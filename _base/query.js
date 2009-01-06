// if(this["dojo"]||window["dojo"]||dojo){
if(this["dojo"]||window["dojo"]){
	dojo.provide("dojo._base.query");
	dojo.require("dojo._base.NodeList");
	dojo.require("dojo._base.lang");

//>>excludeStart("acmeExclude", fileName.indexOf("dojo") != -1);

}else if(!this["acme"] && !this["queryPortability"]){
	// NOTE: 
	//		the functions and properties are duplicates of things found
	//		elsewhere in Dojo. They've been copied here to make query.js a
	//		stand-alone system.  The "acmeExclude" ensures that it *never*
	//		shows up in builds of Dojo.
	(function(){
		// a self-sufficient query impl
		acme = {
			trim: function(/*String*/ str){
				// summary:
				//		trims whitespaces from both sides of the string
				str = str.replace(/^\s+/, '');
				for(var i = str.length - 1; i >= 0; i--){
					if(/\S/.test(str.charAt(i))){
						str = str.substring(0, i + 1);
						break;
					}
				}
				return str;	// String
			},
			forEach: function(/*String*/ arr, /*Function*/ callback, /*Object?*/ thisObject){
				//	summary:
				// 		an iterator function that passes items, indexes,
				// 		and the array to a callback
				if(!arr || !arr.length){ return; }
				for(var i=0,l=arr.length; i<l; ++i){ 
					callback.call(thisObject||window, arr[i], i, arr);
				}
			},
			byId: function(id, doc){
				// 	summary:
				//		a function that return an element by ID, but also
				//		accepts nodes safely
				if(typeof id == "string"){
					return (doc||document).getElementById(id); // DomNode
				}else{
					return id; // DomNode
				}
			},
			isString: function(item){
				// summary: 
				//		is item a string?
				return (typeof item == "string"); // Boolean
			},
			// the default document to search
			doc: document,
			// the constructor for node list objects returned from query()
			NodeList: Array
			// attr; // FIXME: we probably don't need to use attr() for checked
		};

		// define acme.isIE, acme.isSafari, acme.isOpera, etc.
		var n = navigator;
		var dua = n.userAgent;
		var dav = n.appVersion;
		var tv = parseFloat(dav);
		acme.isOpera = (dua.indexOf("Opera") >= 0) ? tv: undefined;
		acme.isKhtml = (dav.indexOf("Konqueror") >= 0) ? tv : undefined;
		acme.isWebKit = parseFloat(dua.split("WebKit/")[1]) || undefined;
		acme.isChrome = parseFloat(dua.split("Chrome/")[1]) || undefined;
		var index = Math.max(dav.indexOf("WebKit"), dav.indexOf("Safari"), 0);
		if(index && !acme.isChrome){
			acme.isSafari = parseFloat(dav.split("Version/")[1]);
			if(!acme.isSafari || parseFloat(dav.substr(index + 7)) <= 419.3){
				acme.isSafari = 2;
			}
		}
		if(document.all && !acme.isOpera){
			acme.isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;
		}

		Array._wrap = function(arr){ return arr; };
	})();

//>>excludeEnd("acmeExclude");
}

/*
	dojo.query() architectural overview:

		dojo.query is a relatively full-featured CSS3 query library. It is
		designed to take any valid CSS3 selector and return the nodes matching
		the selector. To do this quickly, it processes queries in several
		steps, applying caching where profitable.
		
		The steps (roughly in reverse order of the way they appear in the code):
			1.) check to see if we already have a "query dispatcher"
				- if so, use that with the given parameterization. Skip to step 4.
			2.) attempt to determine which branch to dispatch the query to:
				- JS (optimized DOM iteration)
				- native (FF3.1+, Safari 3.1+, IE 8+)
			3.) tokenize and convert to executable "query dispatcher"
				- this is where the lion's share of the complexity in the
				  system lies. In the DOM version, the query dispatcher is
				  assembled as a chain of "yes/no" test functions pertaining to
				  a section of a simple query statement (".blah:nth-child(odd)"
				  but not "div div", which is 2 simple statements). Individual
				  statement dispatchers are cached (to prevent re-definition)
				  as are entire dispatch chains (to make re-execution of the
				  same query fast)
			4.) the resulting query dispatcher is called in the passed scope
			    (by default the top-level document)
				- for DOM queries, this results in a recursive, top-down
				  evaluation of nodes based on each simple query section
				- for native implementations, this may mean working around spec
				  bugs. So be it.
			5.) matched nodes are pruned to ensure they are unique (if necessaray)
*/

