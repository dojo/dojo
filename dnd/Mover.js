define([
	"../_base/array", "../_base/connect", "../_base/declare", "../_base/event", "../_base/sniff", "../_base/window",
	"../dom", "../dom-geometry", "../dom-style", "../Evented", "../touch", "./common", "./autoscroll"
], function(array, connect, declare, event, has, win, dom, domGeom, domStyle, Evented, touch, dnd, autoscroll) {

// module:
//		dojo/dnd/Mover
// summary:
//		TODOC

/*===== Evented = dojo.Evented; =====*/

return declare("dojo.dnd.Mover", [Evented], {
	constructor: function(node, e, host){
		// summary:
		//		an object which makes a node follow the mouse, or touch-drag on touch devices.
		//		Used as a default mover, and as a base class for custom movers.
		// node: Node
		//		a node (or node's id) to be moved
		// e: Event
		//		a mouse event, which started the move;
		//		only pageX and pageY properties are used
		// host: Object?
		//		object which implements the functionality of the move,
		//	 	and defines proper events (onMoveStart and onMoveStop)
		this.node = dom.byId(node);
		this.marginBox = {l: e.pageX, t: e.pageY};
		this.mouseButton = e.button;
		var h = (this.host = host), d = node.ownerDocument;
		this.events = [
			// At the start of a drag, onFirstMove is called, and then the following two
			// connects are disconnected
			connect.connect(d, touch.move, this, "onFirstMove"),

			// These are called continually during the drag
			connect.connect(d, touch.move, this, "onMouseMove"),

			// And these are called at the end of the drag
			connect.connect(d, touch.release,   this, "onMouseUp"),

			// cancel text selection and text dragging
			connect.connect(d, "ondragstart",   event.stop),
			connect.connect(d.body, "onselectstart", event.stop)
		];
		// notify that the move has started
		if(h && h.onMoveStart){
			h.onMoveStart(this);
		}
	},
	// mouse event processors
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove/ontouchmove
		// e: Event
		//		mouse/touch event
		autoscroll.autoScroll(e);
		var m = this.marginBox;
		this.host.onMove(this, {l: m.l + e.pageX, t: m.t + e.pageY}, e);
		event.stop(e);
	},
	onMouseUp: function(e){
		if(has("webkit") && has("mac") && this.mouseButton == 2 ?
				e.button == 0 : this.mouseButton == e.button){ // TODO Should condition be met for touch devices, too?
			this.destroy();
		}
		event.stop(e);
	},
	// utilities
	onFirstMove: function(e){
		// summary:
		//		makes the node absolute; it is meant to be called only once.
		// 		relative and absolutely positioned nodes are assumed to use pixel units
		var s = this.node.style, l, t, h = this.host;
		switch(s.position){
			case "relative":
			case "absolute":
				// assume that left and top values are in pixels already
				l = Math.round(parseFloat(s.left)) || 0;
				t = Math.round(parseFloat(s.top)) || 0;
				break;
			default:
				s.position = "absolute";	// enforcing the absolute mode
				var m = domGeom.getMarginBox(this.node);
				// event.pageX/pageY (which we used to generate the initial
				// margin box) includes padding and margin set on the body.
				// However, setting the node's position to absolute and then
				// doing domGeom.marginBox on it *doesn't* take that additional
				// space into account - so we need to subtract the combined
				// padding and margin.  We use getComputedStyle and
				// _getMarginBox/_getContentBox to avoid the extra lookup of
				// the computed style.
				var b = win.doc.body;
				var bs = domStyle.getComputedStyle(b);
				var bm = domGeom.getMarginBox(b, bs);
				var bc = domGeom.getContentBox(b, bs);
				l = m.l - (bc.l - bm.l);
				t = m.t - (bc.t - bm.t);
				break;
		}
		this.marginBox.l = l - this.marginBox.l;
		this.marginBox.t = t - this.marginBox.t;
		if(h && h.onFirstMove){
			h.onFirstMove(this, e);
		}

		// Disconnect onmousemove and ontouchmove events that call this function
		connect.disconnect(this.events.shift());
	},
	destroy: function(){
		// summary:
		//		stops the move, deletes all references, so the object can be garbage-collected
		array.forEach(this.events, connect.disconnect);
		// undo global settings
		var h = this.host;
		if(h && h.onMoveStop){
			h.onMoveStop(this);
		}
		// destroy objects
		this.events = this.node = this.host = null;
	}
});

});
