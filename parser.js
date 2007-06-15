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
				return value.split(";");
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
		// { cls: dijit.Button, params: {caption: "string", disabled: "boolean"} }
	};
	
	function getClassInfo(/*String*/ className){
		// className:
		//		fully qualified name (like "dijit.Button")
		// returns:
		//		structure like
		//			{ 
		//				cls: dijit.Button, 
		//				params: { caption: "string", disabled: "boolean"}
		//			}

		if(!instanceClasses[className]){
			// get pointer to widget class
			var cls = dojo.getObject(className);
			if(!dojo.isFunction(cls)){
				throw new Error("Could not load widget '" + className +
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

	this._wireUpConnect = function(instance, script){
		var withStr = script.getAttribute("with");
		var preamble = "";
		var suffix = "";
		if(withStr && withStr.length){
			dojo.forEach(withStr.split(/\s*,\s*/), function(part){
				preamble += "with("+part+"){";
				suffix += "}";
			});
		}
		// FIXME: support specifying arg names?
		var nf = dojo.hitch(instance, (new Function(preamble+script.innerHTML+suffix)));
		// if there's a destination, connect it to that, otherwise run it now
		var source = script.getAttribute("event");
		if(source){
			var replace = script.getAttribute("replace");
			if(replace && (replace == "true")){
				instance[source] = nf;
			}else{
				// FIXME: need to implement EL here!!
				dojo.connect(instance, source, nf);
			}
		}else{
			nf();
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
				if(attrValue != null){
					var attrType = clsInfo.params[attrName];
					var val = str2obj(attrValue, attrType);
					if(val != null){
						params[attrName] = val;
					}
				}
			}

			var scripts = dojo.query("> script[type='dojo/connect']", node).orphan();
			// console.debug(scripts);

			// create the instance
			var instance = new clsInfo.cls(params, node);
			thelist.push(instance);

			// map it to the JS namespace if that makes sense
			var jsname = node.getAttribute("jsId");
			if(jsname){
				dojo.setObject(jsname, instance);
			}

			// check to see if we need to hook up events
			scripts.forEach(function(script){
				dojo.parser._wireUpConnect(instance, script);
			});
		});

		// Call startup on each top level widget.  Parent widgets will
		// recursively call startup on their (non-top level) children
		dojo.forEach(thelist, function(widget){
			if(widget && widget.startup && (!widget.getParent || widget.getParent()==null)){
				widget.startup();
			}
		});
		return thelist;
	};

	this.parse = function(/*DomNode?*/ rootNode){
		// summary:
		//		Search specified node (or root node) recursively for widgets,
		//		and instantiate them Searches for
		//		dojoType="qualified.class.name"
		var list = dojo.query('[dojoType]', rootNode);
		// go build the object instances
		var instances = this.instantiate(list);
		
		// FIXME: clean up any dangling scripts that we may need to run
		/*
		var scripts = dojo.query("script[type='dojo/connect']", rootNode).orphan();
		scripts.forEach(function(script){
			wireUpConnect(instance, script);
		});
		*/

		return instances;
	};
}();

//Register the parser callback. It should be the first callback
//after the a11y test.

// FIXME: need to clobber cross-dependency!!
if(dojo.exists("dijit.util.wai.onload") && (dijit.util.wai.onload === dojo._loaders[0])){
	dojo._loaders.splice(1, 0, function(){ dojo.parser.parse(); });
}else{
	dojo._loaders.unshift(function(){ dojo.parser.parse(); });
}

//TODO: ported from 0.4.x Dojo.  Can we reduce this?
dojo.parser._anonCtr = 0;
dojo.parser._anon = {}; // why is this property required?
dojo.parser._nameAnonFunc = function(/*Function*/anonFuncPtr, /*Object*/thisObj, /*Boolean*/searchForNames){
	// summary:
	//		Creates a reference to anonFuncPtr in thisObj with a completely
	//		unique name. The new name is returned as a String.  If
	//		searchForNames is true, an effort will be made to locate an
	//		existing reference to anonFuncPtr in thisObj, and if one is found,
	//		the existing name will be returned instead. The default is for
	//		searchForNames to be false.
	var jpn = "$joinpoint";
	var nso = (thisObj|| dojo.parser._anon);
	if(dojo.isIE){
		var cn = anonFuncPtr["__dojoNameCache"];
		if(cn && nso[cn] === anonFuncPtr){
			return anonFuncPtr["__dojoNameCache"];
		}else if(cn){
			// hack to see if we've been event-system mangled
			var tindex = cn.indexOf(jpn);
			if(tindex != -1){
				return cn.substring(0, tindex);
			}
		}
	}
	var ret = "__"+dojo.parser._anonCtr++;
	while(typeof nso[ret] != "undefined"){
		ret = "__"+dojo.parser._anonCtr++;
	}
	nso[ret] = anonFuncPtr;
	return ret; // String
}