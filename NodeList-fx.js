dojo.provide("dojo.NodeList-fx");
dojo.require("dojo.fx");

dojo.extend(dojo.NodeList, {
	_anim: function(obj, method, args){
		var anims = [];
		args = args||{};
		this.forEach(function(item){
			var tmpArgs = { node: item };
			dojo.mixin(tmpArgs, args);
			anims.push(obj[method](tmpArgs));
		});
		return dojo.fx.combine(anims); // dojo._Animation
	},

	wipeIn: function(args){
		//	summary:
		//		wipe in all elements of this NodeList. Returns an instance of dojo._Animation
		//	example:
		//		// fade in all tables with class "blah"
		//		dojo.query("table.blah").wipeIn().play();
		return this._anim(dojo.fx, "wipeIn", args); // dojo._Animation
	},

	wipeOut: function(args){
		//	summary:
		//		wipe out all elements of this NodeList. Returns an instance of dojo._Animation
		//	example:
		//		// wipe out all tables with class "blah"
		//		dojo.query("table.blah").wipeOut().play();
		return this._anim(dojo.fx, "wipeOut", args); // dojo._Animation
	},

	slideTo: function(args){
		//	summary:
		//		slide all elements of the node list to the specified place.
		//		Returns an instance of dojo._Animation
		//	example:
		//		// move all tables with class "blah" to 300/300
		//		dojo.query("table.blah").slideTo({
		//			left: 40,
		//			top: 50
		//		}).play();
		return this._anim(dojo.fx, "slideTo", args); // dojo._Animation
	},


	fadeIn: function(args){
		//	summary:
		//		fade in all elements of this NodeList. Returns an instance of dojo._Animation
		//	example:
		//		// fade in all tables with class "blah"
		//		dojo.query("table.blah").fadeIn().play();
		return this._anim(dojo, "fadeIn", args); // dojo._Animation
	},

	fadeOut: function(args){
		//	summary:
		//		fade out all elements of this NodeList. Returns an instance of dojo._Animation
		//	example:
		//		// fade out all elements with class "zork"
		//		dojo.query(".zork").fadeOut().play();
		//
		//		// fade them on a delay and do something at the end
		//		var fo = dojo.query(".zork").fadeOut();
		//		dojo.connect(fo, "onEnd", function(){ /*...*/ });
		//		fo.play();
		return this._anim(dojo, "fadeOut", args); // dojo._Animation
	},

	animateProperty: function(args){
		//	summary:
		//		see dojo.animateProperty(). Animate all elements of this
		//		NodeList across the properties specified.
		//	example:
		//		dojo.query(".zork").animateProperty({
		//			duration: 500,
		//			properties: { 
		//				color:		{ start: "black", end: "white" },
		//				left:		{ end: 300 } 
		//			} 
		//		}).play();
		return this._anim(dojo, "animateProperty", args); // dojo._Animation
	}
});
