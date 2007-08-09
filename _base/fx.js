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
dojo._Line = function(/*int*/ start, /*int*/ end){
	// summary: dojo._Line is the object used to generate values
	//			from a start value to an end value
	this.start = start;
	this.end = end;
	this.getValue = function(/*float*/ n){
		//	summary: returns the point on the line
		//	n: a floating point number greater than 0 and less than 1
		return ((this.end - this.start) * n) + this.start; // Decimal
	}
}

dojo.declare("dojo._Animation", null, {
	//	summary
	//		a generic animation object that fires callbacks into it's handlers
	//		object at various states
	//	FIXME: document args object
	constructor: function(/*Object*/ args){
		dojo.mixin(this, args);
		if(dojo.isArray(this.curve)){
			/* curve: Array
				pId: a */
			this.curve = new dojo._Line(this.curve[0], this.curve[1]);
		}
	},
	
	// public properties
	curve: null,
	duration: 1000,
	easing: null,
	repeat: 0,
	rate: 10, // 100 fps
	delay: null,
	
	// events
	beforeBegin: null,
	onBegin: null,
	onAnimate: null,
	onEnd: null,
	onPlay: null,
	onPause: null,
	onStop: null,

	// private properties
	_active: false,
	_paused: false,
	_startTime: null,
	_endTime: null,
	_timer: null,
	_percent: 0,
	_startRepeatCount: 0,

	fire: function(/*Event*/ evt, /*Array?*/ args){
		// summary: Convenience function.  Fire event "evt" and pass it
		//			the arguments specified in "args".
		// evt: The event to fire.
		// args: The arguments to pass to the event.
		if(this[evt]){
			this[evt].apply(this, args||[]);
		}
		return this; // dojo._Animation
	},

	play: function(/*int?*/ delay, /*boolean?*/ gotoStart){
		// summary: Start the animation.
		// delay: How many milliseconds to delay before starting.
		// gotoStart: If true, starts the animation from the beginning; otherwise,
		//            starts it from its current position.
		if(gotoStart){
			clearTimeout(this._timer);
			this._active = this._paused = false;
			this._percent = 0;
		}else if(this._active && !this._paused){
			return this; // dojo._Animation
		}

		this.fire("beforeBegin");

		var d = delay||this.delay;
		if(d > 0){
			setTimeout(dojo.hitch(this, function(){ this.play(null, gotoStart); }), d);
			return this; // dojo._Animation
		}
	
		this._startTime = new Date().valueOf();
		if(this._paused){
			this._startTime -= this.duration * this._percent;
		}
		this._endTime = this._startTime + this.duration;

		this._active = true;
		this._paused = false;

		var value = this.curve.getValue(this._percent);
		if(!this._percent){
			if(!this._startRepeatCount){
				this._startRepeatCount = this.repeat;
			}
			this.fire("onBegin", [value]);
		}

		this.fire("onPlay", [value]);

		this._cycle();
		return this; // dojo._Animation
	},

	pause: function(){
		// summary: Pauses a running animation.
		clearTimeout(this._timer);
		if(!this._active){ return this; /*dojo._Animation*/}
		this._paused = true;
		this.fire("onPause", [this.curve.getValue(this._percent)]);
		return this; // dojo._Animation
	},

	gotoPercent: function(/*Decimal*/ pct, /*boolean?*/ andPlay){
		// summary: Sets the progress of the animation.
		// pct: A percentage in decimal notation (between and including 0.0 and 1.0).
		// andPlay: If true, play the animation after setting the progress.
		clearTimeout(this._timer);
		this._active = this._paused = true;
		this._percent = pct * 100;
		if(andPlay){ this.play(); }
		return this; // dojo._Animation
	},

	stop: function(/*boolean?*/ gotoEnd){
		// summary: Stops a running animation.
		// gotoEnd: If true, the animation will end.
		if(!this._timer){ return; }
		clearTimeout(this._timer);
		if(gotoEnd){
			this._percent = 1;
		}
		this.fire("onStop", [this.curve.getValue(this._percent)]);
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
		clearTimeout(this._timer);
		if(this._active){
			var curr = new Date().valueOf();
			var step = (curr - this._startTime) / (this._endTime - this._startTime);

			if(step >= 1){
				step = 1;
			}
			this._percent = step;

			// Perform easing
			if(this.easing){
				step = this.easing(step);
			}

			this.fire("onAnimate", [this.curve.getValue(step)]);

			if(step < 1){
				this._timer = setTimeout(dojo.hitch(this, "_cycle"), this.rate);
			}else{
				this._active = false;

				if(this.repeat > 0){
					this.repeat--;
					this.play(null, true);
				}else if(this.repeat == -1){
					this.play(null, true);
				}else{
					if(this._startRepeatCount){
						this.repeat = this._startRepeatCount;
						this._startRepeatCount = 0;
					}
				}
				this._percent = 0;
				this.fire("onEnd");
			}
		}
		return this; // dojo._Animation
	}
});

