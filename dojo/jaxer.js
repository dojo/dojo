dojo.provide("dojo.jaxer");

if(typeof print == "function"){
	console.debug = Jaxer.Log.debug;
	console.warn = Jaxer.Log.warn;
	console.error = Jaxer.Log.error;
	console.info = Jaxer.Log.info;
	console.log = Jaxer.Log.warn;
}

onserverload = dojo._loadInit;
