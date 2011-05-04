define(["./_base/kernel", "./listen", "./touch", "./has"], function(dojo, listen, touch, has){
// module:
//		dojo/gesture
//
// summary:
//		This module provides an internal central management for all gestures, including
//		1. Registering/un-registering singleton gesture instances
//		2. Binding listen handlers for gesture events
//		3. Normalizing, dispatching and bubbling gesture events etc.
//
// register(gesture):
//		Register a new gesture(e.g dojo.gesture.tap) with 
//		its event list(e.g. 'tap', 'tap.hold' and 'tap.dobletap')
//
// unRegister(gesture):
//		Un-register a gesture and remove all corresponding event handlers
//
// handle(eventType):
//		Bind a static listen handler for the given gesture event, 
//		the handle will be internally used by listen(), e.g.
//		|	var dojo.gesture.tap = handle('tap');
//		|	//so that listen can use it
//		|	listen(node, dojo.gesture.tap, func(e){});
//		|	//or used directly as
//		|	dojo.gesture.tap(node, func(e){});
//
// isGestureEvent(event):
//		Whether the given event is a supported gesture event
//
// fire(element, eventType, rawEvent, info):
//		Used by gesture implementations to fire a recognized gesture event, fire() invokes appropriate callbacks
//		with a wrapped gesture event(that contains gesture information, the raw event etc.)
//
// example:
//		1. A gesture can be used in the following ways:
//		A. Used with dojo.connect()
//		|	dojo.connect(node, dojo.gesture.tap, function(e){});
//		|	dojo.connect(node, dojo.gesture.tap.hold, function(e){});
//		|	dojo.connect(node, dojo.gesture.tap.doubletap, function(e){});		
//
//		B. Used with dojo.listen
//		|	define(["dojo/listen", "dojo/gesture/tap"], function(listen, tap){
//		|		listen(node, tap, function(e){});
//		|		listen(node, tap.hold, function(e){});
//		|		listen(node, tap.doubletap, function(e){});
//
//		C. Used with dojo.gesture.tap.* directly
//		|	dojo.gesture.tap(node, function(e){});
//		|	dojo.gesture.tap.hold(node, function(e){});
//		|	dojo.gesture.tap.doubletap(node, function(e){});
//
//		Though there is always a default singleton gesture instance after required e.g. require("dojo.gesture.tap")
//		It's possible to create a new one with different parameters to overwrite it
//		|	var myTap = new dojo.gesture.tap.Tap({holdThreshold: 300});
//		|	dojo.gesture.register(myTap);
//		|	dojo.connect(node, myTap, function(e){});
//		|	dojo.connect(node, myTap.hold, function(e){});
//		|	dojo.connect(node, myTap.doubletap, function(e){});
//		
//		Please refer to dojo/gesture/* for more gesture usages

//singleton gesture manager
dojo.gesture = {
	events: {},//<event, gesture> map, e.g {'taphold': xxx, 'rotate': xxx}
	gestures: [],
	_gestureElements: [],
	
	register: function(/*Object*/gesture){
		// summary:
		//		Register a new singleton gesture instance
		// description:
		//		The gesture event list will be added for listening.
		if(!has("touch") && gesture.touchOnly){
			console.warn("Gestures:[", gesture.defaultEvent, "] is only supported on touch devices!");
			return;
		}
		if(dojo.indexOf(this.gestures, gesture) < 0){
			this.gestures.push(gesture);
		}
		
		var evt = gesture.defaultEvent;
		this.events[evt] = gesture;
		gesture.call = this.handle(evt);
		
		dojo.forEach(gesture.subEvents, function(type){
			gesture[type] = this.handle(evt + '.' + type);
			this.events[evt + '.' + type] = gesture;
		}, this);
	},
	unRegister: function(/*Object*/gesture){
		// summary:
		//		Un-register the given singleton gesture instance
		// description:
		//		The gesture event list will also be removed
		var i = dojo.indexOf(this.gestures, gesture);
		if(i >= 0){
			this.gestures.splice(i, 1);
		}
		var evt = gesture.defaultEvent;
		delete this.events[evt];
		dojo.forEach(gesture.subEvents, function(type){
			delete this.events[evt + '.' + type];
		}, this);
	},
	handle: function(/*String*/eventType){
		// summary:
		//		Bind a static listen handler for the given gesture event,
		//		the handle will be used internally by listen()
		var self = this;
		return function(node, listener){//called by listen(), see dojo.listen
			//normalize, arguments might be (null, node, listener)
			var a = arguments;
			if(a.length > 2){
				node = a[1];
				listener = a[2];
			}
			var isNode = node && (node.nodeType || node.attachEvent || node.addEventListener);
			if(!isNode || !self.isGestureEvent(eventType)){
				return listen(node, eventType, listener);
			}else{
				var signal = {
					resume: function(){
						self._add(node, eventType, listener);
					},
					cancel: function(){
						self._remove(node, eventType, listener);
					}			
				};
				signal.resume();
				return signal;
			}
		};
	},
	isGestureEvent: function(/*String*/e){
		return !!this.events[e];
	},
	isMouseEvent: function(/*String*/type){
		return (/^mousedown$|^mousemove$|^mouseup$|^click$|^contextmenu$/).test(type);
	},
	_add: function(node, type, listener){
		var element = this.getGestureElement(node);
		if(element === null){
			element = {
				target: node,
				gestures: {},
				listening: false
			};
			this._gestureElements.push(element);
		}
		if(!element.gestures[type]){
			element.gestures[type] = {
				callbacks: [listener],
				stopped: false //to cancel event bubbling
			};
		}else{//TBD - remove the previous one for the same type?
			element.gestures[type].callbacks.push(listener);
		}
		if(!element.listening){
			var _press = dojo.hitch(this, "_press", element);
			var _move = dojo.hitch(this, "_move", element);
			var _release = dojo.hitch(this, "_release", element);
			
			//TBD - disconnect element.press | move | release?
			var touchOnly = this.events[type].touchOnly;
			if(touchOnly){
				element.press = listen(node, 'touchstart', _press);
				element.move = listen(node, 'touchmove', _move);
				element.release = listen(node, 'touchend', _release);
			}else{
				element.press = touch.press(node, _press);
				element.move = touch.move(node, _move);
				element.release = touch.release(node, _release);
			}
			if(has("touch")){
				var _cancel = dojo.hitch(this, "_cancel", element);
				element.cancel = listen(node, 'touchcancel', _cancel);
			}
			element.listening = true;
		}
	},
	_remove: function(node, type, listener){
		var element = this.getGestureElement(node);
		var i = dojo.indexOf(element.gestures[type].callbacks, listener);
		element.gestures[type].callbacks.splice(i, 1);
//		TBD - when element.count == 0
//		dojo.forEach(['press', 'move', 'release', 'cancel'], function(type){
//			if(element[type] && element[type].cancel){
//				element[type].cancel();//disconnect native listeners
//			}
//		});
	},
	getGestureElement: function(node){
		var i;
		for(i = 0; i < this._gestureElements.length; i++){
			var element = this._gestureElements[i];
			if(element.target === node){
				return element;
			}
		}
		return null;
	},
	_press: function(element, e){
		this._forEach(element, 'press', e);
	},
	_move: function(element, e){
		this._forEach(element, 'move', e);
	},
	_release: function(element, e){
		this._forEach(element, 'release', e);
	},
	_cancel: function(element, e){
		this._forEach(element, 'cancel', e);
	},
	_forEach: function(element, type, e){
		e.preventDefault();
		if(e.locking){
			return;
		}
		var visited = [], x;
		for(x in element.gestures){
			var gesture = this.events[x];
			if(gesture[type] && dojo.indexOf(visited, gesture) < 0){
				//add a lock attr indicating the event is being processed by the most inner node,
				//so that we can do gesture bubbling manually				
				if(!has("touch")){
					e.locking = true;
				}else{
					if(Object.getPrototypeOf){
						//not use e.constructor.prototype to lock in object scope rather TouchEvent.prototype
						Object.getPrototypeOf(e).locking = true;
					}
				}
				gesture[type](element, e);
				visited.push(gesture);
			}
		}
	},
	fire: function(element, eventType, rawEvent, info){
		// summary:
		//		Used by gesture implementations to fire a recognized gesture event, invoking appropriate callbacks
		//		with a wrapped gesture event(that contains gesture information and raw event etc.)
		// element: Object
		//		Gesture element that wraps various gesture information for the target node
		//		e.g gesture events being listening, related callbacks
		// eventType: String
		//		Gesture event type e.g. 'tap.hold', 'swipe.left'
		// rawEvent: Event
		//		Raw event that triggers the gesture, might be touchxxx or mousexxx
		// info: Object
		//		Gesture specific information

		//create a gesture event wrapper
		var event = this._createEvent(rawEvent, info);
		event.type = eventType;
		event.stopPropagation = function(){
			element.gestures[eventType].stopped = true;
		};
		this._fire(element, eventType, event);
	},
	_fire: function(element, eventType, e){
		var gesture = element.gestures[eventType];//{callbacks:[...], stopped:true|false}
		if(!gesture){ return;}
		
		dojo.forEach(gesture.callbacks, function(func){
			func(e);
		});
		
		//gesture bubbling - also fire for parents unless stopped explicitly
		if(!gesture.stopped){
			var parentNode = element.target.parentNode,
			parentGestureElement = dojo.gesture.getGestureElement(parentNode);
			if(parentNode && parentGestureElement){
				e.target = parentNode;
				this._fire(parentGestureElement, eventType, e);
			}
		}
	},
	_createEvent: function(e, info){
		var newEvt = {
			target: e.target,
			srcEvent: e,
			preventDefault: function(){
				e.preventDefault();
			}
		};
		var i;
		for(i in info){
			newEvt[i] = info[i];
		}
		return newEvt;
	}
};

return dojo.gesture;

});