define("dojo/json", ["dojo/lib/kernel"], function(dojo){
(function(){
  var result;
	var hasJSON = typeof JSON != "undefined";
	var features = {
		"json-parse": hasJSON, // all the parsers work fine
		// Firefox 3.5/Gecko 1.9 fails to use replacer in stringify properly https://bugzilla.mozilla.org/show_bug.cgi?id=509184
		"json-stringify": hasJSON && JSON.stringify({a:0}, function(k,v){return v||1;}) == '{"a":1}' 
	};
	function has(feature){
		return features[feature];
	}
	if(has("json-stringify")){
		result= JSON;
	}
	else{
		var escapeString = function(/*String*/str){
			//summary:
			//		Adds escape sequences for non-visual characters, double quote and
			//		backslash and surrounds with double quotes to form a valid string
			//		literal.
			return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
				replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
				replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r"); // string
		};
		result= {
			parse: has("json-parse") ? JSON.parse : function(str){
				// summary:
				// 		Parses a [JSON](http://json.org) string to return a JavaScript object.
				// description:
				//		This function follows [native JSON API](https://developer.mozilla.org/en/JSON)
				// 		Throws for invalid JSON strings. This delegates to eval() if native JSON
				// 		support is not available.  The content passed to this method must therefore come
				//		from a trusted source.
				// json:
				//		a string literal of a JSON item, for instance:
				//			`'{ "foo": [ "bar", 1, { "baz": "thud" } ] }'`
				return eval('(' + str + ')');
			},
			stringify: function(value, replacer, spacer){
				//	summary:
				//		Returns a [JSON](http://json.org) serialization of an object.
				//	description:
				//		Returns a [JSON](http://json.org) serialization of an object.
				//		This function follows [native JSON API](https://developer.mozilla.org/en/JSON)
				//		Note that this doesn't check for infinite recursion, so don't do that!
				//	value:
				//		A value to be serialized. 
				//	replacer:
				//		A replacer function that is called for each value and can return a replacement
				//	spacer:
				//		A spacer string to be used for pretty printing of JSON
				//		
				//	example:
				//		simple serialization of a trivial object
				//		|	define(["dojo/json"], function(JSON){
				// 		|		var jsonStr = JSON.stringify({ howdy: "stranger!", isStrange: true });
				//		|		doh.is('{"howdy":"stranger!","isStrange":true}', jsonStr);
				var undef;
				if(typeof replacer == "string"){
					spacer = replacer;
					replacer = null;
				}
				function stringify(it, indent, key){
					if(replacer){
						it = replacer(key, it);
					}
					var val, objtype = typeof it;
					if(objtype == "number" || objtype == "boolean"){
						return it + "";
					}
					if(it === null){
						return "null";
					}
					if(typeof it == "string"){
						return escapeString(it);
					}
					if(objtype == "function" || objtype == "undefined"){
						return undef; // undefined
					}
					// short-circuit for objects that support "json" serialization
					// if they return "self" then just pass-through...
					if(typeof it.toJSON == "function"){
						return stringify(tf.call(it.toJSON, key), indent, key);
					}
					var nextIndent= spacer ? (indent + spacer) : "";
					if(it.nodeType && it.cloneNode){ // isNode
						// we can't seriailize DOM nodes as regular objects because they have cycles
						// DOM nodes could be serialized with something like outerHTML, but
						// that can be provided by users in the form of .json or .__json__ function.
						throw new Error("Can't serialize DOM nodes");
					}
				
					var sep = spacer ? " " : "";
					var newLine = spacer ? "\n" : "";
				
					// array
					if(it instanceof Array){
						var itl, res = [];
						for(key = 0, itl = it.length; key < itl; key++){
							var obj = it[key];
							val = stringify(obj, nextIndent, key);
							if(typeof val != "string"){
								val = "null";
							}
							res.push(newLine + nextIndent + val);
						}
						return "[" + res.join(",") + newLine + indent + "]";
					}
					// generic object code path
					var output = [];
					for(key in it){
						var keyStr;
						if(typeof key == "number"){
							keyStr = '"' + key + '"';
						}else if(typeof key == "string"){
							keyStr = escapeString(key);
						}else{
							// skip non-string or number keys
							continue;
						}
						val = stringify(it[key], nextIndent, key);
						if(typeof val != "string"){
							// skip non-serializable values
							continue;
						}
						// At this point, the most non-IE browsers don't get in this branch 
						// (they have native JSON), so push is definitely the way to
						output.push(newLine + nextIndent + keyStr + ":" + sep + val);
					}
					return "{" + output.join(",") + newLine + indent + "}"; // String
				}
				return stringify(value, "", "");
			}
		};
	}
  dojo.json= result;
  return result; // AMD-result
})();
});
