dojo.provide("dojo._firebug.firebug");

dojo.deprecated = function(/*String*/ behaviour, /*String?*/ extra, /*String?*/ removal){
	// summary: 
	//		Log a debug message to indicate that a behavior has been
	//		deprecated.
	// extra: Text to append to the message.
	// removal: 
	//		Text to indicate when in the future the behavior will be removed.
	var message = "DEPRECATED: " + behaviour;
	if(extra){ message += " " + extra; }
	if(removal){ message += " -- will be removed in version: " + removal; }
	console.warn(message);
}

dojo.experimental = function(/* String */ moduleName, /* String? */ extra){
	// summary: Marks code as experimental.
	// description: 
	//		This can be used to mark a function, file, or module as
	//		experimental.  Experimental code is not ready to be used, and the
	//		APIs are subject to change without notice.  Experimental code may be
	//		completed deleted without going through the normal deprecation
	//		process.
	// moduleName: 
	//		The name of a module, or the name of a module file or a specific
	//		function
	// extra: 
	//		some additional message for the user
	// example:
	//	|	dojo.experimental("dojo.data.Result");
	// example:
	//	|	dojo.experimental("dojo.weather.toKelvin()", "PENDING approval from NOAA");
	var message = "EXPERIMENTAL: " + moduleName + " -- APIs subject to change without notice.";
	if(extra){ message += " " + extra; }
	console.warn(message);
}

// FIREBUG LITE
	// summary: Firebug Lite, the baby brother to Joe Hewitt's Firebug for Mozilla Firefox
	// description:
	//		Opens a console for logging, debugging, and error messages.
	//		Contains partial functionality to Firebug. See function list below.
	//	NOTE: 
	//			Firebug is a Firefox extension created by Joe Hewitt (see license). You do not need Dojo to run Firebug.
	//			Firebug Lite is included in Dojo by permission from Joe Hewitt
	//			If you are new to Firebug, or used to the Dojo 0.4 dojo.debug, you can learn Firebug 
	//				functionality by reading the function comments below or visiting http://www.getfirebug.com/docs.html
	//	NOTE:
	//		To test Firebug Lite in Firefox, set console = null;
	//
	// example:
	//		Supports inline objects in object inspector window (only simple trace of dom nodes, however)
	//		|	console.log("my object", {foo:"bar"})
	// example:
	//		Option for console to open in popup window
	//		|	var djConfig = {isDebug: true, popup:true };
	// example:
	//		Option for console height (ignored for popup)
	//		|	var djConfig = {isDebug: true, debugHeight:100 };
	
