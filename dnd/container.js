dojo.provide("dojo.dnd.container");

dojo.require("dojo.dnd.common");

/*
	Container states:
		""		- normal state
		"Over"	- mouse over a container
	Container item states:
		""		- normal state
		"Over"	- mouse over a container item
*/

dojo.declare("dojo.dnd.Container", null, 
	// summary: a Container object, which knows when mouse hovers over it, 
	//	and know over which element it hovers
function(node, params){
	// summary: a constructor of the Container
	// node: Node: node or node's id to build the container on
	// params: Object: a dict of parameters, recognized parameters are:
	//	filter: Function: a filter function, which is used to filter out children of the container
	//	creator: Function: a creator function, which takes a data item, and returns an object like that:
	//		{node: newNode, data: usedData, types: arrayOfStrings}
	//	selector: Function: a selector function, which selects all relevant nodes of a container; 
	//		should be used in pair with the filter function; returns an object like that:
	//		{parent: parentNode, nodes: arrayOf childNodes}
	this.node = dojo.byId(node);
	var me = this;
	this.nodeFilter = (params && params.filter) ?
		params.filter :
		function(n){ return n.parentNode == me.parent && n.nodeType == 1; };
	this.nodeCreator  = (params && params.creator) ?
		params.creator :
		dojo.dnd._defaultCreator(this.node);
	this.nodeSelector = (params && params.selector) ?
		params.selector :
		dojo.dnd._defaultSelector;
	// class-specific variables
	this.map = {};
	this.current = null;
	// states
	this.containerState = "";
	dojo.addClass(this.node, "dojoDndContainer");
	
	// mark up children
	var c = this.nodeSelector(this.node);
	this.parent = c.parent;
	c = c.nodes;
	for(var i = 0; i < c.length; ++i){
		var n = c[i];
		if(this.nodeFilter(n) && !n.id){
			n.id = dojo.dnd.getUniqueId();
		}
	}
	// set up events
	this.events = [
		dojo.connect(this.node, "onmouseover", this, "onMouseOver"),
		dojo.connect(this.node, "onmouseout",  this, "onMouseOut"),
		// cancel text selection and text dragging
		dojo.connect(this.node, "ondragstart",   dojo, "stopEvent"),
		dojo.connect(this.node, "onselectstart", dojo, "stopEvent")
	];
},
{
	// mouse events
	onMouseOver: function(e){
		// summary: event processor for onmouseover
		// e: Event: mouse event
		var n = e.relatedTarget;
		for(; n; n = n.parentNode){
			if(n == this.node){ break; }
		}
		if(!n){
			this._changeState("Container", "Over");
			this.onOverEvent();
		}
		n = this._getChildByEvent(e);
		if(this.current == n){ return; }
		if(this.current){ this._removeItemClass(this.current, "Over"); }
		if(n){ this._addItemClass(n, "Over"); }
		this.current = n;
	},
	onMouseOut: function(e){
		// summary: event processor for onmouseout
		// e: Event: mouse event
		for(var n = e.relatedTarget; n; n = n.parentNode){
			if(n == this.node){ return; }
		}
		if(this.current){
			this._removeItemClass(this.current, "Over");
			this.current = null;
		}
		this._changeState("Container", "");
		this.onOutEvent();
	},
	// methods
	destroy: function(){
		// summary: prepares the object to be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.node = this.parent = this.current = this.map = null;
	},
	getAllNodes: function(){
		// summary: returns a list (an array) of all valid child nodes
		var t = [];
		var c = this.nodeSelector(this.node).nodes;
		for(var i = 0; i < c.length; ++i){
			var n = c[i];
			if(this.nodeFilter(n)){
				t.push(n);
			}
		}
		return t;	// Array
	},
	insertNodes: function(data, before, anchor){
		// summary: inserts an array of new nodes before/after an anchor node
		// data: Array: a list of data items, which should be processed by the creator function
		// before: Boolean: insert before the anchor, if true, and after the anchor otherwise
		// anchor: Node: the anchor node to be used as a point of insertion
		if(!this.parent.firstChild){
			anchor = null;
		}else if(before){
			if(!anchor){
				anchor = this.parent.firstChild;
			}
		}else{
			if(anchor){
				anchor = anchor.nextSibling;
			}
		}
		if(anchor){
			for(var i = 0; i < data.length; ++i){
				var t = this.nodeCreator(data[i]);
				this.map[t.node.id] = {data: t.data, types: t.types};
				this.parent.insertBefore(t.node, anchor);
			}
		}else{
			for(var i = 0; i < data.length; ++i){
				var t = this.nodeCreator(data[i]);
				this.map[t.node.id] = {data: t.data, types: t.types};
				this.parent.appendChild(t.node);
			}
		}
		return this;	// self
	},
	// utilities
	onOverEvent: function(){
		// summary: this function is called once, when mouse is over our container
	},
	onOutEvent: function(){
		// summary: this function is called once, when mouse is out of our container
	},
	_changeState: function(type, newState){
		// summary: changes a named state to new state value
		// type: String: a name of the state to change
		// newState: String: new state
		var prefix = "dojoDnd" + type;
		var state  = type.toLowerCase() + "State";
		//dojo.html.replaceClass(this.node, prefix + newState, prefix + this[state]);
		dojo.removeClass(this.node, prefix + this[state]);
		dojo.addClass(this.node, prefix + newState);
		this[state] = newState;
	},
	_addItemClass: function(node, type){
		// summary: adds a class with prefix "dojoDndItem"
		// node: Node: a node
		// type: String: a variable suffix for a class name
		//dojo.html.addClass(node, "dojoDndItem" + type);
		dojo.addClass(node, "dojoDndItem" + type);
	},
	_removeItemClass: function(node, type){
		// summary: removes a class with prefix "dojoDndItem"
		// node: Node: a node
		// type: String: a variable suffix for a class name
		//dojo.html.removeClass(node, "dojoDndItem" + type);
		dojo.removeClass(node, "dojoDndItem" + type);
	},
	_getChildByEvent: function(e){
		// summary: gets a child, which is under the mouse at the moment, or null
		// e: Event: a mouse event
		var node = e.target;
		if(node == this.node){ return null; }
		if(this.nodeFilter(node)) return node;
		var parent = node.parentNode;
		while(parent && parent != this.parent && node != this.node){
			node = parent;
			parent = node.parentNode;
			if(this.nodeFilter(node)) return node;
		}
		return (parent && this.nodeFilter(node)) ? node : null;	// Node
	}
});

