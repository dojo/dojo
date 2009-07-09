dojo.provide("dojo._base.NodeList");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.array");

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
(function(){

	var d = dojo;
//>>excludeEnd("webkitMobile");

	var ap = Array.prototype, aps = ap.slice, apc = ap.concat;
	
	var tnl = function(a){
		// decorate an array to make it look like a NodeList
		a.constructor = d.NodeList;
		dojo._mixin(a, d.NodeList.prototype);
		return a;
	};

	var loopBody = function(f, a, o){
		a = [0].concat(aps.call(a, 0));
		if(!a.sort){
			// make sure it's a real array before we pass it on to be wrapped
			a = aps.call(a, 0);
		}
		o = o || d.global;
		return function(node){
			a[0] = node;
			return f.apply(o, a);
		};
	};
	
	// adapters

	var adaptAsForEach = function(f, o){
		//	summary:
		//		adapts a single node function to be used in the forEach-type
		//		actions. The initial object is returned from the specialized
		//		function.
		//	f: Function
		//		a function to adapt
		//	o: Object?
		//		an optional context for f
		return function(){
			this.forEach(loopBody(f, arguments, o));
			return this;	// Object
		};
	};

	var adaptAsMap = function(f, o){
		//	summary:
		//		adapts a single node function to be used in the map-type
		//		actions. The return is a new array of values, as via `dojo.map`
		//	f: Function
		//		a function to adapt
		//	o: Object?
		//		an optional context for f
		return function(){
			return this.map(loopBody(f, arguments, o));
		};
	};
	
	var adaptAsFilter = function(f, o){
		//	summary:
		//		adapts a single node function to be used in the filter-type actions
		//	f: Function
		//		a function to adapt
		//	o: Object?
		//		an optional context for f
		return function(){
			return this.filter(loopBody(f, arguments, o));
		};
	};
	
	var adaptWithCondition = function(f, g, o){
		//	summary: 
		//		adapts a single node function to be used in the map-type
		//		actions, behaves like forEach() or map() depending on arguments
		//	f: Function
		//		a function to adapt
		//	g: Function
		//		a condition function, if true runs as map(), otherwise runs as forEach()
		//	o: Object?
		//		an optional context for f and g
		return function(){
			var a = arguments, body = loopBody(f, a, o);
			if(g.call(o || d.global, a)){
				return this.map(body);	// self
			}
			this.forEach(body);
			return this;	// self
		};
	};
	
	var magicGuard = function(a){
		//	summary:
		//		the guard function for dojo.attr() and dojo.style()
		return a.length == 1 && d.isString(a[0])
	};
	
	var orphan = function(node){
		//	summary:
		//		function to orphan nodes
		var p = node.parentNode;
		if(p){
			p.removeChild(node);
		}
	};
	// FIXME: should we move orphan() to dojo.html?

	dojo.NodeList = function(){
		//	summary:
		//		dojo.NodeList is an of Array subclass which adds syntactic
		//		sugar for chaining, common iteration operations, animation, and
		//		node manipulation. NodeLists are most often returned as the
		//		result of dojo.query() calls.
		//	description:
		//		dojo.NodeList instances provide many utilities that reflect
		//		core Dojo APIs for Array iteration and manipulation, DOM
		//		manipulation, and event handling. Instead of needing to dig up
		//		functions in the dojo.* namespace, NodeLists generally make the
		//		full power of Dojo available for DOM manipulation tasks in a
		//		simple, chainable way.
		//	example:
		//		create a node list from a node
		//		|	new dojo.NodeList(dojo.byId("foo"));
		//	example:
		//		get a NodeList from a CSS query and iterate on it
		//		|	var l = dojo.query(".thinger");
		//		|	l.forEach(function(node, index, nodeList){
		//		|		console.log(index, node.innerHTML);
		//		|	});
		//	example:
		//		use native and Dojo-provided array methods to manipulate a
		//		NodeList without needing to use dojo.* functions explicitly:
		//		|	var l = dojo.query(".thinger");
		//		|	// since NodeLists are real arrays, they have a length
		//		|	// property that is both readable and writable and
		//		|	// push/pop/shift/unshift methods
		//		|	console.log(l.length);
		//		|	l.push(dojo.create("<span>howdy!</span>"));
		//		|
		//		|	// dojo's normalized array methods work too:
		//		|	console.log( l.indexOf(dojo.byId("foo")) );
		//		|	// ...including the special "function as string" shorthand
		//		|	console.log( l.every("item.nodeType == 1") );
		//		|
		//		|	// NodeLists can be [..] indexed, or you can use the at()
		//		|	// function to get specific items wrapped in a new NodeList:
		//		|	var node = l[3]; // the 4th element
		//		|	var newList = l.at(1, 3); // the 2nd and 4th elements
		//	example:
		//		the style functions you expect are all there too:
		//		|	// style() as a getter...
		//		|	var borders = dojo.query(".thinger").style("border");
		//		|	// ...and as a setter:
		//		|	dojo.query(".thinger").style("border", "1px solid black");
		//		|	// class manipulation
		//		|	dojo.query("li:nth-child(even)").addClass("even");
		//		|	// even getting the coordinates of all the items
		//		|	var coords = dojo.query(".thinger").coords();
		//	example:
		//		DOM manipulation functions from the dojo.* namespace area also
		//		available:
		//		|	// remove all of the elements in the list from their
		//		|	// parents (akin to "deleting" them from the document)
		//		|	dojo.query(".thinger").orphan();
		//		|	// place all elements in the list at the front of #foo
		//		|	dojo.query(".thinger").place("foo", "first");
		//	example:
		//		Event handling couldn't be easier. `dojo.connect` is mapped in,
		//		and shortcut handlers are provided for most DOM events:
		//		|	// like dojo.connect(), but with implicit scope
		//		|	dojo.query("li").connect("onclick", console, "log");
		//		|
		//		|	// many common event handlers are already available directly:
		//		|	dojo.query("li").onclick(console, "log");
		//		|	var toggleHovered = dojo.hitch(dojo, "toggleClass", "hovered");
		//		|	dojo.query("p")
		//		|		.onmouseenter(toggleHovered)
		//		|		.onmouseleave(toggleHovered);
		//	example:
		//		chainability is a key advantage of NodeLists:
		//		|	dojo.query(".thinger")
		//		|		.onclick(function(e){ /* ... */ })
		//		|		.at(1, 3, 8) // get a subset
		//		|			.style("padding", "5px")
		//		|			.forEach(console.log);

		return tnl(Array.apply(null, arguments));
	};

	var nl = d.NodeList, nlp = nl.prototype;
	
	// expose adapters and the wrapper as private functions
	
	nl._wrap = tnl;
	nl._adaptAsMap = adaptAsMap;
	nl._adaptAsForEach = adaptAsForEach;
	nl._adaptAsFilter  = adaptAsFilter;
	nl._adaptWithCondition = adaptWithCondition;
	
	// mass assignment
	
	// add array redirectors
	d.forEach(["slice", "splice"], function(name){
		var f = ap[name];
		nlp[name] = function(){ return tnl(f.apply(this, arguments)); };
	});
	// concat should be here but some browsers with native NodeList have problems with it
	
	// add array.js redirectors
	d.forEach(["indexOf", "lastIndexOf", "every", "some"], function(name){
		var f = d[name];
		nlp[name] = function(){ return f.apply(d, [this].concat(aps.call(arguments, 0))); };
	});
	
	// add conditional methods
	d.forEach(["attr", "style"], function(name){
		nlp[name] = adaptWithCondition(d[name], magicGuard);
	});
	
	// add forEach actions
	d.forEach(["connect", "addClass", "removeClass", "toggleClass", "empty"], function(name){
		nlp[name] = adaptAsForEach(d[name]);
	});

	dojo.extend(dojo.NodeList, {
		// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods

		// FIXME: handle return values for #3244
		//		http://trac.dojotoolkit.org/ticket/3244
		
		// FIXME:
		//		need to wrap or implement:
		//			join (perhaps w/ innerHTML/outerHTML overload for toString() of items?)
		//			reduce
		//			reduceRight

		/*=====
		slice: function(begin, end){
			// summary:
			//		Returns a new NodeList, maintaining this one in place
			// description:
			//		This method behaves exactly like the Array.slice method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see Mozilla's (slice
			//		documentation)[http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:slice]
			// begin: Integer
			//		Can be a positive or negative integer, with positive
			//		integers noting the offset to begin at, and negative
			//		integers denoting an offset from the end (i.e., to the left
			//		of the end)
			// end: Integer?
			//		Optional parameter to describe what position relative to
			//		the NodeList's zero index to end the slice at. Like begin,
			//		can be positive or negative.
			return tnl(a.slice.apply(this, arguments));
		},

		splice: function(index, howmany, item){
			// summary:
			//		Returns a new NodeList, manipulating this NodeList based on
			//		the arguments passed, potentially splicing in new elements
			//		at an offset, optionally deleting elements
			// description:
			//		This method behaves exactly like the Array.splice method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see Mozilla's (splice
			//		documentation)[http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:splice]
			// index: Integer
			//		begin can be a positive or negative integer, with positive
			//		integers noting the offset to begin at, and negative
			//		integers denoting an offset from the end (i.e., to the left
			//		of the end)
			// howmany: Integer?
			//		Optional parameter to describe what position relative to
			//		the NodeList's zero index to end the slice at. Like begin,
			//		can be positive or negative.
			// item: Object...?
			//		Any number of optional parameters may be passed in to be
			//		spliced into the NodeList
			// returns:
			//		dojo.NodeList
			return tnl(a.splice.apply(this, arguments));
		},

		indexOf: function(value, fromIndex){
			//	summary:
			//		see dojo.indexOf(). The primary difference is that the acted-on 
			//		array is implicitly this NodeList
			// value: Object:
			//		The value to search for.
			// fromIndex: Integer?:
			//		The loction to start searching from. Optional. Defaults to 0.
			//	description:
			//		For more details on the behavior of indexOf, see Mozilla's
			//		(indexOf
			//		docs)[http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf]
			//	returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.indexOf(this, value, fromIndex); // Integer
		},

		lastIndexOf: function(value, fromIndex){
			// summary:
			//		see dojo.lastIndexOf(). The primary difference is that the
			//		acted-on array is implicitly this NodeList
			//	description:
			//		For more details on the behavior of lastIndexOf, see
			//		Mozilla's (lastIndexOf
			//		docs)[http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf]
			// value: Object
			//		The value to search for.
			// fromIndex: Integer?
			//		The loction to start searching from. Optional. Defaults to 0.
			// returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.lastIndexOf(this, value, fromIndex); // Integer
		},

		every: function(callback, thisObject){
			//	summary:
			//		see `dojo.every()` and the (Array.every
			//		docs)[http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every].
			//		Takes the same structure of arguments and returns as
			//		dojo.every() with the caveat that the passed array is
			//		implicitly this NodeList
			// callback: Function: the callback
			// thisObject: Object?: the context
			return d.every(this, callback, thisObject); // Boolean
		},

		some: function(callback, thisObject){
			//	summary:
			//		Takes the same structure of arguments and returns as
			//		`dojo.some()` with the caveat that the passed array is
			//		implicitly this NodeList.  See `dojo.some()` and Mozilla's
			//		(Array.some
			//		documentation)[http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some].
			// callback: Function: the callback
			// thisObject: Object?: the context
			return d.some(this, callback, thisObject); // Boolean
		},
		=====*/

		concat: function(item){
			// summary:
			//		Returns a new NodeList comprised of items in this NodeList
			//		as well as items passed in as parameters
			// description:
			//		This method behaves exactly like the Array.concat method
			//		with the caveat that it returns a `dojo.NodeList` and not a
			//		raw Array. For more details, see the (Array.concat
			//		docs)[http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:concat]
			// item: Object?
			//		Any number of optional parameters may be passed in to be
			//		spliced into the NodeList
			// returns:
			//		dojo.NodeList
			
			//return tnl(apc.apply(this, arguments));
			// the line above won't work for the native NodeList :-(
			
			// implementation notes:
			// 1) Native NodeList is not an array, and cannot be used directly
			// in concat() --- the latter doesn't recognize it as an array, and
			// does not inline it, but append as a single entity.
			// 2) On some browsers (e.g., Safari) the "constructor" property is
			// read-only and cannot be changed. So we have to test for both
			// native NodeList and dojo.NodeList in this property to recognize
			// the node list.
			
			var t = d.isArray(this) ? this : aps.call(this, 0),
				m = d.map(arguments, function(a){
					return a && !d.isArray(a) &&
						(a.constructor === NodeList || a.constructor == nl) ?
							aps.call(a, 0) : a;
				});
			return tnl(apc.apply(t, m));	// dojo.NodeList
		},

		map: function(/*Function*/ func, /*Function?*/ obj){
			//	summary:
			//		see dojo.map(). The primary difference is that the acted-on
			//		array is implicitly this NodeList and the return is a
			//		dojo.NodeList (a subclass of Array)
			///return d.map(this, func, obj, d.NodeList); // dojo.NodeList
			return tnl(d.map(this, func, obj)); // dojo.NodeList
		},

		forEach: function(callback, thisObj){
			//	summary:
			//		see `dojo.forEach()`. The primary difference is that the acted-on 
			//		array is implicitly this NodeList
			d.forEach(this, callback, thisObj);
			// non-standard return to allow easier chaining
			return this; // dojo.NodeList 
		},


		/*=====
		coords: function(){
			//	summary:
			// 		Returns the box objects all elements in a node list as
			// 		an Array (*not* a NodeList)
			
			return d.map(this, d.coords); // Array
		},

		attr: function(property, value){
			//	summary:
			//		gets or sets the DOM attribute for every element in the
			//		NodeList
			//	property: String
			//		the attribute to get/set
			//	value: String?
			//		optional. The value to set the property to
			//	returns:
			//		if no value is passed, the result is an array of attribute values
			//		If a value is passed, the return is this NodeList
			return; // dojo.NodeList
			return; // Array
		},

		style: function(property, value){
			//	summary:
			//		gets or sets the CSS property for every element in the NodeList
			//	property: String
			//		the CSS property to get/set, in JavaScript notation
			//		("lineHieght" instead of "line-height") 
			//	value: String?
			//		optional. The value to set the property to
			//	returns:
			//		if no value is passed, the result is an array of strings.
			//		If a value is passed, the return is this NodeList
			return; // dojo.NodeList
			return; // Array
		},

		addClass: function(className){
			//	summary:
			//		adds the specified class to every node in the list
			//	className: String
			//		the CSS class to add
			return; // dojo.NodeList
		},

		removeClass: function(className){
			//	summary:
			//		removes the specified class from every node in the list
			//	className: String
			//		the CSS class to add
			//	returns:
			//		dojo.NodeList, this list
			return; // dojo.NodeList
		},

		toggleClass: function(className, condition){
			//	summary:
			//		Adds a class to node if not present, or removes if present.
			//		Pass a boolean condition if you want to explicitly add or remove.
			//	condition: Boolean?
			//		If passed, true means to add the class, false means to remove.
			//	className: String
			//		the CSS class to add
			return; // dojo.NodeList
		},

		connect: function(methodName, objOrFunc, funcName){
			//	summary:
			//		attach event handlers to every item of the NodeList. Uses dojo.connect()
			//		so event properties are normalized
			//	methodName: String
			//		the name of the method to attach to. For DOM events, this should be
			//		the lower-case name of the event
			//	objOrFunc: Object|Function|String
			//		if 2 arguments are passed (methodName, objOrFunc), objOrFunc should
			//		reference a function or be the name of the function in the global
			//		namespace to attach. If 3 arguments are provided
			//		(methodName, objOrFunc, funcName), objOrFunc must be the scope to 
			//		locate the bound function in
			//	funcName: String?
			//		optional. A string naming the function in objOrFunc to bind to the
			//		event. May also be a function reference.
			//	example:
			//		add an onclick handler to every button on the page
			//		|	dojo.query("div:nth-child(odd)").connect("onclick", function(e){
			//		|		console.log("clicked!");
			//		|	});
			// example:
			//		attach foo.bar() to every odd div's onmouseover
			//		|	dojo.query("div:nth-child(odd)").connect("onmouseover", foo, "bar");
		},

		empty: function(){
			//	summary:
			//		clears all content from each node in the list. Effectively
			//		equivalent to removing all child nodes from every item in
			//		the list.
			return this.forEach("item.innerHTML='';"); // dojo.NodeList
			// FIXME: should we be checking for and/or disposing of widgets below these nodes?
		},
		=====*/
		
		// useful html methods
		coords:	adaptAsMap(d.coords),

		// FIXME: connectPublisher()? connectRunOnce()?

		/*
		destroy: function(){
			//	summary:
			//		destroys every item in 	the list.
			this.forEach(d.destroy);
			// FIXME: should we be checking for and/or disposing of widgets below these nodes?
		},
		*/

		place: function(/*String||Node*/ queryOrNode, /*String*/ position){
			//	summary:
			//		places elements of this node list relative to the first element matched
			//		by queryOrNode. Returns the original NodeList. See: `dojo.place`
			//	queryOrNode:
			//		may be a string representing any valid CSS3 selector or a DOM node.
			//		In the selector case, only the first matching element will be used 
			//		for relative positioning.
			//	position:
			//		can be one of:
			//		|	"last" (default)
			//		|	"first"
			//		|	"before"
			//		|	"after"
			//		|	"only"
			//		|	"replace"
			// 		or an offset in the childNodes property
			var item = d.query(queryOrNode)[0];
			return this.forEach(function(node){ d.place(node, item, position); }); // dojo.NodeList
		},

		orphan: function(/*String?*/ simpleFilter){
			//	summary:
			//		removes elements in this list that match the simple filter
			//		from their parents and returns them as a new NodeList.
			//	simpleFilter:
			//		single-expression CSS rule. For example, ".thinger" or
			//		"#someId[attrName='value']" but not "div > span". In short,
			//		anything which does not invoke a descent to evaluate but
			//		can instead be used to test a single node is acceptable.
			//	returns:
			//		`dojo.NodeList` containing the orpahned elements 
			return (simpleFilter ? d._filterQueryResult(this, simpleFilter) : this).forEach(orphan); // dojo.NodeList
		},

		adopt: function(/*String||Array||DomNode*/ queryOrListOrNode, /*String?*/ position){
			//	summary:
			//		places any/all elements in queryOrListOrNode at a
			//		position relative to the first element in this list.
			//		Returns a dojo.NodeList of the adopted elements.
			//	queryOrListOrNode:
			//		a DOM node or a query string or a query result.
			//		Represents the nodes to be adopted relative to the
			//		first element of this NodeList.
			//	position:
			//		can be one of:
			//		|	"last" (default)
			//		|	"first"
			//		|	"before"
			//		|	"after"
			//		|	"only"
			//		|	"replace"
			// 		or an offset in the childNodes property
			return d.query(queryOrListOrNode).place(this[0], position);	// dojo.NodeList
		},

		// FIXME: do we need this?
		query: function(/*String*/ queryStr){
			//	summary:
			//		Returns a new list whose memebers match the passed query,
			//		assuming elements of the current NodeList as the root for
			//		each search.
			//	example:
			//		assume a DOM created by this markup:
			//	|	<div id="foo">
			//	|		<p>
			//	|			bacon is tasty, <span>dontcha think?</span>
			//	|		</p>
			//	|	</div>
			//	|	<div id="bar">
			//	|		<p>great commedians may not be funny <span>in person</span></p>
			//	|	</div>
			//		If we are presented with the following defintion for a NodeList:
			//	|	var l = new dojo.NodeList(dojo.byId("foo"), dojo.byId("bar"));
			//		it's possible to find all span elements under paragraphs
			//		contained by these elements with this sub-query:
			//	| 	var spans = l.query("p span");

			// FIXME: probably slow
			if(!queryStr){ return this; }
			var ret = this.map(function(node){
				// FIXME: why would we ever get undefined here?
				return d.query(queryStr, node).filter(function(subNode){ return subNode !== undefined; });
			});
			return tnl(apc.apply([], ret));	// dojo.NodeList
		},

		filter: function(/*String|Function*/ simpleFilter){
			//	summary:
			// 		"masks" the built-in javascript filter() method (supported
			// 		in Dojo via `dojo.filter`) to support passing a simple
			// 		string filter in addition to supporting filtering function
			// 		objects.
			//	simpleFilter:
			//		If a string, a single-expression CSS rule. For example,
			//		".thinger" or "#someId[attrName='value']" but not "div >
			//		span". In short, anything which does not invoke a descent
			//		to evaluate but can instead be used to test a single node
			//		is acceptable.
			//	example:
			//		"regular" JS filter syntax as exposed in dojo.filter:
			//		|	dojo.query("*").filter(function(item){
			//		|		// highlight every paragraph
			//		|		return (item.nodeName == "p");
			//		|	}).style("backgroundColor", "yellow");
			// example:
			//		the same filtering using a CSS selector
			//		|	dojo.query("*").filter("p").styles("backgroundColor", "yellow");

			var a = arguments, items = this, start = 0;
			if(d.isString(simpleFilter)){
				items = d._filterQueryResult(this, a[0]);
				if(a.length == 1){
					// if we only got a string query, pass back the filtered results
					return items; // dojo.NodeList
				}
				// if we got a callback, run it over the filtered items
				start = 1;
			}
			return tnl(d.filter(items, a[start], a[start + 1]));	// dojo.NodeList
		},
		
		/*
		// FIXME: should this be "copyTo" and include parenting info?
		clone: function(){
			// summary:
			//		creates node clones of each element of this list
			//		and returns a new list containing the clones
		},
		*/

		addContent: function(/*String|DomNode*/ content, /*String||Integer?*/ position){
			//	summary:
			//		add a node or some HTML as a string to every item in the
			//		list.  Returns the original list.
			//	description:
			//		a copy of the HTML content is added to each item in the
			//		list, with an optional position argument. If no position
			//		argument is provided, the content is appended to the end of
			//		each item.
			//	content:
			//		DOM node or HTML in string format to add at position to
			//		every item
			//	position:
			//		can be one of:
			//		|	"last"||"end" (default)
			//		|	"first||"start"
			//		|	"before"
			//		|	"after"
			// 		or an offset in the childNodes property
			//	example:
			//		appends content to the end if the position is ommitted
			//	|	dojo.query("h3 > p").addContent("hey there!");
			//	example:
			//		add something to the front of each element that has a
			//		"thinger" property:
			//	|	dojo.query("[thinger]").addContent("...", "first");
			//	example:
			//		adds a header before each element of the list
			//	|	dojo.query(".note").addContent("<h4>NOTE:</h4>", "before");
			//	example:
			//		add a clone of a DOM node to the end of every element in
			//		the list, removing it from its existing parent.
			//	|	dojo.query(".note").addContent(dojo.byId("foo"));
			var c = d.isString(content) ? 
						d._toDom(content, this[0] && this[0].ownerDocument) : 
						content, 
					i, 
					l = this.length - 1;
			for(i = 0; i < l; ++i){
				d.place(c.cloneNode(true), this[i], position);
			}
			if(l >= 0){
				d.place(c, this[l], position);
			}
			return this;	// dojo.NodeList
		},

		instantiate: function(/*String|Object*/ declaredClass, /*Object?*/ properties){
			//	summary:
			//		Create a new instance of a specified class, using the
			//		specified properties and each node in the nodeList as a
			//		srcNodeRef
			var c = d.isFunction(declaredClass) ? declaredClass : d.getObject(declaredClass);
			properties = properties || {};
			return this.forEach(function(node){ new c(properties, node); });	// dojo.NodeList
		},

		at: function(/*===== index =====*/){
			//	summary:
			//		Returns a new NodeList comprised of items in this NodeList
			//		at the given index or indices.
			//	index: Integer...
			//		One or more 0-based indices of items in the current
			//		NodeList.
			//	returns:
			//		dojo.NodeList
			var t = new dojo.NodeList();
			d.forEach(arguments, function(i){ if(this[i]){ t.push(this[i]); }}, this);
			return t; // dojo.NodeList
		}

	});

	// syntactic sugar for DOM events
	d.forEach([
		"blur", "focus", "change", "click", "error", "keydown", "keypress",
		"keyup", "load", "mousedown", "mouseenter", "mouseleave", "mousemove",
		"mouseout", "mouseover", "mouseup", "submit" 
		], function(evt){
			var _oe = "on"+evt;
			nlp[_oe] = function(a, b){
				return this.connect(_oe, a, b);
			}
				// FIXME: should these events trigger publishes?
				/*
				return (a ? this.connect(_oe, a, b) : 
							this.forEach(function(n){  
								// FIXME:
								//		listeners get buried by
								//		addEventListener and can't be dug back
								//		out to be triggered externally.
								// see:
								//		http://developer.mozilla.org/en/docs/DOM:element

								console.log(n, evt, _oe);

								// FIXME: need synthetic event support!
								var _e = { target: n, faux: true, type: evt };
								// dojo._event_listener._synthesizeEvent({}, { target: n, faux: true, type: evt });
								try{ n[evt](_e); }catch(e){ console.log(e); }
								try{ n[_oe](_e); }catch(e){ console.log(e); }
							})
				);
			}
			*/
		}
	);

//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
})();
//>>excludeEnd("webkitMobile");
