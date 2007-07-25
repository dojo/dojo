dojo.provide("dojo.dnd.container");

dojo.require("dojo.dnd.common");
dojo.require("dojo.parser");

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
	//	creator: Function: a creator function, which takes a data item, and returns an object like that:
	//		{node: newNode, data: usedData, type: arrayOfStrings}
	//	_skipStartup: Boolean: skip startup(), which collects children, for deferred initialization
	//		(this is used in the markup mode)
	this.node = dojo.byId(node);
	this.creator = params && params.creator || null;
	this.defaultCreator = dojo.dnd._defaultCreator(this.node);

	// class-specific variables
	this.map = {};
	this.current = null;

	// states
	this.containerState = "";
	dojo.addClass(this.node, "dojoDndContainer");
	
	// mark up children
	if(!(params && params._skipStartup)){
		this.startup();
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
	// object attributes (for markup)
	creator: function(){},	// creator function, dummy at the moment
	
	// methods
	getAllNodes: function(){
		// summary: returns a list (an array) of all valid child nodes
		return dojo.query("> .dojoDndItem", this.parent);	// NodeList
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
				var t = this._normalizedCreator(data[i]);
				this.map[t.node.id] = {data: t.data, type: t.type};
				this.parent.insertBefore(t.node, anchor);
			}
		}else{
			for(var i = 0; i < data.length; ++i){
				var t = this._normalizedCreator(data[i]);
				this.map[t.node.id] = {data: t.data, type: t.type};
				this.parent.appendChild(t.node);
			}
		}
		return this;	// self
	},
	destroy: function(){
		// summary: prepares the object to be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.node = this.parent = this.current = this.map = null;
	},

	// markup methods
	markupFactory: function(params, node){
		params._skipStartup = true;
		return new dojo.dnd.Container(node, params);
	},
	startup: function(){
		// summary: collects valid child items and populate the map
		
		// set up the real parent node
		this.parent = this.node;
		if(this.parent.tagName.toLowerCase() == "table"){
			var c = this.parent.getElementsByTagName("tbody");
			if(c && c.length){ this.parent = c[0]; }
		}

		// process specially marked children
		dojo.query("> .dojoDndItem", this.parent).forEach(function(node){
			if(!node.id){ node.id = dojo.dnd.getUniqueId(); }
			var type = node.getAttribute("dndType"),
				data = node.getAttribute("dndData");
			this.map[node.id] = {
				data: data ? data : node.innerHTML,
				type: type ? type.split(/\s*,\s*/) : ["text"]
			};
		}, this);
	},

	// mouse events
	onMouseOver: function(e){
		// summary: event processor for onmouseover
		// e: Event: mouse event
		var n = e.relatedTarget;
		while(n){
			if(n == this.node){ break; }
			try{
				n = n.parentNode;
			}catch(x){
				n = null;
			}
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
		for(var n = e.relatedTarget; n;){
			if(n == this.node){ return; }
			try{
				n = n.parentNode;
			}catch(x){
				n = null;
			}
		}
		if(this.current){
			this._removeItemClass(this.current, "Over");
			this.current = null;
		}
		this._changeState("Container", "");
		this.onOutEvent();
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
		if(node){
			for(var parent = node.parentNode; parent; node = parent, parent = node.parentNode){
				if(parent == this.parent && dojo.hasClass(node, "dojoDndItem")){ return node; }
			}
		}
		return null;
	},
	_normalizedCreator: function(item, hint){
		// summary: adds all necessary data to the output of the user-supplied creator function
		var t = (this.creator ? this.creator : this.defaultCreator)(item, hint);
		if(!dojo.isArray(t.type)){ t.type = ["text"]; }
		if(!t.node.id){ t.node.id = dojo.dnd.getUniqueId(); }
		dojo.addClass(t.node, "dojoDndItem");
		return t;
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
	var r = (dojo.lang && dojo.lang.repr) ? dojo.lang.repr : function(o){ return String(o); };
	return function(item, hint){	// Function
		var isObj = dojo.isObject(item) && item;
		var data = (isObj && item.data) ? item.data : item;
		var type = (isObj && item.type) ? item.type : ["text"];
		var t = r(data), n = (hint == "avatar" ? dojo.dnd._createSpan : c)(t);
		n.id = dojo.dnd.getUniqueId();
		return {node: n, data: data, type: type};
	};
};
