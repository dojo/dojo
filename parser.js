dojo.provide("dojo.parser");
dojo.require("dojo.date.stamp");

dojo.parser = new function(){

	function val2type(/*Object*/ value){
		// summary:
		//		Returns name of type of given value.

		if(dojo.isString(value)){ return "string"; }
		if(typeof value == "number"){ return "number"; }
		if(typeof value == "boolean"){ return "boolean"; }
		if(dojo.isFunction(value)){ return "function"; }
		if(dojo.isArray(value)){ return "array"; } // typeof [] == "object"
		if(value instanceof Date) { return "date"; } // assume timestamp
		if(value instanceof dojo._Url){ return "url"; }
		return "object";
	}

	function str2obj(/*String*/ value, /*String*/ type){
		// summary:
		//		Convert given string value to given type
		switch(type){
			case "string":
				return value;
			case "number":
				return value.length ? Number(value) : null;
			case "boolean":
				return typeof value == "boolean" ? value : !(value.toLowerCase()=="false");
			case "function":
				if(dojo.isFunction(value)){
					return value;
				}
				try{
					if(value.search(/[^\w\.]+/i) != -1){
						// TODO: "this" here won't work
						value = dojo.parser._nameAnonFunc(new Function(value), this);
					}
					return dojo.getObject(value, false);
				}catch(e){ return new Function(); }
			case "array":
				return value.split(/\s*,\s*/);
			case "date":
				return dojo.date.stamp.fromISOString(value);
			case "url":
//PORT FIXME: is value absolute or relative?  Need to join with "/"?
				return dojo.baseUrl + value;
			default:
				try{ eval("var tmp = "+value); return tmp; }
				catch(e){ return value; }
		}
	}

	var instanceClasses = {
		// map from fully qualified name (like "dijit.Button") to structure like
		// { cls: dijit.Button, params: {label: "string", disabled: "boolean"} }
	};
	
	function getClassInfo(/*String*/ className){
		// className:
		//		fully qualified name (like "dijit.Button")
		// returns:
		//		structure like
		//			{ 
		//				cls: dijit.Button, 
		//				params: { label: "string", disabled: "boolean"}
		//			}

		if(!instanceClasses[className]){
			// get pointer to widget class
			var cls = dojo.getObject(className);
			if(!dojo.isFunction(cls)){
				throw new Error("Could not load class '" + className +
					"'. Did you spell the name correctly and use a full path, like 'dijit.form.Button'?");
			}
			var proto = cls.prototype;
	
			// get table of parameter names & types
			var params={};
			for(var name in proto){
				if(name.charAt(0)=="_"){ continue; } 	// skip internal properties
				var defVal = proto[name];
				params[name]=val2type(defVal);
			}

			instanceClasses[className] = { cls: cls, params: params };
		}
		return instanceClasses[className];
	}

	this._functionFromScript = function(script){
		var preamble = "";
		var suffix = "";
		var argsStr = script.getAttribute("args");
		if(argsStr){
			dojo.forEach(argsStr.split(/\s*,\s*/), function(part, idx){
				preamble += "var "+part+" = arguments["+idx+"]; ";
			});
		}
		var withStr = script.getAttribute("with");
		if(withStr && withStr.length){
			dojo.forEach(withStr.split(/\s*,\s*/), function(part){
				preamble += "with("+part+"){";
				suffix += "}";
			});
		}
		return new Function(preamble+script.innerHTML+suffix);
	}

	this._wireUpMethod = function(instance, script){
		var nf = this._functionFromScript(script);
		// if there's a destination, connect it to that, otherwise run it now
		var source = script.getAttribute("event");
		if(source){
			var mode = script.getAttribute("mode");
			if(mode && (mode == "connect")){
				// FIXME: need to implement EL here!!
				dojo.connect(instance, source, instance, nf);
			}else{
				instance[source] = nf;
			}
		}else{
			nf.call(instance);
		}
	}

	this.instantiate = function(nodes){
		// summary:
		//		Takes array of nodes, and turns them into class instances and
		//		potentially calls a layout method to allow them to connect with
		//		any children		
		var thelist = [];
		dojo.forEach(nodes, function(node){
			if(!node){ return; }
			var type = node.getAttribute("dojoType");
			if((!type)||(!type.length)){ return; }
			var clsInfo = getClassInfo(type);
			var params = {};
			for(var attrName in clsInfo.params){
				var attrValue = node.getAttribute(attrName);
				if(attrValue && !dojo.isAlien(attrValue)){ // see bug#3074; ignore builtin attributes
					var attrType = clsInfo.params[attrName];
					var val = str2obj(attrValue, attrType);
					// console.debug(attrName, attrValue, val, (typeof val));
					if(val != null){
						params[attrName] = val;
					}
				}
			}
			// FIXME (perf): making two iterations of the DOM to find the
			// <script> elements feels dirty. Still need a separate iteration
			// if we do it another way, though, so we should probably benchmark
			// the various approaches at some point.

			// preambles are magic. Handle it.
			var preambles = dojo.query("> script[type='dojo/method'][event='preamble']", node).orphan();
			if(preambles.length){
				// we only support one preamble. So be it.
				params.preamble = dojo.parser._functionFromScript(preambles[0]);
			}

			// grab the rest of the scripts for processing later
			var scripts = dojo.query("> script[type='dojo/method']", node).orphan();

			var markupFactory = clsInfo.cls["markupFactory"];
			if((!markupFactory) && (clsInfo.cls["prototype"])){
				markupFactory = clsInfo.cls.prototype["markupFactory"];
			}
			// create the instance
			var instance;
			if(markupFactory){
				instance = markupFactory(params, node);
			}else{
				instance = new clsInfo.cls(params, node);
			}
			thelist.push(instance);

			// map it to the JS namespace if that makes sense
			var jsname = node.getAttribute("jsId");
			if(jsname){
				dojo.setObject(jsname, instance);
			}

			// check to see if we need to hook up events for non-declare()-built classes
			scripts.forEach(function(script){
				dojo.parser._wireUpMethod(instance, script);
			});
		});

		// Call startup on each top level instance if it makes sense (as for
		// widgets).  Parent widgets will recursively call startup on their
		// (non-top level) children
		dojo.forEach(thelist, function(instance){
			if(	instance  && 
				(instance.startup) && 
				((!instance.getParent) || (!instance.getParent()))
			){
				instance.startup();
			}
		});
		return thelist;
	};

	this.parse = function(/*DomNode?*/ rootNode){
		// summary:
		//		Search specified node (or root node) recursively for class instances,
		//		and instantiate them Searches for
		//		dojoType="qualified.class.name"
		var list = dojo.query('[dojoType]', rootNode);
		// go build the object instances
		var instances = this.instantiate(list);
		
		// FIXME: clean up any dangling scripts that we may need to run
		/*
		var scripts = dojo.query("script[type='dojo/method']", rootNode).orphan();
		scripts.forEach(function(script){
			wireUpMethod(instance, script);
		});
		*/

		return instances;
	};
}();

