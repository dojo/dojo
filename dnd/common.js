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

dojo.dnd._getOffset = function(node){
	// summary: calculates the left and top offset for a content box
	// node: Node: a node
	var 
		s=dojo.getComputedStyle(node), 
		px=dojo._toPixelValue;
	return{
		l:px(node, s.marginLeft)+px(node, s.paddingLeft)+(s.borderLeftStyle!='none' ? px(node, s.borderLeftWidth) : 0),
		t:px(node, s.marginTop)+px(node, s.paddingTop)+(s.borderTopStyle!='none' ? px(node, s.borderTopWidth) : 0)
	};
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