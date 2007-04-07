/* 
 * Copyright © 2007 TurboAjax Group (http://www.turboajax.com)
 * Licensed under the Dojo Foundation Contributor License Agreement (http://dojotoolkit.org/icla.txt)
 */

dojo.provide("dojo._base.connect");
dojo.require("dojo._base.lang");

(function(){
					
// arbitrary method delegation (knows nothing about DOM)

dojo.connect = function(/*Object|null*/ obj, /*String*/ event, /*Object|null*/ context, /*String|Function*/ method){
	// support for 3 argument invocation depends on hitch
	return dl.add(obj, event, dojo.hitch(context, method)); /*Handle*/
}

dojo.disconnect = function(/*Object|null*/ obj ,/*String*/ event, /*Handle*/ handle){
	dl.remove(obj, event, handle);
}

// topic publish/subscribe

dojo.topic = {
	topics: {},
	subscribe: function(/*String*/ topic, /*Object|null*/ context, /*String|Function*/ method){
		// support for 3 argument invocation depends on hitch
		return dl.add(dojo.topic.topics, topic, dojo.hitch(context, method)); /*Handle*/
	},
	unsubscribe: function(/*String*/ topic, /*Handle*/ handle){
		dl.remove(dojo.topic.topics, topic, handle);
	},
	publish: function(/*String*/ topic, /*Array*/ args){
		// Note that args is an array. This is more efficient vs variable length argument list.
		// Ideally, by convention, var args are implemented via Array throughout the APIs.
		var f = dojo.topic.topics[topic];
		(f)&&(f.apply(this, args||[]));
	}
}

// low-level delegation machinery

dojo.listener = {
	dispatchers: [ ],
	dispatcher: function(source, method, f) {
		var op = Object.prototype;
		var d = function(){
			var c=arguments.callee, list=c.listeners;
			for (var i in list) {
				!(i in op)&&(list[i].apply(this, arguments));
			}
		}
		d.clean = function() {
			source[method] = null 
		}
		d.listeners = (f ? [f] : []);
		source[method] = d;
		dl.dispatchers.push(d);
		return d;
	},
	add: function(/*Object*/ source, /*String*/ method, /*Function*/ listener){
		// Whenever 'method' is invoked, 'listener' will have the same scope.
		// Supporting a context object for the listener here leads to 
		// unwarranted complexity. 
		//
		// This is an issue for providing 'once' functionality here
		// because listener could be the result of a dojo.hitch call,
		// in which case two references to the same function would not
		// be equivalent. 
		source = source || dojo.global;
		// The source method is either null, a dispatcher, or some other function
		var d = source[method];
		// Ensure a dispatcher
		if (!d||!d.listeners) {
			d = dl.dispatcher(source, method, d);
		}
		// The contract is that a 'handle' is returned that is suitable for 
		// identifying this listener. 
		//
		// The type of 'handle' is private. Here is it implemented as Integer. 
		// DOM event code has this same contract but 'handle' is Function 
		// in non-IE browsers.
		//
		// Could implement 'before' with a flag and unshift.
		return d.listeners.push(listener) - 1; /*Handle*/
	},
	remove: function(/*Object*/ source, /*String*/ method, /*Handle*/ handle){
		var f = (source||dojo.global)[method];
		if(f && f.listeners && handle){	delete f.listeners[handle]; }
	},
	clean: function(){
		for (var i=0, d; (d=this.dispatchers[i]); i++){ d.clean(); }
		this.dispatchers = [];
	}
}

var dl = dojo.listener;

})();