(function(){
	var _makeFadeable = function(node){
		if(dojo.isIE){
			// only set the zoom if the "tickle" value would be the same as the
			// default
			var ns = node.style;
			if(!ns.zoom.length && dojo.style(node, "zoom") == "normal"){
				// make sure the node "hasLayout"
				// NOTE: this has been tested with larger and smaller user-set text
				// sizes and works fine
				ns.zoom = "1";
				// node.style.zoom = "normal";
			}
			// don't set the width to auto if it didn't already cascade that way.
			// We don't want to f anyones designs
			if(!ns.width.length && dojo.style(node, "width") == "auto"){
				ns.width = "auto";
			}
		}
	}

	dojo._fade = function(/*Object*/ args){
		// summary:Returns an animation that will fade the "nodes" from the start to end values passed.

		//FIXME: remove arg checking?  Change docs above to show that end is not optional.  Just make sure this blows up in a reliable way?
		if(typeof args.end == "undefined"){
			throw new Error("dojo._fade needs an end value");
		}
		args.node = dojo.byId(args.node);
		var fArgs = dojo.mixin({ properties: {} }, args);
		var props = (fArgs.properties.opacity = {});
		props.start = (typeof fArgs.start == "undefined") ?
			function(){ return Number(dojo.style(fArgs.node, "opacity")); } : fArgs.start;
		props.end = fArgs.end;

		var anim = dojo.animateProperty(fArgs);
		dojo.connect(anim, "beforeBegin", null, function(){
			_makeFadeable(fArgs.node);
		});

		return anim; // dojo._Animation
	}

	dojo.fadeIn = function(/*Object*/ args){
		// summary: Returns an animation that will fade node
		// defined in 'args' from its current opacity to fully 
		// opaque.
		// 
		// mixins:
		// args.duration: Duration of the animation in milliseconds.
		// args.easing: An easing function.
		return dojo._fade(dojo.mixin({ end: 1 }, args)); // dojo._Animation
	}

	dojo.fadeOut = function(/*Object*/ args){
		// summary: Returns an animation that will fade node
		// defined in 'args'  from its current opacity to fully 
		// transparent.
		// mixins:
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		return dojo._fade(dojo.mixin({ end: 0 }, args)); // dojo._Animation
	}

	if(dojo.isKhtml && !dojo.isSafari){
		// the cool kids are obviously not using konqueror...
		// found a very wierd bug in floats constants, 1.5 evals as 1
		// seems somebody mixed up ints and floats in 3.5.4 ??
		// FIXME: investigate more and post a KDE bug (Fredrik)
		dojo._defaultEasing = function(/*Decimal?*/ n){
			//	summary: Returns the point for point n on a sin wave.
			return parseFloat("0.5")+((Math.sin((n+parseFloat("1.5")) * Math.PI))/2); //FIXME: Does this still occur in the supported Safari version?
		}
	}else{
		dojo._defaultEasing = function(/*Decimal?*/ n){
			return 0.5+((Math.sin((n+1.5) * Math.PI))/2);
		}
	}

	var PropLine = function(properties){
		this._properties = properties;
		for(var p in properties){
			var prop = properties[p];
			if(prop.start instanceof dojo.Color){
				// create a reusable temp color object to keep intermediate results
				prop.tempColor = new dojo.Color();
			}
		}
		this.getValue = function(r){
			var ret = {};
			for(var p in this._properties){
				var prop = this._properties[p];
				var value = null;
				if(prop.start instanceof dojo.Color){
					value = dojo.blendColors(prop.start, prop.end, r, prop.tempColor).toCss();
				}else if(!dojo.isArray(prop.start)){
					value = ((prop.end - prop.start) * r) + prop.start + (p != "opacity" ? prop.units||"px" : "");
				}
				ret[p] = value;
			}
			return ret;
		}
	}

	dojo.animateProperty = function(/*Object*/ args){
		// summary: Returns an animation that will transition the properties of node
		// defined in 'args' depending how they are defined in 'args.properties'

		args.node = dojo.byId(args.node);
		if (!args.easing){ args.easing = dojo._defaultEasing; }
		
		var anim = new dojo._Animation(args);
		dojo.connect(anim, "beforeBegin", anim, function(){
			var pm = {};
			for(var p in this.properties){
				// Make shallow copy of properties into pm because we overwrite some values below.
				// In particular if start/end are functions we don't want to overwrite them or
				// the functions won't be called if the animation is reused.
				var prop = pm[p] = dojo.mixin({}, this.properties[p]);

				if(dojo.isFunction(prop.start)){
					prop.start = prop.start();
				}
				if(dojo.isFunction(prop.end)){
					prop.end = prop.end();
				}

				var isColor = (p.toLowerCase().indexOf("color") >= 0);
				function getStyle(node, p){
					// dojo.style(node, "height") can return "auto" or "" on IE; this is more reliable:
					switch(p){
						case "height": return node.offsetHeight;
						case "width": return node.offsetWidth;
					}
					var v = dojo.style(node, p);
					return (p=="opacity") ? Number(v) : parseFloat(v);
				}
				if(typeof prop.end == "undefined"){
					prop.end = getStyle(this.node, p);
				}else if(typeof prop.start == "undefined"){
					prop.start = getStyle(this.node, p);
				}

				if(isColor){
					// console.debug("it's a color!");
					prop.start = new dojo.Color(prop.start);
					prop.end = new dojo.Color(prop.end);
				}else{
					prop.start = (p == "opacity") ? Number(prop.start) : parseFloat(prop.start);
				}
				// console.debug("start:", prop.start);
				// console.debug("end:", prop.end);
			}
			this.curve = new PropLine(pm);
		});
		dojo.connect(anim, "onAnimate", anim, function(propValues){
			// try{
			for(var s in propValues){
				// console.debug(s, propValues[s], this.node.style[s]);
				dojo.style(this.node, s, propValues[s]);
				// this.node.style[s] = propValues[s];
			}
			// }catch(e){ console.debug(dojo.toJson(e)); }
		});

		return anim; // dojo._Animation
	}
})();
