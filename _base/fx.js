dojo.provide("dojo._base.fx");
dojo.require("dojo._base.Color");
dojo.require("dojo._base.connect");
dojo.require("dojo._base.declare");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.html");

/*
	Animation losely package based on Dan Pupius' work, contributed under CLA: 
		http://pupius.co.uk/js/Toolkit.Drawing.js
*/
(function(){ 

	var d = dojo;
	
	dojo._Line = function(/*int*/ start, /*int*/ end){
		//	summary:
		//		dojo._Line is the object used to generate values from a start value
		//		to an end value
		//	start: int
		//		Beginning value for range
		//	end: int
		//		Ending value for range
		this.start = start;
		this.end = end;
		this.getValue = function(/*float*/ n){
			//	summary: returns the point on the line
			//	n: a floating point number greater than 0 and less than 1
			return ((this.end - this.start) * n) + this.start; // Decimal
		}
	}
	
	d.declare("dojo._Animation", null, {
		//	summary
		//		A generic animation object that fires callbacks into it's handlers
		//		object at various states
		//
		constructor: function(/*Object*/ args){
			d.mixin(this, args);
			if(d.isArray(this.curve)){
				/* curve: Array
					pId: a */
				this.curve = new d._Line(this.curve[0], this.curve[1]);
			}
		},
		
		// duration: Integer
		//	The time in milliseonds the animation will take to run
		duration: 1000,
	
	/*=====
		// curve: dojo._Line||Array
		//	A two element array of start and end values, or a dojo._Line instance to be
		//	used in the Animation. 
		curve: null,
	
		// easing: Function
		//	A Function to adjust the acceleration (or deceleration) of the progress 
		//	across a dojo._Line
		easing: null,
	=====*/
	
		// repeat: Integer
		//	The number of times to loop the animation
		repeat: 0,
	
		// rate: Integer
		//	the time in milliseconds to wait before advancing to next frame 
		//	(used as a fps timer: rate/1000 = fps)
		rate: 10 /* 100 fps */,
	
	/*===== 
		// delay: Integer
		// 	The time in milliseconds to wait before starting animation after it has been .play()'ed
		delay: null,
	
		// events
		//
		// beforeBegin: Event
		//	Synthetic event fired before a dojo._Animation begins playing (synhcronous)
		beforeBegin: null,
	
		// onBegin: Event
		//	Synthetic event fired as a dojo._Animation begins playing (useful?)
		onBegin: null,
	
		// onAnimate: Event
		//	Synthetic event fired at each interval of a dojo._Animation
		onAnimate: null,
	
		// onEnd: Event
		//	Synthetic event fired after the final frame of a dojo._Animation
		onEnd: null,
	
		// onPlay: Event
		//	Synthetic event fired any time a dojo._Animation is play()'ed
		onPlay: null,
	
		// onPause: Event
		//	Synthetic event fired when a dojo._Animation is paused
		onPause: null,
	
		// onStop: Event
		//	Synthetic event fires when a dojo._Animation is stopped
		onStop: null,
	
	=====*/
	
		_percent: 0,
		_startRepeatCount: 0,
	
		_fire: function(/*Event*/ evt, /*Array?*/ args){
			//	summary:
			//		Convenience function.  Fire event "evt" and pass it the
			//		arguments specified in "args".
			//	evt:
			//		The event to fire.
			//	args:
			//		The arguments to pass to the event.
			if(this[evt]){
				this[evt].apply(this, args||[]);
			}
			return this; // dojo._Animation
		},
	
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			// summary:
			//		Start the animation.
			// delay:
			//		How many milliseconds to delay before starting.
			// gotoStart:
			//		If true, starts the animation from the beginning; otherwise,
			//		starts it from its current position.
			var _t = this;
			if(gotoStart){
				_t._stopTimer();
				_t._active = _t._paused = false;
				_t._percent = 0;
			}else if(_t._active && !_t._paused){
				return _t; // dojo._Animation
			}
	
			_t._fire("beforeBegin");
	
			var de = delay||_t.delay;
			var _p = dojo.hitch(_t, "_play", gotoStart);
			if(de > 0){
				setTimeout(_p, de);
				return _t; // dojo._Animation
			}
			_p();
			return _t;
		},
	
		_play: function(gotoStart){
			var _t = this;
			_t._startTime = new Date().valueOf();
			if(_t._paused){
				_t._startTime -= _t.duration * _t._percent;
			}
			_t._endTime = _t._startTime + _t.duration;
	
			_t._active = true;
			_t._paused = false;
	
			var value = _t.curve.getValue(_t._percent);
			if(!_t._percent){
				if(!_t._startRepeatCount){
					_t._startRepeatCount = _t.repeat;
				}
				_t._fire("onBegin", [value]);
			}
	
			_t._fire("onPlay", [value]);
	
			_t._cycle();
			return _t; // dojo._Animation
		},
	
		pause: function(){
			// summary: Pauses a running animation.
			this._stopTimer();
			if(!this._active){ return this; /*dojo._Animation*/ }
			this._paused = true;
			this._fire("onPause", [this.curve.getValue(this._percent)]);
			return this; // dojo._Animation
		},
	
		gotoPercent: function(/*Decimal*/ percent, /*Boolean?*/ andPlay){
			//	summary:
			//		Sets the progress of the animation.
			//	percent:
			//		A percentage in decimal notation (between and including 0.0 and 1.0).
			//	andPlay:
			//		If true, play the animation after setting the progress.
			this._stopTimer();
			this._active = this._paused = true;
			this._percent = percent;
			if(andPlay){ this.play(); }
			return this; // dojo._Animation
		},
	
		stop: function(/*boolean?*/ gotoEnd){
			// summary: Stops a running animation.
			// gotoEnd: If true, the animation will end.
			if(!this._timer){ return this; /* dojo._Animation */ }
			this._stopTimer();
			if(gotoEnd){
				this._percent = 1;
			}
			this._fire("onStop", [this.curve.getValue(this._percent)]);
			this._active = this._paused = false;
			return this; // dojo._Animation
		},
	
		status: function(){
			// summary: Returns a string token representation of the status of
			//			the animation, one of: "paused", "playing", "stopped"
			if(this._active){
				return this._paused ? "paused" : "playing"; // String
			}
			return "stopped"; // String
		},
	
		_cycle: function(){
			var _t = this;
			if(_t._active){
				var curr = new Date().valueOf();
				var step = (curr - _t._startTime) / (_t._endTime - _t._startTime);
	
				if(step >= 1){
					step = 1;
				}
				_t._percent = step;
	
				// Perform easing
				if(_t.easing){
					step = _t.easing(step);
				}
	
				_t._fire("onAnimate", [_t.curve.getValue(step)]);
	
				if(_t._percent < 1){
					_t._startTimer();
				}else{
					_t._active = false;
	
					if(_t.repeat > 0){
						_t.repeat--;
						_t.play(null, true);
					}else if(_t.repeat == -1){
						_t.play(null, true);
					}else{
						if(_t._startRepeatCount){
							_t.repeat = _t._startRepeatCount;
							_t._startRepeatCount = 0;
						}
					}
					_t._percent = 0;
					_t._fire("onEnd");
				}
			}
			return _t; // dojo._Animation
		}
	});

	var ctr = 0;
	var _globalTimerList = [];
	var runner = {
		run: function(){}
	};
	var timer = null;
	dojo._Animation.prototype._startTimer = function(){
		// this._timer = setTimeout(dojo.hitch(this, "_cycle"), this.rate);
		if(!this._timer){
			this._timer = d.connect(runner, "run", this, "_cycle");
			ctr++;
		}
		if(!timer){
			timer = setInterval(d.hitch(runner, "run"), this.rate);
		}
	};

	dojo._Animation.prototype._stopTimer = function(){
		d.disconnect(this._timer);
		this._timer = null;
		ctr--;
		if(!ctr){
			clearInterval(timer);
			timer = null;
		}
	};

	var _makeFadeable = (d.isIE) ? function(node){
		// only set the zoom if the "tickle" value would be the same as the
		// default
		var ns = node.style;
		if(!ns.zoom.length && d.style(node, "zoom") == "normal"){
			// make sure the node "hasLayout"
			// NOTE: this has been tested with larger and smaller user-set text
			// sizes and works fine
			ns.zoom = "1";
			// node.style.zoom = "normal";
		}
		// don't set the width to auto if it didn't already cascade that way.
		// We don't want to f anyones designs
		if(!ns.width.length && d.style(node, "width") == "auto"){
			ns.width = "auto";
		}
	} : function(){};

	dojo._fade = function(/*Object*/ args){
		//	summary: 
		//		Returns an animation that will fade the node defined by
		//		args.node from the start to end values passed (args.start
		//		args.end) (end is mandatory, start is optional)

		args.node = d.byId(args.node);
		var fArgs = d.mixin({ properties: {} }, args);
		var props = (fArgs.properties.opacity = {});
		props.start = !("start" in fArgs) ?
			function(){ return Number(d.style(fArgs.node, "opacity")); } : fArgs.start;
		props.end = fArgs.end;

		var anim = d.animateProperty(fArgs);
		d.connect(anim, "beforeBegin", d.partial(_makeFadeable, fArgs.node));

		return anim; // dojo._Animation
	}

	/*=====
	dojo.__FadeArgs = function(node, duration, easing){
		// 	node: DOMNode|String
		//		The node referenced in the animation
		//	duration: Integer?
		//		Duration of the animation in milliseconds.
		// easing: Function?
		//		An easing function.
		this.node = node;
		this.duration = duration;
		this.easing = easing;
	}
	=====*/

	dojo.fadeIn = function(/*dojo.__FadeArgs*/ args){
		// summary: 
		//		Returns an animation that will fade node defined in 'args' from
		//		its current opacity to fully opaque.
		return d._fade(d.mixin({ end: 1 }, args)); // dojo._Animation
	}

	dojo.fadeOut = function(/*dojo.__FadeArgs*/  args){
		// summary: 
		//		Returns an animation that will fade node defined in 'args'
		//		from its current opacity to fully transparent.
		return d._fade(d.mixin({ end: 0 }, args)); // dojo._Animation
	}

	dojo._defaultEasing = function(/*Decimal?*/ n){
		// summary: The default easing function for dojo._Animation(s)
		return 0.5 + ((Math.sin((n + 1.5) * Math.PI))/2);
	}

	var PropLine = function(properties){
		this._properties = properties;
		for(var p in properties){
			var prop = properties[p];
			if(prop.start instanceof d.Color){
				// create a reusable temp color object to keep intermediate results
				prop.tempColor = new d.Color();
			}
		}
		this.getValue = function(r){
			var ret = {};
			for(var p in this._properties){
				var prop = this._properties[p];
				var start = prop.start;
				if(start instanceof d.Color){
					ret[p] = d.blendColors(start, prop.end, r, prop.tempColor).toCss();
				}else if(!d.isArray(start)){
					ret[p] = ((prop.end - start) * r) + start + (p != "opacity" ? prop.units||"px" : "");
				}
			}
			return ret;
		}
	}

	dojo.animateProperty = function(/*Object*/ args){
		//	summary: 
		//		Returns an animation that will transition the properties of
		//		node defined in 'args' depending how they are defined in
		//		'args.properties'
		//
		// description:
		//		The foundation of most dojo.fx animations, dojo.AnimateProperty
		//		will take an object of "properties" corresponding to style
		//		properties, and animate them in parallel over a set duration.
		//	
		//		args.node can be a String or a DomNode reference
		//	
		// 	example:
		//	|	dojo.animateProperty({ node: node, duration:2000,
		//	|		properties: {
		//	|			width: { start: '200', end: '400', unit:"px" },
		//	|			height: { start:'200', end: '400', unit:"px" },
		//	|			paddingTop: { start:'5', end:'50', unit:"px" } 
		//	|		}
		//	|	}).play();
		//

		args.node = d.byId(args.node);
		if(!args.easing){ args.easing = d._defaultEasing; }

		var anim = new d._Animation(args);
		d.connect(anim, "beforeBegin", anim, function(){
			var pm = {};
			for(var p in this.properties){
				// Make shallow copy of properties into pm because we overwrite some values below.
				// In particular if start/end are functions we don't want to overwrite them or
				// the functions won't be called if the animation is reused.
				var prop = (pm[p] = d.mixin({}, this.properties[p]));

				if(d.isFunction(prop.start)){
					prop.start = prop.start();
				}
				if(d.isFunction(prop.end)){
					prop.end = prop.end();
				}

				var isColor = (p.toLowerCase().indexOf("color") >= 0);
				function getStyle(node, p){
					// dojo.style(node, "height") can return "auto" or "" on IE; this is more reliable:
					var v = ({height: node.offsetHeight, width: node.offsetWidth})[p];
					if(v !== undefined){ return v; }
					v = d.style(node, p);
					return (p=="opacity") ? Number(v) : parseFloat(v);
				}
				if(!("end" in prop)){
					prop.end = getStyle(this.node, p);
				}else if(!("start" in prop)){
					prop.start = getStyle(this.node, p);
				}

				if(isColor){
					// console.debug("it's a color!");
					prop.start = new d.Color(prop.start);
					prop.end = new d.Color(prop.end);
				}else{
					prop.start = (p == "opacity") ? Number(prop.start) : parseFloat(prop.start);
				}
				// console.debug("start:", prop.start);
				// console.debug("end:", prop.end);
			}
			this.curve = new PropLine(pm);
		});
		d.connect(anim, "onAnimate", anim, function(propValues){
			// try{
			for(var s in propValues){
				// console.debug(s, propValues[s], this.node.style[s]);
				d.style(this.node, s, propValues[s]);
				// this.node.style[s] = propValues[s];
			}
			// }catch(e){ console.debug(dojo.toJson(e)); }
		});
		return anim; // dojo._Animation
	}
})();
