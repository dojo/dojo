dojo.provide("dojo._base.event");
dojo.require("dojo._base.connect");

// this file courtesy of the TurboAjax Group, licensed under a Dojo CLA

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
(function(){
//>>excludeEnd("webkitMobile");
	// DOM event listener machinery
	var del = (dojo._event_listener = {
		add: function(/*DOMNode*/ node, /*String*/ name, /*Function*/ fp){
			if(!node){return;} 
			name = del._normalizeEventName(name);
			fp = del._fixCallback(name, fp);
			if(
				//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
				!dojo.isIE && 
				//>>excludeEnd("webkitMobile");
				(name == "mouseenter" || name == "mouseleave")
			){
				var ofp = fp;
				name = (name == "mouseenter") ? "mouseover" : "mouseout";
				fp = function(e){
					if(!dojo.isDescendant(e.relatedTarget, node)){
						// e.type = oname; // FIXME: doesn't take? SJM: event.type is generally immutable.
						return ofp.call(this, e); 
					}
				}
			}
			node.addEventListener(name, fp, false);
			return fp; /*Handle*/
		},
		remove: function(/*DOMNode*/ node, /*String*/ event, /*Handle*/ handle){
			// summary:
			//		clobbers the listener from the node
			// node:
			//		DOM node to attach the event to
			// event:
			//		the name of the handler to remove the function from
			// handle:
			//		the handle returned from add
			if(node){
				event = del._normalizeEventName(event);
				if(!dojo.isIE && (event == "mouseenter" || event == "mouseleave")){
					event = (event == "mouseenter") ? "mouseover" : "mouseout";
				}

				node.removeEventListener(event, handle, false);
			}
		},
		_normalizeEventName: function(/*String*/ name){
			// Generally, name should be lower case, unless it is special
			// somehow (e.g. a Mozilla DOM event).
			// Remove 'on'.
			return name.slice(0,2) =="on" ? name.slice(2) : name;
		},
		_fixCallback: function(/*String*/ name, fp){
			// By default, we only invoke _fixEvent for 'keypress'
			// If code is added to _fixEvent for other events, we have
			// to revisit this optimization.
			// This also applies to _fixEvent overrides for Safari and Opera
			// below.
			return name != "keypress" ? fp : function(e){ return fp.call(this, del._fixEvent(e, this)); };
		},
		_fixEvent: function(evt, sender){
			// _fixCallback only attaches us to keypress.
			// Switch on evt.type anyway because we might 
			// be called directly from dojo.fixEvent.
			switch(evt.type){
				case "keypress":
					del._setKeyChar(evt);
					break;
			}
			return evt;
		},
		_setKeyChar: function(evt){
			evt.keyChar = evt.charCode >= 32 ? String.fromCharCode(evt.charCode) : '';
			evt.charOrCode = evt.keyChar || evt.keyCode;
		},
		// For IE and Safari: some ctrl-key combinations (mostly w/punctuation) do not emit a char code in IE
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
		}
	});

	// DOM events
	
	dojo.fixEvent = function(/*Event*/ evt, /*DOMNode*/ sender){
		// summary:
		//		normalizes properties on the event object including event
		//		bubbling methods, keystroke normalization, and x/y positions
		// evt: Event
		//		native event object
		// sender: DOMNode
		//		node to treat as "currentTarget"
		return del._fixEvent(evt, sender);
	}

	dojo.stopEvent = function(/*Event*/ evt){
		// summary:
		//		prevents propagation and clobbers the default action of the
		//		passed event
		// evt: Event
		//		The event object. If omitted, window.event is used on IE.
		evt.preventDefault();
		evt.stopPropagation();
		// NOTE: below, this method is overridden for IE
	}

	// the default listener to use on dontFix nodes, overriden for IE
	var node_listener = dojo._listener;
	
	// Unify connect and event listeners
	dojo._connect = function(obj, event, context, method, dontFix){
		// FIXME: need a more strict test
		var isNode = obj && (obj.nodeType||obj.attachEvent||obj.addEventListener);
		// choose one of three listener options: raw (connect.js), DOM event on a Node, custom event on a Node
		// we need the third option to provide leak prevention on broken browsers (IE)
		var lid = isNode ? (dontFix ? 2 : 1) : 0, l = [dojo._listener, del, node_listener][lid];
		// create a listener
		var h = l.add(obj, event, dojo.hitch(context, method));
		// formerly, the disconnect package contained "l" directly, but if client code
		// leaks the disconnect package (by connecting it to a node), referencing "l" 
		// compounds the problem.
		// instead we return a listener id, which requires custom _disconnect below.
		// return disconnect package
		return [ obj, event, h, lid ];
	}

	dojo._disconnect = function(obj, event, handle, listener){
		([dojo._listener, del, node_listener][listener]).remove(obj, event, handle);
	}

	// Constants

	// Public: client code should test
	// keyCode against these named constants, as the
	// actual codes can vary by browser.
	dojo.keys = {
		// summary:
		//		Definitions for common key values
		BACKSPACE: 8,
		TAB: 9,
		CLEAR: 12,
		ENTER: 13,
		SHIFT: 16,
		CTRL: 17,
		ALT: 18,
		META: dojo.isSafari ? 91 : 224,		// the apple key on macs
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
		SCROLL_LOCK: 145,
		// virtual key mapping
		copyKey: dojo.isMac && !dojo.isAIR ? (dojo.isSafari ? 91 : 224 ) : 17
	};
	
	var evtCopyKey = dojo.isMac ? "metaKey" : "ctrlKey";
	
	dojo.isCopyKey = function(e){
		// summary:
		//		Checks an event for the copy key (meta on Mac, and ctrl anywhere else)
		// e: Event
		//		Event object to examine
		return e[evtCopyKey];	// Boolean
	};

	// Public: decoding mouse buttons from events

/*=====
	dojo.mouseButtons = {
		// LEFT: Number
		//		Numeric value of the left mouse button for the platform.
		LEFT:   0,
		// MIDDLE: Number
		//		Numeric value of the middle mouse button for the platform.
		MIDDLE: 1,
		// RIGHT: Number
		//		Numeric value of the right mouse button for the platform.
		RIGHT:  2,
	
		isButton: function(e, button){
			// summary:
			//		Checks an event object for a pressed button
			// e: Event
			//		Event object to examine
			// button: Number
			//		The button value (example: dojo.mouseButton.LEFT)
			return e.button == button; // Boolean
		},
		isLeft: function(e){
			// summary:
			//		Checks an event object for the pressed left button
			// e: Event
			//		Event object to examine
			return e.button == 0; // Boolean
		},
		isMiddle: function(e){
			// summary:
			//		Checks an event object for the pressed middle button
			// e: Event
			//		Event object to examine
			return e.button == 1; // Boolean
		},
		isRight: function(e){
			// summary:
			//		Checks an event object for the pressed right button
			// e: Event
			//		Event object to examine
			return e.button == 2; // Boolean
		}
	};
=====*/

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	if(dojo.isIE < 9 || (dojo.isIE && dojo.isQuirks)){
		dojo.mouseButtons = {
			LEFT:   1,
			MIDDLE: 4,
			RIGHT:  2,
			// helper functions
			isButton: function(e, button){ return e.button & button; },
			isLeft:   function(e){ return e.button & 1; },
			isMiddle: function(e){ return e.button & 4; },
			isRight:  function(e){ return e.button & 2; }
		};
	}else{
	//>>excludeEnd("webkitMobile");
		dojo.mouseButtons = {
			LEFT:   0,
			MIDDLE: 1,
			RIGHT:  2,
			// helper functions
			isButton: function(e, button){ return e.button == button; },
			isLeft:   function(e){ return e.button == 0; },
			isMiddle: function(e){ return e.button == 1; },
			isRight:  function(e){ return e.button == 2; }
		};
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	}
	//>>excludeEnd("webkitMobile");

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	// IE event normalization
	if(dojo.isIE){ 
		var _trySetKeyCode = function(e, code){
			try{
				// squelch errors when keyCode is read-only
				// (e.g. if keyCode is ctrl or shift)
				return (e.keyCode = code);
			}catch(e){
				return 0;
			}
		}

		// by default, use the standard listener
		var iel = dojo._listener;
		var listenersName = (dojo._ieListenersName = "_" + dojo._scopeName + "_listeners");
		// dispatcher tracking property
		if(!dojo.config._allow_leaks){
			// custom listener that handles leak protection for DOM events
			node_listener = iel = dojo._ie_listener = {
				// support handler indirection: event handler functions are 
				// referenced here. Event dispatchers hold only indices.
				handlers: [],
				// add a listener to an object
				add: function(/*Object*/ source, /*String*/ method, /*Function*/ listener){
					source = source || dojo.global;
					var f = source[method];
					if(!f||!f[listenersName]){
						var d = dojo._getIeDispatcher();
						// original target function is special
						d.target = f && (ieh.push(f) - 1);
						// dispatcher holds a list of indices into handlers table
						d[listenersName] = [];
						// redirect source to dispatcher
						f = source[method] = d;
					}
					return f[listenersName].push(ieh.push(listener) - 1) ; /*Handle*/
				},
				// remove a listener from an object
				remove: function(/*Object*/ source, /*String*/ method, /*Handle*/ handle){
					var f = (source||dojo.global)[method], l = f && f[listenersName];
					if(f && l && handle--){
						delete ieh[l[handle]];
						delete l[handle];
					}
				}
			};
			// alias used above
			var ieh = iel.handlers;
		}

		dojo.mixin(del, {
			add: function(/*DOMNode*/ node, /*String*/ event, /*Function*/ fp){
				if(!node){return;} // undefined
				event = del._normalizeEventName(event);
				if(event=="onkeypress"){
					// we need to listen to onkeydown to synthesize
					// keypress events that otherwise won't fire
					// on IE
					var kd = node.onkeydown;
					if(!kd || !kd[listenersName] || !kd._stealthKeydownHandle){
						var h = del.add(node, "onkeydown", del._stealthKeyDown);
						kd = node.onkeydown;
						kd._stealthKeydownHandle = h;
						kd._stealthKeydownRefs = 1;
					}else{
						kd._stealthKeydownRefs++;
					}
				}
				return iel.add(node, event, del._fixCallback(fp));
			},
			remove: function(/*DOMNode*/ node, /*String*/ event, /*Handle*/ handle){
				event = del._normalizeEventName(event);
				iel.remove(node, event, handle); 
				if(event=="onkeypress"){
					var kd = node.onkeydown;
					if(--kd._stealthKeydownRefs <= 0){
						iel.remove(node, "onkeydown", kd._stealthKeydownHandle);
						delete kd._stealthKeydownHandle;
					}
				}
			},
			_normalizeEventName: function(/*String*/ eventName){
				// Generally, eventName should be lower case, unless it is
				// special somehow (e.g. a Mozilla event)
				// ensure 'on'
				return eventName.slice(0,2) != "on" ? "on" + eventName : eventName;
			},
			_nop: function(){},
			_fixEvent: function(/*Event*/ evt, /*DOMNode*/ sender){
				// summary:
				//		normalizes properties on the event object including event
				//		bubbling methods, keystroke normalization, and x/y positions
				// evt:
				//		native event object
				// sender:
				//		node to treat as "currentTarget"
				if(!evt){
					var w = sender && (sender.ownerDocument || sender.document || sender).parentWindow || window;
					evt = w.event; 
				}
				if(!evt){return(evt);}
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
				var docBody = ((dojo.isIE < 6) || (doc["compatMode"] == "BackCompat")) ? doc.body : doc.documentElement;
				var offset = dojo._getIeDocumentElementOffset();
				evt.pageX = evt.clientX + dojo._fixIeBiDiScrollLeft(docBody.scrollLeft || 0) - offset.x;
				evt.pageY = evt.clientY + (docBody.scrollTop || 0) - offset.y;
				if(evt.type == "mouseover"){ 
					evt.relatedTarget = evt.fromElement;
				}
				if(evt.type == "mouseout"){ 
					evt.relatedTarget = evt.toElement;
				}
				if (dojo.isIE < 9 || dojo.isQuirks) {
					evt.stopPropagation = del._stopPropagation;
					evt.preventDefault = del._preventDefault;
				}
				return del._fixKeys(evt);
			},
			_fixKeys: function(evt){
				switch(evt.type){
					case "keypress":
						var c = ("charCode" in evt ? evt.charCode : evt.keyCode);
						if (c==10){
							// CTRL-ENTER is CTRL-ASCII(10) on IE, but CTRL-ENTER on Mozilla
							c=0;
							evt.keyCode = 13;
						}else if(c==13||c==27){
							c=0; // Mozilla considers ENTER and ESC non-printable
						}else if(c==3){
							c=99; // Mozilla maps CTRL-BREAK to CTRL-c
						}
						// Mozilla sets keyCode to 0 when there is a charCode
						// but that stops the event on IE.
						evt.charCode = c;
						del._setKeyChar(evt);
						break;
				}
				return evt;
			},
			_stealthKeyDown: function(evt){
				// IE doesn't fire keypress for most non-printable characters.
				// other browsers do, we simulate it here.
				var kp = evt.currentTarget.onkeypress;
				// only works if kp exists and is a dispatcher
				if(!kp || !kp[listenersName]){ return; }
				// munge key/charCode
				var k=evt.keyCode;
				// These are Windows Virtual Key Codes
				// http://msdn.microsoft.com/library/default.asp?url=/library/en-us/winui/WinUI/WindowsUserInterface/UserInput/VirtualKeyCodes.asp
				var unprintable = (k!=13 || (dojo.isIE >= 9 && !dojo.isQuirks)) && k!=32 && k!=27 && (k<48||k>90) && (k<96||k>111) && (k<186||k>192) && (k<219||k>222);

				// synthesize keypress for most unprintables and CTRL-keys
				if(unprintable||evt.ctrlKey){
					var c = unprintable ? 0 : k;
					if(evt.ctrlKey){
						if(k==3 || k==13){
							return; // IE will post CTRL-BREAK, CTRL-ENTER as keypress natively 
						}else if(c>95 && c<106){ 
							c -= 48; // map CTRL-[numpad 0-9] to ASCII
						}else if((!evt.shiftKey)&&(c>=65&&c<=90)){ 
							c += 32; // map CTRL-[A-Z] to lowercase
						}else{ 
							c = del._punctMap[c] || c; // map other problematic CTRL combinations to ASCII
						}
					}
					// simulate a keypress event
					var faux = del._synthesizeEvent(evt, {type: 'keypress', faux: true, charCode: c});
					kp.call(evt.currentTarget, faux);
					if(dojo.isIE < 9 || (dojo.isIE && dojo.isQuirks)){
						evt.cancelBubble = faux.cancelBubble;
					}
					evt.returnValue = faux.returnValue;
					_trySetKeyCode(evt, faux.keyCode);
				}
			},
			// Called in Event scope
			_stopPropagation: function(){
				this.cancelBubble = true; 
			},
			_preventDefault: function(){
				// Setting keyCode to 0 is the only way to prevent certain keypresses (namely
				// ctrl-combinations that correspond to menu accelerator keys).
				// Otoh, it prevents upstream listeners from getting this information
				// Try to split the difference here by clobbering keyCode only for ctrl 
				// combinations. If you still need to access the key upstream, bubbledKeyCode is
				// provided as a workaround.
				this.bubbledKeyCode = this.keyCode;
				if(this.ctrlKey){_trySetKeyCode(this, 0);}
				this.returnValue = false;
			}
		});
				
		// override stopEvent for IE
		dojo.stopEvent = (dojo.isIE < 9 || dojo.isQuirks) ? function(evt){
			evt = evt || window.event;
			del._stopPropagation.call(evt);
			del._preventDefault.call(evt);
		} : dojo.stopEvent;
	}
	//>>excludeEnd("webkitMobile");

	del._synthesizeEvent = function(evt, props){
			var faux = dojo.mixin({}, evt, props);
			del._setKeyChar(faux);
			// FIXME: would prefer to use dojo.hitch: dojo.hitch(evt, evt.preventDefault); 
			// but it throws an error when preventDefault is invoked on Safari
			// does Event.preventDefault not support "apply" on Safari?
			faux.preventDefault = function(){ evt.preventDefault(); }; 
			faux.stopPropagation = function(){ evt.stopPropagation(); }; 
			return faux;
	}
	
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	// Opera event normalization
	if(dojo.isOpera){
		dojo.mixin(del, {
			_fixEvent: function(evt, sender){
				switch(evt.type){
					case "keypress":
						var c = evt.which;
						if(c==3){
							c=99; // Mozilla maps CTRL-BREAK to CTRL-c
						}
						// can't trap some keys at all, like INSERT and DELETE
						// there is no differentiating info between DELETE and ".", or INSERT and "-"
						c = c<41 && !evt.shiftKey ? 0 : c;
						if(evt.ctrlKey && !evt.shiftKey && c>=65 && c<=90){
							// lowercase CTRL-[A-Z] keys
							c += 32;
						}
						return del._synthesizeEvent(evt, { charCode: c });
				}
				return evt;
			}
		});
	}
	//>>excludeEnd("webkitMobile");

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	// Webkit event normalization
	if(dojo.isWebKit){
		//>>excludeEnd("webkitMobile");
		del._add = del.add;
		del._remove = del.remove;

		dojo.mixin(del, {
			add: function(/*DOMNode*/ node, /*String*/ event, /*Function*/ fp){
				if(!node){return;} // undefined
				var handle = del._add(node, event, fp);
				if(del._normalizeEventName(event) == "keypress"){
					// we need to listen to onkeydown to synthesize
					// keypress events that otherwise won't fire
					// in Safari 3.1+: https://lists.webkit.org/pipermail/webkit-dev/2007-December/002992.html
					handle._stealthKeyDownHandle = del._add(node, "keydown", function(evt){
						//A variation on the IE _stealthKeydown function
						//Synthesize an onkeypress event, but only for unprintable characters.
						var k=evt.keyCode;
						// These are Windows Virtual Key Codes
						// http://msdn.microsoft.com/library/default.asp?url=/library/en-us/winui/WinUI/WindowsUserInterface/UserInput/VirtualKeyCodes.asp
						var unprintable = k!=13 && k!=32 && (k<48 || k>90) && (k<96 || k>111) && (k<186 || k>192) && (k<219 || k>222);
						// synthesize keypress for most unprintables and CTRL-keys
						if(unprintable || evt.ctrlKey){
							var c = unprintable ? 0 : k;
							if(evt.ctrlKey){
								if(k==3 || k==13){
									return; // IE will post CTRL-BREAK, CTRL-ENTER as keypress natively 
								}else if(c>95 && c<106){ 
									c -= 48; // map CTRL-[numpad 0-9] to ASCII
								}else if(!evt.shiftKey && c>=65 && c<=90){ 
									c += 32; // map CTRL-[A-Z] to lowercase
								}else{ 
									c = del._punctMap[c] || c; // map other problematic CTRL combinations to ASCII
								}
							}
							// simulate a keypress event
							var faux = del._synthesizeEvent(evt, {type: 'keypress', faux: true, charCode: c});
							fp.call(evt.currentTarget, faux);
						}
					});
				}
				return handle; /*Handle*/
			},

			remove: function(/*DOMNode*/ node, /*String*/ event, /*Handle*/ handle){
				if(node){
					if(handle._stealthKeyDownHandle){
						del._remove(node, "keydown", handle._stealthKeyDownHandle);
					}
					del._remove(node, event, handle);
				}
			},
			_fixEvent: function(evt, sender){
				switch(evt.type){
					case "keypress":
						if(evt.faux){ return evt; }
						var c = evt.charCode;
						c = c>=32 ? c : 0;
						return del._synthesizeEvent(evt, {charCode: c, faux: true});
				}
				return evt;
			}
		});
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	}
	//>>excludeEnd("webkitMobile");
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
})();
//>>excludeEnd("webkitMobile");

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
if(dojo.isIE){
	// keep this out of the closure
	// closing over 'iel' or 'ieh' b0rks leak prevention
	// ls[i] is an index into the master handler array
	dojo._ieDispatcher = function(args, sender){
		var ap = Array.prototype,
			h = dojo._ie_listener.handlers,
			c = args.callee,
			ls = c[dojo._ieListenersName],
			t = h[c.target];
		// return value comes from original target function
		var r = t && t.apply(sender, args);
		// make local copy of listener array so it's immutable during processing
		var lls = [].concat(ls);
		// invoke listeners after target function
		for(var i in lls){
			var f = h[lls[i]];
			if(!(i in ap) && f){
				f.apply(sender, args);
			}
		}
		return r;
	}
	dojo._getIeDispatcher = function(){
		// ensure the returned function closes over nothing ("new Function" apparently doesn't close)
		return new Function(dojo._scopeName + "._ieDispatcher(arguments, this)"); // function
	}
	// keep this out of the closure to reduce RAM allocation
	dojo._event_listener._fixCallback = function(fp){
		var f = dojo._event_listener._fixEvent;
		return function(e){ return fp.call(this, f(e, this)); };
	}
}
//>>excludeEnd("webkitMobile");