//Register the parser callback. It should be the first callback
//after the a11y test.

(function(){
	var parseRunner = function(){ 
		if(djConfig["parseOnLoad"] == true){
			dojo.parser.parse(); 
		}
	};

	// FIXME: need to clobber cross-dependency!!
	if(dojo.exists("dijit.util.wai.onload") && (dijit.util.wai.onload === dojo._loaders[0])){
		dojo._loaders.splice(1, 0, parseRunner);
	}else{
		dojo._loaders.unshift(parseRunner);
	}
})();

//TODO: ported from 0.4.x Dojo.  Can we reduce this?
dojo.parser._anonCtr = 0;
dojo.parser._anon = {}; // why is this property required?
dojo.parser._nameAnonFunc = function(/*Function*/anonFuncPtr, /*Object*/thisObj){
	// summary:
	//		Creates a reference to anonFuncPtr in thisObj with a completely
	//		unique name. The new name is returned as a String. 
	var jpn = "$joinpoint";
	var nso = (thisObj|| dojo.parser._anon);
	if(dojo.isIE){
		var cn = anonFuncPtr["__dojoNameCache"];
		if(cn && nso[cn] === anonFuncPtr){
			return anonFuncPtr["__dojoNameCache"];
		}
	}
	var ret = "__"+dojo.parser._anonCtr++;
	while(typeof nso[ret] != "undefined"){
		ret = "__"+dojo.parser._anonCtr++;
	}
	nso[ret] = anonFuncPtr;
	return ret; // String
}
