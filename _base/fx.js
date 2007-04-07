dojo.provide("dojo._base.fx");
dojo.require("dojo._base.array");
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
		var diffs = [];
		dojo.forEach(this.start, function(s,i){
			diffs[i] = this.end[i] - s;
		}, this);

		this.getValue = function(/*float*/ n){
			var res = [];
			dojo.forEach(this.start, function(s, i){
				res[i] = (diffs[i] * n) + s;
			}, this);
			return res; // Array
		}
	}else{
		var diff = end - start;
			
		this.getValue = function(/*float*/ n){
			//	summary: returns the point on the line
			//	n: a floating point number greater than 0 and less than 1
			return (diff * n) + this.start; // Decimal
		}
	}
}

dojo.declare("dojo._IAnimation", null, null, {
	// summary: dojo._IAnimation is an interface that implements
	//			commonly used functions of animation objects

	// public properties
	curve: null,
	duration: 1000,
	easing: null,
	repeatCount: 0,
	rate: 10, // 100 fps
	
	// events
	handler: null,
	beforeBegin: null,
	onBegin: null,
	onAnimate: null,
	onEnd: null,
	onPlay: null,
	onPause: null,
	onStop: null,

	// public methods
	play: null,
	pause: null,
	stop: null,

//FIXME: Bryan says we can ditch this and just use the regular event code.  This was just a shortcut.
	connect: function(/*Event*/ evt, /*Object*/ scope, /*Function*/ newFunc){
		// summary: Convenience function.  Quickly connect to an event
		//			of this object and save the old functions connected to it.
		// evt: The name of the event to connect to.
		// scope: the scope in which to run newFunc.
		// newFunc: the function to run when evt is fired.
		if(!newFunc){
			/* scope: Function
			   newFunc: null
			   pId: f */
			newFunc = scope;
			scope = this;
		}
		newFunc = dojo.hitch(scope, newFunc);
		var oldFunc = this[evt]||function(){};
		this[evt] = function(){
			var ret = oldFunc.apply(this, arguments);
			newFunc.apply(this, arguments);
			return ret;
		}
		return this; // dojo._IAnimation
	},

	fire: function(/*Event*/ evt, /*Array?*/ args){
		// summary: Convenience function.  Fire event "evt" and pass it
		//			the arguments specified in "args".
		// evt: The event to fire.
		// args: The arguments to pass to the event.
		if(this[evt]){
			this[evt].apply(this, args||[]);
		}
		return this; // dojo._IAnimation
	},
	
	repeat: function(/*int*/ count){
		// summary: Set the repeat count of this object.
		// count: How many times to repeat the animation.
		this.repeatCount = count;
		return this; // dojo._IAnimation
	},

	// private properties
	_active: false,
	_paused: false
});

