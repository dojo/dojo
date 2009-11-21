dojo.require("dojo._base.lang");
dojo.provide("dojo._base.html");

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
	//	summary:
	//		Returns DOM node with matching `id` attribute or `null`
	//		if not found. If `id` is a DomNode, this function is a no-op.
	//
	//	id: String|DOMNode
	//	 	A string to match an HTML id attribute or a reference to a DOM Node
	//
	//	doc: Document?
	//		Document to work in. Defaults to the current value of
	//		dojo.doc.  Can be used to retrieve
	//		node references from other documents.
	//
	//	example:
	//	Look up a node by ID:
	//	|	var n = dojo.byId("foo");
	//
	//	example:
	//	Check if a node exists, and use it.
	//	|	var n = dojo.byId("bar");
	//	|	if(n){ doStuff() ... }
	//
	//	example:
	//	Allow string or DomNode references to be passed to a custom function:
	//	|	var foo = function(nodeOrId){
	//	|		nodeOrId = dojo.byId(nodeOrId);
	//	|		// ... more stuff
	//	|	}
=====*/

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
if(dojo.isIE || dojo.isOpera){
	dojo.byId = function(id, doc){
		if(typeof id != "string"){
			return id;
		}
		var _d = doc || dojo.doc, te = _d.getElementById(id);
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
		// inline'd type check
		return (typeof id == "string") ? (doc || dojo.doc).getElementById(id) : id; // DomNode
	};
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
}
//>>excludeEnd("webkitMobile");
/*=====
};
=====*/

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
(function(){
	var d = dojo;
//>>excludeEnd("webkitMobile");
	var byId = d.byId;

	var _destroyContainer = null,
		_destroyDoc;
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	d.addOnWindowUnload(function(){
		_destroyContainer = null; //prevent IE leak
	});
	//>>excludeEnd("webkitMobile");

/*=====
	dojo._destroyElement = function(node){
		// summary:
		// 		Existing alias for `dojo.destroy`. Deprecated, will be removed
		// 		in 2.0
	}
=====*/
	dojo._destroyElement = dojo.destroy = function(/*String|DomNode*/node){
		//	summary:
		//		Removes a node from its parent, clobbering it and all of its
		//		children.
		//
		//	description:
		//		Removes a node from its parent, clobbering it and all of its
		//		children. Function only works with DomNodes, and returns nothing.
		//
		//	node:
		//		A String ID or DomNode reference of the element to be destroyed
		//
		//	example:
		//	Destroy a node byId:
		//	|	dojo.destroy("someId");
		//
		//	example:
		//	Destroy all nodes in a list by reference:
		//	|	dojo.query(".someNode").forEach(dojo.destroy);

		node = byId(node);
		try{
			var doc = node.ownerDocument;
			// cannot use _destroyContainer.ownerDocument since this can throw an exception on IE
			if(!_destroyContainer || _destroyDoc != doc){
				_destroyContainer = doc.createElement("div");
				_destroyDoc = doc;
			}
			_destroyContainer.appendChild(node.parentNode ? node.parentNode.removeChild(node) : node);
			// NOTE: see http://trac.dojotoolkit.org/ticket/2931. This may be a bug and not a feature
			_destroyContainer.innerHTML = "";
		}catch(e){
			/* squelch */
		}
	};

	dojo.isDescendant = function(/*DomNode|String*/node, /*DomNode|String*/ancestor){
		//	summary:
		//		Returns true if node is a descendant of ancestor
		//	node: string id or node reference to test
		//	ancestor: string id or node reference of potential parent to test against
		//
		// example:
		//	Test is node id="bar" is a descendant of node id="foo"
		//	|	if(dojo.isDescendant("bar", "foo")){ ... }
		try{
			node = byId(node);
			ancestor = byId(ancestor);
			while(node){
				if(node == ancestor){
					return true; // Boolean
				}
				node = node.parentNode;
			}
		}catch(e){ /* squelch, return false */ }
		return false; // Boolean
	};

	dojo.setSelectable = function(/*DomNode|String*/node, /*Boolean*/selectable){
		//	summary: 
		//		Enable or disable selection on a node
		//	node:
		//		id or reference to node
		//	selectable:
		//		state to put the node in. false indicates unselectable, true 
		//		allows selection.
		//	example:
		//	Make the node id="bar" unselectable
		//	|	dojo.setSelectable("bar"); 
		//	example:
		//	Make the node id="bar" selectable
		//	|	dojo.setSelectable("bar", true);
		node = byId(node);
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(d.isMozilla){
			node.style.MozUserSelect = selectable ? "" : "none";
		}else if(d.isKhtml || d.isWebKit){
		//>>excludeEnd("webkitMobile");
			node.style.KhtmlUserSelect = selectable ? "auto" : "none";
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		}else if(d.isIE){
			var v = (node.unselectable = selectable ? "" : "on");
			d.query("*", node).forEach("item.unselectable = '"+v+"'");
		}
		//>>excludeEnd("webkitMobile");
		//FIXME: else?  Opera?
	};

	var _insertBefore = function(/*DomNode*/node, /*DomNode*/ref){
		var parent = ref.parentNode;
		if(parent){
			parent.insertBefore(node, ref);
		}
	};

	var _insertAfter = function(/*DomNode*/node, /*DomNode*/ref){
		//	summary:
		//		Try to insert node after ref
		var parent = ref.parentNode;
		if(parent){
			if(parent.lastChild == ref){
				parent.appendChild(node);
			}else{
				parent.insertBefore(node, ref.nextSibling);
			}
		}
	};

	dojo.place = function(node, refNode, position){
		//	summary:
		//		Attempt to insert node into the DOM, choosing from various positioning options.
		//		Returns the first argument resolved to a DOM node.
		//
		//	node: String|DomNode
		//		id or node reference, or HTML fragment starting with "<" to place relative to refNode
		//
		//	refNode: String|DomNode
		//		id or node reference to use as basis for placement
		//
		//	position: String|Number?
		//		string noting the position of node relative to refNode or a
		//		number indicating the location in the childNodes collection of refNode.
		//		Accepted string values are:
		//	|	* before
		//	|	* after
		//	|	* replace
		//	|	* only
		//	|	* first
		//	|	* last
		//		"first" and "last" indicate positions as children of refNode, "replace" replaces refNode,
		//		"only" replaces all children.  position defaults to "last" if not specified
		//
		//	returns: DomNode
		//		Returned values is the first argument resolved to a DOM node.
		//
		//		.place() is also a method of `dojo.NodeList`, allowing `dojo.query` node lookups.
		//
		// example:
		//		Place a node by string id as the last child of another node by string id:
		//	|	dojo.place("someNode", "anotherNode");
		//
		// example:
		//		Place a node by string id before another node by string id
		//	|	dojo.place("someNode", "anotherNode", "before");
		//
		// example:
		//		Create a Node, and place it in the body element (last child):
		//	|	dojo.place("<div></div>", dojo.body());
		//
		// example:
		//		Put a new LI as the first child of a list by id:
		//	|	dojo.place("<li></li>", "someUl", "first");

		refNode = byId(refNode);
		if(typeof node == "string"){ // inline'd type check
			node = node.charAt(0) == "<" ? d._toDom(node, refNode.ownerDocument) : byId(node);
		}
		if(typeof position == "number"){ // inline'd type check
			var cn = refNode.childNodes;
			if(!cn.length || cn.length <= position){
				refNode.appendChild(node);
			}else{
				_insertBefore(node, cn[position < 0 ? 0 : position]);
			}
		}else{
			switch(position){
				case "before":
					_insertBefore(node, refNode);
					break;
				case "after":
					_insertAfter(node, refNode);
					break;
				case "replace":
					refNode.parentNode.replaceChild(node, refNode);
					break;
				case "only":
					d.empty(refNode);
					refNode.appendChild(node);
					break;
				case "first":
					if(refNode.firstChild){
						_insertBefore(node, refNode.firstChild);
						break;
					}
					// else fallthrough...
				default: // aka: last
					refNode.appendChild(node);
			}
		}
		return node; // DomNode
	}

	// Box functions will assume this model.
	// On IE/Opera, BORDER_BOX will be set if the primary document is in quirks mode.
	// Can be set to change behavior of box setters.

	// can be either:
	//	"border-box"
	//	"content-box" (default)
	dojo.boxModel = "content-box";

	// We punt per-node box mode testing completely.
	// If anybody cares, we can provide an additional (optional) unit 
	// that overrides existing code to include per-node box sensitivity.

	// Opera documentation claims that Opera 9 uses border-box in BackCompat mode.
	// but experiments (Opera 9.10.8679 on Windows Vista) indicate that it actually continues to use content-box.
	// IIRC, earlier versions of Opera did in fact use border-box.
	// Opera guys, this is really confusing. Opera being broken in quirks mode is not our fault.

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	if(d.isIE /*|| dojo.isOpera*/){
		// client code may have to adjust if compatMode varies across iframes
		d.boxModel = document.compatMode == "BackCompat" ? "border-box" : "content-box";
	}
	//>>excludeEnd("webkitMobile");

	// =============================
	// Style Functions
	// =============================

	// getComputedStyle drives most of the style code.
	// Wherever possible, reuse the returned object.
	//
	// API functions below that need to access computed styles accept an 
	// optional computedStyle parameter.
	// If this parameter is omitted, the functions will call getComputedStyle themselves.
	// This way, calling code can access computedStyle once, and then pass the reference to 
	// multiple API functions.

/*=====
	dojo.getComputedStyle = function(node){
		//	summary:
		//		Returns a "computed style" object.
		//
		//	description:
		//		Gets a "computed style" object which can be used to gather
		//		information about the current state of the rendered node.
		//
		//		Note that this may behave differently on different browsers.
		//		Values may have different formats and value encodings across
		//		browsers.
		//
		//		Note also that this method is expensive.  Wherever possible,
		//		reuse the returned object.
		//
		//		Use the dojo.style() method for more consistent (pixelized)
		//		return values.
		//
		//	node: DOMNode
		//		A reference to a DOM node. Does NOT support taking an
		//		ID string for speed reasons.
		//	example:
		//	|	dojo.getComputedStyle(dojo.byId('foo')).borderWidth;
		//
		//	example:
		//	Reusing the returned object, avoiding multiple lookups:
		//	|	var cs = dojo.getComputedStyle(dojo.byId("someNode"));
		//	|	var w = cs.width, h = cs.height;
		return; // CSS2Properties
	}
=====*/

	// Although we normally eschew argument validation at this
	// level, here we test argument 'node' for (duck)type,
	// by testing nodeType, ecause 'document' is the 'parentNode' of 'body'
	// it is frequently sent to this function even 
	// though it is not Element.
	var gcs;
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	if(d.isWebKit){
	//>>excludeEnd("webkitMobile");
		gcs = function(/*DomNode*/node){
			var s;
			if(node.nodeType == 1){
				var dv = node.ownerDocument.defaultView;
				s = dv.getComputedStyle(node, null);
				if(!s && node.style){
					node.style.display = "";
					s = dv.getComputedStyle(node, null);
				}
			}
			return s || {};
		};
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	}else if(d.isIE){
		gcs = function(node){
			// IE (as of 7) doesn't expose Element like sane browsers
			return node.nodeType == 1 /* ELEMENT_NODE*/ ? node.currentStyle : {};
		};
	}else{
		gcs = function(node){
			return node.nodeType == 1 ?
				node.ownerDocument.defaultView.getComputedStyle(node, null) : {};
		};
	}
	//>>excludeEnd("webkitMobile");
	dojo.getComputedStyle = gcs;

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	if(!d.isIE){
	//>>excludeEnd("webkitMobile");
		d._toPixelValue = function(element, value){
			// style values can be floats, client code may want
			// to round for integer pixels.
			return parseFloat(value) || 0;
		};
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	}else{
		d._toPixelValue = function(element, avalue){
			if(!avalue){ return 0; }
			// on IE7, medium is usually 4 pixels
			if(avalue == "medium"){ return 4; }
			// style values can be floats, client code may
			// want to round this value for integer pixels.
			if(avalue.slice && avalue.slice(-2) == 'px'){ return parseFloat(avalue); }
			with(element){
				var sLeft = style.left;
				var rsLeft = runtimeStyle.left;
				runtimeStyle.left = currentStyle.left;
				try{
					// 'avalue' may be incompatible with style.left, which can cause IE to throw
					// this has been observed for border widths using "thin", "medium", "thick" constants
					// those particular constants could be trapped by a lookup
					// but perhaps there are more
					style.left = avalue;
					avalue = style.pixelLeft;
				}catch(e){
					avalue = 0;
				}
				style.left = sLeft;
				runtimeStyle.left = rsLeft;
			}
			return avalue;
		}
	}
	//>>excludeEnd("webkitMobile");
	var px = d._toPixelValue;

	// FIXME: there opacity quirks on FF that we haven't ported over. Hrm.
	/*=====
	dojo._getOpacity = function(node){
			//	summary:
			//		Returns the current opacity of the passed node as a
			//		floating-point value between 0 and 1.
			//	node: DomNode
			//		a reference to a DOM node. Does NOT support taking an
			//		ID string for speed reasons.
			//	returns: Number between 0 and 1
			return; // Number
	}
	=====*/

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	var astr = "DXImageTransform.Microsoft.Alpha";
	var af = function(n, f){
		try{
			return n.filters.item(astr);
		}catch(e){
			return f ? {} : null;
		}
	};

	//>>excludeEnd("webkitMobile");
	dojo._getOpacity =
	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		d.isIE ? function(node){
			try{
				return af(node).Opacity / 100; // Number
			}catch(e){
				return 1; // Number
			}
		} :
	//>>excludeEnd("webkitMobile");
		function(node){
			return gcs(node).opacity;
		};

	/*=====
	dojo._setOpacity = function(node, opacity){
			//	summary:
			//		set the opacity of the passed node portably. Returns the
			//		new opacity of the node.
			//	node: DOMNode
			//		a reference to a DOM node. Does NOT support taking an
			//		ID string for performance reasons.
			//	opacity: Number
			//		A Number between 0 and 1. 0 specifies transparent.
			//	returns: Number between 0 and 1
			return; // Number
	}
	=====*/

	dojo._setOpacity =
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		d.isIE ? function(/*DomNode*/node, /*Number*/opacity){
			var ov = opacity * 100;
			node.style.zoom = 1.0;

			// on IE7 Alpha(Filter opacity=100) makes text look fuzzy so disable it altogether (bug #2661),
			//but still update the opacity value so we can get a correct reading if it is read later.
			af(node, 1).Enabled = !(opacity == 1);

			if(!af(node)){
				node.style.filter += " progid:" + astr + "(Opacity=" + ov + ")";
			}else{
				af(node, 1).Opacity = ov;
			}

			if(node.nodeName.toLowerCase() == "tr"){
				d.query("> td", node).forEach(function(i){
					d._setOpacity(i, opacity);
				});
			}
			return opacity;
		} :
		//>>excludeEnd("webkitMobile");
		function(node, opacity){
			return node.style.opacity = opacity;
		};

	var _pixelNamesCache = {
		left: true, top: true
	};
	var _pixelRegExp = /margin|padding|width|height|max|min|offset/;  // |border
	var _toStyleValue = function(node, type, value){
		type = type.toLowerCase(); // FIXME: should we really be doing string case conversion here? Should we cache it? Need to profile!
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(d.isIE){
			if(value == "auto"){
				if(type == "height"){ return node.offsetHeight; }
				if(type == "width"){ return node.offsetWidth; }
			}
			if(type == "fontweight"){
				switch(value){
					case 700: return "bold";
					case 400:
					default: return "normal";
				}
			}
		}
		//>>excludeEnd("webkitMobile");
		if(!(type in _pixelNamesCache)){
			_pixelNamesCache[type] = _pixelRegExp.test(type);
		}
		return _pixelNamesCache[type] ? px(node, value) : value;
	};

	var _floatStyle = d.isIE ? "styleFloat" : "cssFloat",
		_floatAliases = { "cssFloat": _floatStyle, "styleFloat": _floatStyle, "float": _floatStyle }
	;

	// public API

	dojo.style = function(	/*DomNode|String*/ node,
							/*String?|Object?*/ style,
							/*String?*/ value){
		//	summary:
		//		Accesses styles on a node. If 2 arguments are
		//		passed, acts as a getter. If 3 arguments are passed, acts
		//		as a setter.
		//	description:
		//		Getting the style value uses the computed style for the node, so the value
		//		will be a calculated value, not just the immediate node.style value.
		//		Also when getting values, use specific style names,
		//		like "borderBottomWidth" instead of "border" since compound values like
		//		"border" are not necessarily reflected as expected.
		//		If you want to get node dimensions, use `dojo.marginBox()`, 
		//		`dojo.contentBox()` or `dojo.position()`.
		//	node:
		//		id or reference to node to get/set style for
		//	style:
		//		the style property to set in DOM-accessor format
		//		("borderWidth", not "border-width") or an object with key/value
		//		pairs suitable for setting each property.
		//	value:
		//		If passed, sets value on the node for style, handling
		//		cross-browser concerns.  When setting a pixel value,
		//		be sure to include "px" in the value. For instance, top: "200px".
		//		Otherwise, in some cases, some browsers will not apply the style.
		//	example:
		//		Passing only an ID or node returns the computed style object of
		//		the node:
		//	|	dojo.style("thinger");
		//	example:
		//		Passing a node and a style property returns the current
		//		normalized, computed value for that property:
		//	|	dojo.style("thinger", "opacity"); // 1 by default
		//
		//	example:
		//		Passing a node, a style property, and a value changes the
		//		current display of the node and returns the new computed value
		//	|	dojo.style("thinger", "opacity", 0.5); // == 0.5
		//
		//	example:
		//		Passing a node, an object-style style property sets each of the values in turn and returns the computed style object of the node:
		//	|	dojo.style("thinger", {
		//	|		"opacity": 0.5,
		//	|		"border": "3px solid black",
		//	|		"height": "300px"
		//	|	});
		//
		// 	example:
		//		When the CSS style property is hyphenated, the JavaScript property is camelCased.
		//		font-size becomes fontSize, and so on.
		//	|	dojo.style("thinger",{
		//	|		fontSize:"14pt",
		//	|		letterSpacing:"1.2em"
		//	|	});
		//
		//	example:
		//		dojo.NodeList implements .style() using the same syntax, omitting the "node" parameter, calling
		//		dojo.style() on every element of the list. See: `dojo.query()` and `dojo.NodeList()`
		//	|	dojo.query(".someClassName").style("visibility","hidden");
		//	|	// or
		//	|	dojo.query("#baz > div").style({
		//	|		opacity:0.75,
		//	|		fontSize:"13pt"
		//	|	});

		var n = byId(node), args = arguments.length, op = (style == "opacity");
		style = _floatAliases[style] || style;
		if(args == 3){
			return op ? d._setOpacity(n, value) : n.style[style] = value; /*Number*/
		}
		if(args == 2 && op){
			return d._getOpacity(n);
		}
		var s = gcs(n);
		if(args == 2 && typeof style != "string"){ // inline'd type check
			for(var x in style){
				d.style(node, x, style[x]);
			}
			return s;
		}
		return (args == 1) ? s : _toStyleValue(n, style, s[style] || n.style[style]); /* CSS2Properties||String||Number */
	}

	// =============================
	// Box Functions
	// =============================

	dojo._getPadExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		// 		Returns object with special values specifically useful for node
		// 		fitting.
		//	description:
		//		Returns an object with `w`, `h`, `l`, `t` properties:
		//	|		l/t = left/top padding (respectively)
		//	|		w = the total of the left and right padding 
		//	|		h = the total of the top and bottom padding
		//		If 'node' has position, l/t forms the origin for child nodes.
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s = computedStyle||gcs(n),
			l = px(n, s.paddingLeft),
			t = px(n, s.paddingTop);
		return {
			l: l,
			t: t,
			w: l+px(n, s.paddingRight),
			h: t+px(n, s.paddingBottom)
		};
	}

	dojo._getBorderExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		//		returns an object with properties useful for noting the border
		//		dimensions.
		//	description:
		// 		* l/t = the sum of left/top border (respectively)
		//		* w = the sum of the left and right border
		//		* h = the sum of the top and bottom border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			ne = "none",
			s = computedStyle||gcs(n),
			bl = (s.borderLeftStyle != ne ? px(n, s.borderLeftWidth) : 0),
			bt = (s.borderTopStyle != ne ? px(n, s.borderTopWidth) : 0);
		return {
			l: bl,
			t: bt,
			w: bl + (s.borderRightStyle!=ne ? px(n, s.borderRightWidth) : 0),
			h: bt + (s.borderBottomStyle!=ne ? px(n, s.borderBottomWidth) : 0)
		};
	}

	dojo._getPadBorderExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		//		Returns object with properties useful for box fitting with
		//		regards to padding.
		// description:
		//		* l/t = the sum of left/top padding and left/top border (respectively)
		//		* w = the sum of the left and right padding and border
		//		* h = the sum of the top and bottom padding and border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s = computedStyle||gcs(n),
			p = d._getPadExtents(n, s),
			b = d._getBorderExtents(n, s);
		return {
			l: p.l + b.l,
			t: p.t + b.t,
			w: p.w + b.w,
			h: p.h + b.h
		};
	}

	dojo._getMarginExtents = function(n, computedStyle){
		//	summary:
		//		returns object with properties useful for box fitting with
		//		regards to box margins (i.e., the outer-box).
		//
		//		* l/t = marginLeft, marginTop, respectively
		//		* w = total width, margin inclusive
		//		* h = total height, margin inclusive
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s = computedStyle||gcs(n),
			l = px(n, s.marginLeft),
			t = px(n, s.marginTop),
			r = px(n, s.marginRight),
			b = px(n, s.marginBottom);
		if(d.isWebKit && (s.position != "absolute")){
			// FIXME: Safari's version of the computed right margin
			// is the space between our right edge and the right edge 
			// of our offsetParent.
			// What we are looking for is the actual margin value as 
			// determined by CSS.
			// Hack solution is to assume left/right margins are the same.
			r = l;
		}
		return {
			l: l,
			t: t,
			w: l+r,
			h: t+b
		};
	}

	// Box getters work in any box context because offsetWidth/clientWidth
	// are invariant wrt box context
	//
	// They do *not* work for display: inline objects that have padding styles
	// because the user agent ignores padding (it's bogus styling in any case)
	//
	// Be careful with IMGs because they are inline or block depending on 
	// browser and browser mode.

	// Although it would be easier to read, there are not separate versions of 
	// _getMarginBox for each browser because:
	// 1. the branching is not expensive
	// 2. factoring the shared code wastes cycles (function call overhead)
	// 3. duplicating the shared code wastes bytes

	dojo._getMarginBox = function(/*DomNode*/node, /*Object*/computedStyle){
		// summary:
		//		returns an object that encodes the width, height, left and top
		//		positions of the node's margin box.
		var s = computedStyle || gcs(node), me = d._getMarginExtents(node, s);
		var l = node.offsetLeft - me.l, t = node.offsetTop - me.t, p = node.parentNode;
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(d.isMoz){
			// Mozilla:
			// If offsetParent has a computed overflow != visible, the offsetLeft is decreased
			// by the parent's border.
			// We don't want to compute the parent's style, so instead we examine node's
			// computed left/top which is more stable.
			var sl = parseFloat(s.left), st = parseFloat(s.top);
			if(!isNaN(sl) && !isNaN(st)){
				l = sl, t = st;
			}else{
				// If child's computed left/top are not parseable as a number (e.g. "auto"), we
				// have no choice but to examine the parent's computed style.
				if(p && p.style){
					var pcs = gcs(p);
					if(pcs.overflow != "visible"){
						var be = d._getBorderExtents(p, pcs);
						l += be.l, t += be.t;
					}
				}
			}
		}else if(d.isOpera || (d.isIE > 7 && !d.isQuirks)){
			// On Opera and IE 8, offsetLeft/Top includes the parent's border
			if(p){
				be = d._getBorderExtents(p);
				l -= be.l;
				t -= be.t;
			}
		}
		//>>excludeEnd("webkitMobile");
		return {
			l: l,
			t: t,
			w: node.offsetWidth + me.w,
			h: node.offsetHeight + me.h 
		};
	}

	dojo._getContentBox = function(node, computedStyle){
		// summary:
		//		Returns an object that encodes the width, height, left and top
		//		positions of the node's content box, irrespective of the
		//		current box model.

		// clientWidth/Height are important since the automatically account for scrollbars
		// fallback to offsetWidth/Height for special cases (see #3378)
		var s = computedStyle || gcs(node),
			pe = d._getPadExtents(node, s),
			be = d._getBorderExtents(node, s),
			w = node.clientWidth,
			h
		;
		if(!w){
			w = node.offsetWidth, h = node.offsetHeight;
		}else{
			h = node.clientHeight, be.w = be.h = 0;
		}
		// On Opera, offsetLeft includes the parent's border
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(d.isOpera){ pe.l += be.l; pe.t += be.t; };
		//>>excludeEnd("webkitMobile");
		return {
			l: pe.l,
			t: pe.t,
			w: w - pe.w - be.w,
			h: h - pe.h - be.h
		};
	}

	dojo._getBorderBox = function(node, computedStyle){
		var s = computedStyle || gcs(node),
			pe = d._getPadExtents(node, s),
			cb = d._getContentBox(node, s)
		;
		return {
			l: cb.l - pe.l,
			t: cb.t - pe.t,
			w: cb.w + pe.w,
			h: cb.h + pe.h
		};
	}

	// Box setters depend on box context because interpretation of width/height styles
	// vary wrt box context.
	//
	// The value of dojo.boxModel is used to determine box context.
	// dojo.boxModel can be set directly to change behavior.
	//
	// Beware of display: inline objects that have padding styles
	// because the user agent ignores padding (it's a bogus setup anyway)
	//
	// Be careful with IMGs because they are inline or block depending on 
	// browser and browser mode.
	//
	// Elements other than DIV may have special quirks, like built-in
	// margins or padding, or values not detectable via computedStyle.
	// In particular, margins on TABLE do not seems to appear 
	// at all in computedStyle on Mozilla.

	dojo._setBox = function(/*DomNode*/node, /*Number?*/l, /*Number?*/t, /*Number?*/w, /*Number?*/h, /*String?*/u){
		//	summary:
		//		sets width/height/left/top in the current (native) box-model
		//		dimentions. Uses the unit passed in u.
		//	node:
		//		DOM Node reference. Id string not supported for performance
		//		reasons.
		//	l:
		//		left offset from parent.
		//	t:
		//		top offset from parent.
		//	w:
		//		width in current box model.
		//	h:
		//		width in current box model.
		//	u:
		//		unit measure to use for other measures. Defaults to "px".
		u = u || "px";
		var s = node.style;
		if(!isNaN(l)){ s.left = l + u; }
		if(!isNaN(t)){ s.top = t + u; }
		if(w >= 0){ s.width = w + u; }
		if(h >= 0){ s.height = h + u; }
	}

	dojo._isButtonTag = function(/*DomNode*/node) {
		// summary:
		//		True if the node is BUTTON or INPUT.type="button".
		return node.tagName == "BUTTON"
			|| node.tagName=="INPUT" && (node.getAttribute("type")||'').toUpperCase() == "BUTTON"; // boolean
	}

	dojo._usesBorderBox = function(/*DomNode*/node){
		//	summary:
		//		True if the node uses border-box layout.

		// We could test the computed style of node to see if a particular box
		// has been specified, but there are details and we choose not to bother.

		// TABLE and BUTTON (and INPUT type=button) are always border-box by default.
		// If you have assigned a different box to either one via CSS then
		// box functions will break.

		var n = node.tagName;
		return d.boxModel=="border-box" || n=="TABLE" || d._isButtonTag(node); // boolean
	}

	dojo._setContentSize = function(/*DomNode*/node, /*Number*/widthPx, /*Number*/heightPx, /*Object*/computedStyle){
		//	summary:
		//		Sets the size of the node's contents, irrespective of margins,
		//		padding, or borders.
		if(d._usesBorderBox(node)){
			var pb = d._getPadBorderExtents(node, computedStyle);
			if(widthPx >= 0){ widthPx += pb.w; }
			if(heightPx >= 0){ heightPx += pb.h; }
		}
		d._setBox(node, NaN, NaN, widthPx, heightPx);
	}

	dojo._setMarginBox = function(/*DomNode*/node, 	/*Number?*/leftPx, /*Number?*/topPx,
													/*Number?*/widthPx, /*Number?*/heightPx,
													/*Object*/computedStyle){
		//	summary:
		//		sets the size of the node's margin box and placement
		//		(left/top), irrespective of box model. Think of it as a
		//		passthrough to dojo._setBox that handles box-model vagaries for
		//		you.

		var s = computedStyle || gcs(node),
		// Some elements have special padding, margin, and box-model settings.
		// To use box functions you may need to set padding, margin explicitly.
		// Controlling box-model is harder, in a pinch you might set dojo.boxModel.
			bb = d._usesBorderBox(node),
			pb = bb ? _nilExtents : d._getPadBorderExtents(node, s)
		;
		if(d.isWebKit){
			// on Safari (3.1.2), button nodes with no explicit size have a default margin
			// setting an explicit size eliminates the margin.
			// We have to swizzle the width to get correct margin reading.
			if(d._isButtonTag(node)){
				var ns = node.style;
				if(widthPx >= 0 && !ns.width) { ns.width = "4px"; }
				if(heightPx >= 0 && !ns.height) { ns.height = "4px"; }
			}
		}
		var mb = d._getMarginExtents(node, s);
		if(widthPx >= 0){ widthPx = Math.max(widthPx - pb.w - mb.w, 0); }
		if(heightPx >= 0){ heightPx = Math.max(heightPx - pb.h - mb.h, 0); }
		d._setBox(node, leftPx, topPx, widthPx, heightPx);
	}

	var _nilExtents = { l:0, t:0, w:0, h:0 };

	// public API

	dojo.marginBox = function(/*DomNode|String*/node, /*Object?*/box){
		//	summary:
		//		Getter/setter for the margin-box of node.
		//	description:
		//		Getter/setter for the margin-box of node.
		//		Returns an object in the expected format of box (regardless
		//		if box is passed). The object might look like:
		//			`{ l: 50, t: 200, w: 300: h: 150 }`
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a margin width of 300px and a margin-height of
		//		150px.
		//	node:
		//		id or reference to DOM Node to get/set box for
		//	box:
		//		If passed, denotes that dojo.marginBox() should
		//		update/set the margin box for node. Box is an object in the
		//		above format. All properties are optional if passed.
		//	example:
		//	Retrieve the marginbox of a passed node
		//	|	var box = dojo.marginBox("someNodeId");
		//	|	console.dir(box);
		//
		//	example:
		//	Set a node's marginbox to the size of another node
		//	|	var box = dojo.marginBox("someNodeId");
		//	|	dojo.marginBox("someOtherNode", box);
		
		var n = byId(node), s = gcs(n), b = box;
		return !b ? d._getMarginBox(n, s) : d._setMarginBox(n, b.l, b.t, b.w, b.h, s); // Object
	}

	dojo.contentBox = function(/*DomNode|String*/node, /*Object?*/box){
		//	summary:
		//		Getter/setter for the content-box of node.
		//	description:
		//		Returns an object in the expected format of box (regardless if box is passed).
		//		The object might look like:
		//			`{ l: 50, t: 200, w: 300: h: 150 }`
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a content width of 300px and a content-height of
		//		150px. Note that the content box may have a much larger border
		//		or margin box, depending on the box model currently in use and
		//		CSS values set/inherited for node.
		//	node:
		//		id or reference to DOM Node to get/set box for
		//	box:
		//		If passed, denotes that dojo.contentBox() should
		//		update/set the content box for node. Box is an object in the
		//		above format. All properties are optional if passed.
		var n = byId(node), s = gcs(n), b = box;
		return !b ? d._getContentBox(n, s) : d._setContentSize(n, b.w, b.h, s); // Object
	}

	// =============================
	// Positioning 
	// =============================

	var _sumAncestorProperties = function(node, prop){
		if(!(node = (node||0).parentNode)){return 0}
		var val, retVal = 0, _b = d.body();
		while(node && node.style){
			if(gcs(node).position == "fixed"){
				return 0;
			}
			val = node[prop];
			if(val){
				retVal += val - 0;
				// opera and khtml #body & #html has the same values, we only
				// need one value
				if(node == _b){ break; }
			}
			node = node.parentNode;
		}
		return retVal;	//	integer
	}

	dojo._docScroll = function(){
		var n = d.global;
		return "pageXOffset" in n? { x:n.pageXOffset, y:n.pageYOffset } :
			(n=d.doc.documentElement, n.clientHeight? { x:d._fixIeBiDiScrollLeft(n.scrollLeft), y:n.scrollTop } :
			(n=d.body(), { x:n.scrollLeft||0, y:n.scrollTop||0 }));
	};

	dojo._isBodyLtr = function(){
		return "_bodyLtr" in d? d._bodyLtr :
			d._bodyLtr = (d.body().dir || d.doc.documentElement.dir || "ltr").toLowerCase() == "ltr"; // Boolean 
	}

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	dojo._getIeDocumentElementOffset = function(){
		//	summary:
		//		returns the offset in x and y from the document body to the
		//		visual edge of the page
		//	description:
		// The following values in IE contain an offset:
		//	|		event.clientX
		//	|		event.clientY
		//	|		node.getBoundingClientRect().left
		//	|		node.getBoundingClientRect().top
		//	 	But other position related values do not contain this offset,
		//	 	such as node.offsetLeft, node.offsetTop, node.style.left and
		//	 	node.style.top. The offset is always (2, 2) in LTR direction.
		//	 	When the body is in RTL direction, the offset counts the width
		//	 	of left scroll bar's width.  This function computes the actual
		//	 	offset.

		//NOTE: assumes we're being called in an IE browser

		var de = d.doc.documentElement; // only deal with HTML element here, _abs handles body/quirks 

		if(d.isIE < 8){
			var r = de.getBoundingClientRect(); // works well for IE6+
			//console.debug('rect left,top = ' + r.left+','+r.top + ', html client left/top = ' + de.clientLeft+','+de.clientTop + ', rtl = ' + (!d._isBodyLtr()) + ', quirks = ' + d.isQuirks);
			var l = r.left,
			    t = r.top;
			if(d.isIE < 7){
				l += de.clientLeft;	// scrollbar size in strict/RTL, or,
				t += de.clientTop;	// HTML border size in strict
			}
			return {
				x: l < 0? 0 : l, // FRAME element border size can lead to inaccurate negative values
				y: t < 0? 0 : t
			};
		}else{
			return {
				x: 0,
				y: 0
			};
		}

	};
	//>>excludeEnd("webkitMobile");

	dojo._fixIeBiDiScrollLeft = function(/*Integer*/ scrollLeft){
		// In RTL direction, scrollLeft should be a negative value, but IE < 8
		// returns a positive one. All codes using documentElement.scrollLeft
		// must call this function to fix this error, otherwise the position
		// will offset to right when there is a horizontal scrollbar.

		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		var dd = d.doc;
		if(d.isIE < 8 && !d._isBodyLtr()){
			var de = d.isQuirks ? dd.body : dd.documentElement;
			return scrollLeft + de.clientWidth - de.scrollWidth; // Integer
		}
		//>>excludeEnd("webkitMobile");
		return scrollLeft; // Integer
	}

	// FIXME: need a setter for coords or a moveTo!!
	dojo._abs = dojo.position = function(/*DomNode*/node, /*Boolean?*/includeScroll){
		//	summary:
		//		Gets the position and size of the passed element relative to
		//		the viewport (if includeScroll==false), or relative to the
		//		document root (if includeScroll==true).
		//
		//	description:
		//		Returns an object of the form:
		//			{ x: 100, y: 300, w: 20, h: 15 }
		//		If includeScroll==true, the x and y values will include any
		//		document offsets that may affect the position relative to the
		//		viewport.
		//		Uses the border-box model (inclusive of border and padding but
		//		not margin).  Does not act as a setter.

		var db = d.body(), dh = db.parentNode, ret;
		node = byId(node);
		if(node["getBoundingClientRect"]){
			// IE6+, FF3+, super-modern WebKit, and Opera 9.6+ all take this branch
			ret = node.getBoundingClientRect();
			ret = { x: ret.left, y: ret.top, w: ret.right - ret.left, h: ret.bottom - ret.top };
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
			if(d.isIE){
				// On IE there's a 2px offset that we need to adjust for, see _getIeDocumentElementOffset()
				var offset = d._getIeDocumentElementOffset();

				// fixes the position in IE, quirks mode
				ret.x -= offset.x + (d.isQuirks ? db.clientLeft+db.offsetLeft : 0);
				ret.y -= offset.y + (d.isQuirks ? db.clientTop+db.offsetTop : 0);
			}else if(d.isFF == 3){
				// In FF3 you have to subtract the document element margins.
				// Fixed in FF3.5 though.
				var cs = gcs(dh);
				ret.x -= px(dh, cs.marginLeft) + px(dh, cs.borderLeftWidth);
				ret.y -= px(dh, cs.marginTop) + px(dh, cs.borderTopWidth);
			}
		//>>excludeEnd("webkitMobile");
		}else{
			// FF2 and older WebKit
			ret = {
				x: 0,
				y: 0,
				w: node.offsetWidth,
				h: node.offsetHeight
			};
			if(node["offsetParent"]){
				ret.x -= _sumAncestorProperties(node, "scrollLeft");
				ret.y -= _sumAncestorProperties(node, "scrollTop");

				var curnode = node;
				do{
					var n = curnode.offsetLeft,
						t = curnode.offsetTop;
					ret.x += isNaN(n) ? 0 : n;
					ret.y += isNaN(t) ? 0 : t;

					cs = gcs(curnode);
					if(curnode != node){
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
						if(d.isMoz){
							// tried left+right with differently sized left/right borders
							// it really is 2xleft border in FF, not left+right, even in RTL!
							ret.x += 2 * px(curnode,cs.borderLeftWidth);
							ret.y += 2 * px(curnode,cs.borderTopWidth);
						}else{
		//>>excludeEnd("webkitMobile");
							ret.x += px(curnode, cs.borderLeftWidth);
							ret.y += px(curnode, cs.borderTopWidth);
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
						}
		//>>excludeEnd("webkitMobile");
					}
					// static children in a static div in FF2 are affected by the div's border as well
					// but offsetParent will skip this div!
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
					if(d.isMoz && cs.position=="static"){
						var parent=curnode.parentNode;
						while(parent!=curnode.offsetParent){
							var pcs=gcs(parent);
							if(pcs.position=="static"){
								ret.x += px(curnode,pcs.borderLeftWidth);
								ret.y += px(curnode,pcs.borderTopWidth);
							}
							parent=parent.parentNode;
						}
					}
		//>>excludeEnd("webkitMobile");
					curnode = curnode.offsetParent;
				}while((curnode != dh) && curnode);
			}else if(node.x && node.y){
				ret.x += isNaN(node.x) ? 0 : node.x;
				ret.y += isNaN(node.y) ? 0 : node.y;
			}
		}
		// account for document scrolling
		// if offsetParent is used, ret value already includes scroll position
		// so we may have to actually remove that value if !includeScroll
		if(includeScroll){
			var scroll = d._docScroll();
			ret.x += scroll.x;
			ret.y += scroll.y;
		}

		return ret; // Object
	}

	dojo.coords = function(/*DomNode|String*/node, /*Boolean?*/includeScroll){
		//	summary:
		//		Deprecated: Use position() for border-box x/y/w/h
		//		or marginBox() for margin-box w/h/l/t.
		//		Returns an object representing a node's size and position.
		//
		//	description:
		//		Returns an object that measures margin-box (w)idth/(h)eight
		//		and absolute position x/y of the border-box. Also returned
		//		is computed (l)eft and (t)op values in pixels from the
		//		node's offsetParent as returned from marginBox().
		//		Return value will be in the form:
		//|			{ l: 50, t: 200, w: 300: h: 150, x: 100, y: 300 }
		//		Does not act as a setter. If includeScroll is passed, the x and
		//		y params are affected as one would expect in dojo.position().
		var n = byId(node), s = gcs(n), mb = d._getMarginBox(n, s);
		var abs = d.position(n, includeScroll);
		mb.x = abs.x;
		mb.y = abs.y;
		return mb;
	}

	// =============================
	// Element attribute Functions
	// =============================

	// dojo.attr() should conform to http://www.w3.org/TR/DOM-Level-2-Core/

	var _propNames = {
			// properties renamed to avoid clashes with reserved words
			"class":   "className",
			"for":     "htmlFor",
			// properties written as camelCase
			tabindex:  "tabIndex",
			readonly:  "readOnly",
			colspan:   "colSpan",
			frameborder: "frameBorder",
			rowspan:   "rowSpan",
			valuetype: "valueType"
		},
		_attrNames = {
			// original attribute names
			classname: "class",
			htmlfor:   "for",
			// for IE
			tabindex:  "tabIndex",
			readonly:  "readOnly"
		},
		_forcePropNames = {
			innerHTML: 1,
			className: 1,
			htmlFor:   d.isIE,
			value:     1
		};

	var _fixAttrName = function(/*String*/ name){
		return _attrNames[name.toLowerCase()] || name;
	};

	var _hasAttr = function(node, name){
		var attr = node.getAttributeNode && node.getAttributeNode(name);
		return attr && attr.specified; // Boolean
	};

	// There is a difference in the presence of certain properties and their default values
	// between browsers. For example, on IE "disabled" is present on all elements,
	// but it is value is "false"; "tabIndex" of <div> returns 0 by default on IE, yet other browsers
	// can return -1.

	dojo.hasAttr = function(/*DomNode|String*/node, /*String*/name){
		//	summary:
		//		Returns true if the requested attribute is specified on the
		//		given element, and false otherwise.
		//	node:
		//		id or reference to the element to check
		//	name:
		//		the name of the attribute
		//	returns:
		//		true if the requested attribute is specified on the
		//		given element, and false otherwise
		var lc = name.toLowerCase();
		return _forcePropNames[_propNames[lc] || name] || _hasAttr(byId(node), _attrNames[lc] || name);	// Boolean
	}

	var _evtHdlrMap = {}, _ctr = 0,
		_attrId = dojo._scopeName + "attrid",
		// the next dictionary lists elements with read-only innerHTML on IE
		_roInnerHtml = {col: 1, colgroup: 1,
			// frameset: 1, head: 1, html: 1, style: 1,
			table: 1, tbody: 1, tfoot: 1, thead: 1, tr: 1, title: 1};

	dojo.attr = function(/*DomNode|String*/node, /*String|Object*/name, /*String?*/value){
		//	summary:
		//		Gets or sets an attribute on an HTML element.
		//	description:
		//		Handles normalized getting and setting of attributes on DOM
		//		Nodes. If 2 arguments are passed, and a the second argumnt is a
		//		string, acts as a getter.
		//
		//		If a third argument is passed, or if the second argument is a
		//		map of attributes, acts as a setter.
		//
		//		When passing functions as values, note that they will not be
		//		directly assigned to slots on the node, but rather the default
		//		behavior will be removed and the new behavior will be added
		//		using `dojo.connect()`, meaning that event handler properties
		//		will be normalized and that some caveats with regards to
		//		non-standard behaviors for onsubmit apply. Namely that you
		//		should cancel form submission using `dojo.stopEvent()` on the
		//		passed event object instead of returning a boolean value from
		//		the handler itself.
		//	node:
		//		id or reference to the element to get or set the attribute on
		//	name:
		//		the name of the attribute to get or set.
		//	value:
		//		The value to set for the attribute
		//	returns:
		//		when used as a getter, the value of the requested attribute
		//		or null if that attribute does not have a specified or
		//		default value;
		//
		//		when used as a setter, the DOM node
		//
		//	example:
		//	|	// get the current value of the "foo" attribute on a node
		//	|	dojo.attr(dojo.byId("nodeId"), "foo");
		//	|	// or we can just pass the id:
		//	|	dojo.attr("nodeId", "foo");
		//
		//	example:
		//	|	// use attr() to set the tab index
		//	|	dojo.attr("nodeId", "tabIndex", 3);
		//	|
		//
		//	example:
		//	Set multiple values at once, including event handlers:
		//	|	dojo.attr("formId", {
		//	|		"foo": "bar",
		//	|		"tabIndex": -1,
		//	|		"method": "POST",
		//	|		"onsubmit": function(e){
		//	|			// stop submitting the form. Note that the IE behavior
		//	|			// of returning true or false will have no effect here
		//	|			// since our handler is connect()ed to the built-in
		//	|			// onsubmit behavior and so we need to use
		//	|			// dojo.stopEvent() to ensure that the submission
		//	|			// doesn't proceed.
		//	|			dojo.stopEvent(e);
		//	|
		//	|			// submit the form with Ajax
		//	|			dojo.xhrPost({ form: "formId" });
		//	|		}
		//	|	});
		//
		//	example:
		//	Style is s special case: Only set with an object hash of styles
		//	|	dojo.attr("someNode",{
		//	|		id:"bar",
		//	|		style:{
		//	|			width:"200px", height:"100px", color:"#000"
		//	|		}
		//	|	});
		//
		//	example:
		//	Again, only set style as an object hash of styles:
		//	|	var obj = { color:"#fff", backgroundColor:"#000" };
		//	|	dojo.attr("someNode", "style", obj);
		//	|
		//	|	// though shorter to use `dojo.style()` in this case:
		//	|	dojo.style("someNode", obj);

		node = byId(node);
		var args = arguments.length, prop;
		if(args == 2 && typeof name != "string"){ // inline'd type check
			// the object form of setter: the 2nd argument is a dictionary
			for(var x in name){
				d.attr(node, x, name[x]);
			}
			return node; // DomNode
		}
		var lc = name.toLowerCase(),
			propName = _propNames[lc] || name,
			forceProp = _forcePropNames[propName],
			attrName = _attrNames[lc] || name;
		if(args == 3){
			// setter
			do{
				if(propName == "style" && typeof value != "string"){ // inline'd type check
					// special case: setting a style
					d.style(node, value);
					break;
				}
				if(propName == "innerHTML"){
					// special case: assigning HTML
					//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
					if(d.isIE && node.tagName.toLowerCase() in _roInnerHtml){
						d.empty(node);
						node.appendChild(d._toDom(value, node.ownerDocument));
					}else{
					//>>excludeEnd("webkitMobile");
						node[propName] = value;
					//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
					}
					//>>excludeEnd("webkitMobile");
					break;
				}
				if(d.isFunction(value)){
					// special case: assigning an event handler
					// clobber if we can
					var attrId = d.attr(node, _attrId);
					if(!attrId){
						attrId = _ctr++;
						d.attr(node, _attrId, attrId);
					}
					if(!_evtHdlrMap[attrId]){
						_evtHdlrMap[attrId] = {};
					}
					var h = _evtHdlrMap[attrId][propName];
					if(h){
						d.disconnect(h);
					}else{
						try{
							delete node[propName];
						}catch(e){}
					}
					// ensure that event objects are normalized, etc.
					_evtHdlrMap[attrId][propName] = d.connect(node, propName, value);
					break;
				}
				if(forceProp || typeof value == "boolean"){
					// special case: forcing assignment to the property
					// special case: setting boolean to a property instead of attribute
					node[propName] = value;
					break;
				}
				// node's attribute
				node.setAttribute(attrName, value);
			}while(false);
			return node; // DomNode
		}
		// getter
		// should we access this attribute via a property or
		// via getAttribute()?
		value = node[propName];
		if(forceProp && typeof value != "undefined"){
			// node's property
			return value;	// Anything
		}
		if(propName != "href" && (typeof value == "boolean" || d.isFunction(value))){
			// node's property
			return value;	// Anything
		}
		// node's attribute
		// we need _hasAttr() here to guard against IE returning a default value
		return _hasAttr(node, attrName) ? node.getAttribute(attrName) : null; // Anything
	}

	dojo.removeAttr = function(/*DomNode|String*/ node, /*String*/ name){
		//	summary:
		//		Removes an attribute from an HTML element.
		//	node:
		//		id or reference to the element to remove the attribute from
		//	name:
		//		the name of the attribute to remove
		byId(node).removeAttribute(_fixAttrName(name));
	}

	dojo.getNodeProp = function(/*DomNode|String*/ node, /*String*/ name){
		//	summary:
		//		Returns an effective value of a property or an attribute.
		//	node:
		//		id or reference to the element to remove the attribute from
		//	name:
		//		the name of the attribute
		node = byId(node);
		var lc = name.toLowerCase(),
			propName = _propNames[lc] || name;
		if((propName in node) && propName != "href"){
			// node's property
			return node[propName];	// Anything
		}
		// node's attribute
		var attrName = _attrNames[lc] || name;
		return _hasAttr(node, attrName) ? node.getAttribute(attrName) : null; // Anything
	}

	dojo.create = function(tag, attrs, refNode, pos){
		//	summary:
		//		Create an element, allowing for optional attribute decoration
		//		and placement.
		//
		// description:
		//		A DOM Element creation function. A shorthand method for creating a node or
		//		a fragment, and allowing for a convenient optional attribute setting step,
		//		as well as an optional DOM placement reference.
		//|
		//		Attributes are set by passing the optional object through `dojo.attr`.
		//		See `dojo.attr` for noted caveats and nuances, and API if applicable.
		//|
		//		Placement is done via `dojo.place`, assuming the new node to be the action 
		//		node, passing along the optional reference node and position.
		//
		// tag: String|DomNode
		//		A string of the element to create (eg: "div", "a", "p", "li", "script", "br"),
		//		or an existing DOM node to process.
		//
		// attrs: Object
		//		An object-hash of attributes to set on the newly created node.
		//		Can be null, if you don't want to set any attributes/styles.
		//		See: `dojo.attr` for a description of available attributes.
		//
		// refNode: String?|DomNode?
		//		Optional reference node. Used by `dojo.place` to place the newly created
		//		node somewhere in the dom relative to refNode. Can be a DomNode reference
		//		or String ID of a node.
		//
		// pos: String?
		//		Optional positional reference. Defaults to "last" by way of `dojo.place`,
		//		though can be set to "first","after","before","last", "replace" or "only"
		//		to further control the placement of the new node relative to the refNode.
		//		'refNode' is required if a 'pos' is specified.
		//
		// returns: DomNode
		//
		// example:
		//	Create a DIV:
		//	|	var n = dojo.create("div");
		//
		// example:
		//	Create a DIV with content:
		//	|	var n = dojo.create("div", { innerHTML:"<p>hi</p>" });
		//
		// example:
		//	Place a new DIV in the BODY, with no attributes set
		//	|	var n = dojo.create("div", null, dojo.body());
		//
		// example:
		//	Create an UL, and populate it with LI's. Place the list as the first-child of a 
		//	node with id="someId":
		//	|	var ul = dojo.create("ul", null, "someId", "first");
		//	|	var items = ["one", "two", "three", "four"];
		//	|	dojo.forEach(items, function(data){
		//	|		dojo.create("li", { innerHTML: data }, ul);
		//	|	});
		//
		// example:
		//	Create an anchor, with an href. Place in BODY:
		//	|	dojo.create("a", { href:"foo.html", title:"Goto FOO!" }, dojo.body());
		//
		// example:
		//	Create a `dojo.NodeList()` from a new element (for syntatic sugar):
		//	|	dojo.query(dojo.create('div'))
		//	|		.addClass("newDiv")
		//	|		.onclick(function(e){ console.log('clicked', e.target) })
		//	|		.place("#someNode"); // redundant, but cleaner.

		var doc = d.doc;
		if(refNode){
			refNode = byId(refNode);
			doc = refNode.ownerDocument;
		}
		if(typeof tag == "string"){ // inline'd type check
			tag = doc.createElement(tag);
		}
		if(attrs){ d.attr(tag, attrs); }
		if(refNode){ d.place(tag, refNode, pos); }
		return tag; // DomNode
	}

	/*=====
	dojo.empty = function(node){
			//	summary:
			//		safely removes all children of the node.
			//	node: DOMNode|String
			//		a reference to a DOM node or an id.
			//	example:
			//	Destroy node's children byId:
			//	|	dojo.empty("someId");
			//
			//	example:
			//	Destroy all nodes' children in a list by reference:
			//	|	dojo.query(".someNode").forEach(dojo.empty);
	}
	=====*/

	d.empty =
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		d.isIE ?  function(node){
			node = byId(node);
			for(var c; c = node.lastChild;){ // intentional assignment
				d.destroy(c);
			}
		} :
		//>>excludeEnd("webkitMobile");
		function(node){
			byId(node).innerHTML = "";
		};

	/*=====
	dojo._toDom = function(frag, doc){
			//	summary:
			//		instantiates an HTML fragment returning the corresponding DOM.
			//	frag: String
			//		the HTML fragment
			//	doc: DocumentNode?
			//		optional document to use when creating DOM nodes, defaults to
			//		dojo.doc if not specified.
			//	returns: DocumentFragment
			//
			//	example:
			//	Create a table row:
			//	|	var tr = dojo._toDom("<tr><td>First!</td></tr>");
	}
	=====*/

	// support stuff for dojo._toDom
	var tagWrap = {
			option: ["select"],
			tbody: ["table"],
			thead: ["table"],
			tfoot: ["table"],
			tr: ["table", "tbody"],
			td: ["table", "tbody", "tr"],
			th: ["table", "thead", "tr"],
			legend: ["fieldset"],
			caption: ["table"],
			colgroup: ["table"],
			col: ["table", "colgroup"],
			li: ["ul"]
		},
		reTag = /<\s*([\w\:]+)/,
		masterNode = {}, masterNum = 0,
		masterName = "__" + d._scopeName + "ToDomId";

	// generate start/end tag strings to use
	// for the injection for each special tag wrap case.
	for(var param in tagWrap){
		var tw = tagWrap[param];
		tw.pre  = param == "option" ? '<select multiple="multiple">' : "<" + tw.join("><") + ">";
		tw.post = "</" + tw.reverse().join("></") + ">";
		// the last line is destructive: it reverses the array,
		// but we don't care at this point
	}

	d._toDom = function(frag, doc){
		//	summary:
		// 		converts HTML string into DOM nodes.

		doc = doc || d.doc;
		var masterId = doc[masterName];
		if(!masterId){
			doc[masterName] = masterId = ++masterNum + "";
			masterNode[masterId] = doc.createElement("div");
		}

		// make sure the frag is a string.
		frag += "";

		// find the starting tag, and get node wrapper
		var match = frag.match(reTag),
			tag = match ? match[1].toLowerCase() : "",
			master = masterNode[masterId],
			wrap, i, fc, df;
		if(match && tagWrap[tag]){
			wrap = tagWrap[tag];
			master.innerHTML = wrap.pre + frag + wrap.post;
			for(i = wrap.length; i; --i){
				master = master.firstChild;
			}
		}else{
			master.innerHTML = frag;
		}

		// one node shortcut => return the node itself
		if(master.childNodes.length == 1){
			return master.removeChild(master.firstChild); // DOMNode
		}

		// return multiple nodes as a document fragment
		df = doc.createDocumentFragment();
		while(fc = master.firstChild){ // intentional assignment
			df.appendChild(fc);
		}
		return df; // DOMNode
	}

	// =============================
	// (CSS) Class Functions
	// =============================
	var _className = "className";

	dojo.hasClass = function(/*DomNode|String*/node, /*String*/classStr){
		//	summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node.
		//
		//	node:
		//		String ID or DomNode reference to check the class for.
		//
		//	classStr:
		//		A string class name to look for.
		//
		//	example:
		//	Do something if a node with id="someNode" has class="aSillyClassName" present
		//	|	if(dojo.hasClass("someNode","aSillyClassName")){ ... }

		return ((" "+ byId(node)[_className] +" ").indexOf(" " + classStr + " ") >= 0);  // Boolean
	};

	var spaces = /\s+/, a1 = [""],
		str2array = function(s){
			if(typeof s == "string" || s instanceof String){
				if(s.indexOf(" ") < 0){
					a1[0] = s;
					return a1;
				}else{
					return s.split(spaces);
				}
			}
			// assumed to be an array
			return s;
		};

	dojo.addClass = function(/*DomNode|String*/node, /*String|Array*/classStr){
		//	summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node. Will not re-apply duplicate classes.
		//
		//	node:
		//		String ID or DomNode reference to add a class string too
		//
		//	classStr:
		//		A String class name to add, or several space-separated class names,
		//		or an array of class names.
		//
		// example:
		//	Add a class to some node:
		//	|	dojo.addClass("someNode", "anewClass");
		//
		// example:
		//	Add two classes at once:
		//	|	dojo.addClass("someNode", "firstClass secondClass");
		//
		// example:
		//	Add two classes at once (using array):
		//	|	dojo.addClass("someNode", ["firstClass", "secondClass"]);
		//
		// example:
		//	Available in `dojo.NodeList` for multiple additions
		//	|	dojo.query("ul > li").addClass("firstLevel");

		node = byId(node);
		classStr = str2array(classStr);
		var cls = " " + node[_className] + " ";
		for(var i = 0, len = classStr.length, c; i < len; ++i){
			c = classStr[i];
			if(c && cls.indexOf(" " + c + " ") < 0){
				cls += c + " ";
			}
		}
		node[_className] = d.trim(cls);
	};

	dojo.removeClass = function(/*DomNode|String*/node, /*String|Array?*/classStr){
		// summary:
		//		Removes the specified classes from node. No `dojo.hasClass`
		//		check is required.
		//
		// node:
		// 		String ID or DomNode reference to remove the class from.
		//
		// classStr:
		//		An optional String class name to remove, or several space-separated
		//		class names, or an array of class names. If omitted, all class names
		//		will be deleted.
		//
		// example:
		//	Remove a class from some node:
		//	|	dojo.removeClass("someNode", "firstClass");
		//
		// example:
		//	Remove two classes from some node:
		//	|	dojo.removeClass("someNode", "firstClass secondClass");
		//
		// example:
		//	Remove two classes from some node (using array):
		//	|	dojo.removeClass("someNode", ["firstClass", "secondClass"]);
		//
		// example:
		//	Remove all classes from some node:
		//	|	dojo.removeClass("someNode");
		//
		// example:
		//	Available in `dojo.NodeList()` for multiple removal
		//	|	dojo.query(".foo").removeClass("foo");

		node = byId(node);
		var cls;
		if(classStr !== undefined){
			classStr = str2array(classStr);
			cls = " " + node[_className] + " ";
			for(var i = 0, len = classStr.length; i < len; ++i){
				cls = cls.replace(" " + classStr[i] + " ", " ");
			}
			cls = d.trim(cls);
		}else{
			cls = "";
		}
		if(node[_className] != cls){ node[_className] = cls; }
	};

	dojo.toggleClass = function(/*DomNode|String*/node, /*String|Array*/classStr, /*Boolean?*/condition){
		//	summary:
		//		Adds a class to node if not present, or removes if present.
		//		Pass a boolean condition if you want to explicitly add or remove.
		//	condition:
		//		If passed, true means to add the class, false means to remove.
		//
		// example:
		//	|	dojo.toggleClass("someNode", "hovered");
		//
		// example:
		//	Forcefully add a class
		//	|	dojo.toggleClass("someNode", "hovered", true);
		//
		// example:
		//	Available in `dojo.NodeList()` for multiple toggles
		//	|	dojo.query(".toggleMe").toggleClass("toggleMe");

		if(condition === undefined){
			condition = !d.hasClass(node, classStr);
		}
		d[condition ? "addClass" : "removeClass"](node, classStr);
	};

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
})();
//>>excludeEnd("webkitMobile");
