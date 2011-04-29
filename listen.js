
define(["./aspect", "./_base/kernel", "./has"], function(aspect, dojo, has){
// summary:
//		The export of this module is a function that provides core event listening functionality. With this function
//		you can provide a target, event type, and listener to be notified of 
//		future matching events that are fired.
//	target:
//		This is the target object or DOM node that to receive events from
// type:
// 		This is the name of the event to listen for.
// listener:
// 		This is the function that should be called when the event fires.
// returns:
// 		An object with a cancel() method that can be used to stop listening for this
// 		event.
// description:
// 		To listen for "click" events on a button node, we can do:
// 		|	define("dojo/listen", function(listen){
// 		|		listen(button, "click", clickHandler);
//		|		...
//  	Plain JavaScript objects can also have their own events.
// 		|	var obj = {};
//		|	listen(obj, "foo", fooHandler);
//		And then we could publish a "foo" event:
//		|	listen.dispatch(obj, "foo", {key: "value"});
//		which would trigger fooHandler. Note that for a simple object this is equivalent to calling:
//		|	obj.onfoo({key:"value"});
//		If you use listen.dispatch on a DOM node, it will use native event dispatching when possible.
//		You can also use listen function itself as a pub/sub hub:
//		| 	listen("some/topic", function(event){
//		|	... do something with event
//		|	});
//		|	listen.publish("some/topic", {name:"some event", ...});
// Evented: 
// 		The "Evented" property of the export of this module can be used as a mixin or base class, to add on() and emit() methods to a class
// 		for listening for events and dispatching events:
// 		|	var Evented = listen.Evented;
// 		|	var EventedWidget = dojo.declare([Evented, dijit._Widget], {...});
//		|	widget = new EventedWidget();
//		|	widget.on("open", function(event){
//		|	... do something with event
//		|	 });
//		|
//		|	widget.emit("open", {name:"some event", ...});
//
//
 	"use strict";
	var after = aspect.after;
	if(typeof window != "undefined"){ // check to make sure we are in a browser, this module should work anywhere
		var major = window.ScriptEngineMajorVersion;
		has.add("jscript", major && (major() + ScriptEngineMinorVersion() / 10));
		has.add("event-orientationchange", has("touch") && !dojo.isAndroid); // TODO: how do we detect this?
	}
	var undefinedThis = (function(){
		return this; // this depends on strict mode
	})();
	var listen = function(target, type, listener, dontFix){
		if(!listener){
			// two args, do pub/sub
			return listen(listen, target, type);
		}
		if(target.on){ 
			// delegate to the target's on() method, so it can handle it's own listening if it wants
			return target.on(type, listener);
		}
		// delegate to main listener code
		return addListener(target, type, listener, dontFix, this);
	};
	listen.pausable =  function(target, type, listener, dontFix){
		var paused;
		var signal = listen(target, type, function(){
			if(!paused){
				return listener.apply(this, arguments);
			}
		}, dontFix);
		signal.pause = function(){
			paused = true;
		};
		signal.resume = function(){
			paused = false;
		};
		return signal;
	};
	var prototype = (listen.Evented = function(){}).prototype;
	prototype.on = function(type, listener, dontFix){
		return addListener(this, type, listener, dontFix, this);
	}
	var touchEvents = /^touch/;
	function addListener(target, type, listener, dontFix, matchesTarget){
		if(type.call){
			// event handler function
			// listen(node, dojo.touch.press, touchListener);
			return type.call(null, target, listener);
		}

		if(type.indexOf(",") > -1){
			// we allow comma delimited event names, so you can register for multiple events at once
			var events = type.split(/\s*,\s*/);
			var handles = [];
			var i = 0;
			var eventName;
			while(eventName = events[i++]){
				handles.push(addListener(target, eventName, listener, dontFix, matchesTarget));
			}
			handles.cancel = function(){
				for(var i = 0; i < handles.length; i++){
					handles[i].cancel();
				}
			};
			return handles;
		}
		
		// event delegation:
		var selector = type.match(/(.*):(.*)/);
		// if we have a selector:event, the last one is interpreted as an event, and we use event delegation
		if(selector){
			type = selector[2];
			selector = selector[1];
			var rawListener = listener;
			listener = function(event){
				var eventTarget = event.target;
				// see if we have a valid matchesTarget or default to dojo.query 
				matchesTarget = matchesTarget && matchesTarget.matches ? matchesTarget : dojo.query;
				// there is a selector, so make sure it matches
				while(!matchesTarget.matches(eventTarget, selector, target)){
					if(eventTarget == target || !eventTarget){
						return;
					}
					eventTarget = eventTarget.parentNode;
				}
				return rawListener.call(eventTarget, event);
			};
		}
		// test to see if it a touch event right now, so we don't have to do it every time it fires
		if(has("touch")){
			if(touchEvents.test(type)){
				// touch event, fix it
				listener = fixTouchListener(listener);
			}
			if(!has("event-orientationchange") && (type == "orientationchange")){
				//"orientationchange" not supported <= Android 2.1, 
				//but works through "resize" on window
				type = "resize"; 
				target = window;
				listener = fixTouchListener(listener);
			} 
		}
		// normal path, the target is |this|
		if(target.addEventListener){
			// the target has addEventListener, which should be used if available (might or might not be a node, non-nodes can implement this method as well)
			var signal = {
				cancel: function(){
					target.removeEventListener(type, listener, false);
				}
			};
			target.addEventListener(type, listener, false);
			return signal;
		}
		type = "on" + type;
		if(fixListener && target.attachEvent){
			return fixListener(target, type, listener);
		}
	 // use aop
		return after(target, type, listener, true);
	}
	listen.destroy = function(node, listener){
		// summary:
		//		Extension event that is fired when a node is destroyed (through dojo.destroy)
		return after(node, "onpage", listener);
	}

	function syntheticPreventDefault(){
		this.cancelable = false;
	}
	function syntheticStopPropagation(){
		this.bubbles = false;
	}
	var syntheticDispatch = listen.dispatch = function(target, type, event){
		// summary:
		//		Fires an event on the target object.
		//	target:
		//		The target object to fire the event on
		//	type:
		//		The event type name
		//	event:
		//		An object to use as the event. See https://developer.mozilla.org/en/DOM/event.initEvent for some of the properties.
		//	example:
		//		To fire our own click event
		//	|	listen.dispatch(dojo.byId("button"), "click", {
		//	|		cancelable: true,
		//	|		bubbles: true,
		//	|		screenX: 33,
		//	|		screenY: 44
		//	|	});
		//		We can also fire our own custom events:
		//	|	listen.dispatch(dojo.byId("slider"), "swipe", {
		//	|		cancelable: true,
		//	|		bubbles: true,
		//	|		direction: "left-to-right"
		//	|	});
		var method = "on" + type;
		if("parentNode" in target){
			// node (or node-like), create event controller methods
			event.preventDefault = syntheticPreventDefault;
			event.stopPropagation = syntheticStopPropagation;
			event.target = target;
			event.type = type;
		}
		do{
			// call any node which has a handler (note that ideally we would try/catch to simulate normal event propagation but that causes too much pain for debugging)
			target[method] && target[method].call(target, event);
			// and then continue up the parent node chain if it is still bubbling (if started as bubbles and stopPropagation hasn't been called)
		}while(event.bubbles && (target = target.parentNode));
		return event.cancelable; // if it is still true (was cancelable and was cancelled, return true to indicate default action should happen)
	};

	var undefinedThis = (function(){
			return this; // this depends on strict mode
		})();
	if(has("dom-addeventlistener")){
		// dispatcher that works with native event handling
		listen.dispatch = function(target, type, event){
			if(target.dispatchEvent && document.createEvent){
				// use the native event dispatching mechanism if it is available on the target object
				// create a generic event				
				// we could create branch into the different types of event constructors, but 
				// that would be a lot of extra code, with little benefit that I can see, seems 
				// best to use the generic constructor and copy properties over, making it 
				// easy to have events look like the ones created with specific initializers
				var nativeEvent = document.createEvent("HTMLEvents");
				nativeEvent.initEvent(type, !!event.bubbles, !!event.cancelable);
				// and copy all our properties over
				for(var i in event){
					var value = event[i];
					if(value !== nativeEvent[i]){
						nativeEvent[i] = event[i];
					}
				}
				return target.dispatchEvent(nativeEvent);
			}
			return syntheticDispatch(target, type, event); // dispatch for a non-node
		};
	}else{
		// no addEventListener, basically old IE event normalization
		listen._fixEvent = function(evt, sender){
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
			if(!evt.target){ // check to see if it has been fixed yet
				evt.target = evt.srcElement;
				evt.currentTarget = (sender || evt.srcElement);
				evt.layerX = evt.offsetX;
				evt.layerY = evt.offsetY;
				if(evt.type == "mouseover"){
					evt.relatedTarget = evt.fromElement;
				}
				if(evt.type == "mouseout"){
					evt.relatedTarget = evt.toElement;
				}
				if (!evt.stopPropagation) {
					evt.stopPropagation = stopPropagation;
					evt.preventDefault = preventDefault;
				}
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
						_setKeyChar(evt);
						break;
				}
			}
			return evt;
		}
		var IESignal = function(handle){
			this.handle = handle;
		};
		IESignal.prototype.cancel = function(){
	 		delete _dojoIEListeners_[this.handle];		
		}
		var fixListener = function(target, type, listener){
			var fixedListener = function(evt){
				evt = listen._fixEvent(evt, this);
				return listener.call(this, evt);
			};
			if(((target.ownerDocument ? target.ownerDocument.parentWindow : target.parentWindow || target.window || window) != top || 
						has("jscript") < 5.8) && 
					!has("config-_allow_leaks")){
				// IE will leak memory on certain handlers in frames (IE8 and earlier) and in unattached DOM nodes for JScript 5.7 and below.
				// Here we use global redirection to solve the memory leaks
				if(typeof _dojoIEListeners_ == "undefined"){ 
					_dojoIEListeners_ = [];
				}
				var dispatcher = target[type];
				if(!dispatcher || !dispatcher.listeners){
					var oldListener = dispatcher;
					target[type] = dispatcher = Function('event', 'var callee = arguments.callee; for(var i = 0; i<callee.listeners.length; i++){var listener = _dojoIEListeners_[callee.listeners[i]]; if(listener){listener.call(this,event);}}');
					dispatcher.listeners = [];
					if(oldListener){
						dispatcher.listeners.push(_dojoIEListeners_.push(oldListener) - 1);
					}
				}
				var handle;
				dispatcher.listeners.push(handle = (_dojoIEListeners_.push(fixedListener) - 1));
				return new IESignal(handle);
			}
			return after(target, type, fixedListener, true);
		};

		var _setKeyChar = function(evt){
			evt.keyChar = evt.charCode ? String.fromCharCode(evt.charCode) : '';
			evt.charOrCode = evt.keyChar || evt.keyCode;
		};
		// Called in Event scope
		var stopPropagation = function(){
			this.cancelBubble = true;
		};
		var preventDefault = listen._preventDefault = function(){
			// Setting keyCode to 0 is the only way to prevent certain keypresses (namely
			// ctrl-combinations that correspond to menu accelerator keys).
			// Otoh, it prevents upstream listeners from getting this information
			// Try to split the difference here by clobbering keyCode only for ctrl
			// combinations. If you still need to access the key upstream, bubbledKeyCode is
			// provided as a workaround.
			this.bubbledKeyCode = this.keyCode;
			if(this.ctrlKey){
				try{
					// squelch errors when keyCode is read-only
					// (e.g. if keyCode is ctrl or shift)
					this.keyCode = 0;
				}catch(e){
				}
			}
			this.returnValue = false;
		};
	}
	if(has("touch")){ 
		var windowOrientation = window.orientation; 
		var Event = function (){};
		var fixTouchListener = function(listener){ 
			return function(originalEvent){ 
				//Event normalization(for ontouchxxx and resize): 
				//1.incorrect e.pageX|pageY in iOS 
				//2.there are no "e.rotation", "e.scale" and "onorientationchange" in Andriod
				//3.More TBD e.g. force | screenX | screenX | clientX | clientY | radiusX | radiusY

				// see if it has already been corrected
				var event = originalEvent.corrected;
				if(!event){
					var type = originalEvent.type;
					delete originalEvent.type; // on some JS engines (android), deleting properties make them mutable 
					if(originalEvent.type){
						// deleting properites doesn't work (older iOS), have to use delegation
						Event.prototype = originalEvent;
						var event = new Event;
						// have to delegate methods to make them work
						event.preventDefault = function(){
							originalEvent.preventDefault();
						}
						event.stopPropagation = function(){
							originalEvent.stopPropagation();
						}
					}else{
						// deletion worked, use property as is
						event = originalEvent;
						event.type = type;
					}
					originalEvent.corrected = event;
					if(type == 'resize'){
						if(windowOrientation == window.orientation){ 
							return null;//double tap causes an unexpected 'resize' in Andriod 
						} 
						windowOrientation = window.orientation;
						event.type = "orientationchange"; 
						return listener.call(this, event);
					}
					// We use the original event and augment, rather than doing an expensive mixin operation
					if(!("rotation" in event)){ // test to see if it has rotation
						event.rotation = 0; 
						event.scale = 1;
					}
					//use event.changedTouches[0].pageX|pageY|screenX|screenY|clientX|clientY|target
					var firstChangeTouch = event.changedTouches[0];
					for(var i in firstChangeTouch){ // use for-in, we don't need to have dependency on dojo/_base/lang here
						delete event[i]; // delete it first to make it mutable
						event[i] = firstChangeTouch[i];
					}
				}
				return listener.call(this, event); 
			}; 
		}; 
	}; 
	listen.publish = prototype.emit = /*prototype.publish = prototype.dispatchEvent = */function(type, event){
		type = "on" + type;
		this[type] && this[type](event);
	};
	return listen;
});
