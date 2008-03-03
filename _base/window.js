dojo.provide("dojo._base.window");

dojo._gearsObject = function(){
	// summary: 
	//		factory method to get a Google Gears plugin instance to
	//		expose in the browser runtime environment, if present
	var factory;
	var results;
	
	var gearsObj = dojo.getObject("google.gears");
	if(gearsObj){ return gearsObj; } // already defined elsewhere
	
	if(typeof GearsFactory != "undefined"){ // Firefox
		factory = new GearsFactory();
	}else{
		if(dojo.isIE){
			// IE
			try{
				factory = new ActiveXObject("Gears.Factory");
			}catch(e){
				// ok to squelch; there's no gears factory.  move on.
			}
		}else if(navigator.mimeTypes["application/x-googlegears"]){
			// Safari?
			factory = document.createElement("object");
			factory.setAttribute("type", "application/x-googlegears");
			factory.setAttribute("width", 0);
			factory.setAttribute("height", 0);
			factory.style.display = "none";
			document.documentElement.appendChild(factory);
		}
	}

	// still nothing?
	if(!factory){ return null; }
	
	// define the global objects now; don't overwrite them though if they
	// were somehow set internally by the Gears plugin, which is on their
	// dev roadmap for the future
	dojo.setObject("google.gears.factory", factory);
	return dojo.getObject("google.gears");
};

/*=====
dojo.isGears = {
	// summary: True if client is using Google Gears
};
=====*/
// see if we have Google Gears installed, and if
// so, make it available in the runtime environment
// and in the Google standard 'google.gears' global object
dojo.isGears = (!!dojo._gearsObject())||0;

/*=====
dojo.doc = {
	// summary:
	//		Alias for the current document. 'dojo.doc' can be modified
	//		for temporary context shifting. Also see dojo.withDoc().
	// description:
	//    Refer to dojo.doc rather
	//    than referring to 'window.document' to ensure your code runs
	//    correctly in managed contexts.
	// example:
	// 	|	n.appendChild(dojo.doc.createElement('div'));
}
=====*/
dojo.doc = window["document"] || null;

dojo.body = function(){
	// summary:
	//		Return the body element of the document
	//		return the body object associated with dojo.doc
	// example:
	// 	|	dojo.body().appendChild(dojo.doc.createElement('div'));

	// Note: document.body is not defined for a strict xhtml document
	// Would like to memoize this, but dojo.doc can change vi dojo.withDoc().
	return dojo.doc.body || dojo.doc.getElementsByTagName("body")[0]; // Node
}

dojo.setContext = function(/*Object*/globalObject, /*DocumentElement*/globalDocument){
	// summary:
	//		changes the behavior of many core Dojo functions that deal with
	//		namespace and DOM lookup, changing them to work in a new global
	//		context (e.g., an iframe). The varibles dojo.global and dojo.doc
	//		are modified as a result of calling this function and the result of
	//		`dojo.body()` likewise differs.
	dojo.global = globalObject;
	dojo.doc = globalDocument;
};

dojo._fireCallback = function(callback, context, cbArguments){
	if(context && dojo.isString(callback)){
		callback = context[callback];
	}
	return callback.apply(context, cbArguments || [ ]);
}

dojo.withGlobal = function(	/*Object*/globalObject, 
							/*Function*/callback, 
							/*Object?*/thisObject, 
							/*Array?*/cbArguments){
	// summary:
	//		Call callback with globalObject as dojo.global and
	//		globalObject.document as dojo.doc. If provided, globalObject
	//		will be executed in the context of object thisObject
	// description:
	//		When callback() returns or throws an error, the dojo.global
	//		and dojo.doc will be restored to its previous state.
	var rval;
	var oldGlob = dojo.global;
	var oldDoc = dojo.doc;
	try{
		dojo.setContext(globalObject, globalObject.document);
		rval = dojo._fireCallback(callback, thisObject, cbArguments);
	}finally{
		dojo.setContext(oldGlob, oldDoc);
	}
	return rval;
}

dojo.withDoc = function(	/*Object*/documentObject, 
							/*Function*/callback, 
							/*Object?*/thisObject, 
							/*Array?*/cbArguments){
	// summary:
	//		Call callback with documentObject as dojo.doc. If provided,
	//		callback will be executed in the context of object thisObject
	// description:
	//		When callback() returns or throws an error, the dojo.doc will
	//		be restored to its previous state.
	var rval;
	var oldDoc = dojo.doc;
	try{
		dojo.doc = documentObject;
		rval = dojo._fireCallback(callback, thisObject, cbArguments);
	}finally{
		dojo.doc = oldDoc;
	}
	return rval;
};