dojo.dnd._createNode = function(tag){
	// summary: returns a function, which creates an element of given tag 
	//	(SPAN by default) and sets its innerHTML to given text
	// tag: String: a tag name or empty for SPAN
	if(!tag){ return dojo.dnd._createSpan; }
	return function(text){	// Function
		var n = dojo.doc.createElement(tag);
		n.innerHTML = text;
		return n;
	};
};

dojo.dnd._createTrTd = function(text){
	// summary: creates a TR/TD structure with given text as an innerHTML of TD
	// text: String: a text for TD
	var tr = dojo.doc.createElement("tr");
	var td = dojo.doc.createElement("td");
	td.innerHTML = text;
	tr.appendChild(td);
	return tr;	// Node
};

dojo.dnd._createSpan = function(text){
	// summary: creates a SPAN element with given text as its innerHTML
	// text: String: a text for SPAN
	var n = dojo.doc.createElement("span");
	n.innerHTML = text;
	return n;	// Node
};

// dojo.dnd._defaultCreatorNodes: Object: a dicitionary, which maps container tag names to child tag names
dojo.dnd._defaultCreatorNodes = {ul: "li", ol: "li", div: "div", p: "div"};

dojo.dnd._defaultCreator = function(node){
	// summary: takes a container node, and returns an appropriate creator function
	// node: Node: a container node
	var tag = node.tagName.toLowerCase();
	var c = tag == "table" ? dojo.dnd._createTrTd : dojo.dnd._createNode(dojo.dnd._defaultCreatorNodes[tag]);
	var r = (dojo.lang && dojo.lang.repr) ? dojo.lang.repr : function(o){ return o + ""; };
	return function(data, hint){	// Function
		var t = r(data);
		var n = (hint == "avatar" ? dojo.dnd._createSpan : c)(t);
		n.id = dojo.dnd.getUniqueId();
		return {node: n, data: data, types: ["text"]};
	};
};

dojo.dnd._defaultSelector = function(node) {
	// summary: takes a container node, and returns a parent, and a list of children
	// node: Node: a container node
	var ret = {parent: node, nodes: []};
	if(node.tagName.toLowerCase() == "table"){
		var c = node.getElementsByTagName("tbody");
		if(c && c.length){
			ret.parent = c[0];
		}
		ret.nodes = ret.parent.getElementsByTagName("tr");
	}else{
		ret.nodes = node.childNodes;
	}
	return ret;	// Object
};