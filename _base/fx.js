dojo.provide("dojo._base.fx");
dojo.require("dojo._base.array");
dojo.require("dojo._base.connect");
dojo.require("dojo._base.declare");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.html");

/*
	Animation losely package based on Dan Pupius' work: 
		http://pupius.co.uk/js/Toolkit.Drawing.js
*/
dojo._Line = function(/*int*/ start, /*int*/ end){
	// summary: dojo._Line is the object used to generate values
	//			from a start value to an end value
	this.start = start;
	this.end = end;
	if(dojo.isArray(start)){
		/* start: Array
		   end: Array
		   pId: a */
		this.getValue = function(/*float*/ n){
			var res = [];
			dojo.forEach(this.start, function(s, i){
				res[i] = ((this.end[i] - this.start[i]) * n) + s;
			}, this);
			return res; // Array
		}
	}else{
		this.getValue = function(/*float*/ n){
			//	summary: returns the point on the line
			//	n: a floating point number greater than 0 and less than 1
			return ((this.end - this.start) * n) + this.start; // Decimal
		}
	}
}

//FIXME: _Animation must be a Deferred?
dojo.declare("dojo._Animation", null,
	function(/*Object*/ args){
		//	summary
		//		a generic animation object that fires callbacks into it's handlers
		//		object at various states
		//  FIXME: document args object
		dojo.mixin(this, args);
		if(dojo.isArray(this.curve)){
			/* curve: Array
			   pId: a */
			this.curve = new dojo._Line(this.curve[0], this.curve[1]);
		}
	},
	{
		// public properties
		curve: null,
		duration: 1000,
		easing: null,
		repeatCount: 0,
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
		
		chain: function(/*dojo._Animation[]*/ anims){
			dojo.forEach(anims, function(anim, i){
				var prev = (i==0) ? this : anims[i-1];
				dojo.connect(prev, "onEnd", anim, "play");
			}, this);
			return this; // dojo._Animation
		},

		combine: function(/*dojo._Animation[]*/ anims){
			dojo.forEach(anims, function(anim){
				dojo.connect(this, "play", anim, "play");
			}, this);
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
			if(this._percent == 0){
				if(!this._startRepeatCount){
					this._startRepeatCount = this.repeatCount;
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
			var value = this.curve.getValue(this._percent);
			this.fire("onPause", [value]);
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
			clearTimeout(this._timer);
			if(gotoEnd){
				this._percent = 1;
			}
			var value = this.curve.getValue(this._percent);
			this.fire("onStop", [value]);
			this._active = this._paused = false;
			return this; // dojo._Animation
		},

		status: function(){
			// summary: Returns a string representation of the status of
			//			the animation.
			if(this._active){
				return this._paused ? "paused" : "playing"; // String
			}
			return "stopped"; // String
		},

		// "private" methods
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

				var value = this.curve.getValue(step);
				this.fire("onAnimate", [value]);

				if(step < 1){
					this._timer = setTimeout(dojo.hitch(this, "_cycle"), this.rate);
				}else{
					this._active = false;
					this.fire("onEnd");

					if(this.repeatCount > 0){
						this.repeatCount--;
						this.play(null, true);
					}else if(this.repeatCount == -1){
						this.play(null, true);
					}else{
						if(this._startRepeatCount){
							this.repeatCount = this._startRepeatCount;
							this._startRepeatCount = 0;
						}
					}
				}
			}
			return this; // dojo._Animation
		}
	}
);

