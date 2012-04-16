define([
	'exports',
	'require',
	'../Deferred',
	'../io-query',
	'../_base/array',
	'../_base/lang'
], function(exports, require, Deferred, ioQuery, array, lang){
	exports.deepCopy = function deepCopy(target, source){
		for(var name in source){
			var tval = target[name],
				sval = source[name];
			if(tval !== sval){
				if(tval && typeof tval == 'object' && sval && typeof sval == 'object'){
					exports.deepCopy(tval, sval);
				}else{
					target[name] = sval;
				}
			}
		}
		return target;
	};

	exports.deepCreate = function deepCreate(source, properties){
		properties = properties || {};
		var target = lang.delegate(source),
			name, value;

		for(name in source){
			value = source[name];

			if(value && typeof value == 'object'){
				target[name] = exports.deepCreate(value, properties[name]);
			}
		}
		return exports.deepCopy(target, properties);
	};

	var freeze = Object.freeze || function(obj){ return obj; };
	exports.deferred = function deferred(response, cancel, ok, err, fnlly){
		var def = new Deferred(function(reason){
			cancel && cancel(def, response);

			var err = response.error;
			if(!err){
				err = new Error('request cancelled');
				err.response = response;
				err.dojoType='cancel';
			}
			return err;
		});
		var okHandler = ok ?
			function(response){
				return freeze(ok(response));
			} :
			function(response){
				return freeze(response);
			};
		var errHandler = err ?
			function(error){
				error.response = response;
				err(error, response);
				throw error;
			} :
			function(error){
				error.response = response;
				throw error;
			};

		var promise = def.then(okHandler, errHandler);

		try{
			var notify = require('./notify');
			promise.then(
				function(response){
					notify.load(response);
					return response;
				},
				function(error){
					notify.error(error);
					return error;
				}
			);
		}catch(e){}

		if(fnlly){
			def.then(
				function(response){
					fnlly(response);
				},
				function(error){
					fnlly(response, error);
					throw error;
				}
			);
		}

		def.promise = promise;
		def.then = promise.then;

		return def;
	};

	exports.addCommonMethods = function addCommonMethods(provider, methods){
		array.forEach(methods||['GET', 'POST', 'PUT', 'DELETE'], function(method){
			provider[(method == 'DELETE' ? 'DEL' : method).toLowerCase()] = function(url, options){
				options = lang.delegate(options||{});
				options.method = method;
				return provider(url, options);
			};
		});
	};

	exports.parseArgs = function parseArgs(url, options, skipData){
		var data = options.data,
			query = options.query;
		
		if(data && !skipData){
			if(typeof data == 'object'){
				options.data = ioQuery.objectToQuery(data);
			}
		}

		if(query){
			if(typeof query == 'object'){
				query = ioQuery.objectToQuery(query);
			}
			if(options.preventCache){
				query += (query ? '&' : '') + 'request.preventCache=' + (+(new Date));
			}
		}else if(options.preventCache){
			query = 'request.preventCache=' + (+(new Date));
		}

		if(url && query){
			url += (~url.indexOf('?') ? '&' : '?') + query;
		}

		return {
			url: url,
			options: options
		};
	};

	exports.checkStatus = function(stat){
		stat = stat || 0;
		return (stat >= 200 && stat < 300) || // allow any 2XX response code
			stat == 304 ||                 // or, get it out of the cache
			stat == 1223 ||                // or, Internet Explorer mangled the status code
			!stat;                         // or, we're Titanium/browser chrome/chrome extension requesting a local file
	};
});
