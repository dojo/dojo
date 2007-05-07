dojo.provide("dojo._base.event");
dojo.require("dojo._base.connect");

// this file courtesy of the TurboAjax Group, licensed under a Dojo CLA

(function(){
	// DOM event machinery
	var de = {
		addListener: function(/*DOMNode*/node, /*String*/event, /*Function*/fp){
			if(!node){return;} 
			event = de._normalizeEventName(event)
			fp = de._fixCallback(event, fp);
			node.addEventListener(event, fp, false);
			return fp; /*Handle*/
		},
		removeListener: function(/*DOMNode*/node, /*String*/event, /*Handle*/handle){
			// summary:
			//		clobbers the listener from the node
			// evtName:
			//		the name of the handler to remove the function from
			// node:
			//		DOM node to attach the event to
			// handle:
			//		the handle returned from addListener
			(node)&&(node.removeEventListener(de._normalizeEventName(event), handle, false));
		},
		_normalizeEventName: function(/*String*/name){
			// Generally, name should be lower case, unless it is special
			// somehow (e.g. a Mozilla DOM event).
			// Remove 'on'.
			return (name.slice(0,2)=="on" ? name.slice(2) : name);
		},
		_fixCallback: function(/*String*/name, fp){
			// By default, we only invoke _fixEvent for 'keypress'
			// If code is added to _fixEvent for other events, we have
			// to revisit this optimization.
			// This also applies to _fixEvent overrides for Safari and Opera
			// below.
			return (name!="keypress" ? fp : function(e){ return fp.call(this, de._fixEvent(e, this)); });	
		},
		_fixEvent: function(evt, sender){
			// _fixCallback only attaches us to keypress.
			// Switch on evt.type anyway because we might 
			// be called directly from dojo.fixEvent.
			switch(evt.type){
				case "keypress":
					de._setKeyChar(evt);
					break;
			}
			return evt;
		},
		_setKeyChar: function(evt){
			evt.keyChar = (evt.charCode ? String.fromCharCode(evt.charCode) : '');
		}
	};

	// DOM events
	
	// FIXME: no reason to make this public, use connect
	dojo.addListener = function(node, event, context, method){
		return de.addListener(node, event, dojo.hitch(context, method)); // Handle
	}

	// FIXME: no reason to make this public, use disconnect
	dojo.removeListener = function(node, event, handle){
		de.removeListener(node, event, handle);
	}

	dojo.fixEvent = function(/*Event*/evt, /*DOMNode*/sender){
		// summary:
		//		normalizes properties on the event object including event
		//		bubbling methods, keystroke normalization, and x/y positions
		// evt: native event object
		// sender: node to treat as "currentTarget"
		return de._fixEvent(evt, sender);
	}

	dojo.stopEvent = function(/*Event*/evt){
		// summary:
		//		prevents propagation and clobbers the default action of the
		//		passed event
		// evt: Optional for IE. The native event object.
		evt.preventDefault();
		evt.stopPropagation();
	}

	// cache baseline implementations

	var dc = dojo._connect;
	var dd = dojo._disconnect;

	// Unify connect/disconnect and add/removeListener
	
	dojo._connect = function(obj, event, context, method, dontFix){
		// use listener code (event fixing) for nodes that look like objects, unless told not to
		dontFix = Boolean(!obj || !(obj.nodeType||obj.attachEvent||obj.addEventListener) || dontFix);
		// grab up the result of baseline disconnect, or construct one using addListener
		var h = (dontFix ? dc.apply(this, arguments) : [obj, event, dojo.addListener.apply(this, arguments)]);
		// append flag to the result identifying the kind of listener 
		h.push(dontFix);
		return h;
	}											

	dojo._disconnect = function(obj, event, handle, dontFix){
		// dispatch this disconnect either to the baseline code or to removeListener
		(dontFix ? dd : dojo.removeListener).apply(this, arguments);
	}											

	// Constants

	// Public: client code must test
	// keyCode against these named constants, as the
	// actual codes can vary by browser.
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
	
	// IE event normalization
	if(dojo.isIE){ 
		_trySetKeyCode = function(e, code){
			try{
				// squelch errors when keyCode is read-only
				// (e.g. if keyCode is ctrl or shift)
				return e.keyCode = code;
			}catch(e){
				return 0;
			}
		}

		var ap = Array.prototype;
		// by default, use the standard listener
		var iel = dojo._listener;
		// dispatcher tracking property
		if((dojo.isIE<7)&&(!djConfig._allow_leaks)){
			// custom listener to handle leak protection for DOM events
			iel = dojo._ie_listener = {
				// support handler indirection: 
				// all event handler functions are actually referenced 
				// here and event dispatchers reference only indices.
				handlers: [],
				// add a listener to an object
				add: function(/*Object*/ source, /*String*/ method, /*Function*/ listener){
					source = source || dojo.global;
					var f = d = source[method];
					if(!d||!d.listeners){
						d = source[method] = dojo._getIeDispatcher();
						// initialize listeners with original event code (or just empty)
						d.listeners = (f ? [ieh.push(f) - 1] : []);
					}
					return d.listeners.push(ieh.push(listener) - 1) ; /*Handle*/
				},
				// remove a listener from an object
				remove: function(/*Object*/ source, /*String*/ method, /*Handle*/ handle){
					var f = (source||dojo.global)[method], l = f&&f.listeners;
					if(f && l && handle--){	
						delete ieh[l[handle]];
						delete l[handle]; 
					}
				}
			};
			// alias used above
			var ieh = iel.handlers;
		}

		dojo.mixin(de, {
			addListener: function(/*DOMNode*/node, /*String*/event, /*Function*/fp){
				if(!node){return;} // undefined
				event = de._normalizeEventName(event);
				if(event=="onkeypress"){
					// we need to listen to onkeydown to synthesize 
					// keypress events that otherwise won't fire
					// on IE
					var kd = node.onkeydown;
					if(!kd||!kd.listeners||!kd._stealthKeydown){
						// we simply ignore this connection when disconnecting
						// because it's harmless 
						de.addListener(node, "onkeydown", de._stealthKeyDown);
						// we only want one stealth listener per node
						node.onkeydown._stealthKeydown = true;
					} 
				}
				return iel.add(node, event, de._fixCallback(fp, node));
			},
			removeListener: function(/*DOMNode*/node, /*String*/event, /*Handle*/handle){
				iel.remove(node, de._normalizeEventName(event), handle); 
			},
			_normalizeEventName: function(/*String*/eventName){
				// Generally, eventName should be lower case, unless it is
				// special somehow (e.g. a Mozilla event)
				// ensure 'on'
				return (eventName.slice(0,2)!="on" ? "on"+eventName : eventName);
			},
			_nop: function(){},
			_fixCallback: function(fp, sender){
				return function(e){ 
					return fp.call(this, de._fixEvent(e, sender));
				};
			},
			_fixEvent: function(/*Event*/evt, /*DOMNode*/sender){
				// summary:
				//   normalizes properties on the event object including event
				//   bubbling methods, keystroke normalization, and x/y positions
				// evt: native event object
				// sender: node to treat as "currentTarget"
				if(!evt){
					var w = (sender)&&((sender.ownerDocument || sender.document || sender).parentWindow)||window;
					evt = w.event; 
				}
				evt.target = evt.srcElement; 
				evt.currentTarget = (sender || evt.srcElement); 
				evt.layerX = evt.offsetX;
				evt.layerY = evt.offsetY;
				// FIXME: scroll position query is duped from dojo.html to
				// avoid dependency on that entire module. Now that HTML is in
				// Base, we should convert back to something similar there.
				var se = evt.srcElement, doc = (se && se.ownerDocument) || document;
				// DO NOT replace the following to use dojo.body(), in IE, document.documentElement should be used
				// here rather than document.body
				var docBody = ((dojo.isIE<6)||(doc["compatMode"]=="BackCompat")) ? doc.body : doc.documentElement;
				evt.pageX = evt.clientX + (docBody.scrollLeft || 0);
				evt.pageY = evt.clientY + (docBody.scrollTop || 0);
				if(evt.type == "mouseover"){ 
					evt.relatedTarget = evt.fromElement;
				}
				if(evt.type == "mouseout"){ 
					evt.relatedTarget = evt.toElement;
				}
				evt.stopPropagation = this._stopPropagation;
				evt.preventDefault = this._preventDefault;
				return this._fixKeys(evt);
			},
			_fixKeys: function(evt){
				switch(evt.type){
					case "keypress":
						var c = ("charCode" in evt ? evt.charCode : evt.keyCode);
						if (c==13||c==27){
							c=0; // Mozilla considers ENTER and ESC non-printable
						}else if(c==3){
							c=99; // Mozilla maps CTRL-BREAK to CTRL-c
						}
						// if we have a charCode, try to 0 keycode
						// if that fails, our charCode is bogus and is set to 0
						if(c){c = _trySetKeyCode(evt, 0);}
						evt.charCode = c;
						de._setKeyChar(evt);
						break;
				}
				return evt;
			},
			// some ctrl-key combinations (mostly w/punctuation) do not emit a char code in IE
			// we map those virtual key codes to ascii here
			// not valid for all (non-US) keyboards, so maybe we shouldn't bother
			_punctMap: { 
				106:42, 
				111:47, 
				186:59, 
				187:43, 
				188:44, 
				189:45, 
				190:46, 
				191:47, 
				192:96, 
				219:91, 
				220:92, 
				221:93, 
				222:39 
			},
			_stealthKeyDown: function(evt){
				// IE doesn't fire keypress for most non-printable characters.
				// other browsers do, we simulate it here.
				var kp = evt.currentTarget.onkeypress;
				// only works if kp exists and is a dispatcher
				if(!kp||!kp.listeners)return;
				// munge key/charCode
				var c = evt.keyCode;
				// These are Windows Virtual Key Codes
				// http://msdn.microsoft.com/library/default.asp?url=/library/en-us/winui/WinUI/WindowsUserInterface/UserInput/VirtualKeyCodes.asp
				var unprintable = (c!=13)&&(c!=32)&&(c!=27)&&(c<48||c>90)&&(c<96||c>111)&&(c<186||c>192)&&(c<219||c>222);
				if(unprintable||evt.ctrlKey){
					c = (unprintable ? 0 : c);
					if(evt.ctrlKey){
						if(evt.keyCode==3){
							return; // IE will post CTRL-BREAK as keypress natively 									
						}else if(c>95 && c<106){ 
							c -= 48; // map CTRL-[numpad 0-9] to ASCII
						}else if((!evt.shiftKey)&&(c>=65&&c<=90)){ 
							c += 32; // map CTRL-[A-Z] to lowercase
						}else{ 
							c = de._punctMap[c] || c; // map other problematic CTRL combinations to ASCII
						}
					}
					// simulate a keypress event
					var faux = de._synthesizeEvent(evt, {type: 'keypress', faux: true, charCode: c});
					kp.call(evt.currentTarget, faux);
					evt.cancelBubble = faux.cancelBubble;
					evt.returnValue = faux.returnValue;
					_trySetKeyCode(evt, faux.keyCode);
				}
			},
			// Called in Event scope
			_stopPropagation: function(){
				this.cancelBubble = true; 
			},
			_preventDefault: function(){
				_trySetKeyCode(this, 0);
				this.returnValue = false;
			}
		});
				
		// override stopEvent for IE
		dojo.stopEvent = function(evt){
			evt = evt || window.event;
			de._stopPropagation.call(evt);
			de._preventDefault.call(evt);
		}
	}

	de._synthesizeEvent = function(evt, props) {
			var faux = dojo.mixin({}, evt, props);
			if(faux.charCode){faux.keyCode = 0;}
			de._setKeyChar(faux);
			// FIXME: would prefer to use dojo.hitch: dojo.hitch(evt, evt.preventDefault); 
			// but it throws an error when preventDefault is invoked on Safari
			// does Event.preventDefault not support "apply" on Safari?
			faux.preventDefault = function(){ evt.preventDefault(); }; 
			faux.stopPropagation = function(){ evt.stopPropagation(); }; 
			return faux;
	}
	
	// Opera event normalization
	if(dojo.isOpera){
		dojo.mixin(de, {
			_fixEvent: function(evt, sender){
				switch(evt.type){
					case "keypress":
						var c = evt.which;
						if(c==3){
							c=99; // Mozilla maps CTRL-BREAK to CTRL-c
						}
						// can't trap some keys at all, like INSERT and DELETE
						// there is no differentiating info between DELETE and ".", or INSERT and "-"
						c = ((c<41)&&(!evt.shiftKey) ? 0 : c);
						if((evt.ctrlKey)&&(!evt.shiftKey)&&(c>=65)&&(c<=90)){
							// lowercase CTRL-[A-Z] keys
							c += 32;
						}
						return de._synthesizeEvent(evt, { charCode: c });
				}
				return evt;
			}
		});
	}

	// Safari event normalization
	if(dojo.isSafari){ 
		dojo.mixin(de, {
			_fixEvent: function(evt, sender){
				switch(evt.type){
					case "keypress":
						var c = evt.charCode, s = evt.shiftKey;
						if(evt.keyIdentifier=="Enter"){
							c = 0; // differentiate Enter from CTRL-m (both code 13)
						}else if((evt.ctrlKey)&&(c>0)&&(c<27)){
							c += 96; // map CTRL-[A-Z] codes to ASCII
						} else if (c==dojo.keys.SHIFT_TAB) {
							c = dojo.keys.TAB; // morph SHIFT_TAB into TAB + shiftKey: true
							s = true;
						} else {
							c = (c>=32 && c<63232 ? c : 0); // avoid generating keyChar for non-printables
						}
						return de._synthesizeEvent(evt, {charCode: c, shiftKey: s});
				}
				return evt;
			}
		});
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

if(dojo.isIE<7){
	// keep this out of the closure
	// closing over 'iel' or 'ieh' borks leak prevention
	// ls[i] is an index into the master handler array
	dojo._getIeDispatcher = function(){
		return function(){
			var ap=Array.prototype, ls=arguments.callee.listeners, h=dojo._ie_listener.handlers;
			for(var i in ls){
				if(!(i in ap)){
					h[ls[i]].apply(this, arguments);
				}
			}
		}
	}
}