define(["./_base/kernel", "./_base/NodeList", "./has","./selector/_loader", "./selector/_loader!default"], 
		function(dojo, NodeList, has, loader, defaultEngine){
/*===== 
dojo.query = function(selector, context){
	// summary:
	//		This modules provides DOM querying functionality. The module export is a function
	//		that can be used to query for DOM nodes by CSS selector and returns a dojo.NodeList
	//		representing the matching nodes.
	//
	// selector: String
	//		A CSS selector to search for.
	// context: String|DomNode?
	//		An optional context to limit the searching scope. Only nodes under `context` will be 
	//		scanned. 
	// 
	//	example:
	//		add an onclick handler to every submit button in the document
	//		which causes the form to be sent via Ajax instead:
	//	|	define(["dojo/query"], function(query){
	// 	|	query("input[type='submit']").on("click", function(e){
	//	|		dojo.stopEvent(e); // prevent sending the form
	//	|		var btn = e.target;
	//	|		dojo.xhrPost({
	//	|			form: btn.form,
	//	|			load: function(data){
	//	|				// replace the form with the response
	//	|				var div = dojo.doc.createElement("div");
	//	|				dojo.place(div, btn.form, "after");
	//	|				div.innerHTML = data;
	//	|				dojo.style(btn.form, "display", "none");
	//	|			}
	//	|		});
	//	|	}); 
	//
	// description:
	//		dojo/query is responsible for loading the appropriate query engine and wrapping 
	//		its results with a `dojo.NodeList`. You can use dojo/query with a specific selector engine
	//		by using it as a plugin. For example, if you installed the sizzle package, you could
	//		use it as the selector engine with:
	//		|	define("dojo/query!sizzle", function(query){
	//		|		query("div")...
	//
	//		The id after the ! can be a module id of the selector engine or one of the following values:
	//		|	+ acme: This is the default engine used by Dojo base, and will ensure that the full
	//		|	Acme engine is always loaded. 
	//		|	
	//		|	+ css2: If the browser has a native selector engine, this will be used, otherwise a
	//		|	very minimal lightweight selector engine will be loaded that can do simple CSS2 selectors
	//		|	(by #id, .class, tag, and [name=value] attributes, with standard child or descendant (>)
	//		|	operators) and nothing more.
	//		|
	//		|	+ css2.1: If the browser has a native selector engine, this will be used, otherwise the
	//		|	full Acme engine will be loaded. 
	//		|	
	//		|	+ css3: If the browser has a native selector engine with support for CSS3 pseudo
	//		|	selectors (most modern browsers except IE8), this will be used, otherwise the
	//		|	full Acme engine will be loaded.
	//		|	
	//		|	+ Or the module id of a selector engine can be used to explicitly choose the selector engine
	//		
	//		For example, if you are using CSS3 pseudo selectors in module, you can specify that
	//		you will need support them with:
	//		|	define("dojo/query!css3", function(query){
	//		|		query('#t > h3:nth-child(odd)')...
	//
	//		You can also choose the selector engine/load configuration by setting the <FIXME:what is the configuration setting?>.
	//		For example:
	//		|	<script data-dojo-config="query-selector:'css3'" src="dojo.js"></script>
	//		
	return new dojo.NodeList(); // dojo.NodeList
};
=====*/

"use strict";
function queryForEngine(engine){
	var query = function(/*String*/ query, /*String|DOMNode?*/ root){
		//	summary:
		//		Returns nodes which match the given CSS selector, searching the
		//		entire document by default but optionally taking a node to scope
		//		the search by. Returns an instance of dojo.NodeList.
		if(typeof root == "string"){
			root = dojo.byId(root);
			if(!root){
				return NodeList._wrap([]);
			}
		}
		var results = typeof query == "string" ? engine(query, root) : query.orphan ? query : [query];
		if(!(results instanceof Array)){
			// let selector engines directly return DOM NodeLists, we will convert them to arrays here if necessary 
			var array = [];
			for(var i = 0, l = results.length; i < l; i++){
				array.push(results[i]);
			}
			results = array;
		}else if(results.orphan){
			// already wrapped
			return results; 
		}
		return NodeList._wrap(results);
	};
	query.matches = engine.match || function(node, selector, root){
		// summary:
		//		Test to see if a node matches a selector
		return query.filter([node], selector, root).length > 0;
	};
	// the engine provides a filtering function, use it to for matching
	query.filter = engine.filter || function(nodes, selector, root){
		// summary:
		//		Filters an array of nodes. Note that this does not guarantee to return a dojo.NodeList, just an array.
		return query(selector, root).filter(function(node){
			return dojo.indexOf(nodes, node) > -1;
		});
	};
	if(typeof engine != "function"){
		var search = engine.search;
		engine = function(selector, root){
			// Slick does it backwards
			return search(root || document, selector);
		};
	}
	return query;
}
var query = dojo.query = queryForEngine(defaultEngine);

query.load = /*===== dojo.query.load= ======*/ function(id, parentRequire, loaded, config){
	// summary: can be used as AMD plugin to conditionally load new query engine
	// example:
	//	|	define(["dojo/query!custom"], function(qsa){ 
	//	|		// loaded selector/custom.js as engine
	//	|		qsa("#foobar").forEach(...);
	//	|	});
	loader.load(id, parentRequire, function(engine){
		loaded(queryForEngine(engine));
	});
};

dojo._filterQueryResult = function(nodes, selector, root){
	return NodeList._wrap(query.filter(nodes, selector, root));
};
return query;
});
