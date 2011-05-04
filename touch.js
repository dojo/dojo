define(["./_base/kernel", "./listen", "./has"], function(dojo, listen, has){
// module:
//		dojo/touch
// summary:
//		This module provides unified touch event handlers by exporting
//		press, move and release which can also run well on desktop.
// press:
//		Mapped to mousedown on desktop or touchstart on touch devices
// move:
//		Mapped to mousemove on desktop or touchmove on touch devices
// release:
//		Mapped to mouseup on desktop or touchend on touch devices
// example:
//		1. Used with dojo.connect()
//		|	dojo.connect(node, dojo.touch.press, function(e){});
//		|	dojo.connect(node, dojo.touch.move, function(e){});
//		|	dojo.connect(node, dojo.touch.release, function(e){});
//
//		2. Used with dojo.listen
//		|	define(["dojo/listen", "dojo/touch"], function(listen, touch){
//		|		listen(node, touch.press, function(e){});
//		|		listen(node, touch.move, function(e){});
//		|		listen(node, touch.release, function(e){});
//
//		3. Used with dojo.touch directly
//		|	dojo.touch.press(node, function(e){});
//		|	dojo.touch.move(node, function(e){});
//		|	dojo.touch.release(node, function(e){});
		
	function _handle(/*String - press | move | release*/type){
		return function(node, listener){//called by listen(), see dojo.listen
			return listen(node, type, listener);
		};
	}
	var touch = has("touch");
	//device neutral events - dojo.touch.press|move|release
	dojo.touch = {
		press: _handle(touch ? "touchstart": "mousedown"),
		move: _handle(touch ? "touchmove": "mousemove"),
		release: _handle(touch ? "touchend": "mouseup")
	};
	return dojo.touch;
});