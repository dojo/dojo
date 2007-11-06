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

dojo._escapeString = function(/*String*/str){
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

dojo.toJsonIndentStr = "\t";
dojo.toJson = function(/*Object*/ it, /*Boolean?*/ prettyPrint, /*String?*/ _indentStr){
	// summary:
	//		Create a JSON serialization of an object. 
	//		Note that this doesn't check for infinite recursion, so don't do that!
	//
	// it:
	//		an object to be serialized. Objects may define their own
	//		serialization via a special "__json__" or "json" function
	//		property. If a specialized serializer has been defined, it will
	//		be used as a fallback.
	//
	// prettyPrint:
	//		if true, we indent objects and arrays to make the output prettier.
	//		The variable dojo.toJsonIndentStr is used as the indent string 
	//		-- to use something other than the default (tab), 
	//		change that variable before calling dojo.toJson().
	//
	// _indentStr:
	//		private variable for recursive calls when pretty printing, do not use.
	//		
	// return:
	//		a String representing the serialized version of the passed object.

	_indentStr = _indentStr || "";
	var nextIndent = (prettyPrint ? _indentStr + dojo.toJsonIndentStr : "");
	var newLine = (prettyPrint ? "\n" : "");
	var objtype = typeof(it);
	if(objtype == "undefined"){
		return "undefined";
	}else if((objtype == "number")||(objtype == "boolean")){
		return it + "";
	}else if(it === null){
		return "null";
	}
	if(objtype == "string"){ return dojo._escapeString(it); }
	// recurse
	var recurse = arguments.callee;
	// short-circuit for objects that support "json" serialization
	// if they return "self" then just pass-through...
	var newObj;
	if(typeof it.__json__ == "function"){
		newObj = it.__json__();
		if(it !== newObj){
			return recurse(newObj, prettyPrint, nextIndent);
		}
	}
	if(typeof it.json == "function"){
		newObj = it.json();
		if(it !== newObj){
			return recurse(newObj, prettyPrint, nextIndent);
		}
	}
	// array
	if(dojo.isArray(it)){
		var res = [];
		for(var i = 0; i < it.length; i++){
			var val = recurse(it[i], prettyPrint, nextIndent);
			if(typeof(val) != "string"){
				val = "undefined";
			}
			res.push(newLine + nextIndent + val);
		}
		return "[" + res.join(", ") + newLine + _indentStr + "]";
	}
	/*
	// look in the registry
	try {
		window.o = it;
		newObj = dojo.json.jsonRegistry.match(it);
		return recurse(newObj, prettyPrint, nextIndent);
	}catch(e){
		// console.debug(e);
	}
	// it's a function with no adapter, skip it
	*/
	if(objtype == "function"){
		return null;
	}
	// generic object code path
	var output = [];
	for(var key in it){
		var keyStr;
		if(typeof(key) == "number"){
			keyStr = '"' + key + '"';
		}else if(typeof(key) == "string"){
			keyStr = dojo._escapeString(key);
		}else{
			// skip non-string or number keys
			continue;
		}
		val = recurse(it[key], prettyPrint, nextIndent);
		if(typeof(val) != "string"){
			// skip non-serializable values
			continue;
		}
		// FIXME: use += on Moz!!
		//	 MOW NOTE: using += is a pain because you have to account for the dangling comma...
		output.push(newLine + nextIndent + keyStr + ": " + val);
	}
	return "{" + output.join(", ") + newLine + _indentStr + "}";
}
