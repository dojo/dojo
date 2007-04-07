/* 
 * Copyright © 2007 TurboAjax Group (http://www.turboajax.com)
 * Licensed under the Dojo Foundation Contributor License Agreement (http://dojotoolkit.org/icla.txt)
 */
 
dojo.provide("dojo._base.event");
dojo.require("dojo._base.connect");

(function(){
					
// DOM events

dojo.addListener = function(node, event, context, method) {
	return de.addListener(node, event, dojo.hitch(context, method)); // Handle
}

dojo.removeListener = function(node, event, handle) {
	de.removeListener(node, event, handle);
}

// prefer these remain public, but could be confusing in top level docs

dojo.addConnection = dojo.connect; 
dojo.removeConnection = dojo.disconnect;

// unify add/removeListener with connect/disconnect

dojo.connect = function(/*Object*/ obj, /*String*/ event, /*Object|null*/ context, /*String|Function*/ method){
	return (!obj||isNaN(obj.nodeType) ? dojo.addConnection : dojo.addListener).apply(de, arguments);
}											

dojo.disconnect = function(/*Object*/ obj, /*String*/ event, /*Handle*/ handle){
	return (!obj||isNaN(obj.nodeType) ? dojo.removeConnection : dojo.removeListener).apply(de, arguments);
}											

// DOM event machinery
	
dojo.event = {
	addListener: function(/*DOMNode*/node, /*String*/event, /*Function*/fp){
		if(!node){ return; } 
		event = de.normalizeEventName(event);
		fp = (!de._fixCallback ? fp : de._fixCallback(fp));
		if(node.addEventListener){ 
			node.addEventListener(event.slice(2), fp, false);
			return fp; /*Handle*/
		}else{
			return dojo.listener.add(node, event, fp); /*Handle*/
		}
	},
	removeListener: function(/*DOMNode*/node, /*String*/event, /*Handle*/handle){
		// summary:
		//		clobbers the listener from the node
		// evtName:
		//		the name of the handler to remove the function from
		// node:
		//		DOM node to attach the event to
		// fp:
		//		the function to register
		event = de.normalizeEventName(event);
		if(node.removeEventListener){
			node.removeEventListener(event.slice(2), handle, false);
		}else{
			dojo.listener.remove(node, event, handle);
		}
	},
	normalizeEventName: function(/*String*/eventName){
		// Generally, eventName should be lower case, unless it is special somehow (e.g. a Mozilla event)
		if(eventName.slice(0,2)!="on"){ eventName = "on"+eventName; }
		if(eventName=="onkey"){	eventName = (d.isIE ? "onkeydown" : "onkeypress");	}
		return eventName;
	},
	// hosts can override to fix events as needed
	_fixCallback: null,
	// public fixEvent
	fixEvent: function(/*Event*/evt, /*DOMNode*/sender){
		// summary:
		//		normalizes properties on the event object including event
		//		bubbling methods, keystroke normalization, and x/y positions
		// evt: native event object
		// sender: node to treat as "currentTarget"
		var f = de._fixEvent;
		return (f ? f(evt, sender) : evt);
	},
	stopEvent: function(/*Event*/evt){
		// summary:
		//		prevents propagation and clobbers the default action of the
		//		passed event
		// evt: Optional for IE. The native event object.
		evt.preventDefault();
		evt.stopPropagation();
	}
};

var de = dojo.event;

// Constants

dojo.keys = {
	BACKSPACE: 8,
	TAB: 9,
	CLEAR: 12,
	ENTER: 13,
	SHIFT: 16,
	CTRL: 17,
	ALT: 18,
	PAUSE: 19,
	CAPS_LOCK: 20,
	ESCAPE: 27,
	SPACE: 32,
	PAGE_UP: 33,
	PAGE_DOWN: 34,
	END: 35,
	HOME: 36,
	LEFT_ARROW: 37,
	UP_ARROW: 38,
	RIGHT_ARROW: 39,
	DOWN_ARROW: 40,
	INSERT: 45,
	DELETE: 46,
	HELP: 47,
	LEFT_WINDOW: 91,
	RIGHT_WINDOW: 92,
	SELECT: 93,
	NUMPAD_0: 96,
	NUMPAD_1: 97,
	NUMPAD_2: 98,
	NUMPAD_3: 99,
	NUMPAD_4: 100,
	NUMPAD_5: 101,
	NUMPAD_6: 102,
	NUMPAD_7: 103,
	NUMPAD_8: 104,
	NUMPAD_9: 105,
	NUMPAD_MULTIPLY: 106,
	NUMPAD_PLUS: 107,
	NUMPAD_ENTER: 108,
	NUMPAD_MINUS: 109,
	NUMPAD_PERIOD: 110,
	NUMPAD_DIVIDE: 111,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,
	F13: 124,
	F14: 125,
	F15: 126,
	NUM_LOCK: 144,
	SCROLL_LOCK: 145
};

dojo.isAsciiPrintable = function(charCode) {
	return (charCode>31&&charCode<128)||(charCode>127&&charCode<255);
}

// IE event normalization
if (dojo.isIE) { 
	de.baseAddListener = de.addListener;
	dojo.mixin(de, {
		addListener: function(/*DOMNode*/node, /*String*/event, /*Function*/fp){
			if (node && (event=="keypress" || event=="onkeypress")){ de.baseAddListener(node, "onkeydown", dojo.nop); }
			return de.baseAddListener(node, event, fp);
		},
		_fixCallback: function(fp) {
			return function(e){ 
				var e = de._fixEvent(e, this);
				var r = fp(e);
				de._postFixEvent(e);
				return r;
			};
		},
		_fixEvent: function(/*Event*/evt, /*DOMNode*/sender){
			// summary:
			//   normalizes properties on the event object including event
			//   bubbling methods, keystroke normalization, and x/y positions
			// evt: native event object
			// sender: node to treat as "currentTarget"
			evt = evt || window.event; 
			evt.target = evt.srcElement; 
			evt.currentTarget = (sender || evt.srcElement); 
			evt.layerX = evt.offsetX;
			evt.layerY = evt.offsetY;
			// FIXME: scroll position query is duped from dojo.html to avoid dependency on that entire module
			var se = evt.srcElement, doc = (se && se.ownerDocument) || document;
			// DO NOT replace the following to use dojo.body(), in IE, document.documentElement should be used
			// here rather than document.body
			//var docBody = ((dojo.render.html.ie55)||(doc["compatMode"] == "BackCompat")) ? doc.body : doc.documentElement;
			var docBody = doc.documentElement;
			evt.pageX = evt.clientX + (docBody.scrollLeft || 0);
			evt.pageY = evt.clientY + (docBody.scrollTop || 0);
			if(evt.type == "mouseover"){ evt.relatedTarget = evt.fromElement; }
			if(evt.type == "mouseout"){ evt.relatedTarget = evt.toElement; }
			evt.stopPropagation = this._stopPropagation;
			evt.preventDefault = this._preventDefault;
			return this._fixKeys(evt);
		},
		_fixKeys: function(evt) {
			switch (evt.type) {
				case "keydown":
				case "keypress":
				case "keyup":
					evt.charCode = evt.keyCode;
					break;
			}
			return evt;
		},
		_postFixEvent: function(evt) {
			switch (evt.type) {
				case "keydown":
					// IE doesn't fire keypress for non-printable characters
					// other browsers do, we simulate it here.
					//
					// FIXME: cannot trap numpad keys unless numlock is down
					// unless we can determine the state of numlock ourselves.
					var c = evt.keyCode;
					if((evt.ctrlKey)||(c!=32)&&(c<48||c>90)&&(c<106||c>111)&&(c<186||c>191)){
						var faux = document.createEventObject(evt);
						evt.target.fireEvent("onkeypress", faux);
						evt.returnValue = faux.returnValue;
					}
					break;
			}
		},
		stopEvent: function(){
			with(window.event){
				cancelBubble = true;
				returnValue = false;
			}
		},
		_stopPropagation: function(){
			this.cancelBubble = true; 
		},
		_preventDefault: function(){
			this.returnValue = false;
		}
	});
}

// Opera event normalization
if (dojo.isOpera) {
	dojo.mixin(de, {
		_fixEvent: function(evt, sender){
			switch (evt.type) {
				case "keypress":
					evt.charCode = evt.keyCode;
					break;
			}
			return evt;
		}
	});
}

// Safari event normalization
if (dojo.isSafari) { 
	dojo.mixin(dojo.keys, {
		SHIFT_TAB: 25,		
		UP_ARROW: 63232,
		DOWN_ARROW: 63233,
		LEFT_ARROW: 63234,
		RIGHT_ARROW: 63235,
		F1: 63236,
		F2: 63237,
		F3: 63238,
		F4: 63239,
		F5: 63240,
		F6: 63241,
		F7: 63242,
		F8: 63243,
		F9: 63244,
		F10: 63245,
		F11: 63246,
		F12: 63247,
		PAUSE: 63250,
		DELETE: 63272,
		HOME: 63273,
		END: 63275,
		PAGE_UP: 63276,
		PAGE_DOWN: 63277,
		INSERT: 63302,
		PRINT_SCREEN: 63248,
		SCROLL_LOCK: 63249,
		NUM_LOCK: 63289
	});
}

})();