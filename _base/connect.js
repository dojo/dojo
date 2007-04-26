dojo.provide("dojo._base.connect");
dojo.require("dojo._base.lang");

// this file courtesy of the TurboAjax Group, licensed under a Dojo CLA

// FIXME: needs in-code docs in the worst way!!

// low-level delegation machinery
dojo._listener = {
	// create a dispatcher function
	dispatcher: function(){
		// return a dispatcher function
		return function(){
			// iterate over our listeners
			var ls = arguments.callee.listeners;
			for(var i in ls){
				// properties that are really listeners will not be in "a"
				if(!(i in Array.prototype)){
					// invoke the listener with our current scope
					ls[i].apply(this, arguments);
				}
			}
		}
	},
	// add a listener to an object
	add: function(/*Object*/ source, /*String*/ method, /*Function*/ listener){
		// Whenever 'method' is invoked, 'listener' will have the same scope.
		// Trying to supporting a context object for the listener led to 
		// complexity. 
		// Non trivial to provide 'once' functionality here
		// because listener could be the result of a dojo.hitch call,
		// in which case two references to the same hitch target would not
		// be equivalent. 
		source = source || dojo.global;
		// The source method is either null, a dispatcher, or some other function
		var f = source[method];
		// Ensure a dispatcher
		if(!f||!f.listeners){
			var d = dojo._listener.dispatcher();
			// dispatcher holds a list of handlers
			d.listeners = (f ? [f] : []);
			// put back in source			
			f = source[method] = d;
		}
		// The contract is that a handle is returned that can 
		// identify this listener for disconnect. 
		//
		// The type of the handle is private. Here is it implemented as Integer. 
		// DOM event code has this same contract but handle is Function 
		// in non-IE browsers.
		//
		// Could implement 'before' with a flag and unshift.
		return f.listeners.push(listener) ; /*Handle*/
	},
	// remove a listener from an object
	remove: function(/*Object*/ source, /*String*/ method, /*Handle*/ handle){
		var f = (source||dojo.global)[method];
		// remember that handle is the index+1 (0 is not a valid handle)
		if(f && f.listeners && handle--){	
			delete f.listeners[handle]; 
		}
	}
};

// arbitrary method delegation (knows nothing about DOM)

dojo.connect = function(/*Object|null*/ obj, 
						/*String*/ event, 
						/*Object|null*/ context, 
						/*String|Function*/ method){
	// summary:
	//		Create a link that calls one function when another executes. 
	// description:
	//		Connects method to event, so that after event fires, method
	//		does too. Connect as many methods to event as needed.
	//
	//		event must be a string. If obj is null, dojo.global is used.
	//
	//		null arguments may simply be omitted.
	//
	//		obj[event] can resolve to a function or undefined (null). 
	//		If obj[event] is null, it is assigned a function.
	//
	//		The return value is a handle that is needed to 
	//		remove this connection with dojo.disconnect.
	// obj: 
	//		The source object for the event function. 
	//		Defaults to dojo.global if null.
	// event:
	//		String name of the event function in obj. 
	//		I.e. identifies a property obj[event].
	// context: 
	//		The object that method will receive as "this".
	//
	//		If context is null and method is a function, then method
	//		inherits the context of event.
	//	
	//		If method is a string then context must be the source 
	//		object object for method (context[method]). If context is null,
	//		dojo.global is used.
	// method:
	//		A function reference, or name of a function in context. 
	//		The function identified by method fires after event does. 
	//		method receives the same arguments as the event.
	//		See context argument comments for information on method's scope.
	// usage:
	//		// when obj.onchange(), do ui.update()
	//		dojo.connect(obj, "onchange", ui, "update");
	//		dojo.connect(obj, "onchange", ui, ui.update); // same
	//
	//		// using return value for disconnect
	//		var link = dojo.connect(obj, "onchange", ui, "update");
	//		...
	//		dojo.disconnect(obj, "onchange", link);
	//
	//		// when onglobalevent executes, watcher.handler is invoked
	//		dojo.connect(null, "onglobalevent", watcher, "handler");
	//
	//		// when ob.onCustomEvent executes, customEventHandler is invoked
	//		dojo.connect(ob, "onCustomEvent", null, "customEventHandler");
	//		dojo.connect(ob, "onCustomEvent", "customEventHandler"); // same
	//
	//		// when ob.onCustomEvent executes, customEventHandler is invoked
	//		// with the same scope (this)
	//		dojo.connect(ob, "onCustomEvent", null, customEventHandler);
	//		dojo.connect(ob, "onCustomEvent", customEventHandler); // same
	//
	//		// when globalEvent executes, globalHandler is invoked
	//		// with the same scope (this)
	//		dojo.connect(null, "globalEvent", null, globalHandler);
	//		dojo.connect("globalEvent", globalHandler); // same

	// support for omitting context argument depends on hitch
	if(dojo.isString(obj)){
		return dojo._listener.add(null, obj, dojo.hitch(event, context)); /*Handle*/
	}else{
		return dojo._listener.add(obj, event, dojo.hitch(context, method)); /*Handle*/
	}
}

dojo.disconnect = function(/*Object|null*/ obj, /*String*/ event, /*Handle*/ handle){
	// summary:
	//		Remove a link created by dojo.connect.
	// description:
	//		Removes the connection between event and the method referenced by handle.
	// obj: 
	//		The source object for the event function. 
	//		Defaults to dojo.global if null. May be omitted.
	// event:
	//		String name of the event function in obj. 
	//		I.e. identifies a property obj[event].
	// handle:
	// 		the return value of the dojo.connect call that created the connection.
	if(dojo.isString(obj)){
		dojo._listener.remove(null, obj, event);
	}else{
		dojo._listener.remove(obj, event, handle);
	}
}

// topic publish/subscribe

dojo._topics = {};

dojo.subscribe = function(/*String*/ topic, /*Object|null*/ context, /*String|Function*/ method){
	// support for 3 argument invocation depends on hitch
	return dojo._listener.add(dojo._topics, topic, dojo.hitch(context, method)); /*Handle*/
}

dojo.unsubscribe = function(/*String*/ topic, /*Handle*/ handle){
	dojo._listener.remove(dojo._topics, topic, handle);
}

dojo.publish = function(/*String*/ topic, /*Array*/ args){
	// Note that args is an array. This is more efficient vs variable length argument list.
	// Ideally, by convention, var args are implemented via Array throughout the APIs.
	var f = dojo._topics[topic];
	(f)&&(f.apply(this, args||[]));
}