if((!("console" in window) || !("firebug" in console)) &&
	dojo.config.noFirebugLite !== true){

(function(){
	// don't build a firebug frame in iframes
	try{
		if(window != window.parent){ 
			// but if we've got a parent logger, connect to it
			if(window.parent["console"]){
				window.console = window.parent.console;
			}
			return; 
		}
	}catch(e){/*squelch*/}

	window.console = {
		_connects: [],
		log: function(){
			// summary: 
			//		Sends arguments to console.
			logFormatted(arguments, "");
		},
		
		debug: function(){
			// summary: 
			//		Sends arguments to console. Missing finctionality to show script line of trace.
			logFormatted(arguments, "debug");
		},
		
		info: function(){
			// summary: 
			//		Sends arguments to console, highlighted with (I) icon.
			logFormatted(arguments, "info");
		},
		
		warn: function(){
			// summary: 
			//		Sends warning arguments to console, highlighted with (!) icon and blue style.
			logFormatted(arguments, "warning");
		},
		
		error: function(){
			// summary: 
			//		Sends error arguments (object) to console, highlighted with (X) icon and yellow style
			//			NEW: error object now displays in object inspector
			logFormatted(arguments, "error");
		},
		
		assert: function(truth, message){
			// summary: 
			//		Tests for true. Throws exception if false.
			if(!truth){
				var args = [];
				for(var i = 1; i < arguments.length; ++i){
					args.push(arguments[i]);
				}
				
				logFormatted(args.length ? args : ["Assertion Failure"], "error");
				throw message ? message : "Assertion Failure";
			}
		},
		
		dir: function(object){
			// summary: 
			//		Traces object. Only partially implemented.
						
			var pairs = [];
			for(var prop in object){
				try{
					pairs.push([prop, object[prop]]);
				}catch(e){
					/* squelch */
				}
			}
			
			pairs.sort(function(a, b){ 
				return a[0] < b[0] ? -1 : 1; 
			});
			
			var html = ['<table>'];
			for(var i = 0; i < pairs.length; ++i){
				var name = pairs[i][0], value = pairs[i][1];
				
				html.push('<tr>', 
				'<td class="propertyNameCell"><span class="propertyName">',
					escapeHTML(name), '</span></td>', '<td><span class="propertyValue">');
				appendObject(value, html);
				html.push('</span></td></tr>');
			}
			html.push('</table>');
			
			logRow(html, "dir");
		},
		
		dirxml: function(node){
			// summary: 
			//
			var html = [];
			
			appendNode(node, html);
			logRow(html, "dirxml");
		},
		
		group: function(){
			// summary: 
			//		collects log messages into a group, starting with this call and ending with 
			//			groupEnd(). Missing collapse functionality
			logRow(arguments, "group", pushGroup);
		},
		
		groupEnd: function(){
			// summary: 
			//		Closes group. See above
			logRow(arguments, "", popGroup);
		},
		
		time: function(name){
			// summary: 
			//		Starts timers assigned to name given in argument. Timer stops and displays on timeEnd(title);
			//	example:
			//	|	console.time("load");
			//	|	console.time("myFunction");
			//	|	console.timeEnd("load");
			//	|	console.timeEnd("myFunction");
			timeMap[name] = (new Date()).getTime();
		},
		
		timeEnd: function(name){
			// summary: 
			//		See above.
			if(name in timeMap){
				var delta = (new Date()).getTime() - timeMap[name];
				logFormatted([name+ ":", delta+"ms"]);
				delete timeMap[name];
			}
		},
		
		count: function(){
			// summary: 
			//		Not supported
			this.warn(["count() not supported."]);
		},
		
		trace: function(){
			// summary: 
			//		Not supported
			this.warn(["trace() not supported."]);
		},
		
		profile: function(){
			// summary: 
			//		Not supported
			this.warn(["profile() not supported."]);
		},
		
		profileEnd: function(){ },

		clear: function(){
			// summary: 
			//		Clears message console. Do not call this directly
			while(consoleBody.childNodes.length){
				dojo._destroyElement(consoleBody.firstChild);	
			}
			dojo.forEach(this._connects,dojo.disconnect);
		},

		open: function(){ 
			// summary: 
			//		Opens message console. Do not call this directly
			toggleConsole(true); 
		},
		
		close: function(){
			// summary: 
			//		Closes message console. Do not call this directly
			if(frameVisible){
				toggleConsole();
			}
		},
		closeObjectInspector:function(){
			// summary: 
			//		Closes object inspector and opens message console. Do not call this directly
			consoleObjectInspector.innerHTML = "";
			consoleObjectInspector.style.display = "none";
			consoleBody.style.display = "block";	
		}
	};
 
	// ***************************************************************************
	
	// using global objects so they can be accessed
	// most of the objects in this script are run anonomously
	var _firebugDoc = document;
	var _firebugWin = window;
	var __consoleAnchorId__ = 0;
	
	var consoleFrame = null;
	var consoleBody = null;
	var commandLine = null;
	var consoleToolbar = null;
	
	var frameVisible = false;
	var messageQueue = [];
	var groupStack = [];
	var timeMap = {};
	
	var clPrefix = ">>> ";

	// ***************************************************************************

	function toggleConsole(forceOpen){
		frameVisible = forceOpen || !frameVisible;
		if(consoleFrame){
			consoleFrame.style.display = frameVisible ? "block" : "none";
		}
	}

	function focusCommandLine(){
		toggleConsole(true);
		if(commandLine){
			commandLine.focus();
		}
	}
	
	function openWin(x,y,w,h){
		var win = window.open("","_firebug","status=0,menubar=0,resizable=1,top="+y+",left="+x+",width="+w+",height="+h+",scrollbars=1,addressbar=0");
		if(!win){
			var msg = "Firebug Lite could not open a pop-up window, most likely because of a blocker.\n" +
				"Either enable pop-ups for this domain, or change the djConfig to popup=false.";
			alert(msg);
		}
		createResizeHandler(win);
		var newDoc=win.document;
		//Safari needs an HTML height
		HTMLstring=	'<html style="height:100%;"><head><title>Firebug Lite</title></head>\n' +
					'<body bgColor="#ccc" style="height:98%;" onresize="opener.onFirebugResize()">\n' +
					'<div id="fb"></div>' +
					'</body></html>';
	
		newDoc.write(HTMLstring);
		newDoc.close();
		return win;
	}

	function createResizeHandler(wn){
		// summary
		//		Creates handle for onresize window. Called from script in popup's body tag (so that it will work with IE).
		//
		
		var d = new Date();
			d.setTime(d.getTime()+(60*24*60*60*1000)); // 60 days
			d = d.toUTCString();
			
			var dc = wn.document,
				getViewport;
				
			if (wn.innerWidth){
				getViewport = function(){
					return{w:wn.innerWidth, h:wn.innerHeight};
				}
			}else if (dc.documentElement && dc.documentElement.clientWidth){
				getViewport = function(){
					return{w:dc.documentElement.clientWidth, h:dc.documentElement.clientHeight};
				}
			}else if (dc.body){
				getViewport = function(){
					return{w:dc.body.clientWidth, h:dc.body.clientHeight};
				}
			}
			

		window.onFirebugResize = function(){ 
			
			//resize the height of the console log body
			layout(getViewport().h);
			
			clearInterval(wn._firebugWin_resize);
			wn._firebugWin_resize = setTimeout(function(){
				var x = wn.screenLeft,
					y = wn.screenTop,
					w = wn.outerWidth  || wn.document.body.offsetWidth,
					h = wn.outerHeight || wn.document.body.offsetHeight;
				
				document.cookie = "_firebugPosition=" + [x,y,w,h].join(",") + "; expires="+d+"; path=/";
					 
			 }, 5000); //can't capture window.onMove - long timeout gives better chance of capturing a resize, then the move
		
		}
	}
	
	
	/*****************************************************************************/
	
	
	function createFrame(){
		if(consoleFrame){
			return;
		}
		
		if(dojo.config.popup){
			var containerHeight = "100%";
			var cookieMatch = document.cookie.match(/(?:^|; )_firebugPosition=([^;]*)/);
			var p = cookieMatch ? cookieMatch[1].split(",") : [2,2,320,480];

			_firebugWin = openWin(p[0],p[1],p[2],p[3]);	// global
			_firebugDoc = _firebugWin.document;			// global

			djConfig.debugContainerId = 'fb';
		
			// connecting popup
			_firebugWin.console = window.console;
			_firebugWin.dojo = window.dojo;
		}else{
			_firebugDoc = document;
			containerHeight = (dojo.config.debugHeight || 300) + "px";
		}
		
		var styleElement = _firebugDoc.createElement("link");
		styleElement.href = dojo.moduleUrl("dojo._firebug", "firebug.css");
		styleElement.rel = "stylesheet";
		styleElement.type = "text/css";
		var styleParent = _firebugDoc.getElementsByTagName("head");
		if(styleParent){
			styleParent = styleParent[0];
		}
		if(!styleParent){
			styleParent = _firebugDoc.getElementsByTagName("html")[0];
		}
		if(dojo.isIE){
			window.setTimeout(function(){ styleParent.appendChild(styleElement); }, 0);
		}else{
			styleParent.appendChild(styleElement);
		}
		
		if(dojo.config.debugContainerId){
			consoleFrame = _firebugDoc.getElementById(dojo.config.debugContainerId);
		}
		if(!consoleFrame){
			consoleFrame = _firebugDoc.createElement("div");
			_firebugDoc.body.appendChild(consoleFrame);
		}
		consoleFrame.className += " firebug";
		consoleFrame.style.height = containerHeight;
		consoleFrame.style.display = (frameVisible ? "block" : "none");	  
		
		var closeStr = dojo.config.popup ? "" : '    <a href="#" onclick="console.close(); return false;">Close</a>';
		consoleFrame.innerHTML = 
			  '<div id="firebugToolbar">'
			+ '  <a href="#" onclick="console.clear(); return false;">Clear</a>'
			+ '  <span class="firebugToolbarRight">'
			+ closeStr
			+ '  </span>'
			+ '</div>'
			+ '<input type="text" id="firebugCommandLine" />'
			+ '<div id="firebugLog"></div>'
			+ '<div id="objectLog" style="display:none;"></div>';


		consoleToolbar = _firebugDoc.getElementById("firebugToolbar");
		consoleToolbar.onmousedown = onSplitterMouseDown;

		commandLine = _firebugDoc.getElementById("firebugCommandLine");
		addEvent(commandLine, "keydown", onCommandLineKeyDown);

		addEvent(_firebugDoc, dojo.isIE || dojo.isSafari ? "keydown" : "keypress", onKeyDown);
		
		consoleBody = _firebugDoc.getElementById("firebugLog");
		consoleObjectInspector = _firebugDoc.getElementById("objectLog");

		layout();
		flush();
	}

	dojo.addOnLoad(createFrame);

	function clearFrame(){
		_firebugDoc = null;
		
		if(_firebugWin.console){
			_firebugWin.console.clear();
		}
		_firebugWin = null;
		consoleFrame = null;
		consoleBody = null;
		consoleObjectInspector = null;
		commandLine = null;
		messageQueue = [];
		groupStack = [];
		timeMap = {};
	}
	dojo.addOnUnload(clearFrame);

	function evalCommandLine(){
		var text = commandLine.value;
		commandLine.value = "";

		logRow([clPrefix, text], "command");
		
		var value;
		try{
			value = eval(text);
		}catch(e){
			console.debug(e); // put exception on the console
		}

		console.log(value);
	}
	
	function layout(h){
		var height = h ? 
			h  - (consoleToolbar.offsetHeight + commandLine.offsetHeight +25 + (h*.01)) + "px" : 
			consoleFrame.offsetHeight - (consoleToolbar.offsetHeight + commandLine.offsetHeight) + "px";
		
		consoleBody.style.top = consoleToolbar.offsetHeight + "px";
		consoleBody.style.height = height;
		consoleObjectInspector.style.height = height;
		consoleObjectInspector.style.top = consoleToolbar.offsetHeight + "px";
		commandLine.style.bottom = 0;
	}
	
	function logRow(message, className, handler){
		if(consoleBody){
			writeMessage(message, className, handler);
		}else{
			messageQueue.push([message, className, handler]);
		}
	}
	
	function flush(){
		var queue = messageQueue;
		messageQueue = [];
		
		for(var i = 0; i < queue.length; ++i){
			writeMessage(queue[i][0], queue[i][1], queue[i][2]);
		}
	}

	function writeMessage(message, className, handler){
		var isScrolledToBottom =
			consoleBody.scrollTop + consoleBody.offsetHeight >= consoleBody.scrollHeight;

		handler = handler||writeRow;
		
		handler(message, className);
		
		if(isScrolledToBottom){
			consoleBody.scrollTop = consoleBody.scrollHeight - consoleBody.offsetHeight;
		}
	}
	
	function appendRow(row){
		var container = groupStack.length ? groupStack[groupStack.length-1] : consoleBody;
		container.appendChild(row);
	}

	function writeRow(message, className){
		var row = consoleBody.ownerDocument.createElement("div");
		row.className = "logRow" + (className ? " logRow-"+className : "");
		row.innerHTML = message.join("");
		appendRow(row);
	}

	function pushGroup(message, className){
		logFormatted(message, className);

		//var groupRow = consoleBody.ownerDocument.createElement("div");
		//groupRow.className = "logGroup";
		var groupRowBox = consoleBody.ownerDocument.createElement("div");
		groupRowBox.className = "logGroupBox";
		//groupRow.appendChild(groupRowBox);
		appendRow(groupRowBox);
		groupStack.push(groupRowBox);
	}

	function popGroup(){
		groupStack.pop();
	}
	
	// ***************************************************************************

	function logFormatted(objects, className){
		var html = [];
		
		var format = objects[0];
		var objIndex = 0;

		if(typeof(format) != "string"){
			format = "";
			objIndex = -1;
		}

		var parts = parseFormat(format);
		
		for(var i = 0; i < parts.length; ++i){
			var part = parts[i];
			if(part && typeof part == "object"){
				part.appender(objects[++objIndex], html);
			}else{
				appendText(part, html);
			}
		}
		
		
		var ids = [];
		var obs = [];
		for(i = objIndex+1; i < objects.length; ++i){
			appendText(" ", html);
			
			var object = objects[i];
			if(object === undefined || object === null ){
				appendNull(object, html);

			}else if(typeof(object) == "string"){
				appendText(object, html);
		
			}else if(object.nodeType == 9){
				appendText("[ XmlDoc ]", html);

			}else if(object.nodeType == 1){
				// simple tracing of dom nodes
				appendText("< "+object.tagName+" id=\""+ object.id+"\" />", html);
				
			}else{
				// Create link for object inspector
				// need to create an ID for this link, since it is currently text
				var id = "_a" + __consoleAnchorId__++;
				ids.push(id);
				// need to save the object, so the arrays line up
				obs.push(object);
				var str = '<a id="'+id+'" href="javascript:void(0);">'+getObjectAbbr(object)+'</a>';
				
				appendLink( str , html);
			}
		}
		
		logRow(html, className);
		
		// Now that the row is inserted in the DOM, loop through all of the links that were just created
		for(i=0; i<ids.length; i++){
			var btn = _firebugDoc.getElementById(ids[i]);
			if(!btn){ continue; }
	
			// store the object in the dom btn for reference later
			// avoid parsing these objects unless necessary
			btn.obj = obs[i];
	
			_firebugWin.console._connects.push(dojo.connect(btn, "onclick", function(){
				// hide rows
				consoleBody.style.display = "none";
				consoleObjectInspector.style.display = "block";
				// create a back button
				var bkBtn = '<a href="javascript:console.closeObjectInspector();">&nbsp;<<&nbsp;Back</a>';
				try{
					printObject(this.obj);
				}catch(e){
					this.obj = e;
				}
				consoleObjectInspector.innerHTML = bkBtn + "<pre>" + printObject( this.obj ) + "</pre>";
			}));
		}
	}

	function parseFormat(format){
		var parts = [];

		var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;	  
		var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat};

		for(var m = reg.exec(format); m; m = reg.exec(format)){
			var type = m[8] ? m[8] : m[5];
			var appender = type in appenderMap ? appenderMap[type] : appendObject;
			var precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);

			parts.push(format.substr(0, m[0][0] == "%" ? m.index : m.index+1));
			parts.push({appender: appender, precision: precision});

			format = format.substr(m.index+m[0].length);
		}

		parts.push(format);

		return parts;
	}

	function escapeHTML(value){
		function replaceChars(ch){
			switch(ch){
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case "&":
					return "&amp;";
				case "'":
					return "&#39;";
				case '"':
					return "&quot;";
			}
			return "?";
		}
		return String(value).replace(/[<>&"']/g, replaceChars);
	}

	function objectToString(object){
		try{
			return object+"";
		}catch(e){
			return null;
		}
	}

	// ***************************************************************************
	function appendLink(object, html){
		// needed for object links - no HTML escaping
		html.push( objectToString(object) );
	}
	
	function appendText(object, html){
		html.push(escapeHTML(objectToString(object)));
	}

	function appendNull(object, html){
		html.push('<span class="objectBox-null">', escapeHTML(objectToString(object)), '</span>');
	}

	function appendString(object, html){
		html.push('<span class="objectBox-string">&quot;', escapeHTML(objectToString(object)),
			'&quot;</span>');
	}

	function appendInteger(object, html){
		html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
	}

	function appendFloat(object, html){
		html.push('<span class="objectBox-number">', escapeHTML(objectToString(object)), '</span>');
	}

	function appendFunction(object, html){
		html.push('<span class="objectBox-function">', getObjectAbbr(object), '</span>');
	}
	
	function appendObject(object, html){
		try{
			if(object === undefined){
				appendNull("undefined", html);
			}else if(object === null){
				appendNull("null", html);
			}else if(typeof object == "string"){
				appendString(object, html);
			}else if(typeof object == "number"){
				appendInteger(object, html);
			}else if(typeof object == "function"){
				appendFunction(object, html);
			}else if(object.nodeType == 1){
				appendSelector(object, html);
			}else if(typeof object == "object"){
				appendObjectFormatted(object, html);
			}else{
				appendText(object, html);
			}
		}catch(e){
			/* squelch */
		}
	}
		
	function appendObjectFormatted(object, html){
		var text = objectToString(object);
		var reObject = /\[object (.*?)\]/;

		var m = reObject.exec(text);
		html.push('<span class="objectBox-object">', m ? m[1] : text, '</span>');
	}
	
	function appendSelector(object, html){
		html.push('<span class="objectBox-selector">');

		html.push('<span class="selectorTag">', escapeHTML(object.nodeName.toLowerCase()), '</span>');
		if(object.id){
			html.push('<span class="selectorId">#', escapeHTML(object.id), '</span>');
		}
		if(object.className){
			html.push('<span class="selectorClass">.', escapeHTML(object.className), '</span>');
		}

		html.push('</span>');
	}

	function appendNode(node, html){
		if(node.nodeType == 1){
			html.push(
				'<div class="objectBox-element">',
					'&lt;<span class="nodeTag">', node.nodeName.toLowerCase(), '</span>');

			for(var i = 0; i < node.attributes.length; ++i){
				var attr = node.attributes[i];
				if(!attr.specified){ continue; }
				
				html.push('&nbsp;<span class="nodeName">', attr.nodeName.toLowerCase(),
					'</span>=&quot;<span class="nodeValue">', escapeHTML(attr.nodeValue),
					'</span>&quot;');
			}

			if(node.firstChild){
				html.push('&gt;</div><div class="nodeChildren">');

				for(var child = node.firstChild; child; child = child.nextSibling){
					appendNode(child, html);
				}
					
				html.push('</div><div class="objectBox-element">&lt;/<span class="nodeTag">', 
					node.nodeName.toLowerCase(), '&gt;</span></div>');
			}else{
				html.push('/&gt;</div>');
			}
		}else if (node.nodeType == 3){
			html.push('<div class="nodeText">', escapeHTML(node.nodeValue),
				'</div>');
		}
	}

	// ***************************************************************************
	
	function addEvent(object, name, handler){
		if(document.all){
			object.attachEvent("on"+name, handler);
		}else{
			object.addEventListener(name, handler, false);
		}
	}
	
	function removeEvent(object, name, handler){
		if(document.all){
			object.detachEvent("on"+name, handler);
		}else{
			object.removeEventListener(name, handler, false);
		}
	}
	
	function cancelEvent(event){
		if(document.all){
			event.cancelBubble = true;
		}else{
			event.stopPropagation();		
		}
	}

	function onError(msg, href, lineNo){
		var lastSlash = href.lastIndexOf("/");
		var fileName = lastSlash == -1 ? href : href.substr(lastSlash+1);

		var html = [
			'<span class="errorMessage">', msg, '</span>', 
			'<div class="objectBox-sourceLink">', fileName, ' (line ', lineNo, ')</div>'
		];

		logRow(html, "error");
	}


	//After converting to div instead of iframe, now getting two keydowns right away in IE 6.
	//Make sure there is a little bit of delay.
	var onKeyDownTime = (new Date()).getTime();

	function onKeyDown(event){
		var timestamp = (new Date()).getTime();
		if(timestamp > onKeyDownTime + 200){
			event = dojo.fixEvent(event);
			var keys = dojo.keys;
			var ekc = event.keyCode;
			onKeyDownTime = timestamp;
			if(ekc == keys.F12){
				toggleConsole();
			}else if(
				(ekc == keys.NUMPAD_ENTER || ekc == 76) &&
				event.shiftKey && 
				(event.metaKey || event.ctrlKey)
			){
				focusCommandLine();
			}else{
				return;
			}
			cancelEvent(event);
		}
	}


	function onSplitterMouseDown(event){
		if(dojo.isSafari || dojo.isOpera){
			return;
		}
		
		addEvent(document, "mousemove", onSplitterMouseMove);
		addEvent(document, "mouseup", onSplitterMouseUp);

		for(var i = 0; i < frames.length; ++i){
			addEvent(frames[i].document, "mousemove", onSplitterMouseMove);
			addEvent(frames[i].document, "mouseup", onSplitterMouseUp);
		}
	}
	
	function onSplitterMouseMove(event){
		var win = document.all ?
			event.srcElement.ownerDocument.parentWindow :
			event.target.ownerDocument.defaultView;

		var clientY = event.clientY;
		if(win != win.parent){
			clientY += win.frameElement ? win.frameElement.offsetTop : 0;
		}
		
		var height = consoleFrame.offsetTop + consoleFrame.clientHeight;
		var y = height - clientY;
		
		consoleFrame.style.height = y + "px";
		layout();
	}
	
	function onSplitterMouseUp(event){
		removeEvent(document, "mousemove", onSplitterMouseMove);
		removeEvent(document, "mouseup", onSplitterMouseUp);

		for(var i = 0; i < frames.length; ++i){
			removeEvent(frames[i].document, "mousemove", onSplitterMouseMove);
			removeEvent(frames[i].document, "mouseup", onSplitterMouseUp);
		}
	}
	
	function onCommandLineKeyDown(event){
		if(event.keyCode == 13 && commandLine.value){
			addToHistory(commandLine.value);
			evalCommandLine();
		}else if(event.keyCode == 27){
			commandLine.value = "";
		}else if(event.keyCode == dojo.keys.UP_ARROW || event.charCode == dojo.keys.UP_ARROW){
			navigateHistory("older");
		}else if(event.keyCode == dojo.keys.DOWN_ARROW || event.charCode == dojo.keys.DOWN_ARROW){
			navigateHistory("newer");
		}else if(event.keyCode == dojo.keys.HOME || event.charCode == dojo.keys.HOME){
			historyPosition = 1;
			navigateHistory("older");
		}else if(event.keyCode == dojo.keys.END || event.charCode == dojo.keys.END){
			historyPosition = 999999;
			navigateHistory("newer");
		}
	}

	var historyPosition = -1;
	var historyCommandLine = null;

	function addToHistory(value){
		var history = cookie("firebug_history");
		history = (history) ? dojo.fromJson(history) : [];
		var pos = dojo.indexOf(history, value);
		if (pos != -1){
			history.splice(pos, 1);
		}
		history.push(value);
		cookie("firebug_history", dojo.toJson(history), 30);
		while(history.length && !cookie("firebug_history")){
			history.shift();
			cookie("firebug_history", dojo.toJson(history), 30);
		}
		historyCommandLine = null;
		historyPosition = -1;
	}

	function navigateHistory(direction){
		var history = cookie("firebug_history");
		history = (history) ? dojo.fromJson(history) : [];
		if(!history.length){
			return;
		}

		if(historyCommandLine === null){
			historyCommandLine = commandLine.value;
		}

		if(historyPosition == -1){
			historyPosition = history.length;
		}

		if(direction == "older"){
			--historyPosition;
			if(historyPosition < 0){
				historyPosition = 0;
			}
		}else if(direction == "newer"){
			++historyPosition;
			if(historyPosition > history.length){
				historyPosition = history.length;
			}
		}

		if(historyPosition == history.length){
			commandLine.value = historyCommandLine;
			historyCommandLine = null;
		}else{
			commandLine.value = history[historyPosition];
		}
	}

	function cookie(name, value){
		var c = document.cookie;
		if(arguments.length == 1){
			var matches = c.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
			return matches ? decodeURIComponent(matches[1]) : undefined; // String or undefined
		}else{
			var d = new Date();
			d.setMonth(d.getMonth()+1);
			document.cookie = name + "=" + encodeURIComponent(value) + ((d.toUtcString) ? "; expires=" + d.toUTCString() : "");
		}
	};

	function isArray(it){
		return it && it instanceof Array || typeof it == "array";
	}

	//***************************************************************************************************
	// Print Object Helpers
	function getAtts(o){
		//Get amount of items in an object
		if(isArray(o)){
			return "[array with " + o.length + " slots]"; 
		}else{
			var i = 0;
			for(var nm in o){
				i++;
			}
			return "{object with " + i + " items}";
		}
	}

	function printObject(o, i, txt, used){
		// Recursively trace object, indenting to represent depth for display in object inspector
		// TODO: counter to prevent overly complex or looped objects (will probably help with dom nodes)
		var br = "\n"; // using a <pre>... otherwise we'd need a <br />
		var ind = "  ";
		txt = txt || "";
		i = i || ind;
		used = used || [];
		looking:
		for(var nm in o){
			if(o[nm] === window || o[nm] === document){
				continue;
			}else if(o[nm] && o[nm].nodeType){
				if(o[nm].nodeType == 1){
					txt += i+nm + " : < "+o[nm].tagName+" id=\""+ o[nm].id+"\" />" + br;
				}else if(o[nm].nodeType == 3){
					txt += i+nm + " : [ TextNode "+o[nm].data + " ]" + br;
				}
			}else if(typeof o[nm] == "object" && (o[nm] instanceof String || o[nm] instanceof Number || o[nm] instanceof Boolean)){
				txt += i+nm + " : " + o[nm] + br;
			}else if(typeof(o[nm]) == "object" && o[nm]){
				for(var j = 0, seen; seen = used[j]; j++){
					if(o[nm] === seen){
						txt += i+nm + " : RECURSION" + br;
						continue looking;
					}
				}
				used.push(o[nm]);
				txt += i+nm +" -> " + getAtts(o[nm]) + br;
				txt += printObject(o[nm], i+ind, "", used);
			}else if(typeof o[nm] == "undefined"){
				txt += i+nm + " : undefined" + br;
			}else if(nm == "toString" && typeof o[nm] == "function"){
				var toString = o[nm]();
				if(typeof toString == "string" && toString.match(/function ?(.*?)\(/)){
					toString = escapeHTML(getObjectAbbr(o[nm]));
				}
				txt += i+nm +" : " + toString + br;
			}else{
				txt += i+nm +" : "+ escapeHTML(getObjectAbbr(o[nm])) + br;
			}
		}
		txt += br; // keeps data from running to the edge of page
		return txt;
	}

	function getObjectAbbr(obj){
		// Gets an abbreviation of an object for display in log
		// X items in object, including id
		// X items in an array
		// TODO: Firebug Sr. actually goes by char count
		var isError = (obj instanceof Error);
		var nm = (obj && (obj.id || obj.name || obj.ObjectID || obj.widgetId));
		if(!isError && nm){ return "{"+nm+"}";	}

		var obCnt = 2;
		var arCnt = 4;
		var cnt = 0;

		if(isError){
			nm = "[ Error: "+(obj.message || obj.description || obj)+" ]";
		}else if(isArray(obj)){
			nm = "[" + obj.slice(0,arCnt).join(",");
			if(obj.length > arCnt){
				nm += " ... ("+obj.length+" items)";
			}
			nm += "]";
		}else if(typeof obj == "function"){
			nm = obj + "";
			var reg = /function\s*([^\(]*)(\([^\)]*\))[^\{]*\{/;
			var m = reg.exec(nm);
			if(m){
				if(!m[1]){
					m[1] = "function";
				}
				nm = m[1] + m[2];
			}else{
				nm = "function()";
			}
		}else if(typeof obj != "object" || typeof obj == "string"){
			nm = obj + "";
		}else{
			nm = "{";
			for(var i in obj){
				cnt++;
				if(cnt > obCnt){ break; }
				nm += i+"="+obj[i]+"  ";
			}
			nm+="}";
		}
		
		return nm;
	}
		
	//*************************************************************************************
	
	window.onerror = onError;
	addEvent(document, dojo.isIE || dojo.isSafari ? "keydown" : "keypress", onKeyDown);
	
	if(	(document.documentElement.getAttribute("debug") == "true")||
		(dojo.config.isDebug)
	){
		toggleConsole(true);
	}
})();
}
