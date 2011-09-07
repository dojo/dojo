define(["./_base/kernel", "./on", "./has", "./mouse"], function(dojo, on, has, mouse){
// module:
//		dojo/touch
// summary:
//		This module provides unified touch event handlers by exporting
//		press, move, release and cancel which can also run well on desktop.
//		Based on http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
// press:
//		Mapped to mousedown on desktop or touchstart on touch devices
// move:
//		Mapped to mousemove on desktop or touchmove on touch devices
// release:
//		Mapped to mouseup on desktop or touchend on touch devices
// cancel:
//		Mapped to mouseleave on desktop or touchcancel on touch devices
// example:
//		1. Used with dojo.connect()
//		|	dojo.connect(node, dojo.touch.press, function(e){});
//		|	dojo.connect(node, dojo.touch.move, function(e){});
//		|	dojo.connect(node, dojo.touch.release, function(e){});
//		|	dojo.connect(node, dojo.touch.cancel, function(e){});
//
//		2. Used with dojo.on
//		|	define(["dojo/on", "dojo/touch"], function(on, touch){
//		|		on(node, touch.press, function(e){});
//		|		on(node, touch.move, function(e){});
//		|		on(node, touch.release, function(e){});
//		|		on(node, touch.cancel, function(e){});
//
//		3. Used with dojo.touch directly
//		|	dojo.touch.press(node, function(e){});
//		|	dojo.touch.move(node, function(e){});
//		|	dojo.touch.release(node, function(e){});
//		|	dojo.touch.cancel(node, function(e){});
		
	function _handle(/*String - press | move | release | cancel*/type){
		return function(node, listener){//called by on(), see dojo.on
			return on(node, type, listener);
		};
	}
	var touch = has("touch");
	//device neutral events - dojo.touch.press|move|release|cancel
	dojo.touch = {
		press: _handle(touch ? "touchstart": "mousedown"),
		move: _handle(touch ? "touchmove": "mousemove"),
		release: _handle(touch ? "touchend": "mouseup"),
		cancel: touch ? _handle("touchcancel") : mouse.leave
	};
	return dojo.touch;
});