(function(){
	var _makeFadeable = function(nodes){
		var makeFade = function(node){
			if(dojo.isIE){
				// only set the zoom if the "tickle" value would be the same as the
				// default
				if(node.style.zoom.length == 0 && dojo.style(node, "zoom") == "normal"){
					// make sure the node "hasLayout"
					// NOTE: this has been tested with larger and smaller user-set text
					// sizes and works fine
					node.style.zoom = "1";
					// node.style.zoom = "normal";
				}
				// don't set the width to auto if it didn't already cascade that way.
				// We don't want to f anyones designs
				if(node.style.width.length == 0 && dojo.style(node, "width") == "auto"){
					node.style.width = "auto";
				}
			}
		}
		if(dojo.isArrayLike(nodes)){
			dojo.forEach(nodes, makeFade);
		}else{
			makeFade(nodes);
		}
	}

	//Memoizing. Assumes that the array doesn't change. FIXME: can this go away
	//or get folded into dojo.byId?  Talk it over with Bryan
	//Moving this above any functions that use it so the dojo compressor does not
	//strip it out.
	var _byId = function(nodes){
		if(!nodes){ return []; }
		if(dojo.isArrayLike(nodes)){
			if(!nodes._alreadyChecked){
				var n = [];
				dojo.forEach(nodes, function(node){
					n.push(dojo.byId(node));
				});
				n._alreadyChecked = true;
				return n;
			}else{
				return nodes;
			}
		}else{
			var n = [];
			n.push(dojo.byId(nodes));
			n._alreadyChecked = true;
			return n;
		}
	}

	dojo._fade = function(/*DOMNode[]*/ nodes,
						  /*Object*/values,
						  /*int?*/ duration,
						  /*Function?*/ easing){
		// summary:Returns an animation that will fade the "nodes" from the start to end values passed.
		// nodes: An array of DOMNodes or one DOMNode.
		// values: { start: Decimal?, end: Decimal? }
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		nodes = _byId(nodes);
		var props = {};
		props.start = (typeof values.start == "undefined") ?
			function(){ return Number(dojo.style(nodes[0], "opacity")); } : values.start;

//FIXME: remove arg checking?  Change docs above to show that end is not optional.  Just make sure this blows up in a reliable way?
		if(typeof values.end == "undefined"){
			throw new Error("dojo._fade needs an end value");
		}
		props.end = values.end;

		var anim = dojo.animateProperty({
			nodes: nodes,
			properties: { opacity: props },
			duration: duration,
			easing: easing
		});
		dojo.connect(anim, "beforeBegin", null, function(){
			_makeFadeable(nodes);
		});

		return anim; // dojo._Animation
	}

	dojo.fadeIn = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing){
		// summary: Returns an animation that will fade "nodes" from its current opacity to fully opaque.
		// nodes: An array of DOMNodes or one DOMNode.
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		return dojo._fade(nodes, {end: 1}, duration, easing); // dojo._Animation
	}

	dojo.fadeOut = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing){
		// summary: Returns an animation that will fade "nodes" from its current opacity to fully transparent.
		// nodes: An array of DOMNodes or one DOMNode.
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		return dojo._fade(nodes, {end: 0}, duration, easing); // dojo._Animation
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

	dojo.animateProperty = function(/*Object*/ args){
		// summary: Returns an animation that will transition the properties of "nodes"
		//			depending how they are defined in "propertyMap".
		args.nodes = _byId(args.nodes);
		if (!args.easing){ args.easing = dojo._defaultEasing; }
		
		var PropLine = function(properties){
			this._properties = properties;
			for (var p in properties){
				var prop = properties[p];
				// calculate the end - start to optimize a bit
				if(dojo.isFunction(prop.start)){
					prop.start = prop.start(prop);
				}
				if(dojo.isFunction(prop.end)){
					prop.end = prop.end(prop);
				}
	/* FIXME - gfx dependency
				if(prop.start instanceof dojo.gfx.color.Color){
					// save these so we don't have to call toRgb() every getValue() call
					prop.startRgb = prop.start.toRgb();
					prop.endRgb = prop.end.toRgb();
				}
	*/
			}
			this.getValue = function(n){
				var ret = {};
				for (var p in this._properties) {
					var prop = this._properties[p];
					var value = null;
					if(!dojo.isArray(prop.start)){
						value = ((prop.end - prop.start) * n) + prop.start + (p != "opacity" ? prop.units||"px" : "");
					}
					ret[p] = value;
				}
				return ret;
			}
		}
		
		var anim = new dojo._Animation(args);
		dojo.connect(anim, "beforeBegin", anim, function(){
			if(this.nodes.length==1){
				// FIXME: we're only supporting start-value filling when one node is
				// passed
				var pm = this.properties;
				for (var p in pm) {
					var prop = pm[p];
					if(typeof prop.start == "undefined"){
						prop.start = dojo.style(anim.nodes[0], p);
						prop.start = (p == "opacity") ? Number(prop.start) : parseInt(prop.start);
					}
				}
			}
			this.curve = new PropLine(pm);
		});
		dojo.connect(anim, "onAnimate", anim, function(propValues){
			dojo.forEach(this.nodes, function(node){
				for (var s in propValues) {
					dojo.style(node, s, propValues[s]);
				}
			});
		});

		return anim; // dojo._Animation
	}
})();
