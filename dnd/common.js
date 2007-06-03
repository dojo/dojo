dojo.provide("dojo.dnd.common");

if(navigator.appVersion.indexOf("Macintosh") < 0){
	dojo.dnd.multiSelectKey = function(e) {
		// summary: abstracts away the difference between selection on Mac and PC
		// e: Event: mouse event
		return e.ctrlKey;	// Boolean
	};
}else{
	dojo.dnd.multiSelectKey = function(e) {
		// summary: abstracts away the difference between selection on Mac and PC
		// e: Event: mouse event
		return e.metaKey;	// Boolean
	};
}

dojo.dnd._getOffset = function(node, side){
	// summary: calculates an offset for a content box
	// node: Node: a node
	// side: String: a side of a box ("Left", "Right", "Top", or "Bottom")
	var t = dojo.style(node, "margin" + side) + dojo.style(node, "padding" + side);
	// FIXME: border is not processed properly
	var b = dojo.style(node, "border" + side + "Width");
	if(typeof b != "string" || b == ""){ b = 0; }
	return t + b;
};

dojo.dnd._uniqueId = 0;
dojo.dnd.getUniqueId = function(){
	// summary: returns a unique string for use with any DOM element
	var id;
	do{
		id = "dojoUnique" + (++dojo.dnd._uniqueId);
	}while(dojo.byId(id));
	return id;
};