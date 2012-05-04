define(["./_base/kernel", "./_base/lang", "./aspect", "./dom", "./on", "./has", "./mouse", "./ready", "./_base/window"],
function(dojo, lang, aspect, dom, on, has, mouse, ready, win){

	// module:
	//		dojo/touch
	// summary:
	//		This module provides unified touch event handlers by exporting
	//		press, move, release and cancel which can also run well on desktop.
	//		Based on http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
	//
	// example:
	//		1. Used with dojo.on
	//		|	define(["dojo/on", "dojo/touch"], function(on, touch){
	//		|		on(node, touch.press, function(e){});
	//		|		on(node, touch.move, function(e){});
	//		|		on(node, touch.release, function(e){});
	//		|		on(node, touch.cancel, function(e){});
	//
	//		2. Used with dojo.touch.* directly
	//		|	dojo.touch.press(node, function(e){});
	//		|	dojo.touch.move(node, function(e){});
	//		|	dojo.touch.release(node, function(e){});
	//		|	dojo.touch.cancel(node, function(e){});

	var touch = has("touch");

	var touchmove, hoveredNode;

	if(touch){
		ready(function(){
			// Keep track of currently hovered node
			hoveredNode = win.body();	// currently hovered node

			win.doc.addEventListener("touchstart", function(evt){
				// Precede touchstart event with touch.over event.  DnD depends on this.
				// Use addEventListener(cb, true) to run cb before any touchstart handlers on node run,
				// and to ensure this code runs even if the listener on the node does event.stop().
				var oldNode = hoveredNode;
				hoveredNode = evt.target;
				on.emit(oldNode, "dojotouchout", {
					target: oldNode,
					relatedTarget: hoveredNode,
					bubbles: true
				});
				on.emit(hoveredNode, "dojotouchover", {
					target: hoveredNode,
					relatedTarget: oldNode,
					bubbles: true
				});
			}, true);

			// Fire synthetic touchover and touchout events on nodes since the browser won't do it natively.
			on(win.doc, "touchmove", function(evt){
				var oldNode = hoveredNode;
				hoveredNode = win.doc.elementFromPoint(
					evt.pageX - win.body().parentNode.scrollLeft,
					evt.pageY - win.body().parentNode.scrollTop
				);
				if(oldNode !== hoveredNode){
					on.emit(oldNode, "dojotouchout", {
						target: oldNode,
						relatedTarget: hoveredNode,
						bubbles: true
					});

					on.emit(hoveredNode, "dojotouchover", {
						target: hoveredNode,
						relatedTarget: oldNode,
						bubbles: true
					});
				}
			});
		});

		// Define synthetic touchmove event that unlike the native touchmove, fires for the node the finger is
		// currently dragging over rather than the node where the touch started.
		touchmove = function(node, listener){
			return on(win.doc, "touchmove", function(evt){
				if(node === win.doc || dom.isDescendant(hoveredNode, node)){
					listener.call(this, lang.mixin({}, evt, {
						target: hoveredNode
					}));
				}
			});
		};
	}


	function _handle(/*String - press | move | release | cancel*/type){
		return function(node, listener){//called by on(), see dojo.on
			return on(node, type, listener);
		};
	}

	//device neutral events - dojo.touch.press|move|release|cancel/over/out
	dojo.touch = {
		press: _handle(touch ? "touchstart": "mousedown"),
		move: touch ? touchmove :_handle("mousemove"),
		release: _handle(touch ? "touchend": "mouseup"),
		cancel: touch ? _handle("touchcancel") : mouse.leave,
		over: _handle(touch ? "dojotouchover": "mouseover"),
		out: _handle(touch ? "dojotouchout": "mouseout"),
		enter: mouse._eventHandler(touch ? "dojotouchover" : "mouseover"),
		leave: mouse._eventHandler(touch ? "dojotouchout" : "mouseout")
	};
	/*=====
	dojo.touch = {
		press: function(node, listener){
			// summary:
			//		Register a listener to 'touchstart'|'mousedown' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		move: function(node, listener){
			// summary:
			//		Register a listener to 'touchmove'|'mousemove' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		release: function(node, listener){
			// summary:
			//		Register a listener to 'touchend'|'mouseup' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		cancel: function(node, listener){
			// summary:
			//		Register a listener to 'touchcancel'|'mouseleave' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		over: function(node, listener){
			// summary:
			//		Register a listener to 'mouseover' or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		out: function(node, listener){
			// summary:
			//		Register a listener to 'mouseout' or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		enter: function(node, listener){
			// summary:
			//		Register a listener to mouse.enter or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		leave: function(node, listener){
			// summary:
			//		Register a listener to mouse.leave or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		}
	};
	=====*/

	return dojo.touch;
});