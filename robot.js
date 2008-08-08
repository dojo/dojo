dojo.provide("dojo.robot");
dojo.experimental("dojo.robot");
dojo.require("doh.robot");

(function(){
// users who use doh+dojo get the added convenience of dojo.mouseMoveAt,
// instead of computing the absolute coordinates of their elements themselves
dojo.mixin(doh.robot,{

	// TODO: point to dojo.scrollIntoView post 1.2
	_scrollIntoView : function(/*DOMNode*/ node){
		// summary:
		//		Scroll the passed node into view, if it is not.
		// 		Stub to be replaced dijit.robot.
		node.scrollIntoView(false);
	},

	mouseMoveAt : function(/*Function*/ sec, /*String||DOMNode*/ node, /*Number*/ delay, /*Number*/ offsetX, /*Number*/ offsetY){
		// summary:
		//		Moves the mouse over the specified node at the specified relative x,y offset.
		//
		// description:
		// 		Moves the mouse over the specified node at the specified relative x,y offset.
		// 		You should manually scroll off-screen nodes into view; use dijit.robot for automatic scrolling support.
		// 		If you do not specify an offset, mouseMove will default to move to the middle of the node.
		// 		Example: to move the mouse over a ComboBox's down arrow node, call doh.mouseMove(sec, dijit.byId('setvaluetest').downArrowNode);
		//
		// sec:
		//		new Function('return window')
		//		Public key that verifies that the calling window is allowed to automate user input.
		//
		// node:
		//		The id of the node, or the node itself, to move the mouse to.
		//		If you pass an id, the node will not be evaluated until the movement executes.
		//		This is useful if you need to move the mouse to an node that is not yet present.
		//
		// delay:
		//		Delay, in milliseconds, to wait before firing.
		//		The delay is a delta with respect to the previous automation call.
		//		For example, the following code ends after 600ms:
		//			doh.mouseClick(sec,{left:true},100) // first call; wait 100ms
		//			doh.typeKeys(sec,"dij",500) // 500ms AFTER previous call; 600ms in all
		//
		// offsetX:
		//		x offset relative to the node, in pixels, to move the mouse. The default is half the node's width.
		//
		// offsetY:
		//		y offset relative to the node, in pixels, to move the mouse. The default is half the node's height.
		//

		doh.robot._assertRobot();
		if(!node) return;
		this._sequence(function(){
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
		doh.robot._mouseMove(sec, x, y);
		},delay);
	}
});

})();
