dojo.provide("dojo._base.NodeList");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.array");

// FIXME: need to provide a location to extend this object!!
// FIXME: need to write explicit tests for NodeList
// FIXME: what do the builtin's that we deferr to do when you concat? What gets
// 			returned? Seems (on FF) to be an Array, not a NodeList!

(function(){

	var d = dojo;
	dojo.NodeList = function(){
		//	summary:
		//		dojo.NodeList is as subclass of Array which adds syntactic 
		//		sugar for chaining, common iteration operations, animation, 
		//		and node manipulation. NodeLists are most often returned as
		//		the result of dojo.query() calls.
		//	example:
		//		// create a node list from a node
		//		new dojo.NodeList(dojo.byId("foo"));

		var args = arguments;

		// make it behave like the Array constructor
		if((args.length == 1)&&(typeof args[0] == "number")){
			this.length = parseInt(args[0]);
		}else if(args.length){
			d.forEach(args, function(i){ this.push(i); }, this);
		}
	}

	// prototyping subclass for sane browsers
	dojo.NodeList.prototype = new Array;

	// now, make sure it's an array subclass on IE:
	// 
	// huge thanks to Dean Edwards and Hedger Wang for a solution to
	// subclassing arrays on IE
	//		http://dean.edwards.name/weblog/2006/11/hooray/?full
	//		http://www.hedgerwow.com/360/dhtml/js-array2.html
	// if(!Array.forEach){
	// make sure that it has all the JS 1.6 things we need before we subclass
	if(d.isIE){

		var subClassStr = function(className){
			return (
				// "parent.dojo.debug('setting it up...'); " +
				"var a2 = parent."+className+"; " +
				"var ap = Array.prototype; " +
				"var a2p = a2.prototype; " +
				"for(var x in a2p){ ap[x] = a2p[x]; } " +
				"parent."+className+" = Array; "
			);
		}
		var scs = subClassStr("dojo.NodeList");
		// Hedger's excellent invention
		var popup = window.createPopup()
		popup.document.write("<script>"+scs+"</script>");
		// our fix to ensure that we don't hit strange scoping/timing issues
		// insisde of setTimeout() blocks
		popup.show(1, 1, 1, 1);
	}


	dojo.extend(dojo.NodeList,	{
		// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods

		// FIXME: would it be smaller if we set these w/ iteration?

		// FIXME: handle return values for #3244
		//		http://trac.dojotoolkit.org/ticket/3244
		
		// FIXME:
		//		need to wrap or implement:
		//			slice
		//			splice
		//			concat
		//			join (perhaps w/ innerHTML/outerHTML overload for toString() of items?)
		//			reduce
		//			reduceRight
		
		indexOf: function(/*Object*/ value, /*Integer?*/ fromIndex){
			//	summary:
			//		see dojo.indexOf(). The primary difference is that the acted-on 
			//		array is implicitly this NodeList
			return d.indexOf(this, value, fromIndex);
		},

		lastIndexOf: function(/*Object*/ value, /*Integer?*/ fromIndex){
			//	summary:
			//		see dojo.lastIndexOf(). The primary difference is that the 
			//		acted-on array is implicitly this NodeList
			var aa = d._toArray(arguments);
			aa.unshift(this);
			return d.lastIndexOf.apply(d, aa);
		},

		every: function(/*Function*/callback, /*Object?*/thisObject){
			//	summary:
			//		see dojo.every() and:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every
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

		forEach: function(callback, thisObj){
			//	summary:
			//		see dojo.forEach(). The primary difference is that the acted-on 
			//		array is implicitly this NodeList
			d.forEach(this, callback, thisObj);
			return this; // dojo.NodeList non-standard return to allow easier chaining
		},

		map: function(/*Function*/ func, /*Function?*/ obj){
			//	summary:
			//		see dojo.map(). The primary difference is that the acted-on
			//		array is implicitly this NodeList and the return is a
			//		dojo.NodeList (a subclass of Array)

			return d.map(this, func, obj, d.NodeList); // dojo.NodeList
		},

		// custom methods
		
		coords: function(){
			//	summary:
			// 		returns the box objects all elements in a node list as
			// 		an Array (*not* a NodeList)
			
			return d.map(this, d.coords);
		},

		style: function(/*String*/ property, /*String?*/ value){
			//	summary:
			//		gets or sets the value of the CSS property
			//	property:
			//		the CSS property to get/set, in JavaScript notation ("lineHieght" instead of "line-height") 
			//	value:
			//		optional. The value to set the property to
			//	return:
			//		if no value is passed, the result is a string. If a value is passed, the return is this NodeList

			// FIXME: need to add examples!
			var aa = d._toArray(arguments);
			aa.unshift(this[0]);
			var s = d.style.apply(d, aa);
			return (arguments.length > 1) ? this : s; // String||dojo.NodeList
		},

		styles: function(/*String*/ property, /*String?*/ value){
			//	summary:
			//		gets or sets the CSS property for every element in the NodeList
			//	property:
			//		the CSS property to get/set, in JavaScript notation ("lineHieght" instead of "line-height") 
			//	value:
			//		optional. The value to set the property to
			//	return:
			//		if no value is passed, the result is an array of strings. If a value is passed, the return is this NodeList
			var aa = d._toArray(arguments);
			aa.unshift(null);
			var s = this.map(function(i){
				aa[0] = i;
				return d.style.apply(d, aa);
			});
			return (arguments.length > 1) ? this : s; // String||dojo.NodeList
		},

		addClass: function(/*String*/ className){
			this.forEach(function(i){ dojo.addClass(i, className); });
			return this;
		},

		removeClass: function(/*String*/ className){
			this.forEach(function(i){ dojo.removeClass(i, className); });
			return this;
		},

		// FIXME: toggleClass()? connectPublisher()? connectRunOnce()?

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
			//			"last"||"end" (default)
			//			"first||"start"
			//			"before"
			//			"after"
			// 		or an offset in the childNodes property
			var item = d.query(queryOrNode)[0];
			position = position||"last";

			for(var x=0; x<this.length; x++){
				d.place(this[x], item, position);
			}
			return this; // dojo.NodeList
		},

		connect: function(/*String*/ methodName, /*Object||Function||String*/ objOrFunc, /*String?*/ funcName){
			//	summary:
			//		attach event handlers to every item of the NodeList. Uses dojo.connect()
			//		so event properties are normalized
			//	methodName:
			//		the name of the method to attach to. For DOM events, this should be
			//		the lower-case name of the event
			//	objOrFunc:
			//		if 2 arguments are passed (methodName, objOrFunc), objOrFunc should
			//		reference a function or be the name of the function in the global
			//		namespace to attach. If 3 arguments are provided
			//		(methodName, objOrFunc, funcName), objOrFunc must be the scope to 
			//		locate the bound function in
			//	funcName:
			//		optional. A string naming the function in objOrFunc to bind to the
			//		event. May also be a function reference.
			//	example:
			//		// add an onclick handler to every button on the page
			//		dojo.query("onclick", function(e){
			//			console.debug("clicked!");
			//		});
			//
			//		// attach foo.bar() to every odd div's onmouseover
			//		dojo.query("div:nth-child(odd)").onclick("onmouseover", foo, "bar");
			this.forEach(function(item){
				d.connect(item, methodName, objOrFunc, funcName);
			});
			return this; // dojo.NodeList
		},

		orphan: function(/*String?*/ simpleFilter){
			//	summary:
			//		removes elements in this list that match the simple
			//		filter from their parents and returns them as a new
			//		NodeList.
			//	simpleFilter: single-expression CSS filter
			//	return: a dojo.NodeList of all of the elements orpahned
			var orphans = (simpleFilter) ? d._filterQueryResult(this, simpleFilter) : this;
			orphans.forEach(function(item){
				if(item["parentNode"]){
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
			//		optional. One of:
			//			"last"||"end" (default)
			//			"first||"start"
			//			"before"
			//			"after"
			// 		or an offset in the childNodes property
			var item = this[0];
			return d.query(queryOrListOrNode).forEach(function(ai){ d.place(ai, item, (position||"last")); }); // dojo.NodeList
		},

		// FIXME: do we need this?
		query: function(/*String*/ queryStr){
			//	summary:
			//		returns a new, flattened NodeList. Elements of the new list
			//		satisfy the passed query but use elements of the
			//		current NodeList as query roots.

			queryStr = queryStr||"";

			// FIXME: probably slow
			var ret = new d.NodeList();
			this.forEach(function(item){
				d.query(queryStr, item).forEach(function(subItem){
					if(typeof subItem != "undefined"){
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
			//		// "regular" JS filter syntax as exposed in dojo.filter:
			//		dojo.query("*").filter(function(item){
			//			// highlight every paragraph
			//			return (item.nodeName == "p");
			//		}).styles("backgroundColor", "yellow");
			//
			//		// the same filtering using a CSS selector
			//		dojo.query("*").filter("p").styles("backgroundColor", "yellow");

			var items = this;
			var _a = arguments;
			var r = new d.NodeList();
			var rp = function(t){ 
				if(typeof t != "undefined"){
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
				d.forEach(d.filter(items, _a[1], _a[2]), rp);
				return r; // dojo.NodeList
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
			//	content:
			//		the HTML in string format to add at position to every item
			//	position:
			//		One of:
			//			"last"||"end" (default)
			//			"first||"start"
			//			"before"
			//			"after"
			//		or an integer offset in the childNodes property
			var ta = d.doc.createElement("span");
			if(d.isString(content)){
				ta.innerHTML = content;
			}else{
				ta.appendChild(content);
			}
			var ct = ((position == "first")||(position == "after")) ? "lastChild" : "firstChild";
			this.forEach(function(item){
				var tn = ta.cloneNode(true);
				while(tn[ct]){
					d.place(tn[ct], item, position);
				}
			});
			return this; // dojo.NodeList
		},

		_anim: function(method, args){
			var anims = [];
			args = args||{};
			this.forEach(function(item){
				var tmpArgs = { node: item };
				d.mixin(tmpArgs, args);
				anims.push(d[method](tmpArgs));
			});
			// FIXME: combine isn't in Base!!
			return d.fx.combine(anims); // dojo._Animation
		},

		fadeIn: function(args){
			//	summary:
			//		fade in all elements of this NodeList. Returns an instance of dojo._Animation
			//	example:
			//		// fade in all tables with class "blah"
			//		dojo.query("table.blah").fadeIn().play();
			return this._anim("fadeIn", args); // dojo._Animation
		},

		fadeOut: function(args){
			//	summary:
			//		fade out all elements of this NodeList. Returns an instance of dojo._Animation
			//	example:
			//		// fade out all elements with class "zork"
			//		dojo.query(".zork").fadeOut().play();
			//
			//		// fade them on a delay and do something at the end
			//		var fo = dojo.query(".zork").fadeOut();
			//		dojo.connect(fo, "onEnd", function(){ /*...*/ });
			//		fo.play();
			return this._anim("fadeOut", args); // dojo._Animation
		},

		animateProperty: function(args){
			//	summary:
			//		see dojo.animateProperty(). Animate all elements of this
			//		NodeList across the properties specified.
			//	example:
			//		dojo.query(".zork").animateProperty({
			//			duration: 500,
			//			properties: { 
			//				color:		{ start: "black", end: "white" },
			//				left:		{ end: 300 } 
			//			} 
			//		}).play();
			return this._anim("animateProperty", args); // dojo._Animation
		}

	});

	// syntactic sugar for DOM events
	dojo.forEach([
		"mouseover", "click", "mouseout", "mousemove", "blur", "mousedown",
		"mouseup", "mousemove", "keydown", "keyup", "keypress"
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
