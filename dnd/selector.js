dojo.provide("dojo.dnd.selector");

dojo.require("dojo.dnd.common");
dojo.require("dojo.dnd.container");

/*
	Container item states:
		""			- an item is not selected
		"Selected"	- an item is selected
		"Anchor"	- an item is selected, and is an anchor for a "shift" selection
*/

dojo.declare("dojo.dnd.Selector", dojo.dnd.Container,
	// summary: a Selector object, which knows how to select its children
function(node, params){
	// summary: a constructor of the Selector
	// node: Node: node or node's id to build the selector on
	// params: Object: a dict of parameters, recognized parameters are:
	//	singular: Boolean: allows selection of only one element, if true
	//	the rest of parameters are passed to the container
	this.singular = params && params.singular;
	// class-specific variables
	this.selection = {};
	this.anchor = null;
	this.simpleSelection = false;
	// set up events
	this.events.push(
		dojo.connect(this.node, "onmousedown", this, "onMouseDown"),
		dojo.connect(this.node, "onmouseup",   this, "onMouseUp"));
},
{
	// mouse events
	onMouseDown: function(e){
		// summary: event processor for onmousedown
		// e: Event: mouse event
		if(!this.current){ return; }
		if(!this.singular && !dojo.dnd.getCopyKeyState(e) && !e.shiftKey && (this.current.id in this.selection)){
			this.simpleSelection = true;
			dojo.stopEvent(e);
			return;
		}
		if(!this.singular && e.shiftKey){
			if(!dojo.dnd.getCopyKeyState(e)){
				var empty = {};
				for(var i in this.selection){
					if(!(i in empty)){
						var n = dojo.byId(i);
						this._removeItemClass(n, "Selected");
					}
				}
				this.selection = {};
			}
			var c = this.node.tagName.toLowerCase() == "table" ? this.parent.getElementsByTagName("tr") : this.node.childNodes;
			if(!this.anchor){
				var i = 0;
				for(; i < c.length; ++i){
					var n = c[i];
					if(this.nodeFilter(n)){ break; }
				}
				this.anchor = c[i];
				this._addItemClass(this.anchor, "Anchor");
			}
			this.selection[this.anchor.id] = 1;
			if(this.anchor != this.current){
				var i = 0;
				for(; i < c.length; ++i){
					var n = c[i];
					if(!this.nodeFilter(n)){ continue; }
					if(n == this.anchor || n == this.current){ break; }
				}
				for(++i; i < c.length; ++i){
					var n = c[i];
					if(!this.nodeFilter(n)){ continue; }
					if(n == this.anchor || n == this.current){ break; }
					this._addItemClass(n, "Selected");
					this.selection[n.id] = 1;
				}
				this._addItemClass(this.current, "Selected");
				this.selection[this.current.id] = 1;
			}
		}else{
			if(this.singular){
				if(this.anchor == this.current){
					if(dojo.dnd.getCopyKeyState(e)){
						this._removeItemClass(this.anchor, "Anchor");
						this.anchor = null;
						this.selection = {};
					}
				}else{
					if(this.anchor){
						this._removeItemClass(this.anchor, "Anchor");
					}
					this.anchor = this.current;
					this._addItemClass(this.anchor, "Anchor");
					this.selection = {};
					this.selection[this.current.id] = 1;
				}
			}else{
				if(dojo.dnd.getCopyKeyState(e)){
					if(this.anchor == this.current){
						this._removeItemClass(this.anchor, "Anchor");
						delete this.selection[this.anchor.id];
						this.anchor = null;
					}else{
						if(this.current.id in this.selection){
							this._removeItemClass(this.current, "Selected");
							delete this.selection[this.current.id];
						}else{
							if(this.anchor){
								dojo.removeClass(this.anchor, "dojoDndItemAnchor");
								dojo.addClass(this.anchor, "dojoDndItemSelected");
							}
							this.anchor = this.current;
							this._addItemClass(this.current, "Anchor");
							this.selection[this.current.id] = 1;
						}
					}
				}else{
					var empty = {};
					for(var i in this.selection){
						if(!(i in empty)){
							var n = dojo.byId(i);
							this._removeItemClass(n, "Selected");
						}
					}
					if(this.anchor){
						this._removeItemClass(this.anchor, "Anchor");
					}
					this.selection = {};
					this.anchor = this.current;
					this._addItemClass(this.current, "Anchor");
					this.selection[this.current.id] = 1;
				}
			}
		}
		dojo.stopEvent(e);
	},
	onMouseUp: function(e){
		// summary: event processor for onmouseup
		// e: Event: mouse event
		if(!this.simpleSelection){ return; }
		this.simpleSelection = false;
		this.selectNone();
		if(this.current){
			this.anchor = this.current;
			this._addItemClass(this.anchor, "Anchor");
			this.selection[this.current.id] = 1;
		}
	},
	onMouseMove: function(e){
		// summary: event processor for onmousemove
		// e: Event: mouse event
		this.simpleSelection = false;
	},
	// utilities
	onOverEvent: function(){
		// summary: this function is called once, when mouse is over our container
		this.onmousemoveEvent = dojo.connect(this.node, "onmousemove", this, "onMouseMove");
	},
	onOutEvent: function(){
		// summary: this function is called once, when mouse is out of our container
		dojo.disconnect(this.onmousemoveEvent);
		delete this.onmousemoveEvent;
	},
	// methods
	destroy: function(){
		// summary: prepares the object to be garbage-collected
		dojo.dnd.Selector.superclass.destroy.call(this);
		this.selection = this.anchor = null;
	},
	getSelectedNodes: function(){
		// summary: returns a list (an array) of selected nodes
		var t = [];
		var empty = {};
		for(var i in this.selection){
			if(!(i in empty)){
				t.push(dojo.byId(i));
			}
		}
		return t;	// Array
	},
	selectNone: function(){
		// summary: unselects all items
		var empty = {};
		for(var i in this.selection){
			if(!(i in empty)){
				this._removeItemClass(dojo.byId(i), "Selected");
			}
		}
		if(this.anchor){
			this._removeItemClass(this.anchor, "Anchor");
			this.anchor = null;
		}
		this.selection = {};
		return this;	// self
	},
	selectAll: function(){
		// summary: selects all items
		if(this.anchor){
			this._removeItemClass(this.anchor, "Anchor");
			this.anchor = null;
		}
		var c = this.node.tagName.toLowerCase() == "table" ? this.parent.getElementsByTagName("tr") : this.node.childNodes;
		for(var i = 0; i < c.length; ++i){
			var n = c[i];
			if(this.nodeFilter(n)){
				this._addItemClass(n, "Selected");
				this.selection[n.id] = 1;
			}
		}
		return this;	// self
	},
	deleteSelectedNodes: function(){
		// summary: deletes all selected items
		var empty = {};
		for(var i in this.selection){
			if(!(i in empty)){
				var n = dojo.byId(i);
				delete this.map[i];
				dojo._destroyElement(n);
			}
		}
		this.anchor = null;
		this.selection = {};
		return this;	// self
	},
	insertNodes: function(addSelected, data, before, anchor){
		// summary: inserts new data items (see Container's insertNodes method for details)
		// addSelected: Boolean: all new nodes will be added to selected items, if true, no selection change otherwise
		// data: Array: a list of data items, which should be processed by the creator function
		// before: Boolean: insert before the anchor, if true, and after the anchot otherwise
		// anchor: Node: the anchor node to be used as a point of insertion
		var oldCreator = this.nodeCreator;
		if(addSelected){
			var me = this;
			this.nodeCreator = function(d){
				var t = oldCreator(d);
				me._addItemClass(t.node, "Selected");
				me.selection[t.node.id] = 1;
				return t;
			};
		}
		dojo.dnd.Selector.superclass.insertNodes.call(this, data, before, anchor);
		this.nodeCreator = oldCreator;
		return this;	// self
	}
});