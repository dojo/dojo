dojo.provide("dojo._base.connect");
dojo.require("dojo._base.lang");

// this file courtesy of the TurboAjax Group, licensed under a Dojo CLA

// FIXME: needs in-code docs in the worst way!!

// low-level delegation machinery
dojo._listener = {
	// create a dispatcher function
	getDispatcher: function(){
		// following comments pulled out-of-line to prevent cloning them 
		// in the returned function.
		// - indices (i) that are really in the array of listeners (ls) will 
		//   not be in Array.prototype. This is the 'sparse array' trick
		//   that keeps us safe from libs that take liberties with built-in 
		//   objects
		// - listener is invoked with current scope (this)
		return function(){
			var ls = arguments.callee.listeners;
			for(var i in ls){
				if(!(i in Array.prototype)){
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
			var d = dojo._listener.getDispatcher();
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

// Multiple delegation for arbitrary methods.

// This unit knows nothing about DOM, 
// but we include DOM aware 
// documentation and dontFix
// argument here to help the autodocs.
// Actual DOM aware code is in event.js.

dojo.connect = function(/*Object|null*/ obj, 
						/*String*/ event, 
						/*Object|null*/ context, 
						/*String|Function*/ method,
						/*Boolean*/ dontFix){
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
	//		If obj is a DOM node, the connection is delegated 
	//		to the DOM event manager (unless dontFix is true).
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
	// dontFix:
	//		If obj is a DOM node, set dontFix to true to  prevent delegation 
	//		of this connection to the DOM event manager. 
	// usage:
	//		// when obj.onchange(), do ui.update()
	//		dojo.connect(obj, "onchange", ui, "update");
	//		dojo.connect(obj, "onchange", ui, ui.update); // same
	//
	//		// using return value for disconnect
	//		var link = dojo.connect(obj, "onchange", ui, "update");
	//		...
	//		dojo.disconnect(link);
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

	// normalize arguments
	var a=arguments, args=[], i=0;
	// if a[0] is a String, obj was ommited
	args.push(dojo.isString(a[0]) ? null : a[i++], a[i++]);
	// if the arg-after-next is a String or Function, context was NOT omitted
	var a1 = a[i+1];
	args.push(dojo.isString(a1)||dojo.isFunction(a1) ? a[i++] : null, a[i++]);
	// absorb any additional arguments
	for (var l=a.length; i<l; i++){	args.push(a[i]); }
	// do the actual work
	return dojo._connect.apply(this, args); /*Handle*/
}

dojo._connect = function(obj, event, context, method){
	var h = dojo._listener.add(obj, event, dojo.hitch(context, method)); 
	return [obj, event, h]; /*Handle*/
}

dojo.disconnect = function(/*Handle*/ handle){
	// summary:
	//		Remove a link created by dojo.connect.
	// description:
	//		Removes the connection between event and the method referenced by handle.
	// handle:
	//		the return value of the dojo.connect call that created the connection.
	dojo._disconnect.apply(this, handle);
	if (handle && handle[0]!=undefined){
		dojo._disconnect.apply(this, handle);
		// let's not keep this reference
		delete handle[0];
	}
}

dojo._disconnect = function(obj, event, handle){
	dojo._listener.remove(obj, event, handle);
}

// topic publish/subscribe

dojo._topics = {};

dojo.subscribe = function(/*String*/ topic, /*Object|null*/ context, /*String|Function*/ method){
	// summary:
	//		Attach a listener to a named topic. The listener function is invoked whenever the named
	//      topic is published (see: dojo.publish).
	//		Returns a handle which is needed to unsubscribe this listener.
	// context:
	//		Scope in which method will be invoked, or null for default scope.
	// method:
	//		The name of a function in context, or a function reference. This is the function that
	//		is invoked when topic is published.
	// usage:
	//		dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
	//      dojo.publish("alerts", [ "read this", "hello world" ]);																	
	
	// support for 3 argument invocation depends on hitch
	return [topic, dojo._listener.add(dojo._topics, topic, dojo.hitch(context, method))]; /*Handle*/
}

dojo.unsubscribe = function(/*Handle*/ handle){
	// summary:
	//		Remove a topic listener. 
	// handle:
	//		The handle returned from a call to subscribe.
	// usage:
	//		var alerter = dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
	//		...
	//		dojo.unsubscribe(alerter);
	
	dojo._listener.remove(dojo._topics, handle[0], handle[1]);
}

dojo.publish = function(/*String*/ topic, /*Array*/ args){
	// summary:
	//		Invoke all listener method subscribed to topic.
	// topic:
	//		The name of the topic to publish.
	// args:
	//		An array of arguments. The arguments will be applied 
	//		to each topic subscriber (as first class parameters, via apply).
	// usage:
	//		dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
	//      dojo.publish("alerts", [ "read this", "hello world" ]);																	
	
	// Note that args is an array. This is more efficient vs variable length argument list.
	// Ideally, by convention, var args are implemented via Array throughout the APIs.
	var f = dojo._topics[topic];
	(f)&&(f.apply(this, args||[]));
}
