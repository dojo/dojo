define(["../_base/kernel", "../_base/sniff", "../_base/window","./dom", "./style"],
		function(dojo, has, win, dom, style){
	// module:
	//		dojo/dom-geometry
	// summary:
	//		This module defines the core dojo DOM geometry API.

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
	if(has("ie") /*|| has("opera")*/){
		// client code may have to adjust if compatMode varies across iframes
		dojo.boxModel = document.compatMode == "BackCompat" ? "border-box" : "content-box";
	}
	//>>excludeEnd("webkitMobile");

	// =============================
	// Box Functions
	// =============================

	dojo.getPadExtents = dojo._getPadExtents = function getPadExtents(/*DomNode*/node, /*Object*/computedStyle){
		// summary:
		//		Returns object with special values specifically useful for node
		//		fitting.
		// description:
		//		Returns an object with `w`, `h`, `l`, `t` properties:
		//	|		l/t/r/b = left/top/right/bottom padding (respectively)
		//	|		w = the total of the left and right padding
		//	|		h = the total of the top and bottom padding
		//		If 'node' has position, l/t forms the origin for child nodes.
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), px = style.toPixelValue,
			l = px(node, s.paddingLeft), t = px(node, s.paddingTop), r = px(node, s.paddingRight), b = px(node, s.paddingBottom);
		return {l: l, t: t, r: r, b: b, w: l + r, h: t + b};
	};

	var none = "none";

	dojo.getBorderExtents = dojo._getBorderExtents = function getBorderExtents(/*DomNode*/node, /*Object*/computedStyle){
		// summary:
		//		returns an object with properties useful for noting the border
		//		dimensions.
		// description:
		//		* l/t/r/b = the sum of left/top/right/bottom border (respectively)
		//		* w = the sum of the left and right border
		//		* h = the sum of the top and bottom border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		node = dom.byId(node);
		var px = style.toPixelValue, s = computedStyle || style.getComputedStyle(node),
			l = (s.borderLeftStyle != none ? px(node, s.borderLeftWidth) : 0),
			t = (s.borderTopStyle != none ? px(node, s.borderTopWidth) : 0),
			r = (s.borderRightStyle != none ? px(node, s.borderRightWidth) : 0),
			b = (s.borderBottomStyle != none ? px(node, s.borderBottomWidth) : 0);
		return {l: l, t: t, r: r, b: b, w: l + r, h: t + b};
	};

	dojo.getPadBorderExtents = dojo._getPadBorderExtents = function getPadBorderExtents(/*DomNode*/node, /*Object*/computedStyle){
		// summary:
		//		Returns object with properties useful for box fitting with
		//		regards to padding.
		// description:
		//		* l/t/r/b = the sum of left/top/right/bottom padding and left/top/right/bottom border (respectively)
		//		* w = the sum of the left and right padding and border
		//		* h = the sum of the top and bottom padding and border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node),
			p = dojo.getPadExtents(node, s),
			b = dojo.getBorderExtents(node, s);
		return {
			l: p.l + b.l,
			t: p.t + b.t,
			r: p.r + b.r,
			b: p.b + b.b,
			w: p.w + b.w,
			h: p.h + b.h
		};
	};

	dojo.getMarginExtents = dojo._getMarginExtents = function getMarginExtents(node, computedStyle){
		// summary:
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
		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), px = style.toPixelValue,
			l = px(node, s.marginLeft), t = px(node, s.marginTop), r = px(node, s.marginRight), b = px(node, s.marginBottom);
		if(has("webKit") && (s.position != "absolute")){
			// FIXME: Safari's version of the computed right margin
			// is the space between our right edge and the right edge
			// of our offsetParent.
			// What we are looking for is the actual margin value as
			// determined by CSS.
			// Hack solution is to assume left/right margins are the same.
			r = l;
		}
		return {l: l, t: t, r: r, b: b, w: l + r, h: t + b};
	};

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

	dojo.getMarginBox = dojo._getMarginBox = function getMarginBox(/*DomNode*/node, /*Object*/computedStyle){
		// summary:
		//		returns an object that encodes the width, height, left and top
		//		positions of the node's margin box.
		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), me = dojo.getMarginExtents(node, s),
			l = node.offsetLeft - me.l, t = node.offsetTop - me.t, p = node.parentNode, px = style.toPixelValue, pcs;
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(has("moz")){
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
					pcs = style.getComputedStyle(p);
					if(pcs.overflow != "visible"){
						l += (s.borderLeftStyle != none ? px(node, s.borderLeftWidth) : 0);
						t += (s.borderTopStyle != none ? px(node, s.borderTopWidth) : 0);
					}
				}
			}
		}else if(has("opera") || (has("ie") == 8 && !dojo.isQuirks)){
			// On Opera and IE 8, offsetLeft/Top includes the parent's border
			if(p){
				pcs = style.getComputedStyle(p);
				l -= (s.borderLeftStyle != none ? px(node, s.borderLeftWidth) : 0);
				t -= (s.borderTopStyle != none ? px(node, s.borderTopWidth) : 0);
			}
		}
		//>>excludeEnd("webkitMobile");
		return {l: l, t: t, w: node.offsetWidth + me.w, h: node.offsetHeight + me.h};
	};

	dojo.getContentBox = dojo._getContentBox = function getContentBox(node, computedStyle){
		// summary:
		//		Returns an object that encodes the width, height, left and top
		//		positions of the node's content box, irrespective of the
		//		current box model.

		// clientWidth/Height are important since the automatically account for scrollbars
		// fallback to offsetWidth/Height for special cases (see #3378)
		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node), w = node.clientWidth, h,
			pe = dojo.getPadExtents(node, s), be = dojo.getBorderExtents(node, s);
		if(!w){
			w = node.offsetWidth;
			h = node.offsetHeight;
		}else{
			h = node.clientHeight;
			be.w = be.h = 0;
		}
		// On Opera, offsetLeft includes the parent's border
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(has("opera")){
			pe.l += be.l;
			pe.t += be.t;
		}
		//>>excludeEnd("webkitMobile");
		return {l: pe.l, t: pe.t, w: w - pe.w - be.w, h: h - pe.h - be.h};
	};

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

	function setBox(/*DomNode*/node, /*Number?*/l, /*Number?*/t, /*Number?*/w, /*Number?*/h, /*String?*/u){
		// summary:
		//		sets width/height/left/top in the current (native) box-model
		//		dimensions. Uses the unit passed in u.
		// node:
		//		DOM Node reference. Id string not supported for performance
		//		reasons.
		// l:
		//		left offset from parent.
		// t:
		//		top offset from parent.
		// w:
		//		width in current box model.
		// h:
		//		width in current box model.
		// u:
		//		unit measure to use for other measures. Defaults to "px".
		u = u || "px";
		var s = node.style;
		if(!isNaN(l)){
			s.left = l + u;
		}
		if(!isNaN(t)){
			s.top = t + u;
		}
		if(w >= 0){
			s.width = w + u;
		}
		if(h >= 0){
			s.height = h + u;
		}
	}

	function isButtonTag(/*DomNode*/node){
		// summary:
		//		True if the node is BUTTON or INPUT.type="button".
		return node.tagName.toLowerCase() == "button" ||
			node.tagName.toLowerCase() == "input" && (node.getAttribute("type") || "").toLowerCase() == "button"; // boolean
	}

	function usesBorderBox(/*DomNode*/node){
		// summary:
		//		True if the node uses border-box layout.

		// We could test the computed style of node to see if a particular box
		// has been specified, but there are details and we choose not to bother.

		// TABLE and BUTTON (and INPUT type=button) are always border-box by default.
		// If you have assigned a different box to either one via CSS then
		// box functions will break.

		return dojo.boxModel == "border-box" || node.tagName.toLowerCase() == "table" || isButtonTag(node); // boolean
	}

	dojo.setContentSize = dojo._setContentSize = function setContentSize(/*DomNode*/node,
			/*Number*/widthPx, /*Number*/heightPx, /*Object*/computedStyle){
		// summary:
		//		Sets the size of the node's contents, irrespective of margins,
		//		padding, or borders.

		node = dom.byId(node);
		if(usesBorderBox(node)){
			var pb = dojo.getPadBorderExtents(node, computedStyle);
			if(widthPx >= 0){
				widthPx += pb.w;
			}
			if(heightPx >= 0){
				heightPx += pb.h;
			}
		}
		setBox(node, NaN, NaN, widthPx, heightPx);
		return node;
	};

	var nilExtents = {l: 0, t: 0, w: 0, h: 0};

	dojo.setMarginBox = dojo._setMarginBox = function setMarginBox(/*DomNode*/node,
			/*Number?*/leftPx, /*Number?*/topPx, /*Number?*/widthPx, /*Number?*/heightPx, /*Object*/computedStyle){
		// summary:
		//		sets the size of the node's margin box and placement
		//		(left/top), irrespective of box model. Think of it as a
		//		passthrough to setBox that handles box-model vagaries for
		//		you.

		node = dom.byId(node);
		var s = computedStyle || style.getComputedStyle(node),
		// Some elements have special padding, margin, and box-model settings.
		// To use box functions you may need to set padding, margin explicitly.
		// Controlling box-model is harder, in a pinch you might set dojo.boxModel.
			pb = (usesBorderBox(node) ? nilExtents : dojo.getPadBorderExtents(node, s));
		if(has("webKit")){
			// on Safari (3.1.2), button nodes with no explicit size have a default margin
			// setting an explicit size eliminates the margin.
			// We have to swizzle the width to get correct margin reading.
			if(isButtonTag(node)){
				var ns = node.style;
				if(widthPx >= 0 && !ns.width){
					ns.width = "4px";
				}
				if(heightPx >= 0 && !ns.height){
					ns.height = "4px";
				}
			}
		}
		var mb = dojo.getMarginExtents(node, s);
		if(widthPx >= 0){
			widthPx = Math.max(widthPx - pb.w - mb.w, 0);
		}
		if(heightPx >= 0){
			heightPx = Math.max(heightPx - pb.h - mb.h, 0);
		}
		setBox(node, leftPx, topPx, widthPx, heightPx);
		return node;
	};

	dojo.marginBox = function marginBox(/*DomNode|String*/node, /*Object?*/box){
		// summary:
		//		Getter/setter for the margin-box of node.
		// description:
		//		Getter/setter for the margin-box of node.
		//		Returns an object in the expected format of box (regardless
		//		if box is passed). The object might look like:
		//			`{ l: 50, t: 200, w: 300: h: 150 }`
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a margin width of 300px and a margin-height of
		//		150px.
		// node:
		//		id or reference to DOM Node to get/set box for
		// box:
		//		If passed, denotes that dojo.marginBox() should
		//		update/set the margin box for node. Box is an object in the
		//		above format. All properties are optional if passed.
		// example:
		//		Retrieve the margin box of a passed node
		//	|	var box = dojo.marginBox("someNodeId");
		//	|	console.dir(box);
		//
		// example:
		//		Set a node's margin box to the size of another node
		//	|	var box = dojo.marginBox("someNodeId");
		//	|	dojo.marginBox("someOtherNode", box);
		return box ? dojo.setMarginBox(node, box.l, box.t, box.w, box.h) : dojo.getMarginBox(node); // Object
	};

	dojo.contentBox = function contentBox(/*DomNode|String*/node, /*Object?*/box){
		// summary:
		//		Getter/setter for the content-box of node.
		// description:
		//		Returns an object in the expected format of box (regardless if box is passed).
		//		The object might look like:
		//			`{ l: 50, t: 200, w: 300: h: 150 }`
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a content width of 300px and a content-height of
		//		150px. Note that the content box may have a much larger border
		//		or margin box, depending on the box model currently in use and
		//		CSS values set/inherited for node.
		//		While the getter will return top and left values, the
		//		setter only accepts setting the width and height.
		// node:
		//		id or reference to DOM Node to get/set box for
		// box:
		//		If passed, denotes that dojo.contentBox() should
		//		update/set the content box for node. Box is an object in the
		//		above format, but only w (width) and h (height) are supported.
		//		All properties are optional if passed.
		return box ? dojo.setContentSize(node, box.w, box.h) : dojo.getContentBox(node); // Object
	};

	// =============================
	// Positioning
	// =============================

	dojo.isBodyLtr = dojo._isBodyLtr = function isBodyLtr(){
		//TODO: we need to decide where to keep _bodyLtr
		return "_bodyLtr" in dojo ? dojo._bodyLtr :
			dojo._bodyLtr = (dojo.body().dir || win.doc.documentElement.dir || "ltr").toLowerCase() == "ltr"; // Boolean
	};

	dojo.docScroll = dojo._docScroll = function docScroll(){
		var node = win.doc.parentWindow || win.doc.defaultView;   // use UI window, not dojo.global window
		return "pageXOffset" in node ? {x: node.pageXOffset, y: node.pageYOffset } :
			(node = dojo.isQuirks ? win.body() : win.doc.documentElement,
				{x: dojo.fixIeBiDiScrollLeft(node.scrollLeft || 0), y: node.scrollTop || 0 });
	};

	//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
	dojo.getIeDocumentElementOffset = dojo._getIeDocumentElementOffset = function getIeDocumentElementOffset(){
		// summary:
		//		returns the offset in x and y from the document body to the
		//		visual edge of the page
		// description:
		//		The following values in IE contain an offset:
		//	|		event.clientX
		//	|		event.clientY
		//	|		node.getBoundingClientRect().left
		//	|		node.getBoundingClientRect().top
		//		But other position related values do not contain this offset,
		//		such as node.offsetLeft, node.offsetTop, node.style.left and
		//		node.style.top. The offset is always (2, 2) in LTR direction.
		//		When the body is in RTL direction, the offset counts the width
		//		of left scroll bar's width.  This function computes the actual
		//		offset.

		//NOTE: assumes we're being called in an IE browser

		var de = win.doc.documentElement; // only deal with HTML element here, position() handles body/quirks

		if(has("ie") < 8){
			var r = de.getBoundingClientRect(), // works well for IE6+
				l = r.left, t = r.top;
			if(has("ie") < 7){
				l += de.clientLeft;	// scrollbar size in strict/RTL, or,
				t += de.clientTop;	// HTML border size in strict
			}
			return {
				x: l < 0 ? 0 : l, // FRAME element border size can lead to inaccurate negative values
				y: t < 0 ? 0 : t
			};
		}else{
			return {
				x: 0,
				y: 0
			};
		}
	};
	//>>excludeEnd("webkitMobile");

	dojo.fixIeBiDiScrollLeft = dojo._fixIeBiDiScrollLeft = function fixIeBiDiScrollLeft(/*Integer*/ scrollLeft){
		// In RTL direction, scrollLeft should be a negative value, but IE
		// returns a positive one. All codes using documentElement.scrollLeft
		// must call this function to fix this error, otherwise the position
		// will offset to right when there is a horizontal scrollbar.

		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		var ie = has("ie");
		if(ie && !dojo.isBodyLtr()){
			var qk = dojo.isQuirks,
				de = qk ? win.body() : win.doc.documentElement;
			if(ie == 6 && !qk && dojo.global.frameElement && de.scrollHeight > de.clientHeight){
				scrollLeft += de.clientLeft; // workaround ie6+strict+rtl+iframe+vertical-scrollbar bug where clientWidth is too small by clientLeft pixels
			}
			return (ie < 8 || qk) ? (scrollLeft + de.clientWidth - de.scrollWidth) : -scrollLeft; // Integer
		}
		//>>excludeEnd("webkitMobile");
		return scrollLeft; // Integer
	};

	dojo.position = function(/*DomNode*/node, /*Boolean?*/includeScroll){
		// summary:
		//		Gets the position and size of the passed element relative to
		//		the viewport (if includeScroll==false), or relative to the
		//		document root (if includeScroll==true).
		//
		// description:
		//		Returns an object of the form:
		//			{ x: 100, y: 300, w: 20, h: 15 }
		//		If includeScroll==true, the x and y values will include any
		//		document offsets that may affect the position relative to the
		//		viewport.
		//		Uses the border-box model (inclusive of border and padding but
		//		not margin).  Does not act as a setter.

		node = dom.byId(node);
		var	db = win.body(),
			dh = db.parentNode,
			ret = node.getBoundingClientRect();
		ret = {x: ret.left, y: ret.top, w: ret.right - ret.left, h: ret.bottom - ret.top};
		//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(has("ie")){
			// On IE there's a 2px offset that we need to adjust for, see dojo.getIeDocumentElementOffset()
			var offset = dojo.getIeDocumentElementOffset();

			// fixes the position in IE, quirks mode
			ret.x -= offset.x + (dojo.isQuirks ? db.clientLeft + db.offsetLeft : 0);
			ret.y -= offset.y + (dojo.isQuirks ? db.clientTop + db.offsetTop : 0);
		}else if(has("ff") == 3){
			// In FF3 you have to subtract the document element margins.
			// Fixed in FF3.5 though.
			var cs = style.getComputedStyle(dh), px = style.toPixelValue;
			ret.x -= px(dh, cs.marginLeft) + px(dh, cs.borderLeftWidth);
			ret.y -= px(dh, cs.marginTop) + px(dh, cs.borderTopWidth);
		}
		//>>excludeEnd("webkitMobile");
		// account for document scrolling
		// if offsetParent is used, ret value already includes scroll position
		// so we may have to actually remove that value if !includeScroll
		if(includeScroll){
			var scroll = dojo.docScroll();
			ret.x += scroll.x;
			ret.y += scroll.y;
		}

		return ret; // Object
	};

	dojo.coords = function(/*DomNode|String*/node, /*Boolean?*/includeScroll){
		// summary:
		//		Deprecated: Use position() for border-box x/y/w/h
		//		or marginBox() for margin-box w/h/l/t.
		//		Returns an object representing a node's size and position.
		//
		// description:
		//		Returns an object that measures margin-box (w)idth/(h)eight
		//		and absolute position x/y of the border-box. Also returned
		//		is computed (l)eft and (t)op values in pixels from the
		//		node's offsetParent as returned from marginBox().
		//		Return value will be in the form:
		//|			{ l: 50, t: 200, w: 300: h: 150, x: 100, y: 300 }
		//		Does not act as a setter. If includeScroll is passed, the x and
		//		y params are affected as one would expect in dojo.position().
		dojo.deprecated("dojo.coords()", "Use dojo.position() or dojo.marginBox().");
		node = dom.byId(node);
		var s = style.getComputedStyle(node), mb = dojo.getMarginBox(node, s);
		var abs = dojo.position(node, includeScroll);
		mb.x = abs.x;
		mb.y = abs.y;
		return mb;
	};


	// random "private" functions wildly used throughout the toolkit

	dojo.getMarginSize = dojo._getMarginSize = function getMarginSize(/*DomNode*/node, /*Object*/computedStyle){
		// summary:
		//		returns an object that encodes the width and height of
		//		the node's margin box
		node = dom.byId(node);
		var me = dojo.getMarginExtents(node, computedStyle || style.getComputedStyle(node));
		var size = node.getBoundingClientRect();
		return {
			w: (size.right - size.left) + me.w,
			h: (size.bottom - size.top) + me.h
		}
	};

	// TODO: add getters/setters for dojo.boxModel, so it can be exported
	// TODO: add getters/setters for marginBox(), contentBox(), and a setter for position()?
	// TODO: evaluate separate getters/setters for position and sizes?

	return {
		// extents
		getPadExtents:       dojo.getPadExtents,
		getBorderExtents:    dojo.getBorderExtents,
		getPadBorderExtents: dojo.getPadBorderExtents,
		getMarginExtents:    dojo.getMarginExtents,
		getMarginSize:       dojo.getMarginSize,
		// margin box
		getMarginBox:        dojo.getMarginBox,
		setMarginBox:        dojo.setMarginBox,
		marginBox:           dojo.marginBox,
		// content box
		getContentBox:       dojo.getContentBox,
		setContentSize:      dojo.setContentSize,
		contentBox:          dojo.contentBox,
		// position
		position:            dojo.position,
		// miscellaneous
		isBodyLtr:           dojo.isBodyLtr,
		docScroll:           dojo.docScroll,
		// IE-specific
		getIeDocumentElementOffset: dojo.getIeDocumentElementOffset,
		fixIeBiDiScrollLeft:        dojo.fixIeBiDiScrollLeft
	};
});
