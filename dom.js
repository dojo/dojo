define(["./_base/kernel", "./_base/sniff", "./_base/lang", "./_base/window"],
	function(dojo, sniff, lang, win){
	// module:
	//		dojo/dom
	// summary:
	//		This module defines the core dojo DOM API.

	// FIXME: need to add unit tests for all the semi-public methods

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	try{
		document.execCommand("BackgroundImageCache", false, true);
	}catch(e){
		// sane browsers don't have cache "issues"
	}
	//>>excludeEnd("webkitMobile");

	// =============================
	// DOM Functions
	// =============================

	/*=====
	dojo.byId = function(id, doc){
		// summary:
		//		Returns DOM node with matching `id` attribute or `null`
		//		if not found. If `id` is a DomNode, this function is a no-op.
		//
		// id: String|DOMNode
		//	 	A string to match an HTML id attribute or a reference to a DOM Node
		//
		// doc: Document?
		//		Document to work in. Defaults to the current value of
		//		dojo.doc.  Can be used to retrieve
		//		node references from other documents.
		//
		// example:
		//		Look up a node by ID:
		//	|	var n = dojo.byId("foo");
		//
		// example:
		//		Check if a node exists, and use it.
		//	|	var n = dojo.byId("bar");
		//	|	if(n){ doStuff() ... }
		//
		// example:
		//		Allow string or DomNode references to be passed to a custom function:
		//	|	var foo = function(nodeOrId){
		//	|		nodeOrId = dojo.byId(nodeOrId);
		//	|		// ... more stuff
		//	|	}
	=====*/

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	if(sniff.isIE){
		dojo.byId = function(id, doc){
			if(typeof id != "string"){
				return id;
			}
			var _d = doc || win.doc, te = _d.getElementById(id);
			// attributes.id.value is better than just id in case the
			// user has a name=id inside a form
			if(te && (te.attributes.id.value == id || te.id == id)){
				return te;
			}else{
				var eles = _d.all[id];
				if(!eles || eles.nodeName){
					eles = [eles];
				}
				// if more than 1, choose first with the correct id
				var i=0;
				while((te=eles[i++])){
					if((te.attributes && te.attributes.id && te.attributes.id.value == id)
						|| te.id == id){
						return te;
					}
				}
			}
		};
	}else{
	//>>excludeEnd("webkitMobile");
		dojo.byId = function(id, doc){
			// inline'd type check.
			// be sure to return null per documentation, to match IE branch.
			return ((typeof id == "string") ? (doc || win.doc).getElementById(id) : id) || null; // DomNode
		};
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	}
	//>>excludeEnd("webkitMobile");
	/*=====
	};
	=====*/

	dojo.isDescendant = function(/*DomNode|String*/node, /*DomNode|String*/ancestor){
		// summary:
		//		Returns true if node is a descendant of ancestor
		// node:
		//		string id or node reference to test
		// ancestor:
		//		string id or node reference of potential parent to test against
		//
		// example:
		//		Test is node id="bar" is a descendant of node id="foo"
		//	|	if(dojo.isDescendant("bar", "foo")){ ... }
		try{
			node = dojo.byId(node);
			ancestor = dojo.byId(ancestor);
			while(node){
				if(node == ancestor){
					return true; // Boolean
				}
				node = node.parentNode;
			}
		}catch(e){ /* squelch, return false */ }
		return false; // Boolean
	};

	// TODO: do we need this function in the base?

	dojo.setSelectable = function(/*DomNode|String*/node, /*Boolean*/selectable){
		// summary:
		//		Enable or disable selection on a node
		// node:
		//		id or reference to node
		// selectable:
		//		state to put the node in. false indicates unselectable, true
		//		allows selection.
		// example:
		//		Make the node id="bar" unselectable
		//	|	dojo.setSelectable("bar");
		// example:
		//		Make the node id="bar" selectable
		//	|	dojo.setSelectable("bar", true);
		node = dojo.byId(node);
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(sniff.isMozilla){
			node.style.MozUserSelect = selectable ? "" : "none";
		}else if(sniff.isKhtml || sniff.isWebKit){
		//>>excludeEnd("webkitMobile");
			node.style.KhtmlUserSelect = selectable ? "auto" : "none";
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		}else if(sniff.isIE){
			var v = (node.unselectable = selectable ? "" : "on"),
				cs = node.getElementsByTagName("*"), i = 0, l = cs.length;
			for(; i < l; ++i){
				cs.item(i).unselectable = v;
			}
		}
		//>>excludeEnd("webkitMobile");
		//FIXME: else?  Opera?
	};

	return {
		byId:          dojo.byId,
		isDescendant:  dojo.isDescendant,
		setSelectable: dojo.setSelectable   // TODO: it looks very specialized? do we need it here?
	};
});
