dojo.provide("dojo.dnd.move");

dojo.require("dojo.dnd.common");

dojo.dnd.Mover = function(node, e){
	// summary: an object, which makes a node follow the mouse
	// node: Node: a node (or node's id) to be moved
	// e: Event: a mouse event, which started the move;
	//	only pageX and pageY properties are used
	this.node = dojo.byId(node);
	var m = this.margin = dojo.marginBox(this.node);
	m.l -= e.pageX;
	m.t -= e.pageY;
	this.firstEvent = dojo.connect(dojo.doc, "onmousemove", this, "_makeAbsolute");
	this.events = [
		dojo.connect(dojo.doc, "onmousemove", this, "onMouseMove"),
		dojo.connect(dojo.doc, "onmouseup",   this, "destroy"),
		// cancel text selection and text dragging
		dojo.connect(dojo.doc, "ondragstart",   dojo, "stopEvent"),
		dojo.connect(dojo.doc, "onselectstart", dojo, "stopEvent")
	];
};

dojo.extend(dojo.dnd.Mover, {
	// mouse event processors
	onMouseMove: function(e){
		// summary: event processor for onmousemove
		// e: Event: mouse event
		var m = this.margin;
		dojo.marginBox(this.node, {l: m.l + e.pageX, t: m.t + e.pageY});
	},
	// utilities
	_makeAbsolute: function(){
		// summary: makes the node absolute; it is meant to be called only once
		this.node.style.position = "absolute";	// enforcing the absolute mode
		dojo.body().appendChild(this.node);
		dojo.disconnect(this.firstEvent);
		delete this.firstEvent;
	},
	destroy: function(){
		// summary: stops the move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		if(this.firstEvent){
			dojo.disconnect(this.firstEvent);
		}
		this.node = null;
	}
});

dojo.dnd.Moveable = function(node, handle){
	// summary: an object, which makes a node moveable
	// node: Node: a node (or node's id) to be moved
	// handle: Node: a node (or node's id), which is used as a mouse handle;
	//	if omitted, the node itself is used as a handle
	if(!handle){ handle = node; }
	this.node = dojo.byId(node);
	this.handle = dojo.byId(handle);
	if(!this.handle){ this.handle = this.node; }
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
		new dojo.dnd.Mover(this.node, e);
		dojo.stopEvent(e);
	},
	// utilities
	destroy: function(){
		// summary: stops watching for possible move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.node = this.handle = null;
	}
});