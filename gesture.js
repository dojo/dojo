define(["./_base/kernel", "./on", "./touch", "./has"], function(dojo, on, touch, has){
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
//		the handle will be internally used by on(), e.g.
//		|	var dojo.gesture.tap = handle('tap');
//		|	//so that listen can use it
//		|	on(node, dojo.gesture.tap, func(e){});
//		|	//or used directly as
//		|	dojo.gesture.tap(node, func(e){});
//
// isGestureEvent(event):
//		Whether the given event is a supported gesture event
//
// fire(target, eventType, event):
//		Used by gesture implementations to fire a recognized gesture event, fire() invokes appropriate callbacks
//		with a wrapped gesture event with detail gesture information.
//
// example:
//		1. A gesture can be used in the following ways:
//		A. Used with dojo.connect()
//		|	dojo.connect(node, dojo.gesture.tap, function(e){});
//		|	dojo.connect(node, dojo.gesture.tap.hold, function(e){});
//		|	dojo.connect(node, dojo.gesture.tap.doubletap, function(e){});		
//
//		B. Used with dojo.on
//		|	define(["dojo/on", "dojo/gesture/tap"], function(on, tap){
//		|		on(node, tap, function(e){});
//		|		on(node, tap.hold, function(e){});
//		|		on(node, tap.doubletap, function(e){});
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
		//		the handle will be used internally by on()
		var self = this;
		return function(node, listener){//called by on(), see dojo.on
			//normalize, arguments might be (null, node, listener)
			var a = arguments;
			if(a.length > 2){
				node = a[1];
				listener = a[2];
			}
			var isNode = node && (node.nodeType || node.attachEvent || node.addEventListener);
			if(!isNode || !self.isGestureEvent(eventType)){
				return on(node, eventType, listener);
			}else{
				var signal = {
					remove: function(){
						self._remove(node, eventType, listener);
					}			
				};
				self._add(node, eventType, listener);
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
				data: {},
				listening: false
			};
			this._gestureElements.push(element);
		}
		var gesture = this.events[type];
		if(gesture && !element.data[gesture.defaultEvent]){
			element.data[gesture.defaultEvent] = {};
		}
		if(!element.gestures[type]){
			element.gestures[type] = {
				callbacks: [listener],
				stopped: false //to cancel event bubbling
			};
		}else{
			element.gestures[type].callbacks.push(listener);
		}
		if(!element.listening){
			var _press = dojo.hitch(this, "_press", element);
			var _move = dojo.hitch(this, "_move", element);
			var _release = dojo.hitch(this, "_release", element);
			
			var touchOnly = this.events[type].touchOnly;
			if(touchOnly){
				element.press = on(node, 'touchstart', _press);
				element.move = on(node, 'touchmove', _move);
				element.release = on(node, 'touchend', _release);
			}else{
				element.press = touch.press(node, _press);
				element.move = touch.move(node, _move);
				element.release = touch.release(node, _release);
			}
			if(has("touch")){
				var _cancel = dojo.hitch(this, "_cancel", element);
				element.cancel = on(node, 'touchcancel', _cancel);
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
//				element[type].remove();//disconnect native listeners
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
				e.locking = true;
				gesture[type](element.data[gesture.defaultEvent], e);
				visited.push(gesture);
			}
		}
	},
	fire: function(target, eventType, event){
		// summary:
		//		Used by gesture implementations to fire a recognized gesture event, invoking appropriate callbacks
		//		with a wrapped gesture event
		// target: DomNode
		//		Target node to fire the gesture
		// event: Object
		//		Simulated event containing gesture info e.g {type: 'tap.hold'|'swipe.left'), ...}

		//gesture looks like {callbacks:[...], stopped:true|false}
		var gesture =((this.getGestureElement(target) || {}).gestures || {})[eventType];
		if(!gesture){ return; }

		if(!event){
			event = {};
		}
		if(!event.type){
			event.type = eventType;	
		}
		if(!event.target){
			event.target = target;
		}
		event.preventDefault = function(){};
		event.stopPropagation = function(){
			gesture.stopped = true;
		};
		this._fire(target, eventType, event);
	},
	_fire: function(target, eventType, e){
		var gesture =((this.getGestureElement(target) || {}).gestures || {})[eventType];
		if(!gesture){ return;}
		
		dojo.forEach(gesture.callbacks, function(func){
			func(e);
		});
		
		//gesture bubbling - also fire for parents unless stopped explicitly
		if(!gesture.stopped){
			var parentNode = target.parentNode;
			if(parentNode){
				e.target = parentNode;
				this._fire(parentNode, eventType, e);
			}
		}
	}
};

return dojo.gesture;

});