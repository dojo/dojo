define([
	'module',
	'require',
	'./watch',
	'./util',
	'./handlers',
	'../_base/lang',
	'../query',
	'../has',
	'../dom',
	'../dom-construct',
	'../_base/window'
], function(module, require, watch, util, handlers, lang, query, has, dom, domConstruct, win){
	var mid = module.id.replace(/[\/\.\-]/g, '_'),
		onload = mid + '_onload',
		queue = [],
		current = null;

	if(!win.global[onload]){
		win.global[onload] = function(){
			var data = current;
			if(!data){
				iframe._fireNextRequest();
				return;
			}

			var response = data[1],
				options = response.options,
				formNode = dom.byId(options.form);

			if(formNode){
				// remove all the hidden content inputs
				var toClean = response._contentToClean;
				for(var i=0; i<toClean.length; i++){
					var key = toClean[i];
					//Need to cycle over all nodes since we may have added
					//an array value which means that more than one node could
					//have the same .name value.
					for(var j=0; j<formNode.childNodes.length; j++){
						var childNode = formNode.childNodes[j];
						if(childNode.name == key){
							domConstruct.destroy(childNode);
							break;
						}
					}
				}

				// restore original action + target
				response._originalAction && formNode.setAttribute('action', response._originalAction);
				if(response._originalTarget){
					formNode.setAttribute('target', response._originalTarget);
					formNode.target = response._originalTarget;
				}
			}

			response._finished = true;
		};
	}

	function create(name, onloadstr, uri){
		if(win.global[name]){
			return win.global[name];
		}

		if(win.global.frames[name]){
			return win.global.frames[name];
		}

		if(!uri){
			if(has('config-useXDomain') && !has('config-dojoBlankHtmlUrl')){
				console.warn('dojo/request/iframe: When using cross-domain Dojo builds,' +
					' please save dojo/resources/blank.html to your domain and set dojoConfig.dojoBlankHtmlUrl' +
					' to the path on your domain to blank.html');
			}
			uri = (has('config-dojoBlankHtmlUrl')||require.toUrl('dojo/resources/blank.html'));
		}

		var frame = domConstruct.place(
			'<iframe id="'+name+'" name="'+name+'" src="'+uri+'" onload="'+onloadstr+
			'" style="position: absolute; left: 1px; top: 1px; height: 1px; width: 1px; visibility: hidden">',
			win.body());

		win.global[name] = frame;

		return frame;
	}

	function setSrc(iframe, src, replace){
		var frame = win.global.frames[iframe.name];

		try{
			if(!frame.contentWindow){
				frame.src = src;
			}else if(!replace || !frame.contentWindow.document){
				frame.contentWindow.location = src;
			}else{
				frame.contentWindow.location.replace(src);
			}
		}catch(e){
			console.log('dojo/request/iframe.setSrc: ', e);
		}
	}

	function doc(iframeNode){
		if(iframeNode.contentDocument){
			return iframeNode.contentDocument;
		}
		var name = iframeNode.name;
		if(name){
			var iframes = win.doc.getElementsByTagName('iframe');
			if(iframeNode.document && iframes[name].contentWindow && iframes[name].contentWindow.document){
				return iframes[name].contentWindow.document;
			}else if(win.doc.frames[name] && win.doc.frames[name].document){
				return win.doc.frames[name].document;
			}
		}
		return null;
	}

	function fireNextRequest(){
		// summary: Internal method used to fire the next request in the queue.
		var dfd;
		try{
			if(current || !queue.length){
				return;
			}
			var data;
			do{
				data = current = queue.shift();
			}while(data && data[0].canceled && queue.length);

			if(!data || data[0].canceled){
				current = null;
				return;
			}

			dfd = data[0];
			var response = data[1],
				options = response.options,
				c2c = response._contentToClean = [],
				formNode = dom.byId(options.form),
				notify;

			try{
				notify = require('./notify');
			}catch(e){}

			data = options.data || null;

			if(formNode){
				// if we have things in data, we need to add them to the form
				// before submission
				if(data){
					var createInput = function(name, value){
						domConstruct.create('input', {
							type: 'hidden',
							name: name,
							value: value
						}, formNode);
						c2c.push(name);
					};
					for(var x in data){
						var val = data[x];
						if(lang.isArray(val) && val.length > 1){
							for(var i=0; i<val.length; i++){
								createInput(x, val[i]);
							}
						}else{
							if(!formNode[x]){
								createInput(x, val);
							}else{
								formNode[x].value = val;
							}
						}
					}
				}

				//IE requires going through getAttributeNode instead of just getAttribute in some form cases,
				//so use it for all.  See #2844
				var actionNode = formNode.getAttributeNode('action'),
					methodNode = formNode.getAttributeNode('method'),
					targetNode = formNode.getAttributeNode('target');

				if(response.url){
					response._originalAction = actionNode ? actionNode.value : null;
					if(actionNode){
						actionNode.value = response.url;
					}else{
						formNode.setAttribute('action', response.url);
					}
				}
				if(methodNode){
					methodNode.value = options.method;
				}else{
					formNode.setAttribute('method', options.method);
				}

				response._originalTarget = targetNode ? targetNode.value : null;
				if(targetNode){
					targetNode.value = iframe._iframeName;
				}else{
					formNode.setAttribute('target', iframe._iframeName);
				}
				formNode.target = iframe._iframeName;

				notify && notify.send(response);
				formNode.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe

				notify && notify.send(response);
				iframe.setSrc(iframe._frame, response.url, true);
			}
		}catch(e){
			dfd.reject(e);
		}
	}

	var defaultOptions = {
		method: 'POST'
	};
	function iframe(url, options){
		var response = util.parseArgs(url, util.deepCreate(defaultOptions, options), true);
		url = response.url;
		options = response.options;

		response._callNext = function(){
			if(!this._calledNext){
				this._calledNext = true;
				current = null;
				iframe._fireNextRequest();
			}
		};

		if(options.method != 'GET' && options.method != 'POST'){
			throw new Error(options.method + ' not supported by dojo/request/iframe');
		}

		if(!iframe._frame){
			iframe._frame = iframe.create(iframe._iframeName, onload + '();');
		}

		var dfd = util.deferred(
			response,
			function(dfd, response){
				// summary: canceler for deferred
			},
			function(response){
				// summary: okHandler function for deferred
				try{
					var options = response.options,
						doc = iframe.doc(iframe._frame),
						handleAs = options.handleAs;

					if(handleAs != 'html'){
						if(handleAs == 'xml'){
							// IE6-8 have to parse the XML manually. See http://bugs.dojotoolkit.org/ticket/6334
							if(doc.documentElement.tagName.toLowerCase() == 'html'){
								query('a', doc.documentElement).orphan();
								var xmlText = doc.documentElement.innerText;
								xmlText = xmlText.replace(/>\s+</g, '><');
								response.text = lang.trim(xmlText);
							}else{
								response.data = doc;
							}
						}else{
							// 'json' and 'javascript' and 'text'
							response.text = doc.getElementsByTagName('textarea')[0].value; // text
						}
						handlers(response);
					}else{
						response.data = doc;
					}

					return response;
				}catch(e){
					throw e;
				}
			},
			function(error, response){
				// error handler
				response.error = error;
			},
			function(response){
				// finally
				response._callNext();
			}
		);

		queue.push([dfd, response]);
		iframe._fireNextRequest();

		watch(
			dfd,
			response,
			function(dfd, response){
				// validCheck
				return !response.error;
			},
			function(dfd, response){
				// ioCheck
				return !!response._finished;
			},
			function(dfd, response){
				// resHandle
				if(response._finished){
					dfd.resolve(response);
				}else{
					dfd.reject(new Error('Invalid dojo/request/iframe request state'));
				}
			}
		);

		return dfd.promise;
	}

	try{
		require('doh');
		iframe._dfdQueue = queue;
	}catch(e){}

	iframe._iframeName = mid + '_IoIframe';
	iframe.create = create;
	iframe.doc = doc;
	iframe.setSrc = setSrc;
	iframe._fireNextRequest = fireNextRequest;

	util.addCommonMethods(iframe, ['GET', 'POST']);

	return iframe;
});
