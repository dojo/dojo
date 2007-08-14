dojo.require("dojo._base.lang");
dojo.provide("dojo._base.html");

// FIXME: need to add unit tests for all the semi-public methods

try{
	document.execCommand("BackgroundImageCache", false, true);
}catch(e){
	// sane browsers don't have cache "issues"
}

// =============================
// DOM Functions
// =============================

if(dojo.isIE || dojo.isOpera){
	dojo.byId = function(/*String*/id, /*DocumentElement*/doc){
		// summary:
		// 		similar to other library's "$" function, takes a
		// 		string representing a DOM id or a DomNode and
		// 		returns the corresponding DomNode. If a Node is
		// 		passed, this function is a no-op. Returns a
		// 		single DOM node or null, working around several
		// 		browser-specific bugs to do so.
		// id: DOM id or DOM Node
		// doc:
		//		optional, defaults to the current value of
		//		dojo.doc.  Can be used to retreive
		//		node references from other documents.
		if(dojo.isString(id)){
			var _d = (doc||dojo.doc);
			var te = _d.getElementById(id);
			// attributes.id.value is better than just id in case the 
			// user has a name=id inside a form
			if((te) && (te.attributes.id.value == id)){
				return te;
			}else{
				var eles = _d.all[id];
				if(!eles){ return; }
				if(!eles.length){ return eles; }
				// if more than 1, choose first with the correct id
				var i=0;
				while(te=eles[i++]){
					if(te.attributes.id.value == id){ return te; }
				}
			}
		}else{
			return id; // DomNode
		}
	}
}else{
	dojo.byId = function(/*String*/id, /*DocumentElement*/doc){
		// summary:
		// 		similar to other library's "$" function, takes a
		// 		string representing a DOM id or a DomNode and
		// 		returns the corresponding DomNode. If a Node is
		// 		passed, this function is a no-op. Returns a
		// 		single DOM node or null, working around several
		// 		browser-specific bugs to do so.
		// id: DOM id or DOM Node
		// doc:
		//		optional, defaults to the current value of
		//		dojo.doc.  Can be used to retreive
		//		node references from other documents.
		if(dojo.isString(id)){
			return (doc||dojo.doc).getElementById(id);
		}else{
			return id; // DomNode
		}
	}
}

