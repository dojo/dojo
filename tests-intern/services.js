define([
	'require',
	'exports',
	'when',
	'when/node/function',
	'intern/dojo/node!http',
	'intern/dojo/node!url',
	'intern/dojo/node!querystring',
	'intern/dojo/node!glob',
	'intern/dojo/node!http-proxy',
	'intern/dojo/node!jsgi-node',
	'intern/dojo/node!jsgi-node/jsgi/node',
	'intern/dojo/node!formidable'
], function (require, exports, when, nodefn, http, url, qs, glob, httpProxy, jsgi, node, formidable) {
	var nodeWrapper = node.Node,
		proxy = new httpProxy.RoutingProxy();

	var slice = Array.prototype.slice;
	require = (function (require) {
		return function (deps) {
			return when.promise(function (resolve) {
				require(deps, function () {
					resolve(slice.call(arguments, 0));
				});
			});
		};
	})(require);

	function Multipart(nextApp) {
		var multipartRE = /^multipart\/form-data;/;

		return function (request) {
			var headers = request.headers;
			if (headers['content-type'] && multipartRE.test(headers['content-type'])) {
				request.data = when.promise(function (resolve, reject) {
					nodeWrapper(function (nodeRequest) {
						var parser = new formidable.IncomingForm();
						parser.parse(nodeRequest, function (err, fields, files) {
							if (err) {
								reject(err);
							}
							for (var key in files) {
								fields[key] = files[key];
							}
							resolve(fields);
						});
					})(request);
				});
			}

			return nextApp(request);
		};
	}

	exports.start = function (port) {
		return nodefn.call(glob, '**/*.service.js', {
			cwd: './tests-intern',
		}).then(function (files) {
			var moduleIds = files.map(function (filename) {
				return './' + filename.slice(0, -3);
			});
			return require(moduleIds).then(function (modules) {
				return modules.map(function (module, index) {
					var name = moduleIds[index].slice(2, -8);
					return {
						regexp: new RegExp('^\/' + name.replace('/', '\\/') + '(\\/.*)?$'),
						module: module
					};
				});
			});
		}).then(function (services) {
			var serviceRE = /^\/__services(\/.*)$/,
				jsgiListener = new jsgi.Listener(new Multipart(function (request) {
					var urlInfo = url.parse(request.pathInfo, true),
						query = qs.parse(request.queryString),
						pathInfo = urlInfo.pathname.match(serviceRE),
						serviceURL = pathInfo && pathInfo[1],
						response;

					if (serviceURL) {
						request.urlInfo = urlInfo;
						request.query = query;
						request.serviceURL = serviceURL;

						services.some(function (service) {
							var match = serviceURL.match(service.regexp);
							if (match) {
								request.urlInfo.pathname = match[1];
								response = service.module.call(null, request);
								return true;
							}
						});
					}

					if (!response) {
						return {
							status: 500,
							headers: {
								'Content-Type': 'text/plain'
							},
							body: [ 'No services' ]
						};
					}
					return response;
				}));
			var server = http.createServer(function (request, response) {
				var urlInfo = url.parse(request.url, true),
					pathInfo = urlInfo.pathname.match(serviceRE);

				if (request.url.indexOf('/__services/') === 0) {
					jsgiListener(request, response);
				}
				else {
					proxy.proxyRequest(request, response, {
						host: 'localhost',
						port: 9000
					});
				}
			});
			server.listen(port || 9001);

			return server;
		});
	};
});