//FIXME: _Animation must be a Deferred?
dojo.declare("dojo._Animation", dojo._IAnimation, 
	function(/*Object*/ handlers, /*int*/ duration, /*dojo._Line*/ curve, /*function*/ easing,
		/*int*/ repeatCount, /*int*/ rate){
		//	summary
		//		a generic animation object that fires callbacks into it's handlers
		//		object at various states
		//	handlers: { handler: Function?, onstart: Function?, onstop: Function?, onanimate: Function? }
		dojo._IAnimation.call(this);
		if(!isNaN(handlers)||(!handlers && duration.getValue)){
			// no handlers argument:
			rate = repeatCount;
			repeatCount = easing;
			easing = curve;
			curve = duration;
			duration = handlers;
			handlers = null;
		}else if(handlers.getValue||dojo.isArray(handlers)){
			// no handlers or duration:
			rate = easing;
			repeatCount = curve;
			easing = duration;
			curve = handlers;
			duration = null;
			handlers = null;
		}
		if(dojo.isArray(curve)){
			/* curve: Array
			   pId: a */
			this.curve = new dojo._Line(curve[0], curve[1]);
		}else{
			this.curve = curve;
		}
		if(duration != null && duration > 0){ this.duration = duration; }
		if(repeatCount){ this.repeatCount = repeatCount; }
		if(rate){ this.rate = rate; }
		if(handlers){
			dojo.forEach([
					"handler", "beforeBegin", "onBegin", 
					"onEnd", "onPlay", "onStop", "onAnimate"
				], function(item){
					if(handlers[item]){
						this.connect(item, handlers[item]);
					}
				}, this);
		}
		if(easing && dojo.isFunction(easing)){
			this.easing=easing;
		}
	},
	{
		_startTime: null,
		_endTime: null,
		_timer: null,
		_percent: 0,
		_startRepeatCount: 0,

		play: function(/*int?*/ delay, /*boolean?*/ gotoStart){
			// summary: Start the animation.
			// delay: How many milliseconds to delay before starting.
			// gotoStart: If true, starts the animation from the beginning; otherwise,
			//            starts it from its current position.
			if(gotoStart){
				clearTimeout(this._timer);
				this._active = false;
				this._paused = false;
				this._percent = 0;
			}else if(this._active && !this._paused){
				return this; // dojo._Animation
			}

			this.fire("handler", ["beforeBegin"]);
			this.fire("beforeBegin");

			if(delay > 0){
				setTimeout(dojo.hitch(this, function(){ this.play(null, gotoStart); }), delay);
				return this; // dojo._Animation
			}
		
			this._startTime = new Date().valueOf();
			if(this._paused){
				this._startTime -= this.duration * this._percent / 100;
			}
			this._endTime = this._startTime + this.duration;

			this._active = true;
			this._paused = false;
		
			var step = this._percent / 100;
			var value = this.curve.getValue(step);
			if(this._percent == 0 ){
				if(!this._startRepeatCount){
					this._startRepeatCount = this.repeatCount;
				}
				this.fire("handler", ["begin", value]);
				this.fire("onBegin", [value]);
			}

			this.fire("handler", ["play", value]);
			this.fire("onPlay", [value]);

			this._cycle();
			return this; // dojo._Animation
		},

		pause: function(){
			// summary: Pauses a running animation.
			clearTimeout(this._timer);
			if(!this._active){ return this; /*dojo._Animation*/}
			this._paused = true;
			var value = this.curve.getValue(this._percent / 100);
			this.fire("handler", ["pause", value]);
			this.fire("onPause", [value]);
			return this; // dojo._Animation
		},

		gotoPercent: function(/*Decimal*/ pct, /*boolean?*/ andPlay){
			// summary: Sets the progress of the animation.
			// pct: A percentage in decimal notation (between and including 0.0 and 1.0).
			// andPlay: If true, play the animation after setting the progress.
			clearTimeout(this._timer);
			this._active = true;
			this._paused = true;
			this._percent = pct;
			if(andPlay){ this.play(); }
			return this; // dojo._Animation
		},

		stop: function(/*boolean?*/ gotoEnd){
			// summary: Stops a running animation.
			// gotoEnd: If true, the animation will end.
			clearTimeout(this._timer);
			var step = this._percent / 100;
			if(gotoEnd){
				step = 1;
			}
			var value = this.curve.getValue(step);
			this.fire("handler", ["stop", value]);
			this.fire("onStop", [value]);
			this._active = false;
			this._paused = false;
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
				this._percent = step * 100;

				// Perform easing
				if(this.easing && dojo.isFunction(this.easing)){
					step = this.easing(step);
				}

				var value = this.curve.getValue(step);
				this.fire("handler", ["animate", value]);
				this.fire("onAnimate", [value]);

				if(step < 1){
					this._timer = setTimeout(dojo.hitch(this, "_cycle"), this.rate);
				}else{
					this._active = false;
					this.fire("handler", ["end"]);
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

	dojo._fade = function(/*DOMNode[]*/ nodes,
								  /*Object*/values,
								  /*int?*/ duration,
								  /*Function?*/ easing,
								  /*Function?*/ callback){
		// summary:Returns an animation that will fade the "nodes" from the start to end values passed.
		// nodes: An array of DOMNodes or one DOMNode.
		// values: { start: Decimal?, end: Decimal? }
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		// callback: Function to run at the end of the animation.
		nodes = _byId(nodes);
		var props = { property: "opacity" };
		props.start = (typeof values.start == "undefined") ?
			function(){ return dojo.style(nodes[0], "opacity"); } : values.start;

		if(typeof values.end == "undefined"){
			throw new Error("dojo._fade needs an end value");
		}
		props.end = values.end;

		var anim = dojo.animateProperty(nodes, [props], duration, easing);
		anim.connect("beforeBegin", function(){
			_makeFadeable(nodes);
		});
		if(callback){
			anim.connect("onEnd", function(){ callback(nodes, anim); });
		}

		return anim; // dojo._Animation
	}

	dojo.fadeIn = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing, /*Function?*/ callback){
		// summary: Returns an animation that will fade "nodes" from its current opacity to fully opaque.
		// nodes: An array of DOMNodes or one DOMNode.
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		// callback: Function to run at the end of the animation.
		return dojo._fade(nodes, {end: 1}, duration, easing, callback); // dojo._Animation
	}

	dojo.fadeOut = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing, /*Function?*/ callback){
		// summary: Returns an animation that will fade "nodes" from its current opacity to fully transparent.
		// nodes: An array of DOMNodes or one DOMNode.
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		// callback: Function to run at the end of the animation.	
		return dojo._fade(nodes, {end: 0}, duration, easing, callback); // dojo._Animation
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

	//Memoizing. Assumes that the array doesn't change. FIXME: can this go away
	//or get folded into dojo.byId?  Talk it over with Bryan
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

	dojo.animateProperty = function(			/*DOMNode[]*/ nodes, 
												/*Object[]*/ propertyMap, 
												/*int*/ duration,
												/*function*/ easing,
												/*Object*/ handlers){
		// summary: Returns an animation that will transition the properties of "nodes"
		//			depending how they are defined in "propertyMap".
		// nodes: An array of DOMNodes or one DOMNode.
		// propertyMap: { property: String, start: Decimal?, end: Decimal?, units: String? }
		//				An array of objects defining properties to change.
		// duration: Duration of the animation in milliseconds.
		// easing: An easing function.
		// handlers: { handler: Function?, onstart: Function?, onstop: Function?, onanimate: Function? }
		nodes = _byId(nodes);

		var targs = {
			"propertyMap": propertyMap,
			"nodes": nodes,
			"duration": duration,
			"easing": easing||dojo._defaultEasing
		};
		
		var setEmUp = function(args){
			if(args.nodes.length==1){
				// FIXME: we're only supporting start-value filling when one node is
				// passed
				
				var pm = args.propertyMap;
				if(!dojo.isArray(args.propertyMap)){
					// it's stupid to have to pack an array with a set of objects
					// when you can just pass in an object list
					var parr = [];
					for(var pname in pm){
						pm[pname].property = pname;
						parr.push(pm[pname]);
					}
					pm = args.propertyMap = parr;
				}
				dojo.forEach(pm, function(prop){
					if(typeof prop.start == "undefined"){
						//FIXME: else clause is unecessary?  parseInt vs. parseFloat?
						if(prop.property == "opacity"){
							prop.start = dojo.style(args.nodes[0], prop.property);
						}else{
							prop.start = parseInt(dojo.getComputedStyle(args.nodes[0])[prop.property]);
						}
					}
				});
			}
		}

		var coordsAsInts = function(coords){
			var cints = [];
			dojo.forEach(coords, function(c){ 
				cints.push(Math.round(c));
			});
			return cints;
		}

		var setStyle = function(n, style){
			n = dojo.byId(n);
			if(!n || !n.style){ return; }
			for(var s in style){
				try{
					dojo.style(n, s, style[s]);
				}catch(e){ //TODO: why the try/catch?
					dojo.debug(e);
				}
			}
		}

		var PropLine = function(properties){
			this._properties = properties;
			this.diffs = [properties.length];
			dojo.forEach(properties, function(prop, i){
				// calculate the end - start to optimize a bit
				if(dojo.isFunction(prop.start)){
					prop.start = prop.start(prop, i);
				}
				if(dojo.isFunction(prop.end)){
					prop.end = prop.end(prop, i);
				}
				if(dojo.isArray(prop.start)){
					// don't loop through the arrays
					this.diffs[i] = null;
	/* FIXME - gfx dependency
				}else if(prop.start instanceof dojo.gfx.color.Color){
					// save these so we don't have to call toRgb() every getValue() call
					prop.startRgb = prop.start.toRgb();
					prop.endRgb = prop.end.toRgb();
	*/
				}else{
					this.diffs[i] = prop.end - prop.start;
				}
			}, this);

			this.getValue = function(n){
				var ret = {};
				dojo.forEach(this._properties, function(prop, i){
					var value = null;
					if(dojo.isArray(prop.start)){
						// FIXME: what to do here?
	/* FIXME
					}else if(prop.start instanceof dojo.gfx.color.Color){
						value = (prop.units||"rgb") + "(";
						for(var j = 0 ; j < prop.startRgb.length ; j++){
							value += Math.round(((prop.endRgb[j] - prop.startRgb[j]) * n) + prop.startRgb[j]) + (j < prop.startRgb.length - 1 ? "," : "");
						}
						value += ")";
	*/
					}else{
						value = (this.diffs[i] * n) + prop.start + (prop.property != "opacity" ? prop.units||"px" : "");
					}
					ret[prop.property] = value;
	//FIXME				ret[dojo.html.toCamelCase(prop.property)] = value;
				}, this);
				return ret;
			}
		}
		
		var anim = new dojo._Animation({
				beforeBegin: function(){ 
					setEmUp(targs);
					anim.curve = new PropLine(targs.propertyMap);
				},
				onAnimate: function(propValues){
					dojo.forEach(targs.nodes, function(node){
						setStyle(node, propValues);
					});
				}
			},
			targs.duration, null, targs.easing);

		if(handlers){
			for(var x in handlers){
				if(dojo.isFunction(handlers[x])){
					anim.connect(x, anim, handlers[x]);
				}
			}
		}
		
		return anim; // dojo._Animation
	}

})();
