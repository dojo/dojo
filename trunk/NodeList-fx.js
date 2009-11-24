dojo.provide("dojo.NodeList-fx");
dojo.require("dojo.fx");

/*=====
dojo["NodeList-fx"] = {
	// summary: Adds dojo.fx animation support to dojo.query()
};
=====*/

dojo.extend(dojo.NodeList, {
	_anim: function(obj, method, args){
		args = args||{};
		return dojo.fx.combine(
			this.map(function(item){
				var tmpArgs = { node: item };
				dojo.mixin(tmpArgs, args);
				return obj[method](tmpArgs);
			})
		); // dojo.Animation
	},

	wipeIn: function(args){
		//	summary:
		//		wipe in all elements of this NodeList. Returns an instance of dojo.Animation
		//	example:
		//		Fade in all tables with class "blah":
		//		|	dojo.query("table.blah").wipeIn().play();
		return this._anim(dojo.fx, "wipeIn", args); // dojo.Animation
	},

	wipeOut: function(args){
		//	summary:
		//		wipe out all elements of this NodeList. Returns an instance of dojo.Animation
		//	example:
		//		Wipe out all tables with class "blah":
		//		|	dojo.query("table.blah").wipeOut().play();
		return this._anim(dojo.fx, "wipeOut", args); // dojo.Animation
	},

	slideTo: function(args){
		//	summary:
		//		slide all elements of the node list to the specified place.
		//		Returns an instance of dojo.Animation
		//	example:
		//		|	Move all tables with class "blah" to 300/300:
		//		|	dojo.query("table.blah").slideTo({
		//		|		left: 40,
		//		|		top: 50
		//		|	}).play();
		return this._anim(dojo.fx, "slideTo", args); // dojo.Animation
	},


	fadeIn: function(args){
		//	summary:
		//		fade in all elements of this NodeList. Returns an instance of dojo.Animation
		//	example:
		//		Fade in all tables with class "blah":
		//		|	dojo.query("table.blah").fadeIn().play();
		return this._anim(dojo, "fadeIn", args); // dojo.Animation
	},

	fadeOut: function(args){
		//	summary:
		//		fade out all elements of this NodeList. Returns an instance of dojo.Animation
		//	example:
		//		Fade out all elements with class "zork":
		//		|	dojo.query(".zork").fadeOut().play();
		//	example:
		//		Fade them on a delay and do something at the end:
		//		|	var fo = dojo.query(".zork").fadeOut();
		//		|	dojo.connect(fo, "onEnd", function(){ /*...*/ });
		//		|	fo.play();
		return this._anim(dojo, "fadeOut", args); // dojo.Animation
	},

	animateProperty: function(args){
		//	summary:
		//		see dojo.animateProperty(). Animate all elements of this
		//		NodeList across the properties specified.
		//	example:
		//	|	dojo.query(".zork").animateProperty({
		//	|		duration: 500,
		//	|		properties: { 
		//	|			color:		{ start: "black", end: "white" },
		//	|			left:		{ end: 300 } 
		//	|		} 
		//	|	}).play();
		return this._anim(dojo, "animateProperty", args); // dojo.Animation
	},

	anim: function(	/*Object*/ 			properties, 
					/*Integer?*/		duration, 
					/*Function?*/		easing, 
					/*Function?*/		onEnd,
					/*Integer?*/		delay){
		//	summary:
		//		Animate one or more CSS properties for all nodes in this list.
		//		The returned animation object will already be playing when it
		//		is returned. See the docs for `dojo.anim` for full details.
		//	properties: Object
		//		the properties to animate
		//	duration: Integer?
		//		Optional. The time to run the animations for
		//	easing: Function?
		//		Optional. The easing function to use.
		//	onEnd: Function?
		//		A function to be called when the animation ends
		//	delay:
		//		how long to delay playing the returned animation
		//	example:
		//		Another way to fade out:
		//	|	dojo.query(".thinger").anim({ opacity: 0 });
		//	example:
		//		animate all elements with the "thigner" class to a width of 500
		//		pixels over half a second
		//	|	dojo.query(".thinger").anim({ width: 500 }, 700);
		var canim = dojo.fx.combine(
			this.map(function(item){
				return dojo.animateProperty({
					node: item,
					properties: properties,
					duration: duration||350,
					easing: easing
				});
			})
		); 
		if(onEnd){
			dojo.connect(canim, "onEnd", onEnd);
		}
		return canim.play(delay||0); // dojo.Animation
	}
});
