dojo.provide("dojo.robot");
dojo.experimental("dojo.robot");
dojo.require("doh.robot");

(function(){
// users who use doh+dojo get the added convenience of dojo.mouseMoveAt,
// instead of computing the absolute coordinates of their elements themselves
dojo.mixin(doh.robot,{

	// TODO: point to dojo.scrollIntoView post 1.2
	_scrollIntoView : function(/*String||DOMNode||Function*/ node){
		// summary:
		//		Scroll the passed node into view, if it is not.
		// 		Stub to be replaced dijit.robot.
		if(typeof node == "function"){
			// if the user passed a function returning a node, evaluate it
			node = node();
		}
		node.scrollIntoView(false);
	},

	scrollIntoView : function(/*String||DOMNode||Function*/ node, /*Number, optional*/ delay){
		// summary:
		//		Scroll the passed node into view, if it is not.
		//
		// node:
		//		The id of the node, or the node itself, to move the mouse to.
		//		If you pass an id or a function that returns a node, the node will not be evaluated until the movement executes.
		//		This is useful if you need to move the mouse to an node that is not yet present.
		//
		// delay:
		//		Delay, in milliseconds, to wait before firing.
		//		The delay is a delta with respect to the previous automation call.
		//
		doh.robot.sequence(function(){
			doh.robot._scrollIntoView(node);
		}, delay);
	},

	mouseMoveAt : function(/*String||DOMNode||Function*/ node, /*Integer, optional*/ delay, /*Integer, optional*/ duration, /*Number, optional*/ offsetX, /*Number, optional*/ offsetY){
		// summary:
		//		Moves the mouse over the specified node at the specified relative x,y offset.
		//
		// description:
		// 		Moves the mouse over the specified node at the specified relative x,y offset.
		// 		You should manually scroll off-screen nodes into view; use dijit.robot for automatic scrolling support.
		// 		If you do not specify an offset, mouseMove will default to move to the middle of the node.
		// 		Example: to move the mouse over a ComboBox's down arrow node, call doh.mouseMoveAt(dijit.byId('setvaluetest').downArrowNode);
		//
		// node:
		//		The id of the node, or the node itself, to move the mouse to.
		//		If you pass an id or a function that returns a node, the node will not be evaluated until the movement executes.
		//		This is useful if you need to move the mouse to an node that is not yet present.
		//
		// delay:
		//		Delay, in milliseconds, to wait before firing.
		//		The delay is a delta with respect to the previous automation call.
		//		For example, the following code ends after 600ms:
		//			doh.mouseClick({left:true}, 100) // first call; wait 100ms
		//			doh.typeKeys("dij", 500) // 500ms AFTER previous call; 600ms in all
		//
		// duration:
		//		Approximate time Robot will spend moving the mouse
		//		The default is 100ms.
		//
		// offsetX:
		//		x offset relative to the node, in pixels, to move the mouse. The default is half the node's width.
		//
		// offsetY:
		//		y offset relative to the node, in pixels, to move the mouse. The default is half the node's height.
		//

		doh.robot._assertRobot();
		duration = duration||100;
		this.sequence(function(){
		if(typeof node == "function"){
			// if the user passed a function returning a node, evaluate it
			node = node();
		}
		if(!node) return;
		node=dojo.byId(node);
		if(offsetY === undefined){
			var box=dojo.contentBox(node);
			offsetX=box.w/2;
			offsetY=box.h/2;
		}
		var x = offsetX;
		var y = offsetY;
		doh.robot._scrollIntoView(node);
		// coords relative to viewport be default
		var c = dojo.coords(node);
		x += c.x;
		y += c.y;
		doh.robot._mouseMove(x, y, false, duration);
		},delay,duration);
	}
});

})();
