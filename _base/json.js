dojo.provide("dojo._base.json");

dojo.fromJson = function(/*String*/ json){
	// summary:
	// 		evaluates the passed string-form of a JSON object
	// json: 
	//		a string literal of a JSON item, for instance:
	//			'{ "foo": [ "bar", 1, { "baz": "thud" } ] }'
	// return:
	//		the result of the evaluation

	// FIXME: should this accept mozilla's optional second arg?
	try {
		return eval("(" + json + ")");
	}catch(e){
		console.debug(e);
		return json;
	}
}

dojo._escapeString = function(/*string*/str){
	//summary:
	//		Adds escape sequences for non-visual characters, double quote and
	//		backslash and surrounds with double quotes to form a valid string
	//		literal.
	return ('"' + str.replace(/(["\\])/g, '\\$1') + '"'
		).replace(/[\f]/g, "\\f"
		).replace(/[\b]/g, "\\b"
		).replace(/[\n]/g, "\\n"
		).replace(/[\t]/g, "\\t"
		).replace(/[\r]/g, "\\r"); // string
}

dojo.toJson = function(/*Object*/ obj){
	// summary:
	//		Create a JSON serialization of an object, note that this doesn't
	//		check for infinite recursion, so don't do that!
	// obj:
	//		an object to be serialized. Objects may define their own
	//		serialization via a special "__json__" or "json" function
	//		property. If a specialized serializer has been defined, it will
	//		be used as a fallback.
	// return:
	//		a String representing the serialized version of the passed
	//		object

	var o = obj;
	var objtype = typeof(o);
	if(objtype == "undefined"){
		return "undefined";
	}else if((objtype == "number")||(objtype == "boolean")){
		return o + "";
	}else if(o === null){
		return "null";
	}
	if(objtype == "string"){ return dojo._escapeString(o); }
	// recurse
	var me = arguments.callee;
	// short-circuit for objects that support "json" serialization
	// if they return "self" then just pass-through...
	var newObj;
	if(typeof o.__json__ == "function"){
		newObj = o.__json__();
		if(o !== newObj){
			return me(newObj);
		}
	}
	if(typeof o.json == "function"){
		newObj = o.json();
		if(o !== newObj){
			return me(newObj);
		}
	}
	// array
	if(dojo.isArray(o)){
		var res = [];
		for(var i = 0; i < o.length; i++){
			var val = me(o[i]);
			if(typeof(val) != "string"){
				val = "undefined";
			}
			res.push(val);
		}
		return "[" + res.join(",") + "]";
	}
	/*
	// look in the registry
	try {
		window.o = o;
		newObj = dojo.json.jsonRegistry.match(o);
		return me(newObj);
	}catch(e){
		// console.debug(e);
	}
	// it's a function with no adapter, bad
	*/
	if(objtype == "function"){
		return null;
	}
	// generic object code path
	res = [];
	for(var k in o){
		var useKey;
		if(typeof(k) == "number"){
			useKey = '"' + k + '"';
		}else if(typeof(k) == "string"){
			useKey = dojo._escapeString(k);
		}else{
			// skip non-string or number keys
			continue;
		}
		val = me(o[k]);
		if(typeof(val) != "string"){
			// skip non-serializable values
			continue;
		}
		// FIXME: use += on Moz!!
		res.push(useKey + ":" + val);
	}
	return "{" + res.join(",") + "}";
}
