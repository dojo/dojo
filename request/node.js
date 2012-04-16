define([
   'require',
   './util',
   './handlers'
], function(require, util, handlers){
	var http = require.nodeRequire('http'),
		https = require.nodeRequire('https'),
		URL = require.nodeRequire('url'),
		undefined;

	var defaultOptions = {
		method: 'GET',
		query: null,
		data: undefined,
		headers: {}
	};
	function request(url, options){
		var response = util.parseArgs(url, util.deepCreate(defaultOptions, options));
		url = response.url;
		options = response.options;

		var def = util.deferred(
			response,
			function(dfd, data){
				data.clientRequest.abort();
				var err = data.error;
				if(!err){
					err = new Error('request cancelled');
					err.dojoType = 'cancel';
				}
				return err;
			}
		);

		url = URL.parse(url);

		var reqOptions = response.requestOptions = {
			host: url.hostname,
			method: options.method,
			port: url.port == null ? 80 : url.port,
			headers: options.headers
		};
		if(url.path){
			reqOptions.path = url.path;
		}
		if(options.user || options.password){
			reqOptions.auth = (options.user||'') + ':' + (options.password||'');
		}
		var req = response.clientRequest = (url.protocol == 'https:' ? https : http).request(reqOptions);

		req.on('response', function(clientResponse){
			response.clientResponse = clientResponse;
			response.status = clientResponse.statusCode;

			var body = [];
			clientResponse.on('data', function(chunk){
				def.progress(chunk.toString());
				body.push(chunk);
			});
			clientResponse.on('end', function(){
				if(timeout){
					clearTimeout(timeout);
				}
				response.text = body.join('');
				handlers(response);
				def.resolve(response);
			});
		});

		req.on('error', function(e){
			def.reject(e);
		});

		if(options.data != null){
			req.write(options.data);
		}

		req.end();

		if(options.timeout != null){
			var timeout = setTimeout(function(){
				response.error = new Error('timeout exceeded');
				response.error.dojoType = 'timeout';
				def.cancel();
			}, options.timeout);
		}

		return def.promise;
	}

	util.addCommonMethods(request);

	return request;
});
