define([
	'require',
	'./watch',
	'./handlers',
	'./util',
	'../has'
], function(require, watch, handlers, util, has){
	has.add('native-xhr', function() {
		// if true, the environment has a native XHR implementation
		return typeof XMLHttpRequest !== 'undefined';
	});

	has.add('native-xhr2', function(){
		if(!has('native-xhr')){ return; }
		var x = new XMLHttpRequest();
		return typeof x['addEventListener'] != 'undefined';
	});

	function _resHandle(dfd, response){
		var _xhr = response.xhr;
		if(util.checkStatus(_xhr.status)){
			dfd.resolve(response);
		}else{
			var err = new Error('Unable to load ' + response.url + ' status: ' + _xhr.status);
			err.log = false;

			response.status = _xhr.status;
			if(response.options.handleAs == 'xml'){
				response.data = _xhr.responseXML;
			}else{
				response.text = _xhr.responseText;
			}
			dfd.reject(err);
		}
	}

	var validCheck, ioCheck, resHandle, addListeners, cancel;
	if(has('native-xhr2')){
		// Any platform with XHR2 will only use the watch mechanism for timeout.

		validCheck = function(dfd, response){
			// summary: Check to see if the request should be taken out of the watch queue
			return !dfd._finished;
		};
		cancel = function(dfd, response){
			// summary: Canceller for deferred
			response.xhr.abort();
		};
		addListeners = function(_xhr, dfd, response){
			// summary: Adds event listeners to the XMLHttpRequest object
			function onLoad(evt){
				dfd._finished = 1;
				_resHandle(dfd, response);
			}
			function onError(evt){
				dfd._finished = 1;

				var _xhr = evt.target,
					err = new Error('Unable to load ' + response.url + ' status: ' + _xhr.status);
				err.log = false;

				response.status = _xhr.status;
				if(response.options.handleAs == 'xml'){
					response.data = _xhr.responseXML;
				}else{
					response.text = _xhr.responseText;
				}
				dfd.reject(err);
			}
			function onAbort(evt){
				dfd._finished = 1;
			}

			function onProgress(evt){
				if(evt.lengthComputable){
					response.loaded = evt.loaded;
					response.total = evt.total;
					dfd.progress(response);
				}
			}

			_xhr.addEventListener('load', onLoad, false);
			_xhr.addEventListener('error', onError, false);
			_xhr.addEventListener('abort', onAbort, false);
			_xhr.addEventListener('progress', onProgress, false);

			return function(){
				_xhr.removeEventListener('load', onLoad, false);
				_xhr.removeEventListener('error', onError, false);
				_xhr.removeEventListener('abort', onAbort, false);
				_xhr.removeEventListener('progress', onProgress, false);
			};
		};
	}else{
		validCheck = function(dfd, response){
			return response.xhr.readyState; //boolean
		};
		ioCheck = function(dfd, response){
			return 4 == response.xhr.readyState; //boolean
		};
		resHandle = _resHandle;
		cancel = function(dfd, response){
			// summary: canceller function for util.deferred call.
			var xhr = response.xhr;
			var _at = typeof xhr.abort;
			if(_at == 'function' || _at == 'object' || _at == 'unknown'){
				xhr.abort();
			}
		};
	}

	function resolve(response){
		// summary: okHandler function for util.deferred call.
		var _xhr = response.xhr;
		if(response.options.handleAs == 'xml'){
			response.data = _xhr.responseXML;
		}else{
			response.text = _xhr.responseText;
		}
		response.status = response.xhr.status;
		handlers(response);
		return response;
	}
	function reject(error, response){
		// summary: errHandler function for util.deferred call.
		if(!response.options.failOk){
			console.error(error);
		}
	}

	var undefined,
		defaultOptions = {
			data: null,
			query: null,
			sync: false,
			method: 'GET',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};
	function xhr(/*String*/ url, /*Object?*/ options){
		//	summary:
		//		Sends an HTTP request with the given URL and options.
		//	description:
		//		Sends an HTTP request with the given URL.
		//	url:
		//		URL to request
		var response = util.parseArgs(url, util.deepCreate(defaultOptions, options));
		url = response.url;
		options = response.options;

		var remover,
			fnlly = function(){
				remover && remover();
			};

		//Make the Deferred object for this xhr request.
		var dfd = util.deferred(response, cancel, resolve, reject, fnlly),
			_xhr = response.xhr = xhr._create();

		//If XHR factory fails, cancel the deferred.
		if(!_xhr){
			dfd.cancel();
			return dfd.promise;
		}

		if(addListeners){
			remover = addListeners(_xhr, dfd, response);
		}

		var data = options.data,
			async = !options.sync,
			method = options.method;

		// IE6 won't let you call apply() on the native function.
		_xhr.open(method, url, async, options.user || undefined, options.password || undefined);

		var headers = options.headers,
			contentType;
		if(headers){
			for(var hdr in headers){
				if(hdr.toLowerCase() == 'content-type'){
					contentType = headers[hdr];
				}else if(headers[hdr]){
					//Only add header if it has a value. This allows for instance, skipping
					//insertion of X-Requested-With by specifying empty value.
					_xhr.setRequestHeader(hdr, headers[hdr]);
				}
			}
		}

		if(contentType && contentType !== false){
			_xhr.setRequestHeader('Content-Type', contentType);
		}
		if(!headers || !('X-Requested-With' in headers)){
			_xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		}

		try{
			var notify = require('./notify');
			notify.send(response);
		}catch(e){}
		try{
			_xhr.send(data);
		}catch(e){
			response.error = e;
			dfd.reject(e);
		}

		watch(dfd, response, validCheck, ioCheck, resHandle);
		_xhr = null;

		return dfd.promise;
	}

	xhr._create = function(){
		// summary:
		//		does the work of portably generating a new XMLHTTPRequest object.
		throw new Error('XMLHTTP not available');
	};
	if(has('native-xhr')){
		xhr._create = function(){
			return new XMLHttpRequest();
		};
	}else if(has('activex')){
		try{
			new ActiveXObject('Msxml2.XMLHTTP');
			xhr._create = function(){
				return new ActiveXObject('Msxml2.XMLHTTP');
			};
		}catch(e){
			try{
				new ActiveXObject('Microsoft.XMLHTTP');
				xhr._create = function(){
					return new ActiveXObject('Microsoft.XMLHTTP');
				};
			}catch(e){}
		}
	}

	util.addCommonMethods(xhr);

	return xhr;
});
