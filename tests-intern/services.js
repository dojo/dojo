var http = require('http'),
	url = require('url'),
	qs = require('querystring'),
	glob = require('glob'),
	httpProxy = require('http-proxy'),
	jsgi = require('jsgi-node');

var proxy = new httpProxy.RoutingProxy();

exports.start = function (port, callback) {
	glob('**/*.service.js', {
		cwd: __dirname
	}, function (err, files) {
		if (err) {
			console.error(err);
			return;
		}

		var services = [];
		files.forEach(function (serviceFile) {
			var serviceName = serviceFile.slice(0, -11);
			services.push({
				match: new RegExp('^\/' + serviceName.replace('/', '\\/') + '(\\/.*)?$'),
				service: require('./' + serviceName + '.service')
			});
		});

		var serviceRE = /^\/__services(\/.*)$/,
			jsgiListener = new jsgi.Listener(function (request) {
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
						var match = serviceURL.match(service.match);
						if (match) {
							request.urlInfo.pathname = match[1];
							response = service.service.call(null, request);
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
			});
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
		callback(server);
	});
};
