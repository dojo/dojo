define([
	'module',
	'require',
	'./watch',
	'./util',
	'../_base/array',
	'../_base/lang',
	'../on',
	'../dom',
	'../dom-construct',
	'../has',
	'../_base/window'
], function(module, require, watch, util, array, lang, on, dom, domConstruct, has, win){
	has.add('script-readystatechange', function(global, document){
		var script = document.createElement('script');
		return typeof script['onreadystatechange'] != 'undefined' &&
			(typeof global['opera'] == 'undefined' || global['opera'].toString() != '[object Opera]');
	});

	var mid = module.id.replace(/[\/\.\-]/g, '_'),
		counter = 0,
		loadEvent = has('script-readystatechange') ? 'readystatechange' : 'load',
		readyRegExp = /complete|loaded/,
		callbacks = this[mid + '_callbacks'] = {},
		deadScripts = [];
	
		console.log("LOAD EVENT " + loadEvent);

	function jsonpCallback(json){
		this.response.data = json;
	}

	function attach(id, url, frameDoc){
		var doc = (frameDoc || win.doc),
			element = doc.createElement('script');

		element.type = 'text/javascript';
		element.src = url;
		element.id = id;
		element.async = true;
		element.charset = 'utf-8';

		return doc.getElementsByTagName('head')[0].appendChild(element);
	}

	function remove(id, frameDoc){
		domConstruct.destroy(dom.byId(mid + id, frameDoc));

		if(callbacks[id]){
			delete callbacks[id];
		}
	}

	function _addDeadScript(response){
		deadScripts.push({ id: response.id, frameDoc: response.options.frameDoc });
		response.options.frameDoc = null;
	}

	function _ioCheck(dfd, response){
		var checkString = response.options.checkString;
		if(response.data || (response.scriptLoaded && !checkString)){
			return true;
		}

		//Check for finished "checkString" case.
		return checkString && eval('typeof(' + checkString + ') != "undefined"');
	}

	function script(url, options){
		var response = util.parseArgs(url, util.deepCopy({}, options));
		url = response.url;
		options = response.options;

		var dfd = util.deferred(
			response,
			function(dfd, response){
				// canceler
				if(response.canDelete){
					_addDeadScript(response);
				}
			},
			function(response){
				// OK handler
				if(response.canDelete){
					_addDeadScript(response);
				}

				return response;
			},
			function(error, response){
				// error handler
				if(response.canDelete){
					if(error.dojoType == 'timeout'){
						//For timeouts, remove the script element immediately to
						//avoid a response from it coming back later and causing trouble.
						script._remove(response.id, response.options.frameDoc);
					}else{
						_addDeadScript(response);
					}
				}
			}
		);

		lang.mixin(response, {
			id: counter++,
			canDelete: false
		});
		response.scriptId = mid + response.id;

		if(options.jsonp){
			url += (~url.indexOf('?') ? '&' : '?') +
				options.jsonp + '=' +
				(options.frameDoc ? 'parent.' : '') +
				mid + '_callbacks[' + response.id + ']._jsonpCallback';

			response.canDelete = true;
			callbacks[response.id] = {
				_jsonpCallback: jsonpCallback,
				response: response
			};
		}

		try{
			var notify = require('./notify');
			notify.send(response);
		}catch(e){}
		var node = script._attach(response.scriptId, url, options.frameDoc);

		if(!options.jsonp && !options.checkString){
			var handle = on(node, loadEvent, function(evt){
				if(evt.type == 'load' || readyRegExp.test(node.readyState)){
					handle.remove();
					response.scriptLoaded = evt;
				}
			});
		}

		watch(
			dfd,
			response,
			function(dfd, response){
				// validCheck

				//Do script cleanup here. We wait for one inflight pass
				//to make sure we don't get any weird things by trying to remove a script
				//tag that is part of the call chain (IE 6 has been known to
				//crash in that case).
				if(deadScripts && deadScripts.length){
					array.forEach(deadScripts, function(_script){
						script._remove(_script.id, _script.frameDoc);
						_script.frameDoc = null;
					});
					deadScripts = [];
				}

				return true;
			},
			_ioCheck,
			function(dfd, response){
				// resHandle
				if(_ioCheck(dfd, response)){
					dfd.resolve(response);
				}else{
					dfd.reject(new Error('inconceivable request/script error'));
				}
			}
		);

		return dfd.promise;
	}
	script.get = script;

	// TODO: Remove in 2.0
	script._attach = attach;
	script._remove = remove;

	return script;
});
