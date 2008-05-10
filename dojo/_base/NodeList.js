dojo.provide("dojo._base.NodeList");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.array");

(function(){

	var d = dojo;

	var tnl = function(arr){
		// decorate an array to make it look like a NodeList
		arr.constructor = dojo.NodeList;
		dojo._mixin(arr, dojo.NodeList.prototype);
		return arr;
	}

	var _mapIntoDojo = function(func, alwaysThis){
		// returns a function which, when executed in the scope of its caller,
		// applies the passed arguments to a particular dojo.* function (named
		// in func) and aggregates the returns. if alwaysThis is true, it
		// always returns the scope object and not the collected returns from
		// the Dojo method
		return function(){
			var _a = arguments;
			var aa = d._toArray(_a, 0, [null]);
			var s = this.map(function(i){
				aa[0] = i;
				return d[func].apply(d, aa);
			});
			return (alwaysThis || ( (_a.length > 1) || !d.isString(_a[0]) )) ? this : s; // String||dojo.NodeList
		}
	};

	dojo.NodeList = function(){
		//	summary:
		//		dojo.NodeList is as subclass of Array which adds syntactic 
		//		sugar for chaining, common iteration operations, animation, 
		//		and node manipulation. NodeLists are most often returned as
		//		the result of dojo.query() calls.
		//	example:
		//		create a node list from a node
		//		|	new dojo.NodeList(dojo.byId("foo"));

		return tnl(Array.apply(null, arguments));
	}

	dojo.NodeList._wrap = tnl;

	dojo.extend(dojo.NodeList, {
		// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods

		// FIXME: handle return values for #3244
		//		http://trac.dojotoolkit.org/ticket/3244
		
		// FIXME:
		//		need to wrap or implement:
		//			join (perhaps w/ innerHTML/outerHTML overload for toString() of items?)
		//			reduce
		//			reduceRight

		slice: function(/*===== begin, end =====*/){
			// summary:
			//		Returns a new NodeList, maintaining this one in place
			// description:
			//		This method behaves exactly like the Array.slice method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:slice
			// begin: Integer
			//		Can be a positive or negative integer, with positive
			//		integers noting the offset to begin at, and negative
			//		integers denoting an offset from the end (i.e., to the left
			//		of the end)
			// end: Integer?
			//		Optional parameter to describe what position relative to
			//		the NodeList's zero index to end the slice at. Like begin,
			//		can be positive or negative.
			var a = dojo._toArray(arguments);
			return tnl(a.slice.apply(this, a));
		},

		splice: function(/*===== index, howmany, item =====*/){
			// summary:
			//		Returns a new NodeList, manipulating this NodeList based on
			//		the arguments passed, potentially splicing in new elements
			//		at an offset, optionally deleting elements
			// description:
			//		This method behaves exactly like the Array.splice method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:splice>
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
			var a = dojo._toArray(arguments);
			return tnl(a.splice.apply(this, a));
		},

		concat: function(/*===== item =====*/){
			// summary:
			//		Returns a new NodeList comprised of items in this NodeList
			//		as well as items passed in as parameters
			// description:
			//		This method behaves exactly like the Array.concat method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:concat>
			// item: Object...?
			//		Any number of optional parameters may be passed in to be
			//		spliced into the NodeList
			// returns:
			//		dojo.NodeList
			var a = dojo._toArray(arguments, 0, [this]);
			return tnl(a.concat.apply([], a));
		},
		
		indexOf: function(/*Object*/ value, /*Integer?*/ fromIndex){
			//	summary:
			//		see dojo.indexOf(). The primary difference is that the acted-on 
			//		array is implicitly this NodeList
			// value:
			//		The value to search for.
			// fromIndex:
			//		The loction to start searching from. Optional. Defaults to 0.
			//	description:
			//		For more details on the behavior of indexOf, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf>
			//	returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.indexOf(this, value, fromIndex); // Integer
		},

		lastIndexOf: function(/*===== value, fromIndex =====*/){
			// summary:
			//		see dojo.lastIndexOf(). The primary difference is that the
			//		acted-on array is implicitly this NodeList
			//	description:
			//		For more details on the behavior of lastIndexOf, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf>
			// value: Object
			//		The value to search for.
			// fromIndex: Integer?
			//		The loction to start searching from. Optional. Defaults to 0.
			// returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.lastIndexOf.apply(d, d._toArray(arguments, 0, [this])); // Integer
		},

		every: function(/*Function*/callback, /*Object?*/thisObject){
			//	summary:
			//		see `dojo.every()` and:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every>
			//		Takes the same structure of arguments and returns as
			//		dojo.every() with the caveat that the passed array is
			//		implicitly this NodeList
			return d.every(this, callback, thisObject); // Boolean
		},

		some: function(/*Function*/callback, /*Object?*/thisObject){
			//	summary:
			//		see dojo.some() and:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some
			//		Takes the same structure of arguments and returns as
			//		dojo.some() with the caveat that the passed array is
			//		implicitly this NodeList
			return d.some(this, callback, thisObject); // Boolean
		},

		map: function(/*Function*/ func, /*Function?*/ obj){
			//	summary:
			//		see dojo.map(). The primary difference is that the acted-on
			//		array is implicitly this NodeList and the return is a
			//		dojo.NodeList (a subclass of Array)

			return d.map(this, func, obj, d.NodeList); // dojo.NodeList
		},

		forEach: function(callback, thisObj){
			//	summary:
			//		see dojo.forEach(). The primary difference is that the acted-on 
			//		array is implicitly this NodeList

			d.forEach(this, callback, thisObj);
			// non-standard return to allow easier chaining
			return this; // dojo.NodeList 
		},

		// custom methods
		
		coords: function(){
			//	summary:
			// 		Returns the box objects all elements in a node list as
			// 		an Array (*not* a NodeList)
			
			return d.map(this, d.coords); // Array
		},

		/*=====
		attr: function(property, value){
			//	summary:
			//		gets or sets the DOM attribute for every element in the
			//		NodeList
			//	property: String
			//		the attribute to get/set
			//	value: String?
			//		optional. The value to set the property to
			//	return:
			//		if no value is passed, the result is an array of attribute values
			//		If a value is passed, the return is this NodeList
		},

		style: function(property, value){
			//	summary:
			//		gets or sets the CSS property for every element in the NodeList
			//	property: String
			//		the CSS property to get/set, in JavaScript notation
			//		("lineHieght" instead of "line-height") 
			//	value: String?
			//		optional. The value to set the property to
			//	return:
			//		if no value is passed, the result is an array of strings.
			//		If a value is passed, the return is this NodeList
		},

		addClass: function(className){
			//	summary:
			//		adds the specified class to every node in the list
			//	className: String
			//		the CSS class to add
			//	return:
			//		dojo.NodeList, this list
		},

		removeClass: function(className){
			//	summary:
			//		removes the specified class from every node in the list
			//	className: String
			//		the CSS class to add
			//	return:
			//		dojo.NodeList, this list
		},

		toggleClass: function(className, condition){
			//	summary:
			//		Adds a class to node if not present, or removes if present.
			//		Pass a boolean condition if you want to explicitly add or remove.
			//	condition: Boolean?
			//		If passed, true means to add the class, false means to remove.
			//	className: String
			//		the CSS class to add
			//	return: dojo.NodeList
			//		this list
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
			//		|		console.debug("clicked!");
			//		|	});
			// example:
			//		attach foo.bar() to every odd div's onmouseover
			//		|	dojo.query("div:nth-child(odd)").connect("onmouseover", foo, "bar");
		},
		=====*/
		attr: _mapIntoDojo("attr"),
		style: _mapIntoDojo("style"),
		addClass: _mapIntoDojo("addClass", true),
		removeClass: _mapIntoDojo("removeClass", true),
		toggleClass: _mapIntoDojo("toggleClass", true),
		connect: _mapIntoDojo("connect", true),

		// FIXME: connectPublisher()? connectRunOnce()?

		place: function(/*String||Node*/ queryOrNode, /*String*/ position){
			//	summary:
			//		places elements of this node list relative to the first element matched
			//		by queryOrNode. Returns the original NodeList.
			//	queryOrNode:
			//		may be a string representing any valid CSS3 selector or a DOM node.
			//		In the selector case, only the first matching element will be used 
			//		for relative positioning.
			//	position:
			//		can be one of:
			//			* "last"||"end" (default)
			//			* "first||"start"
			//			* "before"
			//			* "after"
			// 		or an offset in the childNodes property
			var item = d.query(queryOrNode)[0];
			return this.forEach(function(i){ d.place(i, item, (position||"last")); }); // dojo.NodeList
		},

		orphan: function(/*String?*/ simpleFilter){
			//	summary:
			//		removes elements in this list that match the simple
			//		filter from their parents and returns them as a new
			//		NodeList.
			//	simpleFilter:
			//		single-expression CSS filter
			//	return:
			//		`dojo.NodeList` the orpahned elements 
			var orphans = simpleFilter ? d._filterQueryResult(this, simpleFilter) : this;
			orphans.forEach(function(item){
				if(item.parentNode){
					item.parentNode.removeChild(item);
				}
			});
			return orphans; // dojo.NodeList
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
			//			* "last"||"end" (default)
			//			* "first||"start"
			//			* "before"
			//			* "after"
			// 		or an offset in the childNodes property
			var item = this[0];
			return d.query(queryOrListOrNode).forEach(function(ai){ d.place(ai, item, position || "last"); }); // dojo.NodeList
		},

		// FIXME: do we need this?
		query: function(/*String*/ queryStr){
			//	summary:
			//		Returns a new, flattened NodeList. Elements of the new list
			//		satisfy the passed query but use elements of the
			//		current NodeList as query roots.

			if(!queryStr){ return this; }

			// FIXME: probably slow
			// FIXME: use map?
			var ret = d.NodeList();
			this.forEach(function(item){
				d.query(queryStr, item).forEach(function(subItem){
					if(subItem !== undefined){
						ret.push(subItem);
					}
				});
			});
			return ret; // dojo.NodeList
		},

		filter: function(/*String*/ simpleQuery){
			//	summary:
			// 		"masks" the built-in javascript filter() method to support
			//		passing a simple string filter in addition to supporting
			//		filtering function objects.
			//	example:
			//		"regular" JS filter syntax as exposed in dojo.filter:
			//		|	dojo.query("*").filter(function(item){
			//		|		// highlight every paragraph
			//		|		return (item.nodeName == "p");
			//		|	}).styles("backgroundColor", "yellow");
			// example:
			//		the same filtering using a CSS selector
			//		|	dojo.query("*").filter("p").styles("backgroundColor", "yellow");

			var items = this;
			var _a = arguments;
			var r = d.NodeList();
			var rp = function(t){ 
				if(t !== undefined){
					r.push(t); 
				}
			}
			if(d.isString(simpleQuery)){
				items = d._filterQueryResult(this, _a[0]);
				if(_a.length == 1){
					// if we only got a string query, pass back the filtered results
					return items; // dojo.NodeList
				}
				// if we got a callback, run it over the filtered items
				_a.shift();
			}
			// handle the (callback, [thisObject]) case
			d.forEach(d.filter(items, _a[0], _a[1]), rp);
			return r; // dojo.NodeList
		},
		
		/*
		// FIXME: should this be "copyTo" and include parenting info?
		clone: function(){
			// summary:
			//		creates node clones of each element of this list
			//		and returns a new list containing the clones
		},
		*/

		addContent: function(/*String*/ content, /*String||Integer?*/ position){
			//	summary:
			//		add a node or some HTML as a string to every item in the list. 
			//		Returns the original list.
			//	description:
			//		a copy of the HTML content is added to each item in the
			//		list, with an optional position argument. If no position
			//		argument is provided, the content is appended to the end of
			//		each item.
			//	content:
			//		the HTML in string format to add at position to every item
			//	position:
			//		can be one of:
			//			* "last"||"end" (default)
			//			* "first||"start"
			//			* "before"
			//			* "after"
			// 		or an offset in the childNodes property
			//	example:
			//		appends content to the end if the position is ommitted
			//	|	dojo.query("h3 > p").addContent("hey there!");
			//	example:
			//		add something to the front of each element that has a "thinger" property:
			//	|	dojo.query("[thinger]").addContent("...", "first");
			//	example:
			//		adds a header before each element of the list
			//	|	dojo.query(".note").addContent("<h4>NOTE:</h4>", "before");
			var ta = d.doc.createElement("span");
			if(d.isString(content)){
				ta.innerHTML = content;
			}else{
				ta.appendChild(content);
			}
			if(position === undefined){
				position = "last";
			}
			var ct = (position == "first" || position == "after") ? "lastChild" : "firstChild";
			this.forEach(function(item){
				var tn = ta.cloneNode(true);
				while(tn[ct]){
					d.place(tn[ct], item, position);
				}
			});
			return this; // dojo.NodeList
		},

		empty: function(){
			//	summary:
			//		clears all content from each node in the list
			return this.forEach("item.innerHTML='';"); // dojo.NodeList

			// FIXME: should we be checking for and/or disposing of widgets below these nodes?
		},
		
		instantiate: function(/*String|Object*/ declaredClass, /*Object?*/ properties){
			//	summary:
			//		Create a new instance of a specified class, using the
			//		specified properties and each node in the nodeList as a
			//		srcNodeRef
			//
			var c = d.isFunction(declaredClass) ? declaredClass : d.getObject(declaredClass);
			return this.forEach(function(i){
				new c(properties||{},i);
			}) // dojo.NodeList
		}

	});

	// syntactic sugar for DOM events
	d.forEach([
		"blur", "focus", "click", "keydown", "keypress", "keyup", "mousedown",
		"mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover",
		"mouseup"
		], function(evt){
			var _oe = "on"+evt;
			dojo.NodeList.prototype[_oe] = function(a, b){
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

								console.debug(n, evt, _oe);

								// FIXME: need synthetic event support!
								var _e = { target: n, faux: true, type: evt };
								// dojo._event_listener._synthesizeEvent({}, { target: n, faux: true, type: evt });
								try{ n[evt](_e); }catch(e){ console.debug(e); }
								try{ n[_oe](_e); }catch(e){ console.debug(e); }
							})
				);
			}
			*/
		}
	);

})();
