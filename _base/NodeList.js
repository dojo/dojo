dojo.provide("dojo._base.NodeList");
dojo.require("dojo._base.lang");
dojo.require("dojo._base.array");

// FIXME: need to provide a location to extend this object!!
// FIXME: need to write explicit tests for NodeList
// FIXME: animation?
// FIXME: what do the builtin's that we deferr to do when you concat? What gets
// 			returned? Seems (on FF) to be an Array, not a NodeList!

(function(){

	var d = dojo;

	dojo.NodeList = function(){
		// NodeList constructor...should probably call down to the superclass ctor?
		// Array.apply(this, arguments);

		// make it behave like the Array constructor
		if((arguments.length == 1)&&(typeof arguments[0] == "number")){
			this.length = parseInt(arguments[0]);
		}else if((arguments.length == 1)&&(arguments[0].constructor == dojo.NodeList)){
			// FIXME: implement!
		}else{
			for(var x=0; x<arguments.length; x++){
				this.push(arguments[x]);
			}
		}
	}
	dojo.NodeList.prototype = new Array;

	dojo.extend(dojo.NodeList,
		{
			box: function(){
				// summary:
				// 		returns a box object for the first element in a node list
				return dojo.coords(this[0]);
			},

			boxes: function(){
				// summary:
				// 		returns the box objects all elements in a node list as
				// 		an Array
				
				// FIXME: should we just tack a box property onto each element
				// instead? Also, is this really that useful anyway?
				var ret = [];
				this.forEach(function(item){
					ret.push(dojo.coords(item));
				});
				return ret;
			},

			style: function(prop){
				// (key, value)
				// (props, ...)
				var aa = dojo._toArray(arguments);
				aa.unshift(this[0]);
				return dojo.style.apply(dojo, aa);
			},

			styles: function(prop){
				// (key, value)
				// (props, ...)
				var aa = dojo._toArray(arguments);
				aa.unshift(null);
				return this.map(function(i){
					aa[0] = i;
					return dojo.style.apply(dojo, aa);
				});
			},

			place: function(queryOrNode, /*String*/ position){
				// summary:
				//		placement always relative to the first element matched
				//		by queryOrNode
				// position:
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
				return this;
			},

			orphan: function(/*String*/ simpleFilter){
				// summary:
				//		removes elements in this list that match the simple
				//		filter from their parents and returns them as a new
				//		NodeList.
				// simpleFilter: single-expression CSS filter
				var orphans = d._filterQueryResult(this, simpleFilter);
				orphans.forEach(function(item){
					if(item["parentNode"]){
						item.parentNode.removeChild(item);
					}
				});
				return orphans;
			},

			adopt: function(queryOrListOrNode, /*String*/ position){
				// summary:
				//		places any/all elements in queryOrListOrNode at a
				//		position relative to the first element in this list.
				// position:
				//		can be one of:
				//			"last"||"end" (default)
				//			"first||"start"
				//			"before"
				//			"after"
				// 		or an offset in the childNodes property
				var item = this[0];
				position = position||"last";
				var adoptees = d.query(queryOrListOrNode);

				for(var x=0; x<adoptees.length; x++){
					d.place(adoptees[x], item, position);
				}
				return adoptees;
			},

			// may have name changed to "get" if dojo.query becomes dojo.get
			// FIXME: do we need this?
			query: function(/*String*/ queryStr){
				// summary:
				//		returns a new NodeList. Elements of the new NodeList
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
				return ret;
			},

			filter: function(/*String*/ simpleQuery){
				//			(callback, [thisObject])
				//			(simpleQuery, callback, [thisObject])
				// "masks" the built-in javascript filter() method to support
				// passing a simple string filter in addition to supporting
				// filtering function objects.

				var items = this;
				var _a = arguments;
				var r = new d.NodeList();
				var rp = function(t){ 
					if(typeof t != "undefined"){
						r.push(t); 
					}
				}
				if(dojo.isString(simpleQuery)){
					items = d._filterQueryResult(this, _a[0]);
					if(_a.length == 1){
						// if we only got a string query, pass back the filtered results
						return items;
					}
					// if we got a callback, run it over the filtered items
					d.forEach(d.filter(items, _a[1], _a[2]), rp);
					return r;
				}
				// handle the (callback, [thisObject]) case
				d.forEach(d.filter(items, _a[0], _a[1]), rp);
				return r;

			},

			addContent: function(content, position){
				// position can be one of:
				//		"last"||"end" (default)
				//		"first||"start"
				//		"before"
				//		"after"
				// or an offset in the childNodes property
				var ta = dojo.doc.createElement("span");
				if(dojo.isString(content)){
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
				// FIXME: what to return!?
				return this;
			}
		}
	);

	// now, make sure it's an array subclass on IE:
	// 
	// huge thanks to Dean Edwards and Hedger Wang for a solution to
	// subclassing arrays on IE
	//		http://dean.edwards.name/weblog/2006/11/hooray/?full
	//		http://www.hedgerwow.com/360/dhtml/js-array2.html
	if(!Array.forEach){
		// make sure that it has all the JS 1.6 things we need before we subclass
		dojo.extend(dojo.NodeList,
			{
				// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods
				// must implement the following JS 1.6 methods:

				// FIXME: would it be smaller if we set these w/ iteration?
				indexOf: function(value, identity){
					return d.indexOf(this, value, identity);
				},

				lastIndexOf: function(value, identity){
					return d.lastIndexOf(this, value, identity);
				},

				forEach: function(callback, thisObj){
					return d.forEach(this, callback, thisObj);
				},

				every: function(callback, thisObj){
					return d.every(this, callback, thisObj);
				},

				some: function(callback, thisObj){
					return d.some(this, callback, thisObj);
				},

				map: function(unary_func, obj){
					return d.map(this, unary_func, obj);
				}

				// NOTE: filter() is handled in NodeList by default
			}
		);
	}
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
})();
