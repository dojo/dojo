dojo.provide("dojo.NodeList");
dojo.require("dojo.lang.*");
dojo.require("dojo.dom");
dojo.require("dojo.experimental");
dojo.experimental("dojo.NodeList");

(function(){

	var d = dojo;
	var h = d.render.html;

	/*
	dojo.NodeBox = function(elem){
	}
	*/

	dojo.NodeList = function(){
		// NodeList constructor...should probably call down to the superclass ctor?
		// Array.apply(this, arguments);

		// make it behave like the Array constructor
		if((arguments.length == 1)&&(typeof arguments[0] == "number")){
			this.length = parseInt(arguments[0]);
		}else{
			for(var x=0; x<arguments.length; x++){
				this.push(arguments[x]);
			}
		}
	}
	dojo.NodeList.prototype = new Array;

	dojo.lang.extend(dojo.NodeList,
		{
			// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods
			// must implement the following JS 1.6 methods:
			//		forEach()
			//		every()
			//		some()
			//		map()
			//		filter()
			//		indexOf()
			//		lastIndexOf()

			box: (h.ie) ? function(){
				// returns a box object for the first element in a node list
				dojo.debug("dojo.NodeList.box is unimplemented");
			} : function(){
				dojo.debug("dojo.NodeList.box is unimplemented");
			},

			boxes: function(){
				// returns the box objects all elements in a node list as an
				// Array
				dojo.debug("dojo.NodeList.boxes is unimplemented");
			},

			style: function(prop){
				// (key, value)
				// (props, ...)
			},

			styles: function(prop){
				// (key, value)
				// (props, ...)
			},

			place: function(queryOrNode, position){
				// placement always relative to the first element matched by
				// queryOrNode

				// position can be one of:
				//		"last"||"end" (default)
				//		"first||"start"
				//		"before"
				//		"after"
				// or an offset in the childNodes property
				var item = dojo.query(queryOrNode)[0];
				position = position||"last";

				for(var x=0; x<this.length; x++){
					dojo.dom.insertAtPosition(this[x], item, position);
				}
			},

			orphan: function(simpleFilter){
				// removes elements in this list that match the simple filter
				// from their parents and returns them as a new NodeList.
				var orphans = dojo._filterQueryResult(this, simpleFilter);
				orphans.forEach(function(item){
					if(item["parentNode"]){
						item.parentNode.removeChild(item);
					}
				});
				return orphans;
			},

			adopt: function(queryOrListOrNode, position){
				// places any/all elements in queryOrListOrNode at a position
				// relative to the first element in this list.

				// position can be one of:
				//		"last"||"end" (default)
				//		"first||"start"
				//		"before"
				//		"after"
				// or an offset in the childNodes property
				var item = this[0];
				position = position||"last";
				var adoptees = dojo.query(queryOrListOrNode);

				for(var x=0; x<adoptees.length; x++){
					dojo.dom.insertAtPosition(adoptees[x], item, position);
				}
			},

			// may have name changed to "get" if dojo.query becomes dojo.get
			// FIXME: do we need this?
			query: function(queryStr){
				// returns a new NodeList. Elements of the new NodeList satisfy
				// the passed query but use elements of the current NodeList as
				// query roots.

				// FIXME: probably slow
				var ret = new dojo.NodeList();
				this.forEach(function(item){
					dojo.query(queryStr, item).forEach(function(subItem){
						if(typeof subItem != "undefined"){
							ret.push(subItem);
						}
					});
				});
				return ret;
			},

			filter: function(simpleQuery){
				//			(callback, [thisObject])
				//			(simpleQuery, callback, [thisObject])
				// "masks" the built-in javascript filter() method to support
				// passing a simple string filter in addition to supporting
				// filtering function objects.

				var items = this;
				if(typeof arguments[0] == "string"){
					items = dojo._filterQueryResult(this, arguments[0]);
					if(arguments.length == 1){
						return items;
					}
				}
				return dojo.lang.filter(items, arguments[1], arguments[2]);
			},

			addContent: function(content, position){
				// position can be one of:
				//		"last"||"end" (default)
				//		"first||"start"
				//		"before"
				//		"after"
				// or an offset in the childNodes property
			}
		}
	);

	// now, make sure it's an array subclass on IE:
	// 
	// huge thanks to Dean Edwards and Hedger Wang for a solution to
	// subclassing arrays on IE
	//		http://dean.edwards.name/weblog/2006/11/hooray/?full
	//		http://www.hedgerwow.com/360/dhtml/js-array2.html
	if(h.ie){
		var dl = d.lang;
		// make sure that it has all the JS 1.6 things we need before we subclass
		dl.extend(dojo.NodeList,
			{
				// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods
				// must implement the following JS 1.6 methods:

				// fixme: we can't use hitch here as it binds to an object,
				// which we don't want. Time for a real partial() ?
				forEach: function(callback, thisObj){
					return dl.forEach(this, callback, thisObj);
				},

				every: function(callback, thisObj){
					return dl.every(this, callback, thisObj);
				},

				some: function(callback, thisObj){
					return dl.some(this, callback, thisObj);
				},

				map: function(obj, unary_func){
					return dl.map(this, obj, unary_func);
				}

				// NOTE: filter() is handled in NodeList by default
			}
		);



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
	// look, ma, it's synchronous!
	/*
	var tw = window;
	dojo.addOnLoad(function(){
		dojo.lang.delayThese([
			function(){
				var tna = new dojo.NodeList("blah", "blah", "blah");
				dojo.debug((new dojo.NodeList()).length);
			},
			function(){
				var tna = new dojo.NodeList("blah", "blah", "blah");
				dojo.debug((new dojo.NodeList()).length);
			},
			function(){
				var tna = new dojo.NodeList("blah", "blah", "blah");
				dojo.debug((new dojo.NodeList()).length);
			},
			function(){
				var tna = new dojo.NodeList("blah", "blah", "blah");
				dojo.debug((new dojo.NodeList()).length);
				dojo.debug((new dojo.NodeList()).length);
				new dojo.NodeList();
				tna.push("blah");
				tna.push("blah");
				tna.push("blah");
				// alert(tna.length);
				// alert(tna.length == 6);
			}
		], null, 100);
	});
	*/
})();
var dnl = dojo.NodeList;
