dojo.provide("dojo.dnd.move");

dojo.require("dojo.dnd.common");

dojo.dnd.Mover = function(node, e){
	// summary: an object, which makes a node follow the mouse, 
	//	used as a default mover, and as a base class for custom movers
	// node: Node: a node (or node's id) to be moved
	// e: Event: a mouse event, which started the move;
	//	only pageX and pageY properties are used
	this.node = dojo.byId(node);
	var m = this.marginBox = dojo.marginBox(this.node), d = node.ownerDocument;
	m.l -= e.pageX;
	m.t -= e.pageY;
	var firstEvent = dojo.connect(d, "onmousemove", this, "_makeAbsolute");
	this.events = [
		dojo.connect(d, "onmousemove", this, "onMouseMove"),
		dojo.connect(d, "onmouseup",   this, "destroy"),
		// cancel text selection and text dragging
		dojo.connect(d, "ondragstart",   dojo, "stopEvent"),
		dojo.connect(d, "onselectstart", dojo, "stopEvent"),
		firstEvent
	];
};

dojo.extend(dojo.dnd.Mover, {
	// mouse event processors
	onMouseMove: function(e){
		// summary: event processor for onmousemove
		// e: Event: mouse event
		var m = this.marginBox;
		dojo.marginBox(this.node, {l: m.l + e.pageX, t: m.t + e.pageY});
	},
	// utilities
	_makeAbsolute: function(){
		// summary: makes the node absolute; it is meant to be called only once
		this.node.style.position = "absolute";	// enforcing the absolute mode
		dojo.disconnect(this.events.pop());
	},
	destroy: function(){
		// summary: stops the move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.events = this.node = null;
	}
});

dojo.dnd.Moveable = function(node, opt){
	// summary: an object, which makes a node moveable
	// node: Node: a node (or node's id) to be moved
	// opt: Object: an optional object with additional parameters;
	//	following parameters are recognized:
	//		handle: Node: a node (or node's id), which is used as a mouse handle
	//			if omitted, the node itself is used as a handle
	//		delay: Number: delay move by this number of pixels
	//		skip: Boolean: skip move of form elements
	//		mover: Object: a constructor of custom Mover
	this.node = dojo.byId(node);
	this.handle = (opt && opt.handle) ? dojo.byId(opt.handle) : null;
	if(!this.handle){ this.handle = this.node; }
	this.delay = (opt && opt.delay > 0) ? opt.delay : 0;
	this.skip  = opt && opt.skip;
	this.mover = (opt && opt.mover) ? opt.mover : dojo.dnd.Mover;
	this.events = [
		dojo.connect(this.handle, "onmousedown", this, "onMouseDown"),
		// cancel text selection and text dragging
		dojo.connect(this.handle, "ondragstart",   dojo, "stopEvent"),
		dojo.connect(this.handle, "onselectstart", dojo, "stopEvent")
	];
};

dojo.extend(dojo.dnd.Moveable, {
	// mouse event processors
	onMouseDown: function(e){
		// summary: event processor for onmousedown, creates a Mover for the node
		// e: Event: mouse event
		if(this.skip){
			var t = e.target;
			if(t.nodeType == 3 /*TEXT_NODE*/){
				t = t.parentNode;
			}
			// do not trigger move if user interacts with form elements
			if(" button textarea input select option ".indexOf(" " + t.tagName.toLowerCase() + " ") >= 0) {
				return;
			}
		}
		if(this.delay){
			this.events.push(dojo.connect(this.handle, "onmousemove", this, "onMouseMove"));
			this.events.push(dojo.connect(this.handle, "onmouseup", this, "onMouseUp"));
			this._lastX = e.pageX;
			this._lastY = e.pageY;
		}else{
			new this.mover(this.node, e);
		}
		dojo.stopEvent(e);
	},
	onMouseMove: function(e){
		if(Math.abs(e.pageX - this._lastX) > this.delay || Math.abs(e.pageY - this._lastY) > this.delay){
			this.onMouseUp(e);
			new this.mover(this.node, e);
		}
		dojo.stopEvent(e);
	},
	onMouseUp: function(e){
		dojo.disconnect(this.events.pop());
		dojo.disconnect(this.events.pop());
	},
	// utilities
	destroy: function(){
		// summary: stops watching for possible move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.events = this.node = this.handle = null;
	}
});

dojo.dnd.constrainedMover = function(fun, within){
	var mover = function(node, e){
		dojo.dnd.Mover.call(this, node, e);
		var c = this.constraintBox = fun.call(this), m = this.marginBox;
		c.r = c.l + c.w - (within ? m.w : 0);
		c.b = c.t + c.h - (within ? m.h : 0);
	};
	dojo.extend(mover, dojo.dnd.Mover.prototype);
	dojo.extend(mover, {
		onMouseMove: function(e){
			// summary: event processor for onmousemove
			// e: Event: mouse event
			var m = this.marginBox, c = this.constraintBox,
				l = m.l + e.pageX, t = m.t + e.pageY;
			l = l < c.l ? c.l : c.r < l ? c.r : l;
			t = t < c.t ? c.t : c.b < t ? c.b : t;
			dojo.marginBox(this.node, {l: l, t: t});
		}
	});
	return mover;
};

dojo.dnd.boxConstrainedMover = function(box, within){
	return dojo.dnd.constrainedMover(function(){ return box; }, within);
};

dojo.dnd.parentConstrainedMover = function(within){
	var fun = function(){
		var n = this.node.parentNode,
			s = dojo.getComputedStyle(n),
			c = dojo._getContentBox(n, s),
			p = dojo._getPadBounds(n, s);
		return {l: 0, t: 0, w: c.w + p.w, h: c.h + p.h};
	};
	return dojo.dnd.constrainedMover(fun, within);
};