(function(){
	/*
	dojo.createElement = function(obj, parent, position){
		// TODO: need to finish this!
	}
	*/

	var _destroyContainer = null;
	dojo._destroyElement = function(/*String||DomNode*/node){
		// summary:
		//		removes node from its parent, clobbers it and all of its
		//		children.
		//	node:
		//		the element to be destroyed, either as an ID or a reference

		node = dojo.byId(node);
		try{
			if(!_destroyContainer){
				_destroyContainer = document.createElement("div");
			}
			_destroyContainer.appendChild(node.parentNode ? node.parentNode.removeChild(node) : node);
			// NOTE: see http://trac.dojotoolkit.org/ticket/2931. This may be a bug and not a feature
			_destroyContainer.innerHTML = ""; 
		}catch(e){
			/* squelch */
		}
	};

	dojo.isDescendant = function(/*Node|String*/node, /*Node|String*/ancestor){
		//	summary:
		//		Returns true if node is a descendant of ancestor
		//	node: id or node reference to test
		//	ancestor: id or node reference of potential parent to test against
		try{
			node = dojo.byId(node);
			ancestor = dojo.byId(ancestor);
			while(node){
				if(node === ancestor){
					return true; // Boolean
				}
				node = node.parentNode;
			}
		}catch(e){ /* squelch */ }
		return false; // Boolean
	};

	dojo.setSelectable = function(/*Node|String*/node, /*Boolean*/selectable){
		// summary: enable or disable selection on a node
		node = dojo.byId(node);
		if(dojo.isMozilla){
			node.style.MozUserSelect = (selectable) ? "normal" : "none";
		}else if(dojo.isKhtml){
			node.style.KhtmlUserSelect = (selectable) ? "auto" : "none";
		}else if(dojo.isIE){
			node.unselectable = (selectable) ? "" : "on";
			dojo.query("*", node).forEach(function(descendant){
				descendant.unselectable = (selectable) ? "" : "on";
			});
		}
		//FIXME: else?  Opera?
	};

	var _insertBefore = function(/*Node*/node, /*Node*/ref){
		ref.parentNode.insertBefore(node, ref);
		return true;	//	boolean
	}

	var _insertAfter = function(/*Node*/node, /*Node*/ref){
		//	summary:
		//		Try to insert node after ref
		var pn = ref.parentNode;
		if(ref == pn.lastChild){
			pn.appendChild(node);
		}else{
			return _insertBefore(node, ref.nextSibling);	//	boolean
		}
		return true;	//	boolean
	}

	dojo.place = function(/*String|DomNode*/node, /*String|DomNode*/refNode, /*String|Number*/position){
		//	summary:
		//		attempt to insert node in relation to ref based on position
		//	node: 
		//		id or reference to node to place relative to refNode
		//	refNode: 
		//		id or reference of node to use as basis for placement
		//	position:
		//		string noting the position of node relative to refNode or a
		//		number indicating the location in the childNodes collection of
		//		refNode. Accepted string values are:
		//			* before
		//			* after
		//			* first
		//			* last
		//		"first" and "last" indicate positions as children of refNode.

		// FIXME: need to write tests for this!!!!
		if((!node)||(!refNode)||(typeof position == "undefined")){ 
			return false;	//	boolean 
		}
		node = dojo.byId(node);
		refNode = dojo.byId(refNode);
		if(typeof position == "number"){
			var cn = refNode.childNodes;
			if(((position == 0)&&(cn.length == 0)) ||
				(cn.length == position)){
				refNode.appendChild(node); return true;
			}
			if(position == 0){
				return _insertBefore(node, refNode.firstChild);
			}
			return _insertAfter(node, cn[position-1]);
		}
		switch(position.toLowerCase()){
			case "before":
				return _insertBefore(node, refNode);	//	boolean
			case "after":
				return _insertAfter(node, refNode);		//	boolean
			case "first":
				if(refNode.firstChild){
					return _insertBefore(node, refNode.firstChild);	//	boolean
				}else{
					refNode.appendChild(node);
					return true;	//	boolean
				}
				break;
			default: // aka: last
				refNode.appendChild(node);
				return true;	//	boolean
		}
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

	if(dojo.isIE /*|| dojo.isOpera*/){
		var _dcm = document.compatMode;
		// client code may have to adjust if compatMode varies across iframes
		dojo.boxModel = (_dcm=="BackCompat")||(_dcm=="QuirksMode")||(dojo.isIE<6) ? "border-box" : "content-box";
	}

	// =============================
	// Style Functions
	// =============================
	
	// getComputedStyle drives most of the style code.
	// Wherever possible, reuse the returned object.
	//
	// API functions below that need to access computed styles accept an 
	// optional computedStyle parameter.
	//
	// If this parameter is omitted, the functions will call getComputedStyle themselves.
	//
	// This way, calling code can access computedStyle once, and then pass the reference to 
	// multiple API functions. 
	//
	// This is a faux declaration to take pity on the doc tool
	
	dojo.getComputedStyle = function(/*DomNode*/node){
		//	summary:
		//		returns a "computed style" object which can be used to
		//		gather information about the current state of the
		//		rendered node. 
		//		Note that this may behave differently on different 
		//		browsers. Values may have different formats and value 
		//		encodings across browsers. 
		//		Use the dojo.style() method for more consistent (pixelized)
		//		return values.
		//	node:
		//		a reference to a DOM node. Does NOT support taking an
		//		ID string for speed reasons.
		//	usage:
		//		dojo.getComputedStyle(dojo.byId('foo')).borderWidth;
		return; // CSS2Properties
	}
		
	var gcs, dv = document.defaultView;
	if(dojo.isSafari){
		gcs = function(/*DomNode*/node){
			var s = dv.getComputedStyle(node, null);
			if(!s && node.style){ 
				node.style.display = ""; 
				s = dv.getComputedStyle(node, null);
			}
			return s || {};
		} 
	}else if(dojo.isIE){
		gcs = function(node){
			return node.currentStyle;
		}
	}else{
		gcs = function(node){
			return dv.getComputedStyle(node, null);
		}
	}
	dojo.getComputedStyle = gcs;
		
	if(!dojo.isIE){
		dojo._toPixelValue = function(element, value){
			// style values can be floats, client code may want
			// to round for integer pixels.
			return (parseFloat(value) || 0); 
		}
	}else{
		dojo._toPixelValue = function(element, avalue){
			if(!avalue){return 0;}
			// on IE7, medium is usually 4 pixels
			if(avalue=="medium"){return 4;};
			// style values can be floats, client code may
			// want to round this value for integer pixels.
			if(avalue.slice && (avalue.slice(-2)=='px')){ return parseFloat(avalue); }
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

	// FIXME: there opacity quirks on FF that we haven't ported over. Hrm.

	dojo._getOpacity = (dojo.isIE ? function(/*DomNode*/node){
			//	summary:
			//		returns the current opacity of the passed node as a
			//		floating-point value between 0 and 1.
			//	node:
			//		a reference to a DOM node. Does NOT support taking an
			//		ID string for speed reasons.
			try{
				return (node.filters.alpha.opacity / 100); // Number
			}catch(e){
				return 1; // Number
			}
		} : function(node){
			return dojo.getComputedStyle(node).opacity;
		}
	);

	dojo._setOpacity = (dojo.isIE ? function(/*DomNode*/node, /*Number*/opacity){
			//	summary:
			//		set the opacity of the passed node portably. Returns the
			//		new opacity of the node.
			//	node:
			//		a reference to a DOM node. Does NOT support taking an
			//		ID string for performance reasons.
			//	opacity:
			//		Number between 0 and 1. 0 specifies transparent.
			if(opacity == 1){
				// on IE7 Alpha(Filter opacity=100) makes text look fuzzy so remove it altogether (bug #2661)
				node.style.cssText = node.style.cssText.replace(/FILTER:[^;]*;/i, "");
			}else{
				var o = "Alpha(Opacity="+(opacity*100)+")";
				node.style.filter = o;
			}
			if(node.nodeName.toLowerCase == "tr"){
				dojo.query("> td", node).forEach(function(i){
					i.style.filter = o;
				});
			}
			return opacity;
		} : function(node, opacity){
			return node.style.opacity = opacity;
		}
	);

	var _pixelNamesCache = {
		width: true, height: true, left: true, top: true
	};
	var _toStyleValue = function(node, type, value){
		type = type.toLowerCase();
		if(_pixelNamesCache[type] === true){
			return dojo._toPixelValue(node, value)
		}else if(_pixelNamesCache[type] === false){
			return value;
		}else{
			if(
				(type.indexOf("margin") >= 0) ||
				// (type.indexOf("border") >= 0) ||
				(type.indexOf("padding") >= 0) ||
				(type.indexOf("width") >= 0) ||
				(type.indexOf("height") >= 0) ||
				(type.indexOf("max") >= 0) ||
				(type.indexOf("min") >= 0) ||
				(type.indexOf("offset") >= 0)
			){
				_pixelNamesCache[type] = true;
				return dojo._toPixelValue(node, value)
			}else{
				_pixelNamesCache[type] = false;
				return value;
			}
		}
	}

	// public API
	
	dojo.style = function(/*DomNode|String*/ node, /*String*/style, /*String?*/value){
		//	summary:
		//		gets or sets a style property on node. If 2 arguments are
		//		passed, acts as a getter. If value is passed, acts as a setter
		//		for the property.
		//	node:
		//		id or reference to node to get/set style for
		//	style:
		//		the style property to set in DOM-accessor format
		//		("borderWidth", not "border-width").
		//	value:
		//		optional. If passed, sets value on the node for style, handling
		//		cross-browser concerns.
		var n=dojo.byId(node), args=arguments.length, op=(style=="opacity");
		if(args==3){
			return op ? dojo._setOpacity(n, value) : n.style[style] = value; /*Number*/
		}
		if (args==2 && op){
			return dojo._getOpacity(n);
		}
		var s = dojo.getComputedStyle(n);
		return (args == 1) ? s : _toStyleValue(n, style, s[style]); /* CSS2Properties||String||Number */
	}

	// =============================
	// Box Functions
	// =============================

	dojo._getPadExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		// 		Returns object with special values specifically useful for node
		// 		fitting.
		// 			l/t = left/top padding (respectively)
		// 			w = the total of the left and right padding 
		// 			h = the total of the top and bottom padding
		//		If 'node' has position, l/t forms the origin for child nodes. 
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s=computedStyle||gcs(n), 
			px=dojo._toPixelValue,
			l=px(n, s.paddingLeft), 
			t=px(n, s.paddingTop);
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
		// 			l/t = the sum of left/top border (respectively)
		//			w = the sum of the left and right border
		//			h = the sum of the top and bottom border
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			ne='none',
			px=dojo._toPixelValue, 
			s=computedStyle||gcs(n), 
			bl=(s.borderLeftStyle!=ne ? px(n, s.borderLeftWidth) : 0),
			bt=(s.borderTopStyle!=ne ? px(n, s.borderTopWidth) : 0);
		return { 
			l: bl,
			t: bt,
			w: bl + (s.borderRightStyle!=ne ? px(n, s.borderRightWidth) : 0),
			h: bt + (s.borderBottomStyle!=ne ? px(n, s.borderBottomWidth) : 0)
		};
	}

	dojo._getPadBorderExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		//		returns object with properties useful for box fitting with
		//		regards to padding.
		//			l/t = the sum of left/top padding and left/top border (respectively)
		//			w = the sum of the left and right padding and border
		//			h = the sum of the top and bottom padding and border
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s=computedStyle||gcs(n), 
			p=dojo._getPadExtents(n, s),
			b=dojo._getBorderExtents(n, s);
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
		//			l/t = marginLeft, marginTop, respectively
		//			w = total width, margin inclusive
		//			h = total height, margin inclusive
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s=computedStyle||gcs(n), 
			px=dojo._toPixelValue,
			l=px(n, s.marginLeft),
			t=px(n, s.marginTop),
			r=px(n, s.marginRight),
			b=px(n, s.marginBottom);
		if (dojo.isSafari && (s.position != "absolute")){
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
		var s = computedStyle||gcs(node), me = dojo._getMarginExtents(node, s);
		var	l = node.offsetLeft - me.l,	t = node.offsetTop - me.t;
		if(dojo.isMoz){
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
				var p = node.parentNode;
				if(p && p.style){
					var pcs = gcs(p);
					if(pcs.overflow != "visible"){
						var be = dojo._getBorderExtents(p, pcs);
						l += be.l, t += be.t;
					}
				}
			}
		}else if(dojo.isOpera){
			// On Opera, offsetLeft includes the parent's border
			var p = node.parentNode;
			if(p){
				var be = dojo._getBorderExtents(p);
				l -= be.l, t -= be.t;
			}
		}
		return { 
			l: l, 
			t: t, 
			w: node.offsetWidth + me.w, 
			h: node.offsetHeight + me.h 
		};
	}
	
	dojo._getContentBox = function(node, computedStyle){
		// summary:
		//		returns an object that encodes the width, height, left and top
		//		positions of the node's content box, irrespective of the
		//		current box model.

		// clientWidth/Height are important since the automatically account for scrollbars
		// fallback to offsetWidth/Height for special cases (see #3378)
		var s=computedStyle||gcs(node), pe=dojo._getPadExtents(node, s), be=dojo._getBorderExtents(node, s), w=node.clientWidth, h;
		if (!w) {
			w=node.offsetWidth, h=node.offsetHeight;
		} else {
			h=node.clientHeight, be.w = be.h = 0; 
		}
		// On Opera, offsetLeft includes the parent's border
		if(dojo.isOpera){ pe.l += be.l; pe.t += be.t; };
		return { 
			l: pe.l, 
			t: pe.t, 
			w: w - pe.w - be.w, 
			h: h - pe.h - be.h
		};
	}

	dojo._getBorderBox = function(node, computedStyle){
		var s=computedStyle||gcs(node), pe=dojo._getPadExtents(node, s), cb=dojo._getContentBox(node, s);
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
		//	node: DOM Node reference. Id string not supported for performance reasons.
		//	l: optional. left offset from parent.
		//	t: optional. top offset from parent.
		//	w: optional. width in current box model.
		//	h: optional. width in current box model.
		//	u: optional. unit measure to use for other measures. Defaults to "px".
		u = u || "px";
		with(node.style){
			if(!isNaN(l)){ left = l+u; }
			if(!isNaN(t)){ top = t+u; }
			if(w>=0){ width = w+u; }
			if(h>=0){ height = h+u; }
		}
	}

	dojo._usesBorderBox = function(/*DomNode*/node){
		//	summary: 
		//		True if the node uses border-box layout.

		// We could test the computed style of node to see if a particular box
		// has been specified, but there are details and we choose not to bother.
		var n = node.tagName;
		// For whatever reason, TABLE and BUTTON are always border-box by default.
		// If you have assigned a different box to either one via CSS then
		// box functions will break.
		return (dojo.boxModel=="border-box")||(n=="TABLE")||(n=="BUTTON"); // boolean
	}

	dojo._setContentSize = function(/*DomNode*/node, /*Number*/widthPx, /*Number*/heightPx, /*Object*/computedStyle){
		//	summary:
		//		sets the size of the node's contents, irrespective of margins,
		//		padding, or borders.
		var bb = dojo._usesBorderBox(node);
		if(bb){
			var pb = dojo._getPadBorderExtents(node, computedStyle);
			if(widthPx>=0){ widthPx += pb.w; }
			if(heightPx>=0){ heightPx += pb.h; }
		}
		dojo._setBox(node, NaN, NaN, widthPx, heightPx);
	}

	dojo._setMarginBox = function(/*DomNode*/node, 	/*Number?*/leftPx, /*Number?*/topPx, 
													/*Number?*/widthPx, /*Number?*/heightPx, 
													/*Object*/computedStyle){
		//	summary:
		//		sets the size of the node's margin box and palcement
		//		(left/top), irrespective of box model. Think of it as a
		//		passthrough to dojo._setBox that handles box-model vagaries for
		//		you.

		var s = computedStyle || dojo.getComputedStyle(node);
		// Some elements have special padding, margin, and box-model settings. 
		// To use box functions you may need to set padding, margin explicitly.
		// Controlling box-model is harder, in a pinch you might set dojo.boxModel.
		var bb=dojo._usesBorderBox(node),
				pb=bb ? _nilExtents : dojo._getPadBorderExtents(node, s),
				mb=dojo._getMarginExtents(node, s);
		if(widthPx>=0){	widthPx = Math.max(widthPx - pb.w - mb.w, 0);	}
		if(heightPx>=0){ heightPx = Math.max(heightPx - pb.h - mb.h, 0); }
		dojo._setBox(node, leftPx, topPx, widthPx, heightPx);
	}
	
	var _nilExtents = { l:0, t:0, w:0, h:0 };

	// public API
	
	dojo.marginBox = function(/*DomNode|String*/node, /*Object?*/box){
		//	summary:
		//		getter/setter for the margin-box of node. Returns an object in
		//		the expected format of box (regardless if box is passed). The
		//		object might look like:
		//			{ l: 50, t: 200, w: 300: h: 150 }
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a margin width of 300px and a margin-height of
		//		150px.
		//	node:
		//		id or reference to DOM Node to get/set box for
		//	box:
		//		optional. If passed, denotes that dojo.marginBox() should
		//		update/set the margin box for node. Box is an object in the
		//		above format. All properties are optional if passed.
		var n=dojo.byId(node), s=gcs(n), b=box;
		return !b ? dojo._getMarginBox(n, s) : dojo._setMarginBox(n, b.l, b.t, b.w, b.h, s); // Object
	}

	dojo.contentBox = function(/*DomNode|String*/node, /*Object?*/box){
		//	summary:
		//		getter/setter for the content-box of node. Returns an object in
		//		the expected format of box (regardless if box is passed). The
		//		object might look like:
		//			{ l: 50, t: 200, w: 300: h: 150 }
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a content width of 300px and a content-height of
		//		150px. Note that the content box may have a much larger border
		//		or margin box, depending on the box model currently in use and
		//		CSS values set/inherited for node.
		//	node:
		//		id or reference to DOM Node to get/set box for
		//	box:
		//		optional. If passed, denotes that dojo.contentBox() should
		//		update/set the content box for node. Box is an object in the
		//		above format. All properties are optional if passed.
		var n=dojo.byId(node), s=gcs(n), b=box;
		return !b ? dojo._getContentBox(n, s) : dojo._setContentSize(n, b.w, b.h, s); // Object
	}
	
	// =============================
	// Positioning 
	// =============================
	
	var _sumAncestorProperties = function(node, prop){
		if(!(node = (node||0).parentNode)){return 0};
		var val, retVal = 0, _b = dojo.body();
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
		var _b = dojo.body();
		var _w = dojo.global;
		var de = dojo.doc.documentElement;
		return {
			y: (_w.pageYOffset || de.scrollTop || _b.scrollTop || 0),
			x: (_w.pageXOffset || dojo._fixIeBiDiScrollLeft(de.scrollLeft) || _b.scrollLeft || 0)
		};
	};
	
	dojo._isBodyLtr = function(){
		//FIXME: could check html and body tags directly instead of computed style?  need to ignore case, accept empty values
		return typeof dojo._bodyLtr == "undefined" ? 
				(dojo._bodyLtr = dojo.getComputedStyle(dojo.body()).direction == "ltr") :
				dojo._bodyLtr; // Boolean 
	}
	
	dojo._getIeDocumentElementOffset = function(){
		// summary
		// The following values in IE contain an offset:
		//     event.clientX 
		//     event.clientY 
		//     node.getBoundingClientRect().left
		//     node.getBoundingClientRect().top
		// But other position related values do not contain this offset, such as
		// node.offsetLeft, node.offsetTop, node.style.left and node.style.top.
		// The offset is always (2, 2) in LTR direction. When the body is in RTL
		// direction, the offset counts the width of left scroll bar's width.
		// This function computes the actual offset.

		//NOTE: assumes we're being called in an IE browser

		var de = dojo.doc.documentElement;
		if(dojo.isIE >= 7){
			return {x: de.getBoundingClientRect().left, y: de.getBoundingClientRect().top}; // Object
		}else{
			// IE 6.0
			return {x: dojo._isBodyLtr() || window.parent == window ?
				de.clientLeft : de.offsetWidth - de.clientWidth - de.clientLeft, 
				y: de.clientTop}; // Object
		}
	};
	
	dojo._fixIeBiDiScrollLeft = function(/*Integer*/ scrollLeft){
		// In RTL direction, scrollLeft should be a negative value, but IE 
		// returns a positive one. All codes using documentElement.scrollLeft
		// must call this function to fix this error, otherwise the position
		// will offset to right when there is a horizonal scrollbar.
		if(dojo.isIE && !dojo._isBodyLtr()){
			var de = dojo.doc.documentElement;
			return scrollLeft + de.clientWidth - de.scrollWidth; // Integer
		}
		return scrollLeft; // Integer
	}
	
	dojo._abs = function(/*HTMLElement*/node, /*Boolean?*/includeScroll){
		//	summary:
		//		Gets the absolute position of the passed element based on the
		//		document itself. Returns an object of the form:
		//			{ x: 100, y: 300 }
		//		if includeScroll is passed, the x and y values will include any
		//		document offsets that may affect the position relative to the
		//		viewport.

		// FIXME: need to decide in the brave-new-world if we're going to be
		// margin-box or border-box.
		var ownerDocument = node.ownerDocument;
		var ret = {
			x: 0,
			y: 0
		};
		var hasScroll = false;

		// targetBoxType == "border-box"
		var db = dojo.body();
		if(dojo.isIE){
			var client = node.getBoundingClientRect();
			var offset = dojo._getIeDocumentElementOffset();
			ret.x = client.left - offset.x;
			ret.y = client.top - offset.y;
		}else if(ownerDocument["getBoxObjectFor"]){
			// mozilla
			var bo = ownerDocument.getBoxObjectFor(node);
			ret.x = bo.x - _sumAncestorProperties(node, "scrollLeft");
			ret.y = bo.y - _sumAncestorProperties(node, "scrollTop");
		}else{
			if(node["offsetParent"]){
				hasScroll = true;
				var endNode;
				// in Safari, if the node is an absolutely positioned child of
				// the body and the body has a margin the offset of the child
				// and the body contain the body's margins, so we need to end
				// at the body
				// FIXME: getting contrary results to the above in latest WebKit.
				if(dojo.isSafari &&
					//(node.style.getPropertyValue("position") == "absolute") &&
					(gcs(node).position == "absolute") &&
					(node.parentNode == db)){
					endNode = db;
				}else{
					endNode = db.parentNode;
				}
				if(node.parentNode != db){
					var nd = node;
					if(dojo.isOpera){ nd = db; }
					ret.x -= _sumAncestorProperties(nd, "scrollLeft");
					ret.y -= _sumAncestorProperties(nd, "scrollTop");
				}
				var curnode = node;
				do{
					var n = curnode["offsetLeft"];
					//FIXME: ugly hack to workaround the submenu in 
					//popupmenu2 does not shown up correctly in opera. 
					//Someone have a better workaround?
					if(!dojo.isOpera || n>0){
						ret.x += isNaN(n) ? 0 : n;
					}
					var m = curnode["offsetTop"];
					ret.y += isNaN(m) ? 0 : m;
					curnode = curnode.offsetParent;
				}while((curnode != endNode)&&(curnode != null));
			}else if(node["x"]&&node["y"]){
				ret.x += isNaN(node.x) ? 0 : node.x;
				ret.y += isNaN(node.y) ? 0 : node.y;
			}
		}
		// account for document scrolling
		// if offsetParent is used, ret value already includes scroll position
		// so we may have to actually remove that value if !includeScroll
		if(hasScroll || includeScroll){
			var scroll = dojo._docScroll();
			var m = hasScroll ? (!includeScroll ? -1 : 0) : 1;
			ret.y += m*scroll.y;
			ret.x += m*scroll.x;
		}

		return ret; // object
	}

	// FIXME: need a setter for coords or a moveTo!!
	dojo.coords = function(/*HTMLElement*/node, /*Boolean?*/includeScroll){
		//	summary:
		//		returns an object that measures margin box width/height and
		//		absolute positioning data from dojo._abs(). Return value will
		//		be in the form:
		//			{ l: 50, t: 200, w: 300: h: 150, x: 100, y: 300 }
		//		does not act as a setter. If includeScroll is passed, the x and
		//		y params are affected as one would expect in dojo._abs().
		var n=dojo.byId(node), s=gcs(n), mb=dojo._getMarginBox(n, s);
		var abs = dojo._abs(n, includeScroll);
		mb.x = abs.x;
		mb.y = abs.y;
		return mb;
	}
})();

// =============================
// (CSS) Class Functions
// =============================

dojo.hasClass = function(/*HTMLElement*/node, /*String*/classStr){
	//	summary:
	//		Returns whether or not the specified classes are a portion of the
	//		class list currently applied to the node. 
	return ((" "+node.className+" ").indexOf(" "+classStr+" ") >= 0);  // Boolean
};

dojo.addClass = function(/*HTMLElement*/node, /*String*/classStr){
	//	summary:
	//		Adds the specified classes to the end of the class list on the
	//		passed node.
	var cls = node.className;
	if((" "+cls+" ").indexOf(" "+classStr+" ") < 0){
		node.className = cls + (cls ? ' ' : '') + classStr;
	}
};

dojo.removeClass = function(/*HTMLElement*/node, /*String*/classStr){
	// summary: Removes classes from node.
	var t = dojo.trim((" " + node.className + " ").replace(" " + classStr + " ", " "));
	if(node.className != t){ node.className = t; }
};

dojo.toggleClass = function(/*HTMLElement*/node, /*String*/classStr, /*Boolean?*/condition){
	//	summary: 	
	//		Adds a class to node if not present, or removes if present.
	//		Pass a boolean condition if you want to explicitly add or remove.
	//	condition:
	//		If passed, true means to add the class, false means to remove.
	if(typeof condition == "undefined"){
		condition = !dojo.hasClass(node, classStr);
	}
	dojo[condition ? "addClass" : "removeClass"](node, classStr);
};
