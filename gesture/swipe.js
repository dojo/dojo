define(["dojo", "../gesture"], function(dojo, gesture){
// module:
//		dojo/gesture/swipe
// summary:
//		This module provides event handlers for swipe gesture
//		- dojo.gesture.swipe -> to fire 'swipe' event
//		- dojo.gesture.swipe.up -> to fire 'swipe.up' event
//		- dojo.gesture.swipe.down -> to fire 'swipe.down' event
//		- dojo.gesture.swipe.left -> to fire 'swipe.left' event
//		- dojo.gesture.swipe.right -> to fire 'swipe.right' event
// example:
//		A. Used with dojo.connect()
//		|	dojo.connect(node, dojo.gesture.swipe, function(e){});
//		|	dojo.connect(node, dojo.gesture.swipe.up|down|left|right, function(e){});
//
//		B. Used with dojo.on
//		|	define(["dojo/on", "dojo/gesture/swipe"], function(on, swipe){
//		|		on(node, swipe, function(e){});
//		|		on(node, swipe.up|down|left|right, function(e){});
//
//		C. Used with dojo.gesture.swipe.* directly
//		|	dojo.gesture.swipe(node, function(e){});
//		|	dojo.gesture.swipe.up(node, function(e){});
//		|	...
//
//		Though there is always a default singleton gesture instance if required e.g. require("dojo.gesture.swipe")
//		It's possible to create a new one with different parameters to overwrite it
//		|	var mySwipe = new dojo.gesture.swipe.Swipe({swipeRange: 300});
//		|	dojo.gesture.register(mySwipe);
//		|	dojo.connect(node, mySwipe, function(e){});
//		|	dojo.connect(node, mySwipe.up|down|left|right, function(e){});

var clz = dojo.declare(null, {
	
	swipeTimeout: 300,
	
	swipeSpeed: 600,
	
	swipeRange: 60,
	
	swipeDirection: {none: 0, up: 1, down: 2, left: 4, right: 8},
	
	defaultEvent: 'swipe',
	
	subEvents: ['up', 'right', 'down', 'left'],

	constructor: function(args){
		dojo.mixin(this, args);
	},
	press: function(data, e){
		if(!data.swipeContext){
			data.swipeContext = {x: 0, y: 0, t: 0};
		}
		data.swipeContext.t = new Date().getTime();
		data.swipeContext.x = e.screenX;
		data.swipeContext.y = e.screenY;
	},
	release: function(data, e){
		var t = (new Date().getTime() - data.swipeContext.t);
		if(t > this.swipeTimeout){
			// gesture is too long
			return;
		}
		var dx = e.screenX - data.swipeContext.x,
			dy = e.screenY - data.swipeContext.y,
			dirx = (dx > 0 ? this.swipeDirection.right : dx < 0 ? this.swipeDirection.left : this.swipeDirection.none),
			diry = (dy > 0 ? this.swipeDirection.down : dy < 0 ? this.swipeDirection.up : this.swipeDirection.none);
		if(dirx === this.swipeDirection.none && diry === this.swipeDirection.none){
			// not a swipe
			return;
		}
		dx = Math.abs(dx);
		dy = Math.abs(dy);
		var target = e.currentTarget;
		if(dx >= dy){
			if(dx/t*1000 < this.swipeSpeed){
				// gesture is too slow
				return;
			}
			switch(dy > this.swipeRange ? this.swipeDirection.none : dirx){
			case this.swipeDirection.left:
				gesture.fire(target, "swipe.left");
				break;
			case this.swipeDirection.right:
				gesture.fire(target, "swipe.right");
				break;
			default: 
				// not a swipe
				return;
			}
		}else{
			if(dy/t*1000 < this.swipeSpeed){
				// gesture is too slow
				return;
			}
			switch(dx > this.swipeRange ? this.swipeDirection.none : diry){
			case this.swipeDirection.up:
				gesture.fire(target, "swipe.up");
				break;
			case this.swipeDirection.down:
				gesture.fire(target, "swipe.down");
				break;
			default:
				// not a swipe
				return;
			}
		}
		gesture.fire(target, 'swipe');
	},
	destroy: function(){}
});

//register a default singleton Swipe instance
dojo.gesture.swipe = new clz();

dojo.gesture.swipe.Swipe = clz;

gesture.register(dojo.gesture.swipe);

return dojo.gesture.swipe;

});