;(function(d){
	// define everything in a closure for compressability reasons. "d" is an
	// alias to "dojo" (or the toolkit alias object, e.g., "acme").

	////////////////////////////////////////////////////////////////////////
	// Toolkit aliases
	////////////////////////////////////////////////////////////////////////

	// if you are extracing dojo.query for use in your own system, you will
	// need to provide these methods and properties. No other porting should be
	// necessaray, save for configuring the system to use a class other than
	// dojo.NodeList as the return instance instantiator
	var trim = 			d.trim;
	var each = 			d.forEach;
	// 					d.isIE; // float
	// 					d.isSafari; // float
	// 					d.isOpera; // float
	// 					d.isWebKit; // float
	// 					d.doc ; // document element
	var listCtor = 		d.NodeList;
	var isString = 		d.isString;

	var getDoc = function(){ return d.doc; };
	var attr = d.attr; // FIXME: we probably don't need to use attr() for checked

	////////////////////////////////////////////////////////////////////////
	// Global utilities
	////////////////////////////////////////////////////////////////////////


	// on browsers that support the "children" collection we can avoid a lot of
	// iteration on chaff (non-element) nodes.
	// why.
	var childNodesName = !!getDoc().firstChild["children"] ? "children" : "childNodes";

	var specials = ">~+";

	// global thunk to determine whether we should treat the current query as
	// case sensitive or not. This switch is flipped by the query evaluator
	// based on the document passed as the context to search.
	var caseSensitive = false;

	// how high?
	var yesman = function(){ return true; };
	yesman.agreeable = true;

	////////////////////////////////////////////////////////////////////////
	// Tokenizer
	////////////////////////////////////////////////////////////////////////

	var getQueryParts = function(query){
		//	summary: 
		//		state machine for query tokenization
		//	description:
		//		instead of using a brittle and slow regex-based CSS parser,
		//		dojo.query implements an AST-style query representation. This
		//		representation is only generated once per query. For example,
		//		the same query run multiple times or under different root nodes
		//		does not re-parse the selector expression but instead uses the
		//		cached data structure. The state machine implemented here
		//		terminates on the last " " (space) charachter and returns an
		//		ordered array of query component structures (or "parts"). Each
		//		part represents an operator or a simple CSS filtering
		//		expression. The structure for parts is documented in the code
		//		below.



		// NOTE: 
		//		this code is designed to compress well, and while thoroughly
		//		documented isn't expected to be simple to read or modify. Your
		//		best bet when hacking the tokenizer is to put The Donnas on
		//		*really* loud (may we recommend their "Spend The Night"
		//		release?) and just assume you're gonna make mistakes. 
		//		Knowing is half the battle ;-)

		if(specials.indexOf(query.charAt(query.length-1)) >= 0){
			// if we end with a ">", "+", or "~", that means we're implicitly
			// searching all children, so make it explicit
			query += " * "
		}else{
			// if you have not provided a terminator, one will be provided for
			// you...
			query += " ";

		}

		var ts = function(/*Integer*/ s, /*Integer*/ e){
			// trim and slice. 

			// take an index to start a string slice from and an end position
			// and return a trimmed copy of that sub-string
			return trim(query.slice(s, e));
		}

		// the overall data graph of the full query, as represented by queryPart objects
		var queryParts = []; 

		// an iterator interface which queryParts exposes
		/*
		queryParts.iter = function(){
			var idx = 0;
			var _t = this;
			return {
				nextItem: function(){ idx++; return _t[idx]; },
				current: function(){ return _t[idx]; },
				peek: function(){ return _t[idx+1]; },
				rewind: function(){ return _t[idx=0]; },
				ff: function(){ return _t[(idx=(_t.length-1))]; },
				first: function(){ return _t[0]; },
				last: function(){ return _t[_t.length-1]; },
				arr: function(){ return _t; }
			};
		};
		*/

		// state keeping vars
		var inBrackets = -1, inParens = -1, inMatchFor = -1, 
			inPseudo = -1, inClass = -1, inId = -1, inTag = -1, 
			lc = "", cc = "", pStart;
		// iteration vars
		var x = 0; // index in the query
		var ql = query.length;
		var currentPart = null; // data structure representing the entire clause
		var _cp = null; // the current pseudo or attr matcher
		// several temporary variables are assigned to this structure durring a
		// potential sub-expression match:
		//		attr:
		//			a string representing the current full attribute match in a
		//			bracket expression
		//		type:
		//			if there's an operator in a bracket expression, this is
		//			used to keep track of it
		//		value:
		//			the internals of parenthetical expression for a pseudo. for
		//			:nth-child(2n+1), value might be "2n+1"

		var endTag = function(){
			// called when the tokenizer hits the end of a particular tag name.
			// Re-sets state variables for tag matching and sets up the matcher
			// to handle the next type of token (tag or operator).
			if(inTag >= 0){
				var tv = (inTag == x) ? null : ts(inTag, x); // .toLowerCase();
				currentPart[ (specials.indexOf(tv) < 0) ? "tag" : "oper" ] = tv;
				inTag = -1;
			}
		}

		var endId = function(){
			// called when the tokenizer might be at the end of an ID portion of a match
			if(inId >= 0){
				currentPart.id = ts(inId, x).replace(/\\/g, "");
				inId = -1;
			}
		}

		var endClass = function(){
			// called when the tokenizer might be at the end of a class name
			// match. CSS allows for multiple classes, so we augment the
			// current item with another class in its list
			if(inClass >= 0){
				currentPart.classes.push(ts(inClass+1, x).replace(/\\/g, ""));
				inClass = -1;
			}
		}

		var endAll = function(){
			// at the end of a simple fragment, so wall off the matches
			endId(); endTag(); endClass();
		}

		// iterate over the query, charachter by charachter, building up a 
		// list of query part objects
		for(; lc=cc, cc=query.charAt(x),x<ql; x++){
			//		cc: the current character in the match
			//		lc: the last charachter (if any)

			// someone is trying to escape something, so don't try to match any
			// fragments. We assume we're inside a literal.
			if(lc == "\\"){ continue; } 
			if(!currentPart){ // a part was just ended or none has yet been created
				// NOTE: I hate all this alloc, but it's shorter than writing tons of if's
				pStart = x;
				//	rules describe full CSS sub-expressions, like:
				//		#someId
				//		.className:first-child
				//	but not:
				//		thinger > div.howdy[type=thinger]
				//	the indidual components of the previous query would be
				//	split into 3 parts that would be represented a structure
				//	like:
				//		[
				//			{
				//				query: "thinger",
				//				tag: "thinger",
				//			},
				//			{
				//				query: "div.howdy[type=thinger]",
				//				classes: ["howdy"],
				//				infixOper: {
				//					query: ">",
				//					oper: ">",
				//				}
				//			},
				//		]
				currentPart = {
					query: null, // the full text of the part's rule
					pseudos: [], // CSS supports multiple pseud-class matches in a single rule
					attrs: [], 	// CSS supports multi-attribute match, so we need an array
					classes: [], // class matches may be additive, e.g.: .thinger.blah.howdy
					tag: null, 	// only one tag...
					oper: null, // ...or operator per component. Note that these wind up being exclusive.
					id: null, 	// the id component of a rule
					getTag: function(){
						return (caseSensitive) ? this.otag : this.tag;
					}
				};
				// if we don't have a part, we assume we're going to start at
				// the beginning of a match, which should be a tag name. This
				// might fault a little later on, but we detect that and this
				// iteration will still be fine.
				inTag = x; 
			}

			if(inBrackets >= 0){
				// look for a the close first
				if(cc == "]"){ // if we're in a [...] clause and we end, do assignment
					if(!_cp.attr){
						// no attribute match was previously begun, so we
						// assume this is an attribute existance match in the
						// form of [someAttributeName]
						_cp.attr = ts(inBrackets+1, x);
					}else{
						// we had an attribute already, so we know that we're
						// matching some sort of value, as in [attrName=howdy]
						_cp.matchFor = ts((inMatchFor||inBrackets+1), x);
					}
					var cmf = _cp.matchFor;
					if(cmf){
						// try to strip quotes from the matchFor value. We want
						// [attrName=howdy] to match the same 
						//	as [attrName = 'howdy' ]
						if(	(cmf.charAt(0) == '"') || (cmf.charAt(0)  == "'") ){
							_cp.matchFor = cmf.substring(1, cmf.length-1);
						}
					}
					// end the attribute by adding it to the list of attributes. 
					currentPart.attrs.push(_cp);
					_cp = null; // necessaray?
					inBrackets = inMatchFor = -1;
				}else if(cc == "="){
					// if the last char was an operator prefix, make sure we
					// record it along with the "=" operator. 
					var addToCc = ("|~^$*".indexOf(lc) >=0 ) ? lc : "";
					_cp.type = addToCc+cc;
					_cp.attr = ts(inBrackets+1, x-addToCc.length);
					inMatchFor = x+1;
				}
				// now look for other clause parts
			}else if(inParens >= 0){
				// if we're in a parenthetical expression, we need to figure
				// out if it's attached to a pseduo-selector rule like
				// :nth-child(1)
				if(cc == ")"){
					if(inPseudo >= 0){
						_cp.value = ts(inParens+1, x);
					}
					inPseudo = inParens = -1;
				}
			}else if(cc == "#"){
				// start of an ID match
				endAll();
				inId = x+1;
			}else if(cc == "."){
				// start of a class match
				endAll();
				inClass = x;
			}else if(cc == ":"){
				// start of a pseudo-selector match
				endAll();
				inPseudo = x;
			}else if(cc == "["){
				// start of an attribute match. 
				endAll();
				inBrackets = x;
				// provide a new structure for the attribute match to fill-in
				_cp = {
					/*=====
					attr: null, type: null, matchFor: null
					=====*/
				};
			}else if(cc == "("){
				// we really only care if we've entered a parenthetical
				// expression if we're already inside a pseudo-selector match
				if(inPseudo >= 0){
					// provide a new structure for the pseudo match to fill-in
					_cp = { 
						name: ts(inPseudo+1, x), 
						value: null
					}
					currentPart.pseudos.push(_cp);
				}
				inParens = x;
			}else if(cc == " " && lc != cc){ 
				// if it's a space char and the last char is too, consume the
				// current one without doing more work

				// NOTE: we expect the query to be " " terminated
				endAll();
				if(inPseudo >= 0){
					currentPart.pseudos.push({ name: ts(inPseudo+1, x) });
				}
				// hint to the selector engine to tell it whether or not it
				// needs to do any iteration. Many simple selectors don't, and
				// we can avoid significant construction-time work by advising
				// the system to skip them
				currentPart.loops = (	
						currentPart.pseudos.length || 
						currentPart.attrs.length || 
						currentPart.classes.length	);

				currentPart.oquery = currentPart.query = ts(pStart, x); // save the full expression as a string

				// otag/tag are hints to suggest to the system whether or not
				// it's an operator or a tag. We save a copy of otag since the
				// tag name is cast to upper-case in regular HTML matches. The
				// system has a global switch to figure out if the current
				// expression needs to be case sensitive or not and it will use
				// otag or tag accordingly
				currentPart.otag = currentPart.tag = (currentPart["oper"]) ? null : (currentPart.tag || "*");

				if(currentPart.tag){
					// if we're in a case-insensitive HTML doc, we likely want
					// the toUpperCase when matching on element.tagName. If we
					// do it here, we can skip the string op per node
					// comparison
					currentPart.tag = currentPart.tag.toUpperCase();
				}

				// add the part to the list
				if(queryParts.length && (queryParts[queryParts.length-1].oper)){
					// operators are always infix, so we remove them from the
					// list and attach them to the next match. The evaluator is
					// responsible for sorting out how to handle them.
					currentPart.infixOper = queryParts.pop();
					currentPart.query = currentPart.infixOper.query + " " + currentPart.query;
					/*
					console.debug(	"swapping out the infix", 
									currentPart.infixOper, 
									"and attaching it to", 
									currentPart);
					*/
				}
				queryParts.push(currentPart);

				currentPart = null;
			}
		}
		return queryParts;
	};
	

	////////////////////////////////////////////////////////////////////////
	// DOM query infrastructure
	////////////////////////////////////////////////////////////////////////

	var _filtersCache = {};
	var _simpleFiltersCache = {};

	// the basic building block of the yes/no chaining system. agree(f1, f2)
	// generates a new function which returns the boolean results of both of
	// the passed functions to a single logical-anded result.
	var agree = function(first, second){
		if(!first){ return second; }
		if(!second){ return first; }

		return function(){
			return first.apply(window, arguments) && second.apply(window, arguments);
		}
	}
	var _isElement = function(n){ return (1 == n.nodeType); };

	var filterDown = function(root, queryParts){
		var candidates = [], qp, x, te, qpl = queryParts.length, bag, ret;
		if(root){ candidates.push(root); }
		// being recursive in filterDown reduced our visibility into the
		// potential for global optimization in the query parts (including the
		// # of parent candidates), so we refactor it into a slower series of
		// nested loops to speed up the system as a whole
		for(var i = 0; i < qpl; i++){
			ret = []; // FIXME: should we be using 'new listCtor()' here instead?
			qp = queryParts[i];
			x = candidates.length - 1;
			bag = null;
			if(candidates.length > 1){ // FIXME: need to expand this list!!
				bag = {};
				ret.nozip = true;
			}
			var gef = getElementsFunc(qp);
			while(te = candidates[x--]){
				// for every root, get the elements that match the descendant selector
				gef(te, ret, bag);
			}
			if(!ret.length){ break; }
			candidates = ret;
		}
		return ret;
	}

	var getNodeIndex = function(node){
		// NOTE: 
		//		we could have a more accurate caching mechanism by invalidating
		//		caches after the query has finished, but I think that'd lead to
		//		significantly more cache churn than the cache would provide
		//		value for in the common case. Generally, we're more
		//		conservative (and therefore, more accurate) than jQuery and
		//		DomQuery WRT node node indexes, but there may be corner cases
		//		in which we fall down.  How much we care about them is TBD.

		var pn = node.parentNode;
		var pnc = pn.childNodes;

		// check to see if we can trust the cache. If not, re-key the whole
		// thing and return our node match from that.

		var nidx = -1;
		var child = pn.firstChild;
		if(!child){
			return nidx;
		}

		var ci = node["__cachedIndex"];
		var cl = pn["__cachedLength"];

		// only handle cache building if we've gone out of sync
		if(((typeof cl == "number")&&(cl != pnc.length))||(typeof ci != "number")){
			// rip though the whole set, building cache indexes as we go
			pn["__cachedLength"] = pnc.length;
			var idx = 1;
			do{
				// we only assign indexes for nodes with nodeType == 1, as per:
				//		http://www.w3.org/TR/css3-selectors/#nth-child-pseudo
				// only elements are counted in the search order, and they
				// begin at 1 for the first child's index

				if(child === node){
					nidx = idx;
				}
				if(_isElement(child)){
					child["__cachedIndex"] = idx;
					idx++;
				}
				child = child.nextSibling;
			}while(child);
		}else{
			// NOTE: 
			//		could be incorrect in some cases (node swaps involving the
			//		passed node, etc.), but we ignore those due to the relative
			//		unlikelihood of that occuring
			nidx = ci;
		}
		return nidx;
	}

	var firedCount = 0;

	// FIXME: need to coalesce _getAttr with defaultGetter
	var blank = "";
	var _getAttr = function(elem, attr){
		if(attr == "class"){
			return elem.className || blank;
		}
		if(attr == "for"){
			return elem.htmlFor || blank;
		}
		if(attr == "style"){
			return elem.style.cssText || blank;
		}
		return (caseSensitive ? elem.getAttribute(attr) : elem.getAttribute(attr, 2)) || blank;
	}

	var attrs = {
		"*=": function(attr, value){
			return function(elem){
				// E[foo*="bar"]
				//		an E element whose "foo" attribute value contains
				//		the substring "bar"
				return (_getAttr(elem, attr).indexOf(value)>=0);
			}
		},
		"^=": function(attr, value){
			// E[foo^="bar"]
			//		an E element whose "foo" attribute value begins exactly
			//		with the string "bar"
			return function(elem){
				return (_getAttr(elem, attr).indexOf(value)==0);
			}
		},
		"$=": function(attr, value){
			// E[foo$="bar"]	
			//		an E element whose "foo" attribute value ends exactly
			//		with the string "bar"
			var tval = " "+value;
			return function(elem){
				var ea = " "+_getAttr(elem, attr);
				return (ea.lastIndexOf(value)==(ea.length-value.length));
			}
		},
		"~=": function(attr, value){
			// E[foo~="bar"]	
			//		an E element whose "foo" attribute value is a list of
			//		space-separated values, one of which is exactly equal
			//		to "bar"

			// return "[contains(concat(' ',@"+attr+",' '), ' "+ value +" ')]";
			var tval = " "+value+" ";
			return function(elem){
				var ea = " "+_getAttr(elem, attr)+" ";
				return (ea.indexOf(tval)>=0);
			}
		},
		"|=": function(attr, value){
			// E[hreflang|="en"]
			//		an E element whose "hreflang" attribute has a
			//		hyphen-separated list of values beginning (from the
			//		left) with "en"
			var valueDash = " "+value+"-";
			return function(elem){
				var ea = " "+(elem.getAttribute(attr, 2) || "");
				return (
					(ea == value) ||
					(ea.indexOf(valueDash)==0)
				);
			}
		},
		"=": function(attr, value){
			return function(elem){
				return (_getAttr(elem, attr) == value);
			}
		}
	};

	var pseudos = {
		"checked": function(name, condition){
			return function(elem){
				// FIXME: need to make this more portable!!
				return !!d.attr(elem, "checked");
			}
		},
		"first-child": function(name, condition){
			return function(elem){
				if(!_isElement(elem)){ return false; }
				// check to see if any of the previous siblings are elements
				var fc = elem.previousSibling;
				while(fc && (!_isElement(fc))){
					fc = fc.previousSibling;
				}
				return (!fc);
			}
		},
		"last-child": function(name, condition){
			return function(elem){
				if(!_isElement(elem)){ return false; }
				// check to see if any of the next siblings are elements
				var nc = elem.nextSibling;
				while(nc && (!_isElement(nc))){
					nc = nc.nextSibling;
				}
				return (!nc);
			}
		},
		"only-child": function(name, condition){
			return function(node){ 
				// FIXME: investigate if we can do better than iteration!
				// return node.parentNode[childNodesName].length == 1;

				var n = node, p = node;
				// look left
				while(p = p[_ps]){
					if(_simpleNodeTest(p)){ return false; }
				}

				// look right
				while(n = n[_ns]){
					if(_simpleNodeTest(n)){ return false; }
				}
				
				return true;
			};
		},
		"empty": function(name, condition){
			return function(elem){
				// DomQuery and jQuery get this wrong, oddly enough.
				// The CSS 3 selectors spec is pretty explicit about it, too.
				var cn = elem.childNodes;
				var cnl = elem.childNodes.length;
				// if(!cnl){ return true; }
				for(var x=cnl-1; x >= 0; x--){
					var nt = cn[x].nodeType;
					if((nt === 1)||(nt == 3)){ return false; }
				}
				return true;
			}
		},
		"contains": function(name, condition){
			var cz = condition.charAt(0);
			if( cz== '"' || cz == "'" ){ //remove quote
				condition = condition.substr(1, condition.length-2);
			}
			return function(elem){
				// FIXME:
				//		I dislike this version of "contains", as whimsical
				//		attribute could set it off. An inner-text based version
				//		might be more accurate, but since jQuery and DomQuery
				//		also potentially get this wrong, I'm leaving it for
				//		now.
				return (elem.innerHTML.indexOf(condition) >= 0);
			}
		},
		"not": function(name, condition){
			var ntf = getSimpleFilterFunc(getQueryParts(condition)[0]);
			return function(elem){
				return (!ntf(elem));
			}
		},
		"nth-child": function(name, condition){
			var pi = parseInt;
			if(condition == "odd"){
				condition = "2n+1";
			}else if(condition == "even"){
				condition = "2n";
			}
			// FIXME: can we shorten this up?
			if(condition.indexOf("n") != -1){
				var tparts = condition.split("n", 2);
				var pred = tparts[0] ? ((tparts[0] == '-') ? -1 : pi(tparts[0])) : 1;
				var idx = tparts[1] ? pi(tparts[1]) : 0;
				var lb = 0, ub = -1;
				if(pred > 0){
					if(idx < 0){
						idx = (idx % pred) && (pred + (idx % pred));
					}else if(idx>0){
						if(idx >= pred){
							lb = idx - idx % pred;
						}
						idx = idx % pred;
					}
				}else if(pred<0){
					pred *= -1;
					// idx has to be greater than 0 when pred is negative;
					// shall we throw an error here?
					if(idx > 0){
						ub = idx;
						idx = idx % pred;
					}
				}
				if(pred > 0){
					return function(elem){
						var i = getNodeIndex(elem);
						return (i>=lb) && (ub<0 || i<=ub) && ((i % pred) == idx);
					}
				}else{
					condition = idx;
				}
			}
			//if(condition.indexOf("n") == -1){
			var ncount = pi(condition);
			return function(elem){
				return (getNodeIndex(elem) == ncount);
			}
		}
	};

	var defaultGetter = (d.isIE) ? function(cond){
		var clc = cond.toLowerCase();
		if(clc == "class"){ cond = "className"; }
		return function(elem){
			return (caseSensitive ? elem.getAttribute(cond) : elem[cond]||elem[clc]);
		}
	} : function(cond){
		return function(elem){
			return (elem && elem.getAttribute && elem.hasAttribute(cond));
		}
	};

	var getSimpleFilterFunc = function(query, ignores){
		if(!query){ return yesman; }
		// console.debug("generating filters for:");
		ignores = ignores||{};

		/*
		var fcHit = (_simpleFiltersCache[query.query]||_filtersCache[query.query]);
		if(fcHit){ return fcHit; }
		*/

		var ff = null;

		if(!("el" in ignores)){
			// console.debug("	el");
			ff = agree(ff, _isElement);
		}


		if(!("tag" in ignores)){
			if(query.tag != "*"){
				// console.debug("	tag");
				ff = agree(ff, function(elem){
					return (elem.tagName == query.getTag());
				});
			}
		}


		if(!("classes" in ignores)){
			// if there's a class in our query, generate a match function for it
			// console.debug("	classes");
			each(query.classes, function(cname, idx, arr){
				// get the class name
				var isWildcard = cname.charAt(cname.length-1) == "*";
				if(isWildcard){
					cname = cname.substr(0, cname.length-1);
				}
				// I dislike the regex thing, even if memozied in a cache, but it's VERY short
				var re = new RegExp("(?:^|\\s)" + cname + (isWildcard ? ".*" : "") + "(?:\\s|$)");
				ff = agree(ff, function(elem){
					return re.test(elem.className);
				});
				ff.count = idx;
			});
		}

		if(!("pseudos" in ignores)){
			// console.debug("	pseudos");
			each(query.pseudos, function(pseudo){
				if(pseudos[pseudo.name]){
					ff = agree(ff, pseudos[pseudo.name](pseudo.name, pseudo.value));
				}
			});
		}

		if(!("attrs" in ignores)){
			each(query.attrs, function(attr){
				var matcher;
				var a = attr.attr;
				// type, attr, matchFor
				if(attr.type && attrs[attr.type]){
					matcher = attrs[attr.type](a, attr.matchFor);
				}else if(a.length){
					matcher = defaultGetter(a);
				}
				if(matcher){
					ff = agree(ff, matcher);
				}
			});
		}

		if(!("id" in ignores)){
			if(query.id){
				ff = agree(ff, function(elem){ return (elem.id == query.id); });
			}
		}


		if(!ff){
			if(!("default" in ignores)){
				// console.debug("	default");
				ff = yesman; 
			}
		}
		return _simpleFiltersCache[query.query] = ff;
	}

	// NOTES:
	//		there are likely some cases we can shortcut (should they proove
	//		themselves out in benchmarks):
	//			* single child
	//			* "are we already the last child?"

	// avoid testing for node type if we can. Defining this in the negative
	// here to avoid negation in the fast path.
	var _noNES = (typeof getDoc().firstChild.nextElementSibling == "undefined");
	var _ns = !_noNES ? "nextElementSibling" : "nextSibling";
	var _ps = !_noNES ? "previousElementSibling" : "previousSibling";
	var _simpleNodeTest = (_noNES ? _isElement : yesman);

	var _nextSibling = function(filterFunc){
		return function(node, ret, bag){
			while(node = node[_ns]){
				if(_noNES && (!_isElement(node))){ continue; }
				if(
					(!bag || _isUnique(node, bag)) &&
					filterFunc(node)
				){
					ret.push(node);
				}
				break;
			}
			return ret;
		}
	}

	var _nextSiblings = function(filterFunc){
		return function(root, ret, bag){
			var te = root[_ns];
			while(te){
				if(_simpleNodeTest(te)){
					if(bag && !_isUnique(te, bag)){
						break;
					}
					if(filterFunc(te)){
						ret.push(te);
					}
				}
				te = te[_ns];
			}
			return ret;
		}
	};

	// get an array of child *elements*, skipping text and comment nodes
	var _childElements = function(filterFunc){
		filterFunc = filterFunc||yesman;
		return function(root, ret, bag){
			// get an array of child elements, skipping text and comment nodes
			var te, x = 0, tret = root[childNodesName];
			while(te = tret[x++]){
				if(
					_simpleNodeTest(te) &&
					(!bag || _isUnique(te, bag)) &&
					(filterFunc(te))
				){ 
					ret.push(te);
				}
			}
			return ret;
		};
	}

	var getArr = function(i, arr, nozip){
		var r = arr||[];
		if(i){ r.push(i); }
		r.nozip = nozip;
		return r;
	};

	// thanks, Dean!
	var itemIsAfterRoot = d.isIE ? function(item, root){
		return (item.sourceIndex > root.sourceIndex);
	} : function(item, root){
		return (item.compareDocumentPosition(root) == 2);
	};

	var _isDescendant = function(node, root){
		var pn = node.parentNode;
		while(pn){
			if(pn == root){
				break;
			}
			pn = pn.parentNode;
		}
		return !!pn;
	}

	/*
	var _getNodeGetter = function(prop, str, filterFunc, nozip){
		// summary:
		//		specializer for node-finding logic
		return function(root, arr){
			var ret = getArr(null, arr, nozip), te, x=0;
			var tret = root[prop](str);
			while((te = tret[x++])){
				if(filterFunc(te, root)){
					ret.push(te);
				}
			}
			return ret;
		}
	}
	*/

	var _getElementsFuncCache = {};

	var getElementsFunc = function(query){
		// NOTE: this function is in the fast path! not memoized!!!

		// TODO:
		//		investigate if :first-child ,:last-child, and :only-child can
		//		be treated as infix operators

		var qq = query.query;
		var cachedFunc = _getElementsFuncCache[qq];
		if(cachedFunc){ return cachedFunc; }

		// NOTE:
		//		fundamentally this function is designed to return a local query
		//		dispatcher which is specialized by the depth policy (the infix
		//		operator if present or " ") and a test function to be applied
		//		to the results. Many common cases can be fast-pathed. We'd like
		//		to create a dispatcher that doesn't do more work than
		//		necessaray at any point since, unlike this function, the
		//		dispatchers will be in the fast path. It might look like this
		//		in pseudo code:
		//
		//		# if it's a purely descendant query (no ">", "+", or "~" modifiers)
		//		if infixOperator == " ":
		//			if only(id):
		//				return def(root):
		//					return d.byId(id, root);
		//
		//			elif id:
		//				return def(root):
		//					return filter(d.byId(id, root));
		//
		//			elif cssClass && getElementsByClassName:
		//				return def(root):
		//					return filter(root.getElementsByClassName(cssClass));
		//
		//			else:
		//				# search by tag name, then filter
		//				return def(root):
		//					return filter(root.getElementsByTagName(tagName||"*"));
		//
		//		elif infixOperator == ">":
		//			# search direct children
		//			return def(root):
		//				return filter(root.children);
		//
		//		elif infixOperator == "+":
		//			# search next sibling
		//			return def(root):
		//				return filter(root.nextElementSibling);
		//
		//		elif infixOperator == "~":
		//			# search rightward siblings
		//			return def(root):
		//				return filter(nextSiblings(root));

		var io = query.infixOper;
		var oper = (io ? io.oper : "");
		var filterFunc = getSimpleFilterFunc(query, { el: 1 });
		var qt = query.tag;
		var wildcardTag = ("*" == qt);
		var retFunc;

		if(!oper){
			// if there's no infix operator, then it's a descendant query. 
			// ID and "elements by class name" variants of those are
			// fast-pathable, so we call them out explicitly:
			if(query.id){

				// testing shows that the overhead of yesman() is acceptable
				// and can save us some bytes vs. re-defining the function
				// everywhere.
				filerFunc = (!query.loops && !qt) ? 
					yesman : 
					getSimpleFilterFunc(query, { el: 1, id: 1 });

				retFunc = function(root, arr){
					var te = d.byId(query.id, (root.ownerDocument||root));
					if(!filterFunc(te)){ return; }
					if(9 == root.nodeType){ // if root's a doc, we just return directly
						return getArr(te, arr);
					}else{ // otherwise check ancestry
						if(_isDescendant(te, root)){
							return getArr(te, arr);
						}
					}
				}
			}else if(getDoc()["getElementsByClassName"] && query.classes.length){
				// ignore class and ID filters since we will have handled both
				filterFunc = getSimpleFilterFunc(query, { el: 1, classes: 1, id: 1 });
				var classesString = query.classes.join(" ");
				// retFunc = _getNodeGetter("getElementsByClassName", classesString, filterFunc);
				retFunc = function(root, arr){
					var ret = getArr(null, arr), te, x=0;
					var tret = root.getElementsByClassName(classesString);
					while((te = tret[x++])){
						if(filterFunc(te, root)){ ret.push(te); }
					}
					return ret;
				};

			}else{
				// the common case:
				//		a descendant selector without a fast path. By now it's got
				//		to have a tag selector, even if it's just "*" so we query
				//		by that and filter
				filterFunc = getSimpleFilterFunc(query, { el: 1, tag: 1, id: 1 });
				// retFunc = _getNodeGetter("getElementsByTagName", qt, filterFunc);
				retFunc = function(root, arr){
					var ret = getArr(null, arr), te, x=0;
					var tret = root.getElementsByTagName(query.getTag());
					while((te = tret[x++])){
						if(filterFunc(te, root)){ ret.push(te); }
					}
					return ret;
				};
			}
		}else{
			// the query is scoped in some way. Instead of querying by tag we
			// use some other collection to find candidate nodes
			var skipFilters = { el: 1 };
			if(wildcardTag){
				skipFilters.tag = 1;
			}
			filterFunc = getSimpleFilterFunc(query, skipFilters);
			if("+" == oper){
				retFunc = _nextSibling(filterFunc);
			}else if("~" == oper){
				retFunc = _nextSiblings(filterFunc);
			}else if(">" == oper){
				retFunc = _childElements(filterFunc);
			}
		}
		_getElementsFuncCache[query.query] = retFunc;
		return retFunc;
	}

	////////////////////////////////////////////////////////////////////////
	// the query runner
	////////////////////////////////////////////////////////////////////////

	// this is the primary caching for full-query results. The query dispatcher
	// functions are generated here and then pickled for hash lookup in the
	// future

	/*
	var _queryFuncCacheDOM = {
		"*": d.isIE ? 
			function(root){ 
					return root.all;
			} : 
			function(root){
				 return root.getElementsByTagName("*");
			},
		"~": _nextSiblings,
		"+": function(root){ return _nextSiblings(root, true); },
		">": _childElements
	};
	*/

	var _queryFuncCacheDOM = {};
	var _queryFuncCacheQSA = {};

	// this is the second level of spliting, from full-length queries (e.g.,
	// "div.foo .bar") into simple query expressions (e.g., ["div.foo",
	// ".bar"])
	var getStepQueryFunc = function(query){
		// if it's trivial, get a fast-path dispatcher
		var qparts = getQueryParts(trim(query));

		if(qparts.length == 1){
			// we optimize this case here to prevent dispatch further down the
			// chain, potentially slowing things down. We could more elegantly
			// handle this in filterDown(), but it's slower for simple things
			// that need to be fast (e.g., "#someId").
			var tef = getElementsFunc(qparts[0]);
			return function(root){
				var r = tef(root, new listCtor());
				if(r){ r.nozip = true; }
				return r;
			}
		}

		// otherwise, break it up and return a runner that iterates over the parts recursively
		return function(root){
			return filterDown(root, qparts);
		}
	}

	// NOTES:
	//	* we can't trust QSA for anything but document-rooted queries, so
	//	  caching is split into DOM query evaluators and QSA query evaluators
	//	* caching query results is dirty and leak-prone (or, at a minimum,
	//	  prone to unbounded growth). Other toolkits may go this route, but
	//	  they totally destory their own ability to manage their memory
	//	  footprint. If we implement it, it should only ever be with a fixed
	//	  total element reference # limit and an LRU-style algorithm since JS
	//	  has no weakref support. Caching compiled query evaluators is also
	//	  potentially problematic, but even on large documents the size of the
	//	  query evaluators is often < 100 function objects per evaluator (and
	//	  LRU can be applied if it's ever shown to be an issue).
	//	* since IE's QSA support is currently only for HTML documents and even
	//	  then only in IE 8's "standards mode", we have to detect our dispatch
	//	  route at query time and keep 2 separate caches. Ugg.

	// we need to determine if we think we can run a given query via
	// querySelectorAll or if we'll need to fall back on DOM queries to get
	// there. We need a lot of information about the environment and the query
	// to make the determiniation (e.g. does it support QSA, does the query in
	// question work in the native QSA impl, etc.).
	var nua = navigator.userAgent;
	// some versions of Safari provided QSA, but it was buggy and crash-prone.
	// We need te detect the right "internal" webkit version to make this work.
	var wk = "WebKit/";
	var is525 = (
		d.isWebKit && 
		(nua.indexOf(wk) > 0) && 
		(parseFloat(nua.split(wk)[1]) > 528)
	);

	// IE QSA queries may incorrectly include comment nodes, so we throw the
	// zipping function into "remove" comments mode instead of the normal "skip
	// it" which every other QSA-clued browser enjoys
	var noZip = d.isIE ? "commentStrip" : "nozip";

	var qsa = "querySelectorAll";
	var qsaAvail = (
		!!getDoc()[qsa] && 
		// see #5832
		(!d.isSafari || (d.isSafari > 3.1) || is525 )
	); 
	var getQueryFunc = function(query, forceDOM){

		if(qsaAvail){
			// if we've got a cached variant and we think we can do it, run it!
			var qsaCached = _queryFuncCacheQSA[query];
			if(qsaCached && !forceDOM){ return qsaCached; }
		}

		// else if we've got a DOM cached variant, assume that we already know
		// all we need to and use it
		var domCached = _queryFuncCacheDOM[query];
		if(domCached){ return domCached; }

		// TODO: 
		//		today we're caching DOM and QSA branches separately so we
		//		recalc useQSA every time. If we had a way to tag root+query
		//		efficiently, we'd be in good shape to do a global cache.

		var qcz = query.charAt(0);
		var nospace = (-1 == query.indexOf(" "));

		if(
			(qcz == "#") && (nospace) &&
			(!/[.:\[\(]/.test(query)) // make sure it's an ID only search
		){
			forceDOM = true;
		}

		var useQSA = ( 
			qsaAvail && (!forceDOM) &&
			// as per CSS 3, we can't currently start w/ combinator:
			//		http://www.w3.org/TR/css3-selectors/#w3cselgrammar
			(specials.indexOf(qcz) == -1) && 
			// IE's QSA impl sucks on pseudos
			(!d.isIE || (query.indexOf(":") == -1)) &&
			// FIXME:
			//		need to tighten up browser rules on ":contains" and "|=" to
			//		figure out which aren't good
			(query.indexOf(":contains") == -1) &&
			(query.indexOf("|=") == -1) && // some browsers don't grok it
			true
		);

		// TODO: 
		//		if we've got a descendant query (e.g., "> .thinger" instead of
		//		just ".thinger") in a QSA-able doc, but are passed a child as a
		//		root, it should be possible to give the item a synthetic ID and
		//		trivially rewrite the query to the form "#synid > .thinger" to
		//		use the QSA branch


		if(useQSA){
			var tq = (specials.indexOf(query.charAt(query.length-1)) >= 0) ? 
						(query + " *") : query;
			return _queryFuncCacheQSA[query] = function(root){
				// FIXME: 
				//		need to test here to make sure that either the query is
				//		either simple or the root is a document.
				try{
					// the QSA system contains an egregious spec bug which
					// limits us, effectively, to only running QSA queries over
					// entire documents.  See:
					//		http://ejohn.org/blog/thoughts-on-queryselectorall/
					//	despite this, we can also handle QSA runs on simple
					//	selectors, but we don't want detection to be expensive
					//	so we're just checking for the presence of a space char
					//	right now. Not elegant, but it's cheaper than running
					//	the query parser when we might not need to
					if(!((9 == root.nodeType) || nospace)){ throw ""; }
					var r = root[qsa](tq);
					// skip expensive duplication checks and just wrap in a NodeList
					r[noZip] = true;
					return r;
				}catch(e){
					// else run the DOM branch on this query, ensuring that we
					// default that way in the future
					return getQueryFunc(query, true)(root);
				}
			}
		}else{
			// DOM branch
			var parts = query.split(/\s*,\s*/);
			return _queryFuncCacheDOM[query] = ((parts.length < 2) ? 
				// if not a compound query (e.g., ".foo, .bar"), cache and return a dispatcher
				getStepQueryFunc(query) : 
				// if it *is* a complex query, break it up into its
				// constituent parts and return a dispatcher that will
				// merge the parts when run
				function(root){
					var pindex = 0; // avoid array alloc for every invocation
					var ret = [];
					var tp;
					while((tp = parts[pindex++])){
						ret = ret.concat(getStepQueryFunc(tp)(root));
					}
					return ret;
				}
			);
		}
	}

	var _zipIdx = 0;
	// determine if a node in is unique in a "bag". In this case we don't want
	// to flatten a list of unique items, but rather just tell if the item in
	// question is already in the bag. Normally we'd just use hash lookup to do
	// this for us but IE's DOM is busted so we can't really count on that. On
	// the upside, it gives us a built in unique ID function. 

	// NOTE:
	//		this function is Moo inspired, but our own impl to deal correctly
	//		with XML in IE
	var _nodeUID = d.isIE ? function(node){
		if(caseSensitive){
			// XML docs don't have uniqueID on their nodes
			return (node.getAttribute("_uid") || node.setAttribute("_uid", ++_zipIdx) || _zipIdx);

		}else{
			return node.uniqueID;
		}
	} : 
	function(node){
		return (node._uid || (node._uid = _zipIdx++));
	};

	var _isUnique = function(node, bag){
		if(!bag){ return 1; }
		var id = _nodeUID(node);
		if(!bag[id]){ return bag[id] = 1; }
		return 0;
	};

	// attempt to efficiently determine if an item in a list is a dupe,
	// returning a list of "uniques", hopefully in doucment order
	var _zipIdxName = "_zipIdx";
	var _zip = function(arr){
		if(arr && arr.nozip){ 
			return (listCtor._wrap) ? listCtor._wrap(arr) : arr;
		}
		// var ret = new listCtor();
		var ret = new listCtor();
		if(!arr){ return ret; }
		if(arr[0]){
			ret.push(arr[0]);
		}
		if(arr.length < 2){ return ret; }

		_zipIdx++;
		
		// we have to fork here for IE and XML docs because we can't set
		// expandos on their nodes (apparently). *sigh*
		if(d.isIE && caseSensitive){
			var szidx = _zipIdx+"";
			arr[0].setAttribute(_zipIdxName, szidx);
			for(var x = 1, te; te = arr[x]; x++){
				if(arr[x].getAttribute(_zipIdxName) != szidx){ 
					ret.push(te);
				}
				te.setAttribute(_zipIdxName, szidx);
			}
		}else if(d.isIE && arr.commentStrip){
			try{
				for(var x = 1, te; te = arr[x]; x++){
					if(_isElement(te)){ 
						ret.push(te);
					}
				}
			}catch(e){ /* squelch */ }
		}else{
			// console.debug("zip in length:", arr.length);
			arr[0][_zipIdxName] = _zipIdx;
			for(var x = 1, te; te = arr[x]; x++){
				if(arr[x][_zipIdxName] != _zipIdx){ 
					ret.push(te);
				}
				te[_zipIdxName] = _zipIdx;
			}
			// console.debug("zip out length:", ret.length);
		}
		return ret;
	}

	// the main executor
	d.query = function(/*String*/ query, /*String|DOMNode?*/ root){
		//	summary:
		//		Returns nodes which match the given CSS3 selector, searching the
		//		entire document by default but optionally taking a node to scope
		//		the search by. Returns an instance of dojo.NodeList.
		//	description:
		//		dojo.query() is the swiss army knife of DOM node manipulation in
		//		Dojo. Much like Prototype's "$$" (bling-bling) function or JQuery's
		//		"$" function, dojo.query provides robust, high-performance
		//		CSS-based node selector support with the option of scoping searches
		//		to a particular sub-tree of a document.
		//
		//		Supported Selectors:
		//		--------------------
		//
		//		dojo.query() supports a rich set of CSS3 selectors, including:
		//
		//			* class selectors (e.g., `.foo`)
		//			* node type selectors like `span`
		//			* ` ` descendant selectors
		//			* `>` child element selectors 
		//			* `#foo` style ID selectors
		//			* `*` universal selector
		//			* `~`, the immediately preceeded-by sibling selector
		//			* `+`, the preceeded-by sibling selector
		//			* attribute queries:
		//			|	* `[foo]` attribute presence selector
		//			|	* `[foo='bar']` attribute value exact match
		//			|	* `[foo~='bar']` attribute value list item match
		//			|	* `[foo^='bar']` attribute start match
		//			|	* `[foo$='bar']` attribute end match
		//			|	* `[foo*='bar']` attribute substring match
		//			* `:first-child`, `:last-child`, and `:only-child` positional selectors
		//			* `:empty` content emtpy selector
		//			* `:checked` pseudo selector
		//			* `:nth-child(n)`, `:nth-child(2n+1)` style positional calculations
		//			* `:nth-child(even)`, `:nth-child(odd)` positional selectors
		//			* `:not(...)` negation pseudo selectors
		//
		//		Any legal combination of these selectors will work with
		//		`dojo.query()`, including compound selectors ("," delimited).
		//		Very complex and useful searches can be constructed with this
		//		palette of selectors and when combined with functions for
		//		maniplation presented by dojo.NodeList, many types of DOM
		//		manipulation operations become very straightforward.
		//		
		//		Unsupported Selectors:
		//		----------------------
		//
		//		While dojo.query handles many CSS3 selectors, some fall outside of
		//		what's resaonable for a programmatic node querying engine to
		//		handle. Currently unsupported selectors include:
		//		
		//			* namespace-differentiated selectors of any form
		//			* all `::` pseduo-element selectors
		//			* certain pseduo-selectors which don't get a lot of day-to-day use:
		//			|	* `:root`, `:lang()`, `:target`, `:focus`
		//			* all visual and state selectors:
		//			|	* `:root`, `:active`, `:hover`, `:visisted`, `:link`,
		//				  `:enabled`, `:disabled`
		//			* `:*-of-type` pseudo selectors
		//		
		//		dojo.query and XML Documents:
		//		-----------------------------
		//		
		//		`dojo.query` (as of dojo 1.2) supports searching XML documents
		//		in a case-sensitive manner. If an HTML document is served with
		//		a doctype that forces case-sensitivity (e.g., XHTML 1.1
		//		Strict), dojo.query() will detect this and "do the right
		//		thing". Case sensitivity is dependent upon the document being
		//		searched and not the query used. It is therefore possible to
		//		use case-sensitive queries on strict sub-documents (iframes,
		//		etc.) or XML documents while still assuming case-insensitivity
		//		for a host/root document.
		//
		//		Non-selector Queries:
		//		---------------------
		//
		//		If something other than a String is passed for the query,
		//		`dojo.query` will return a new `dojo.NodeList` instance
		//		constructed from that parameter alone and all further
		//		processing will stop. This means that if you have a reference
		//		to a node or NodeList, you can quickly construct a new NodeList
		//		from the original by calling `dojo.query(node)` or
		//		`dojo.query(list)`.
		//
		//	query:
		//		The CSS3 expression to match against. For details on the syntax of
		//		CSS3 selectors, see <http://www.w3.org/TR/css3-selectors/#selectors>
		//	root:
		//		A DOMNode (or node id) to scope the search from. Optional.
		//	returns: dojo.NodeList
		//		An instance of `dojo.NodeList`. Many methods are available on
		//		NodeLists for searching, iterating, manipulating, and handling
		//		events on the matched nodes in the returned list.
		//	example:
		//		search the entire document for elements with the class "foo":
		//	|	dojo.query(".foo");
		//		these elements will match:
		//	|	<span class="foo"></span>
		//	|	<span class="foo bar"></span>
		//	|	<p class="thud foo"></p>
		//	example:
		//		search the entire document for elements with the classes "foo" *and* "bar":
		//	|	dojo.query(".foo.bar");
		//		these elements will match:
		//	|	<span class="foo bar"></span>
		//		while these will not:
		//	|	<span class="foo"></span>
		//	|	<p class="thud foo"></p>
		//	example:
		//		find `<span>` elements which are descendants of paragraphs and
		//		which have a "highlighted" class:
		//	|	dojo.query("p span.highlighted");
		//		the innermost span in this fragment matches:
		//	|	<p class="foo">
		//	|		<span>...
		//	|			<span class="highlighted foo bar">...</span>
		//	|		</span>
		//	|	</p>
		//	example:
		//		set an "odd" class on all odd table rows inside of the table
		//		`#tabular_data`, using the `>` (direct child) selector to avoid
		//		affecting any nested tables:
		//	|	dojo.query("#tabular_data > tbody > tr:nth-child(odd)").addClass("odd");
		//	example:
		//		remove all elements with the class "error" from the document
		//		and store them in a list:
		//	|	var errors = dojo.query(".error").orphan();
		//	example:
		//		add an onclick handler to every submit button in the document
		//		which causes the form to be sent via Ajax instead:
		//	|	dojo.query("input[type='submit']").onclick(function(e){
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

		if(!query){
			return new listCtor();
		}

		if(query.constructor == listCtor){
			return query;
		}
		if(!isString(query)){
			return new listCtor(query); // dojo.NodeList
		}
		if(isString(root)){
			root = d.byId(root);
		}

		root = root||getDoc();
		var od = root.ownerDocument||root.documentElement;

		// throw the big case sensitivity switch

		// FIXME: Opera in XHTML mode doesn't detect case-sensitivity correctly
		caseSensitive = (root.contentType && root.contentType=="application/xml") || 
						(d.isOpera && root.doctype) ||
						(!!od) && 
						(d.isIE ? od.xml : (root.xmlVersion||od.xmlVersion));

		// NOTE: 
		//		adding "true" as the 2nd argument to getQueryFunc is useful for
		//		testing the DOM branch without worrying about the
		//		behavior/performance of the QSA branch.
		var r = getQueryFunc(query, true)(root);
		// FIXME:
		//		need to investigate this branch WRT #8074 and #8075
		if(r && r.nozip && !listCtor._wrap){
			return r;
		}
		return _zip(r); // dojo.NodeList
	}

	/*
	// exposing these was a mistake
	d.query.attrs = attrs;
	d.query.pseudos = pseudos;
	*/

	// one-off function for filtering a NodeList based on a simple selector
	d._filterQueryResult = function(nodeList, simpleFilter){
		var tmpNodeList = new listCtor();
		var filterFunc = getSimpleFilterFunc(getQueryParts(simpleFilter)[0]);
		for(var x = 0, te; te = nodeList[x]; x++){
			if(filterFunc(te)){ tmpNodeList.push(te); }
		}
		return tmpNodeList;
	}
})(this["queryPortability"]||this["acme"]||dojo);
