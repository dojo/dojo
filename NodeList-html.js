dojo.provide("dojo.NodeList-html");
dojo.require("dojo.html");

/*=====
dojo["NodeList-html"] = {
	// summary: Adds a chainable html method to dojo.query() / Nodelist instances for setting/replacing node content
};
=====*/

dojo.extend(dojo.NodeList, {
	html: function(content, params){
		//	summary:
		//		see dojo.html.set(). Sets the content of all elements of this
		//		NodeList to the given content (string/node/nodelist), with optional args to further tune the set content behavior
		//	example:
		//
		//	| dojo.query(".thingList").html.set("<li dojoType='dojo.dnd.Moveable'>1</li><li dojoType='dojo.dnd.Moveable'>2</li><li dojoType='dojo.dnd.Moveable'>3</li>",
		//	| { 
		//	| 	parseContent: true, 
		//	| 	onBegin: function() {
		//	| 		this.content = this.content.replace(/([0-9])/g, this.id + ": $1");
		//	| 		dojo.content._SetContentOperation.prototype.onBegin.apply(this, []);
		//	| 	}
		//	| }).removeClass("notdone").addClass("done");

		var dhs = new dojo.html._ContentSetter(null,content,params || {});
		this.forEach( function(elm){
			dhs.node = elm; 
			dhs.set();
			dhs.tearDown();
		});
		return this;
	}
});
