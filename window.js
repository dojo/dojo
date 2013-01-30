define("dojo/window", ["dojo"], function(dojo) {
dojo.getObject("window", true, dojo);

dojo.window.getBox = function(){
	// summary:
	//		Returns the dimensions and scroll position of the viewable area of a browser window

	var scrollRoot = (dojo.doc.compatMode == 'BackCompat') ? dojo.body() : dojo.doc.documentElement;

	// get scroll position
	var scroll = dojo._docScroll(); // scrollRoot.scrollTop/Left should work
	return { w: scrollRoot.clientWidth, h: scrollRoot.clientHeight, l: scroll.x, t: scroll.y };
};

dojo.window.get = function(doc){
	// summary:
	// 		Get window object associated with document doc

	// In some IE versions (at least 6.0), document.parentWindow does not return a
	// reference to the real window object (maybe a copy), so we must fix it as well
	// We use IE specific execScript to attach the real window reference to
	// document._parentWindow for later use
	if(dojo.isIE && window !== document.parentWindow){
		/*
		In IE 6, only the variable "window" can be used to connect events (others
		may be only copies).
		*/
		doc.parentWindow.execScript("document._parentWindow = window;", "Javascript");
		//to prevent memory leak, unset it after use
		//another possibility is to add an onUnload handler which seems overkill to me (liucougar)
		var win = doc._parentWindow;
		doc._parentWindow = null;
		return win;	//	Window
	}

	return doc.parentWindow || doc.defaultView;	//	Window
};

dojo.window.scrollIntoView = function(/*DomNode*/ node, /*Object?*/ pos){
	// summary:
	//		Scroll the passed node into view using minimal movement, if it is not already.

	// Don't rely on node.scrollIntoView working just because the function is there since
	// it forces the node to the page's bottom or top (and left or right in IE) without consideration for the minimal movement.
	// WebKit's node.scrollIntoViewIfNeeded doesn't work either for inner scrollbars in right-to-left mode
	// and when there's a fixed position scrollable element

	node = dojo.byId(node);
	var body, doc = node.ownerDocument || dojo.doc;

	// has() functions but without has() support
	if(!("rtl_adjust_position_for_verticalScrollBar" in dojo.window)){
		body = dojo.body();
		var	scrollable = dojo.create('div', {
				style: {overflow:'scroll', overflowX:'visible', direction:'rtl', visibility:'hidden', position:'absolute', left:'0', top:'0', width:'64px', height:'64px'}
			}, body, "last"),
			div = dojo.create('div', {
				style: {overflow:'hidden', direction:'ltr'}
			}, scrollable, "last");
		dojo.window.rtl_adjust_position_for_verticalScrollBar = dojo.position(div).x != 0;
		scrollable.removeChild(div);
		body.removeChild(scrollable);
	}

	if(!("position_fixed_support" in dojo.window)){
		// IE6, IE7+quirks, and some older mobile browsers don't support position:fixed
		body = dojo.body();
		var	outer = dojo.create('span', {
				style: {visibility:'hidden', position:'fixed', left:'1px', top:'1px'}
			}, body, "last"),
			inner = dojo.create('span', {
				style: {position:'fixed', left:'0', top:'0'}
			}, outer, "last");
		dojo.window.position_fixed_support = dojo.position(inner).x != dojo.position(outer).x;
		outer.removeChild(inner);
		body.removeChild(outer);
	}

	try{ // catch unexpected/unrecreatable errors (#7808) since we can recover using a semi-acceptable native method
		body = doc.body || doc.getElementsByTagName("body")[0];
		var	html = doc.documentElement || body.parentNode,
			isIE = dojo.isIE,
			isWK = dojo.isWebKit;
		// if an untested browser, then use the native method
		if(node == body || node == html){ return; }
		if(!(dojo.isMozilla || isIE || isWK || dojo.isOpera) && ("scrollIntoView" in node)){
			node.scrollIntoView(false); // short-circuit to native if possible
			return;
		}
		var	backCompat = doc.compatMode == 'BackCompat',
			rootWidth = Math.min(body.clientWidth || html.clientWidth, html.clientWidth || body.clientWidth),
			rootHeight = Math.min(body.clientHeight || html.clientHeight, html.clientHeight || body.clientHeight),
			scrollRoot = (isWK || backCompat) ? body : html,
			nodePos = pos || dojo.position(node),
			el = node.parentNode,
			isFixed = function(el){
				return (isIE <= 6 || (isIE == 7 && backCompat))
					? false
					: (dojo.window.position_fixed_support && (dojo.style(el, 'position').toLowerCase() == "fixed"));
			};
		if(isFixed(node)){ return; } // nothing to do
		while(el){
			if(el == body){ el = scrollRoot; }
			var	elPos = dojo.position(el),
				fixedPos = isFixed(el),
				rtl = dojo.getComputedStyle(el).direction.toLowerCase() == "rtl";

			if(el == scrollRoot){
				elPos.w = rootWidth; elPos.h = rootHeight;
				if(scrollRoot == html && isIE && rtl){ elPos.x += scrollRoot.offsetWidth-elPos.w; } // IE workaround where scrollbar causes negative x
				if(elPos.x < 0 || !isIE || isIE >= 9){ elPos.x = 0; } // older IE can have values > 0
				if(elPos.y < 0 || !isIE || isIE >= 9){ elPos.y = 0; }
			}else{
				var pb = dojo._getPadBorderExtents(el);
				elPos.w -= pb.w; elPos.h -= pb.h; elPos.x += pb.l; elPos.y += pb.t;
				var clientSize = el.clientWidth,
					scrollBarSize = elPos.w - clientSize;
				if(clientSize > 0 && scrollBarSize > 0){
					if(rtl && dojo.window.rtl_adjust_position_for_verticalScrollBar){
						elPos.x += scrollBarSize;
					}
					elPos.w = clientSize;
				}
				clientSize = el.clientHeight;
				scrollBarSize = elPos.h - clientSize;
				if(clientSize > 0 && scrollBarSize > 0){
					elPos.h = clientSize;
				}
			}
			if(fixedPos){ // bounded by viewport, not parents
				if(elPos.y < 0){
					elPos.h += elPos.y; elPos.y = 0;
				}
				if(elPos.x < 0){
					elPos.w += elPos.x; elPos.x = 0;
				}
				if(elPos.y + elPos.h > rootHeight){
					elPos.h = rootHeight - elPos.y;
				}
				if(elPos.x + elPos.w > rootWidth){
					elPos.w = rootWidth - elPos.x;
				}
			}
			// calculate overflow in all 4 directions
			var	l = nodePos.x - elPos.x, // beyond left: < 0
//						t = nodePos.y - Math.max(elPos.y, 0), // beyond top: < 0
				t = nodePos.y - elPos.y, // beyond top: < 0
				r = l + nodePos.w - elPos.w, // beyond right: > 0
				bot = t + nodePos.h - elPos.h; // beyond bottom: > 0
			var s, old;
			if(r * l > 0 && (!!el.scrollLeft || el == scrollRoot || el.scrollWidth > el.offsetHeight)){
				s = Math[l < 0? "max" : "min"](l, r);
				if(rtl && ((isIE == 8 && !backCompat) || isIE >= 9)){ s = -s; }
				old = el.scrollLeft;
				el.scrollLeft += s;
				s = el.scrollLeft - old;
				nodePos.x -= s;
			}
			if(bot * t > 0 && (!!el.scrollTop || el == scrollRoot || el.scrollHeight > el.offsetHeight)){
				s = Math.ceil(Math[t < 0? "max" : "min"](t, bot));
				old = el.scrollTop;
				el.scrollTop += s;
				s = el.scrollTop - old;
				nodePos.y -= s;
			}
			el = (el != scrollRoot) && !fixedPos && el.parentNode;
		}
	}catch(error){
		console.error('scrollIntoView: ' + error);
		node.scrollIntoView(false);
	}
};

return dojo.window;
});
