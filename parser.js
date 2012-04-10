define(
	["./_base/kernel", "./_base/lang", "./_base/array", "./_base/config", "./_base/html", "./_base/window", "./_base/url",
		"./_base/json", "./aspect", "./date/stamp", "./has", "./query", "./on", "./ready"],
	function(dojo, dlang, darray, config, dhtml, dwindow, _Url, djson, aspect, dates, has, query, don, ready){

// module:
//		dojo/parser
// summary:
//		The Dom/Widget parsing package

new Date("X"); // workaround for #11279, new Date("") == NaN

dojo.parser = new function(){
	// summary:
	//		The Dom/Widget parsing package

	// Widgets like BorderContainer add properties to _Widget via dojo.extend().
	// If BorderContainer is loaded after _Widget's parameter list has been cached,
	// we need to refresh that parameter list (for _Widget and all widgets that extend _Widget).
	var extendCnt = 0;
	aspect.after(dlang, "extend", function(){
		extendCnt++;
	}, true);

	function getNameMap(ctor){
		// summary:
		//		Returns map from lowercase name to attribute name in class, ex: {onclick: "onClick"}
		var map = ctor._nameCaseMap, proto = ctor.prototype;

		// Create the map if it's undefined.
		// Refresh the map if a superclass was possibly extended with new methods since the map was created.
		if(!map || map._extendCnt < extendCnt){
			map = ctor._nameCaseMap = {};
			for(var name in proto){
				if(name.charAt(0) === "_"){ continue; }	// skip internal properties
				map[name.toLowerCase()] = name;
			}
			map._extendCnt = extendCnt;
		}
		return map;
	}

	// Map from widget name (ex: "dijit.form.Button") to a map of { "list-of-mixins": ctor }
	// if "list-of-mixins" is "__type" this is the raw type without mixins
	var _ctorMap = {};

	function getCtor(type){
		var map = _ctorMap[type] || (_ctorMap[type] = {});
		return map["__type"] || (map["__type"] = (dlang.getObject(type) || require(type)));
	}

	this._clearCache = function(){
		// summary:
		//		Clear cached data.   Used mainly for benchmarking.
		extendCnt++;
		_ctorMap = {};
	};

	this._functionFromScript = function(script, attrData){
		// summary:
		//		Convert a <script type="dojo/method" args="a, b, c"> ... </script>
		//		into a function
		// script: DOMNode
		//		The <script> DOMNode
		// attrData: String
		//		For HTML5 compliance, searches for attrData + "args" (typically
		//		"data-dojo-args") instead of "args"
		var preamble = "",
			suffix = "",
			argsStr = (script.getAttribute(attrData + "args") || script.getAttribute("args")),
			withStr = script.getAttribute("with");

		// Convert any arguments supplied in script tag into an array to be passed to the 
		var fnArgs = (argsStr || "").split(/\s*,\s*/);

		if(withStr && withStr.length){
			darray.forEach(withStr.split(/\s*,\s*/), function(part){
				preamble += "with("+part+"){";
				suffix += "}";
			});
		}

		return new Function(fnArgs, preamble + script.innerHTML + suffix);
	};

	this.instantiate = /*====== dojo.parser.instantiate= ======*/ function(nodes, mixin, options) {
		// summary:
		//		Takes array of nodes, and turns them into class instances and
		//		potentially calls a startup method to allow them to connect with
		//		any children.
		// nodes: Array
		//		Array of DOM nodes
		// mixin: Object?
		//		An object that will be mixed in with each node in the array.
		//		Values in the mixin will override values in the node, if they
		//		exist.
		// options: Object?
		//		An object used to hold kwArgs for instantiation.
		//		See parse.options argument for details.

		mixin = mixin || {};
		options = options || {};

		var dojoType = (options.scope || dojo._scopeName) + "Type",		// typically "dojoType"
			attrData = "data-" + (options.scope || dojo._scopeName) + "-",// typically "data-dojo-"
			dataDojoType = attrData + "type";						// typically "data-dojo-type"

		var list = [];
		darray.forEach(nodes, function(node){
			var type = dojoType in mixin ? mixin[dojoType] : node.getAttribute(dataDojoType) || node.getAttribute(dojoType);
			if(type){
				list.push({
					node: node,
					"type": type
				});
			}
		});

		// Instantiate the nodes and return the objects
		return this._instantiate(list, mixin, options);
	};

	this._instantiate = /*====== dojo.parser.instantiate= ======*/ function(nodes, mixin, options){
		// summary:
		//		Takes array of objects representing nodes, and turns them into class instances and
		//		potentially calls a startup method to allow them to connect with
		//		any children.
		// nodes: Array
		//		Array of objects like
		//	|		{
		//	|			type: "dijit.form.Button",
		//	|			node: DOMNode,
		//	|			scripts: [ ... ],	// array of <script type="dojo/..."> children of node
		//	|			inherited: { ... }	// settings inherited from ancestors like dir, theme, etc.
		//	|		}
		// mixin: Object
		//		An object that will be mixed in with each node in the array.
		//		Values in the mixin will override values in the node, if they
		//		exist.
		// options: Object
		//		An options object used to hold kwArgs for instantiation.
		//		See parse.options argument for details.

		var thelist = [];

		// Precompute names of data-dojo-type and data-dojo-mixin attributes.
		// TODO: for 2.0 default to data-dojo- regardless of scopeName (or maybe scopeName won't exist in 2.0)
		var scope = options.scope || dojo._scopeName,
			attrData = "data-" + scope + "-",						// typically "data-dojo-"
			dojoType = (options.scope || dojo._scopeName) + "Type",		// typically "dojoType"
			dataDojoType = attrData + "type",						// typically "data-dojo-type"
			dataDojoMixins = attrData + "mixins";

		function extend(type, mixins){
			return type.createSubclass && type.createSubclass(mixins) || type.extend.apply(type, mixins);
		}

		darray.forEach(nodes, function(obj){
			if(!obj){ return; }

			var node = obj.node,
				type = obj.type,
				mixins = node.getAttribute(dataDojoMixins), ctor;

			// Get or generate the constructor from data-dojo-type and data-dojo-mixins
			if(mixins){
				var map = _ctorMap[type];
				// remove whitespaces
				mixins = mixins.replace(/ /g, "");
				ctor = map && map[mixins];
				if(!ctor){
					// first get ctor for raw type (& create _ctorMap[type] if needed (should not be))
					ctor = getCtor(type);
					// then do the mixin
					ctor = _ctorMap[type][mixins] = extend(ctor, darray.map(mixins.split(","), getCtor));
				}
			}else{
				ctor = getCtor(type);
			}

			// Call widget constructor
			thelist.push(this.construct(ctor, node, mixin, options, obj.scripts, obj.inherited));
		}, this);

		// Call startup on each top level instance if it makes sense (as for
		// widgets).  Parent widgets will recursively call startup on their
		// (non-top level) children
		if(!mixin._started){
			darray.forEach(thelist, function(instance){
				if( !options.noStart && instance  &&
					dlang.isFunction(instance.startup) &&
					!instance._started
				){
					instance.startup();
				}
			});
		}

		return thelist;
	};

	this.construct = function(ctor, node, mixin, options, scripts, inherited){
		// summary:
		//		Calls new ctor(params, node), where params is the hash of parameters specified on the node,
		//		excluding data-dojo-type and data-dojo-mixins.   Does not call startup().   Returns the widget.
		// ctor: Function
		//		Widget constructor.
		// node: DOMNode
		//		This node will be replaced/attached to by the widget.  It also specifies the arguments to pass to ctor.
		// mixin: Object?
		//		Attributes in this object will be passed as parameters to ctor,
		//		overriding attributes specified on the node.
		// options: Object?
		//		An options object used to hold kwArgs for instantiation.   See parse.options argument for details.
		// scripts: DomNode[]?
		//		Array of <script type="dojo/*"> DOMNodes.  If not specified, will search for <script> tags inside node.
		// inherited: Object?
		//		Settings from dir=rtl or lang=... on a node above this node.   Overrides options.inherited.

		var proto = ctor && ctor.prototype;
		options = options || {};

		// Setup hash to hold parameter settings for this widget.	Start with the parameter
		// settings inherited from ancestors ("dir" and "lang").
		// Inherited setting may later be overridden by explicit settings on node itself.
		var params = {};

		if(options.defaults){
			// settings for the document itself (or whatever subtree is being parsed)
			dlang.mixin(params, options.defaults);
		}
		if(inherited){
			// settings from dir=rtl or lang=... on a node above this node
			dlang.mixin(params, inherited);
		}

		// Get list of attributes explicitly listed in the markup
		var attributes;
		if(has("dom-attributes-explicit")){
			// Standard path to get list of user specified attributes
			attributes = node.attributes;
		}else if(has("dom-attributes-specified-flag")){
			// Special processing needed for IE8, to skip a few faux values in attributes[]
			attributes = darray.filter(node.attributes, function(a){ return a.specified;});
		}else{
			// Special path for IE6-7, avoid (sometimes >100) bogus entries in node.attributes
			var clone = /^input$|^img$/i.test(node.nodeName) ? node : node.cloneNode(false),
				attrs = clone.outerHTML.replace(/=[^\s"']+|="[^"]*"|='[^']*'/g, "").replace(/^\s*<[a-zA-Z0-9]*\s*/, "").replace(/\s*>.*$/, "");

			attributes = darray.map(attrs.split(/\s+/), function(name){
				var lcName = name.toLowerCase();
				return {
					name: name,
					// getAttribute() doesn't work for button.value, returns innerHTML of button.
					// but getAttributeNode().value doesn't work for the form.encType or li.value
					value: (node.nodeName == "LI" && name == "value") || lcName == "enctype" ?
							node.getAttribute(lcName) : node.getAttributeNode(lcName).value
				};
			});
		}

		// Hash to convert scoped attribute name (ex: data-dojo17-params) to something friendly (ex: data-dojo-params)
		// TODO: remove scope for 2.0
		var scope = options.scope || dojo._scopeName,
			attrData = "data-" + scope + "-",						// typically "data-dojo-"
			hash = {};
		if(scope !== "dojo"){
			hash[attrData + "props"] = "data-dojo-props";
			hash[attrData + "type"] = "data-dojo-type";
			hash[scope + "type"] = "dojoType";
			hash[attrData + "id"] = "data-dojo-id";
		}

		// Read in attributes and process them, including data-dojo-props, data-dojo-type,
		// dojoAttachPoint, etc., as well as normal foo=bar attributes.
		var i=0, item, funcAttrs=[];
		while(item = attributes[i++]){
			var name = item.name,
				lcName = name.toLowerCase(),
				value = item.value;

			switch(hash[lcName] || lcName){
			// Already processed, just ignore
			case "data-dojo-type":
			case "dojotype":
				break;

			// Data-dojo-props.   Save for later to make sure it overrides direct foo=bar settings
			case "data-dojo-props":
				var extra = value;
				break;

			// data-dojo-id or jsId. TODO: drop jsId in 2.0
			case "data-dojo-id":
			case "jsid":
				var jsname = value;
				break;

			// For the benefit of _Templated
			case "data-dojo-attach-point":
			case "dojoattachpoint":
				params.dojoAttachPoint = value;
				break;
			case "data-dojo-attach-event":
			case "dojoattachevent":
				params.dojoAttachEvent = value;
				break;

			// Special parameter handling needed for IE
			case "class":
				params["class"] = node.className;
				break;
			case "style":
				params["style"] = node.style && node.style.cssText;
				break;
			default:
				// Normal attribute, ex: value="123"

				// Find attribute in widget corresponding to specified name.
				// May involve case conversion, ex: onclick --> onClick
				if(!(name in proto)){
					var map = getNameMap(ctor);
					name = map[lcName] || name;
				}

				// Set params[name] to value, doing type conversion
				if(name in proto){
					switch(typeof proto[name]){
					case "string":
						params[name] = value;
						break;
					case "number":
						params[name] = value.length ? Number(value) : NaN;
						break;
					case "boolean":
						// for checked/disabled value might be "" or "checked".	 interpret as true.
						params[name] = value.toLowerCase() != "false";
						break;
					case "function":
						if(value === "" || value.search(/[^\w\.]+/i) != -1){
							// The user has specified some text for a function like "return x+5"
							params[name] = new Function(value);
						}else{
							// The user has specified the name of a global function like "myOnClick"
							// or a single word function "return"
							params[name] = dlang.getObject(value, false) || new Function(value);
						}
						funcAttrs.push(name);	// prevent "double connect", see #15026
						break;
					default:
						var pVal = proto[name];
						params[name] =
							(pVal && "length" in pVal) ? (value ? value.split(/\s*,\s*/) : []) :	// array
								(pVal instanceof Date) ?
									(value == "" ? new Date("") :	// the NaN of dates
									value == "now" ? new Date() :	// current date
									dates.fromISOString(value)) :
							(pVal instanceof _Url) ? (dojo.baseUrl + value) :
							djson.fromJson(value);
					}
				}else{
					params[name] = value;
				}
			}
		}

		// Remove function attributes from DOMNOde to prevent "double connect" problem, see #15026.
		// Do this as a separate loop since attributes[] is often a live collection (depends on the browser though).
		for(var i=0; i<funcAttrs.length; i++){
			var lcName = funcAttrs[i].toLowerCase();
			node.removeAttribute(lcName);
			node[lcName] = null;
		}

		// Mix things found in data-dojo-props into the params, overriding any direct settings
		if(extra){
			try{
				extra = djson.fromJson.call(options.propsThis, "{" + extra + "}");
				dlang.mixin(params, extra);
			}catch(e){
				// give the user a pointer to their invalid parameters. FIXME: can we kill this in production?
				throw new Error(e.toString() + " in data-dojo-props='" + extra + "'");
			}
		}

		// Any parameters specified in "mixin" override everything else.
		dlang.mixin(params, mixin);

		// Get <script> nodes associated with this widget, if they weren't specified explicitly
		if(!scripts){
			scripts = (ctor && (ctor._noScript || proto._noScript) ? [] : query("> script[type^='dojo/']", node));
		}

		// Process <script type="dojo/*"> script tags
		// <script type="dojo/method" event="foo"> tags are added to params, and passed to
		// the widget on instantiation.
		// <script type="dojo/method"> tags (with no event) are executed after instantiation
		// <script type="dojo/connect" data-dojo-event="foo"> tags are dojo.connected after instantiation
		// <script type="dojo/watch" data-dojo-prop="foo"> tags are dojo.watch after instantiation
		// <script type="dojo/on" data-dojo-event="foo"> tags are dojo.on after instantiation
		// note: dojo/* script tags cannot exist in self closing widgets, like <input />
		var aspects = [],	// aspects to connect after instantiation
			calls = [],		// functions to call after instantiation
			watches = [],  // functions to watch after instantiation
			ons = []; // functions to on after instantiation

		if(scripts){
			for(i=0; i<scripts.length; i++){
				var script = scripts[i];
				node.removeChild(script);
				// FIXME: drop event="" support in 2.0. use data-dojo-event="" instead
				var event = (script.getAttribute(attrData + "event") || script.getAttribute("event")),
					prop = script.getAttribute(attrData + "prop"),
					method = script.getAttribute(attrData + "method"),
					advice = script.getAttribute(attrData + "advice"),
					scriptType = script.getAttribute("type"),
					nf = this._functionFromScript(script, attrData);
				if(event){
					if(scriptType == "dojo/connect"){
						aspects.push({ method: event, func: nf });
					}else if(scriptType == "dojo/on"){
						ons.push({ event: event, func: nf });
					}else{
						params[event] = nf;
					}
				}else if(scriptType == "dojo/aspect"){
					aspects.push({ method: method, advice: advice, func: nf });
				}else if(scriptType == "dojo/watch"){
					watches.push({ prop: prop, func: nf });
				}else{
					calls.push(nf);
				}
			}
		}

		// create the instance
		var markupFactory = ctor.markupFactory || proto.markupFactory;
		var instance = markupFactory ? markupFactory(params, node, ctor) : new ctor(params, node);

		// map it to the JS namespace if that makes sense
		if(jsname){
			dlang.setObject(jsname, instance);
		}

		// process connections and startup functions
		for(i=0; i<aspects.length; i++){
			aspect[aspects[i].advice || "after"](instance, aspects[i].method, dlang.hitch(instance, aspects[i].func), true);
		}
		for(i=0; i<calls.length; i++){
			calls[i].call(instance);
		}
		for(i=0; i<watches.length; i++){
			instance.watch(watches[i].prop, watches[i].func);
		}
		for(i=0; i<ons.length; i++){
			don(instance, ons[i].event, ons[i].func);
		}

		return instance;
	};

	this.scan = /*====== dojo.parser.scan= ======*/ function(root, options){
		// summary:
		//		Scan a DOM tree and return an array of objects representing the DOMNodes
		//		that need to be turned into widgets.
		// description:
		//		Search specified node (or document root node) recursively for class instances
		//		and return an array of objects that represent potential widgets to be
		//		instantiated. Searches for either data-dojo-type="MID" or dojoType="MID" where
		//		"MID" is a module ID like "dijit/form/Button" or a fully qualified Class name
		//		like "dijit.form.Button".
		//
		//		See parser.parse() for details of markup.
		// root: DomNode?
		//		A default starting root node from which to start the parsing. Can be
		//		omitted, defaulting to the entire document. If omitted, the `options`
		//		object can be passed in this place. If the `options` object has a
		//		`rootNode` member, that is used.
		// options: Object
		//		a kwArgs options object, see parse() for details

		// Output list
		var list = [];

		var dojoType = (options.scope || dojo._scopeName) + "Type",		// typically "dojoType"
			attrData = "data-" + (options.scope || dojo._scopeName) + "-",	// typically "data-dojo-"
			dataDojoType = attrData + "type",						// typically "data-dojo-type"
			dataDojoTextDir = attrData + "textdir";					// typically "data-dojo-textdir"

		// Info on DOMNode currently being processed
		var node = root.firstChild;

		// Info on parent of DOMNode currently being processed
		//	- inherited: dir, lang, and textDir setting of parent, or inherited by parent
		//	- parent: pointer to identical structure for my parent (or null if no parent)
		//	- scripts: if specified, collects <script type="dojo/..."> type nodes from children
		var inherited = options.inherited;
		if(!inherited){
			function findAncestorAttr(node, attr){
				return (node.getAttribute && node.getAttribute(attr)) ||
					(node !== dwindow.doc && node !== dwindow.doc.documentElement && node.parentNode ? findAncestorAttr(node.parentNode, attr) : null);
			}
			inherited = {
				dir: findAncestorAttr(root, "dir"),
				lang: findAncestorAttr(root, "lang"),
				textDir: findAncestorAttr(root, dataDojoTextDir)
			};
			for(var key in inherited){
				if(!inherited[key]){ delete inherited[key]; }
			}
		}
		var parent = {
			inherited: inherited
		};

		// For collecting <script type="dojo/..."> type nodes (when null, we don't need to collect)
		var scripts;

		// when true, only look for <script type="dojo/..."> tags, and don't recurse to children
		var scriptsOnly;

		function getEffective(parent){
			// summary:
			//		Get effective dir, lang, textDir settings for specified obj
			//		(matching "parent" object structure above), and do caching.
			//		Take care not to return null entries.
			if(!parent.inherited){
				parent.inherited = {};
				var node = parent.node,
					grandparent = getEffective(parent.parent);
				var inherited  = {
					dir: node.getAttribute("dir") || grandparent.dir,
					lang: node.getAttribute("lang") || grandparent.lang,
					textDir: node.getAttribute(dataDojoTextDir) || grandparent.textDir
				};
				for(var key in inherited){
					if(inherited[key]){
						parent.inherited[key] = inherited[key];
					}
				}
			}
			return parent.inherited;
		}

		// DFS on DOM tree, collecting nodes with data-dojo-type specified.
		while(true){
			if(!node){
				// Finished this level, continue to parent's next sibling
				if(!parent || !parent.node){
					break;
				}
				node = parent.node.nextSibling;
				scripts = parent.scripts;
				scriptsOnly = false;
				parent = parent.parent;
				continue;
			}

			if(node.nodeType != 1){
				// Text or comment node, skip to next sibling
				node = node.nextSibling;
				continue;
			}

			if(scripts && node.nodeName.toLowerCase() == "script"){
				// Save <script type="dojo/..."> for parent, then continue to next sibling
				type = node.getAttribute("type");
				if(type && /^dojo\/\w/i.test(type)){
					scripts.push(node);
				}
				node = node.nextSibling;
				continue;
			}
			if(scriptsOnly){
				node = node.nextSibling;
				continue;
			}

			// Check for data-dojo-type attribute, fallback to backward compatible dojoType
			var type = node.getAttribute(dataDojoType) || node.getAttribute(dojoType);

			// Short circuit for leaf nodes containing nothing [but text]
			var firstChild = node.firstChild;
			if(!type && (!firstChild || (firstChild.nodeType == 3 && !firstChild.nextSibling))){
				node = node.nextSibling;
				continue;
			}

			// Setup data structure to save info on current node for when we return from processing descendant nodes
			var current = {
				node: node,
				scripts: scripts,
				parent: parent
			};

			// If dojoType/data-dojo-type specified, add to output array of nodes to instantiate
			// Note: won't find classes declared via dojo.Declaration, so use try/catch to avoid throw from require()
			// We don't care yet about mixins ctors, we check script stop only on main class
			var ctor;
			try{
				ctor = type && getCtor(type);
			}catch(e){
			}
			var childScripts = ctor && !ctor.prototype._noScript ? [] : null; // <script> nodes that are parent's children
			if(type){
				list.push({
					"type": type,
					node: node,
					scripts: childScripts,
					inherited: getEffective(current) // dir & lang settings for current node, explicit or inherited
				});
			}

			// Recurse, collecting <script type="dojo/..."> children, and also looking for
			// descendant nodes with dojoType specified (unless the widget has the stopParser flag).
			// When finished with children, go to my next sibling.
			node = firstChild;
			scripts = childScripts;
			scriptsOnly = ctor && ctor.prototype.stopParser && !(options.template);
			parent = current;
		}

		return list;
	};

	this.parse = /*====== dojo.parser.parse= ======*/ function(rootNode, options){
		// summary:
		//		Scan the DOM for class instances, and instantiate them.
		//
		// description:
		//		Search specified node (or root node) recursively for class instances,
		//		and instantiate them. Searches for either data-dojo-type="Class" or
		//		dojoType="Class" where "Class" is a a fully qualified class name,
		//		like `dijit.form.Button`
		//
		//		Using `data-dojo-type`:
		//		Attributes using can be mixed into the parameters used to instantiate the
		//		Class by using a `data-dojo-props` attribute on the node being converted.
		//		`data-dojo-props` should be a string attribute to be converted from JSON.
		//
		//		Using `dojoType`:
		//		Attributes are read from the original domNode and converted to appropriate
		//		types by looking up the Class prototype values. This is the default behavior
		//		from Dojo 1.0 to Dojo 1.5. `dojoType` support is deprecated, and will
		//		go away in Dojo 2.0.
		//
		// rootNode: DomNode?
		//		A default starting root node from which to start the parsing. Can be
		//		omitted, defaulting to the entire document. If omitted, the `options`
		//		object can be passed in this place. If the `options` object has a
		//		`rootNode` member, that is used.
		//
		// options: Object?
		//		A hash of options.
		//
		//			* noStart: Boolean?
		//				when set will prevent the parser from calling .startup()
		//				when locating the nodes.
		//			* rootNode: DomNode?
		//				identical to the function's `rootNode` argument, though
		//				allowed to be passed in via this `options object.
		//			* template: Boolean
		//				If true, ignores ContentPane's stopParser flag and parses contents inside of
		//				a ContentPane inside of a template.   This allows dojoAttachPoint on widgets/nodes
		//				nested inside the ContentPane to work.
		//			* inherited: Object
		//				Hash possibly containing dir and lang settings to be applied to
		//				parsed widgets, unless there's another setting on a sub-node that overrides
		//			* scope: String
		//				Root for attribute names to search for.   If scopeName is dojo,
		//				will search for data-dojo-type (or dojoType).   For backwards compatibility
		//				reasons defaults to dojo._scopeName (which is "dojo" except when
		//				multi-version support is used, when it will be something like dojo16, dojo20, etc.)
		//			* propsThis: Object
		//				If specified, "this" referenced from data-dojo-props will refer to propsThis.
		//				Intended for use from the widgets-in-template feature of `dijit._WidgetsInTemplateMixin`
		//
		// example:
		//		Parse all widgets on a page:
		//	|		dojo.parser.parse();
		//
		// example:
		//		Parse all classes within the node with id="foo"
		//	|		dojo.parser.parse(dojo.byId('foo'));
		//
		// example:
		//		Parse all classes in a page, but do not call .startup() on any
		//		child
		//	|		dojo.parser.parse({ noStart: true })
		//
		// example:
		//		Parse all classes in a node, but do not call .startup()
		//	|		dojo.parser.parse(someNode, { noStart:true });
		//	|		// or
		//	|		dojo.parser.parse({ noStart:true, rootNode: someNode });

		// determine the root node and options based on the passed arguments.
		var root;
		if(!options && rootNode && rootNode.rootNode){
			options = rootNode;
			root = options.rootNode;
		}else if(rootNode && dlang.isObject(rootNode) && !("nodeType" in rootNode)){
			options = rootNode;
		}else{
			root = rootNode;
		}
		root = root ? dhtml.byId(root) : dwindow.body();

		options = options || {};

		// List of all nodes on page w/dojoType specified
		var list = this.scan(root, options);

		// go build the object instances
		var mixin = options.template ? {template: true} : {};
		return this._instantiate(list, mixin, options); // Array
	};
}();

//Register the parser callback. It should be the first callback
//after the a11y test.
if(config.parseOnLoad){
	ready(100, dojo.parser, "parse");
}

return dojo.parser;
});
