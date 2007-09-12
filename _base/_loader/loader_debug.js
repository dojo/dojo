dojo.provide("dojo._base._loader.loader_debug");

//Override dojo.provide, so we can trigger the next
//script tag for the next local module. We can only add one
//at a time because there are browsers that execute script tags
//in the order that the code is received, and not in the DOM order.
dojo.nonDebugProvide = dojo.provide;

dojo.provide = function(resourceName){
	var dbgQueue = dojo["_xdDebugQueue"];
	if(dbgQueue && dbgQueue.length > 0 && resourceName == dbgQueue["currentResourceName"]){
		//Set a timeout so the module can be executed into existence. Normally the
		//dojo.provide call in a module is the first line. Don't want to risk attaching
		//another script tag until the current one finishes executing.
		window.setTimeout("dojo._xdDebugFileLoaded('" + resourceName + "')", 1);
	}

	return dojo.nonDebugProvide.apply(dojo, arguments);
}

dojo._xdDebugFileLoaded = function(resourceName){
	var dbgQueue = this._xdDebugQueue;
	
	if(resourceName && resourceName == dbgQueue.currentResourceName){
		dbgQueue.shift();
	}

	if(dbgQueue.length == 0){
		dbgQueue.currentResourceName = null;
		this._xdNotifyLoaded();
	}else{
		dbgQueue.currentResourceName = dbgQueue[0].resourceName;
		var element = document.createElement("script");
		element.type = "text/javascript";
		element.src = dbgQueue[0].resourcePath;
		document.getElementsByTagName("head")[0].appendChild(element);
	}		
}
