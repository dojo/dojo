dojo.provide("dojo.NodeList-manipulate");

/*=====
dojo["NodeList-manipulate"] = {
	// summary: Adds a chainable methods to dojo.query() / Nodelist instances for manipulating HTML
	// and DOM nodes and their properties.
};
=====*/

//TODO: add a way to parse for widgets in the injected markup?

(function(){
	function getText(/*DOMNode*/node){
		// summary:
		// 		recursion method for text() to use. Gets text value for a node.
		// description:
		// 		Juse uses nodedValue so things like <br/> tags do not end up in
		// 		the text as any sort of line return.
		var text = "", ch = node.childNodes;
		for(var i = 0, n; n = ch[i]; i++){
			//Skip comments.
			if(n.nodeType != 8){
				if(n.nodeType == 1){
					text += getText(n);
				}else{
					text += n.nodeValue;
				}
			}
		}
		return text;
	}

	function normalizeInsertData(/*String||Element||NodeList*/content, /*DOMNode*/refNode){
		// summary:
		// 		normalizes data to an array of items to insert.
		// 		Wanted to just use a DocumentFragment, but for the array/NodeList
		// 		case that meant  using cloneNode, but we may not want that.
		// 		Cloning should only happen if the node operations span
		// 		multiple refNodes. Also, need a real array, not a NodeList from the
		// 		DOM since the node movements could change those NodeLists.
		if(typeof content == "string"){
			content = dojo._toDom(content, (refNode && refNode.ownerDocument));
			if(content.nodeType == 11){
				//DocumentFragment. It cannot handle cloneNode calls, so pull out the children.
				content = dojo._toArray(content.childNodes);
			}else{
				content = [content];
			}
		}else if(!dojo.isArrayLike(content)){
			content = [content];
		}else if(!dojo.isArray(content)){
			//To get to this point, content is array-like, but
			//not an array, which likely means a DOM NodeList. Convert it now.
			content = dojo._toArray(content);
		}
		return content; //Array
	}

	function place(/*Array*/ary, /*DOMNode*/refNode, /*String*/position, /*Boolean*/useClone){
		// summary:
		// 		handles placing an array of nodes relative to another node.
		// 		Also allows for cloning the nodes in the array.
		var rNode = refNode;
		//Always cycle backwards in case the array is really a
		//DOM NodeList and the DOM operations take it out of the live collection.
		var length = ary.length;
		for(var i = length - 1; i >= 0; i--){
			var node = (useClone ? ary[i].cloneNode(true) : ary[i]);
			if(i == length - 1){
				dojo.place(node, rNode, position);
			}else{
				rNode.parentNode.insertBefore(node, rNode);
			}
			rNode = node;
		}
	}

	function insertPlace(/*String||DOMNode||NodeList*/content, /*NodeList*/nl, /*String*/position){
		// summary:
		// 		reusable chunk for different position calls.
		content = normalizeInsertData(content, nl[0]);
		for(var i = 0, node; node = nl[i]; i++){
			place(content, node, position, i > 0);
		}
		return nl; //dojo.NodeList
	}

	function reverseInsertPlace(/*String*/query, /*NodeList*/nl, /*String*/position){
		// summary:
		// 		reusable chunk for different To/After position calls.
		var nl2 = dojo.query(query);
		for(var i = 0; i < nl2.length; i++){
			for(var j = 0, item; item = nl[j]; j++){
				dojo.place((i > 0 ? item.cloneNode(true) : item), nl2[i], position);
			}
		}
		return nl; //dojo.NodeList
	}

	function getWrapInsertion(/*DOMNode*/node){
		// summary:
		// 		finds the innermost element to use for wrap insertion.

		//Make it easy, assume single nesting, no siblings.
		while(node.childNodes[0] && node.childNodes[0].nodeType == 1){
			node = node.childNodes[0];
		}
		return node; //DOMNode
	}

	function makeWrapNode(/*DOMNode||String*/html, /*DOMNode*/refNode){
		// summary: 
		// 		convert HTML into nodes if it is not already a node.
		if(typeof html == "string"){
			html = dojo._toDom(html, (refNode && refNode.ownerDocument));
			if(html.nodeType == 11){
				//DocumentFragment cannot handle cloneNode, so choose first child.
				html = html.childNodes[0];
			}
		}
		return html; /*DOMNode*/
	}

	dojo.extend(dojo.NodeList, {
		innerHTML: function(/*String?||DOMNode?|NodeList?*/value){
			// summary:
			// 		allows setting the innerHTML of each node in the NodeList,
			// 		if there is a value passed in, otherwise, reads the innerHTML value of the first node.
			// description:
			// 		This method is simpler than the dojo.NodeList.html() method provided by
			// 		`dojo.NodeList-html`. This method just does proper innerHTML insertion of HTML fragments,
			// 		and it allows for the innerHTML to be read for the first node in the node list.
			// 		Since dojo.NodeList-html already took the "html" name, this method is called
			// 		"innerHTML". However, if dojo.NodeList-html has not been loaded yet, this
			// 		module will define an "html" method that can be used instead. Be careful if you
			// 		are working in an environment where it is possible that dojo.NodeList-html could
			// 		have been loaded, since its definition of "html" will take precedence.
			// 		The nodes represented by the value argument will be cloned if more than one
			// 		node is in this NodeList. The nodes in this NodeList are returned in the "set"
			// 		usage of this method, not the HTML that was inserted.
			if(arguments.length){
				return insertPlace(value, this, "only"); //dojo.NodeList
			}else{
				return this[0].innerHTML; //String
			}
		},

		/*=====
		html: function(value){
			// summary:
			//		see the information for "innerHTML". "html" is an alias for "innerHTML", but is
			// 		only defined if dojo.NodeList-html has not been loaded.
			// description:
			// 		An alias for the "innerHTML" method, but only defined if there is not an existing
			// 		"html" method on dojo.NodeList. Be careful if you are working in an environment
			// 		where it is possible that dojo.NodeList-html could have been loaded, since its
			// 		definition of "html" will take precedence. If you are not sure if dojo.NodeList-html
			// 		could be loaded, use the "innerHTML" method.
			//	value: String?||DOMNode?||NodeList?
			//		optional. The HTML fragment to use as innerHTML. If value is not passed, then the innerHTML
			// 		of the first element in this NodeList is returned.
			//	returns:
			//		if no value is passed, the result is String
			//		If a value is passed, the return is this NodeList
			return; // dojo.NodeList
			return; // String
		},
		=====*/

		text: function(/*String*/value){
			// summary:
			// 		allows seting the text value of each node in the NodeList,
			// 		if there is a value passed in, otherwise, returns the text value for all the
			// 		nodes in the NodeList in one string.
			if(arguments.length){
				for(var i = 0, node; node = this[i]; i++){
					if(node.nodeType == 1){
						dojo.empty(node);
						node.appendChild(node.ownerDocument.createTextNode(value));
					}
				}
				return this; //dojo.NodeList
			}else{
				var result = "";
				for(i = 0; node = this[i]; i++){
					result += getText(node);
				}
				return result; //String
			}
		},

		val: function(/*String||Array*/value){
			// summary:
			// 		If value is passed, allows seting the value property of form elements in this
			// 		NodeList, or properly selecting/checking the right value for radio/checkbox/select
			// 		elements. If no value is passed, the value of the first node in this NodeList
			// 		is returned.

			//Special work for input elements.
			if(arguments.length){
				var isArray = dojo.isArray(value);
				for(var index = 0, node; node = this[index]; index++){
					var name = node.nodeName.toUpperCase();
					var type = node.type;
					var newValue = isArray ? value[index] : value;
	
					if(name == "SELECT"){
						var opts = node.options;
						for(var i = 0; i < opts.length; i++){
							var opt = opts[i];
							if(node.multiple){
								opt.selected = (dojo.indexOf(value, opt.value) != -1);
							}else{
								opt.selected = (opt.value == newValue);
							}
						}
					}else if(type == "checkbox" || type == "radio"){
						node.checked = (node.value == newValue);
					}else{
						node.value = newValue;
					}
				}
				return this; //dojo.NodeList
			}else{
				//node already declared above.
				node = this[0];
				if(!node || node.nodeType != 1){
					return undefined;
				}
				value = node.value || "";
				if(node.nodeName.toUpperCase() == "SELECT" && node.multiple){
					//A multivalued selectbox. Do the pain.
					value = [];
					//opts declared above in if block.
					opts = node.options;
					//i declared above in if block;
					for(i = 0; i < opts.length; i++){
						//opt declared above in if block
						opt = opts[i];
						if(opt.selected){
							value.push(opt.value);
						}
					}
					if(!value.length){
						value = null;
					}
				}
				return value; //String||Array
			}
		},

		append: function(/*String||DOMNode||NodeList*/content){
			// summary:
			// 		appends the content to every node in the NodeList.
			// description:
			// 		The content will be cloned if the length of NodeList
			// 		is greater than 1. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the appended content.
			return insertPlace(content, this, "last"); //dojo.NodeList
		},

		appendTo: function(/*String*/query){
			// summary:
			// 		appends nodes in this NodeList to the nodes matched by
			// 		the query passed to appendTo.
			// description:
			// 		The nodes in this NodeList will be cloned if the query
			// 		matches more than one element. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the matched nodes
			// 		from the query.
			return reverseInsertPlace(query, this, "last"); //dojo.NodeList
		},

		prepend: function(/*String||DOMNode||NodeList*/content){
			// summary:
			// 		prepends the content to every node in the NodeList.
			// description:
			// 		The content will be cloned if the length of NodeList
			// 		is greater than 1. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the prepended content.
			return insertPlace(content, this, "first"); //dojo.NodeList
		},

		prependTo: function(/*String*/query){
			// summary:
			// 		prepends nodes in this NodeList to the nodes matched by
			// 		the query passed to prependTo.
			// description:
			// 		The nodes in this NodeList will be cloned if the query
			// 		matches more than one element. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the matched nodes
			// 		from the query.
			return reverseInsertPlace(query, this, "first"); //dojo.NodeList
		},

		after: function(/*String||Element||NodeList*/content){
			// summary:
			// 		Places the content after every node in the NodeList.
			// description:
			// 		The content will be cloned if the length of NodeList
			// 		is greater than 1. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the content.
			return insertPlace(content, this, "after"); //dojo.NodeList
		},

		insertAfter: function(/*String*/query){
			// summary:
			// 		The nodes in this NodeList will be placed after the nodes
			// 		matched by the query passed to insertAfter.
			// description:
			// 		The nodes in this NodeList will be cloned if the query
			// 		matches more than one element. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the matched nodes
			// 		from the query.
			return reverseInsertPlace(query, this, "after"); //dojo.NodeList
		},

		before: function(/*String||DOMNode||NodeList*/content){
			// summary:
			// 		Places the content before every node in the NodeList.
			// description:
			// 		The content will be cloned if the length of NodeList
			// 		is greater than 1. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in this NodeList
			// 		will be returned, not the content.
			return insertPlace(content, this, "before"); //dojo.NodeList
		},

		insertBefore: function(/*String*/query){
			// summary:
			// 		The nodes in this NodeList will be placed after the nodes
			// 		matched by the query passed to insertAfter.
			// description:
			// 		The nodes in this NodeList will be cloned if the query
			// 		matches more than one element. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the matched nodes
			// 		from the query.
			return reverseInsertPlace(query, this, "before"); //dojo.NodeList
		},

		/*=====
		remove: function(simpleFilter){
			//	summary:
			//		alias for dojo.NodeList's orphan method. Removes elements
			// 		in this list that match the simple filter from their parents
			// 		and returns them as a new NodeList.
			//	simpleFilter: String
			//		single-expression CSS rule. For example, ".thinger" or
			//		"#someId[attrName='value']" but not "div > span". In short,
			//		anything which does not invoke a descent to evaluate but
			//		can instead be used to test a single node is acceptable.
			//	returns:
			//		dojo.NodeList
			return; // dojo.NodeList
		},
		=====*/
		remove: dojo.NodeList.prototype.orphan,

		wrap: function(/*String||DOMNode*/html){
			// summary:
			// 		Wrap each node in the NodeList with html passed to wrap.
			// description:
			// 		html will be cloned if the NodeList has more than one
			// 		element. Only DOM nodes are cloned, not any attached
			// 		event handlers. The nodes in the current NodeList will
			// 		be returned, not the nodes from html.
			if(this[0]){
				html = makeWrapNode(html, this[0]);

				//Now cycle through the elements and do the insertion.
				for(var i = 0, node; node = this[i]; i++){
					//Always clone because if html is used to hold one of
					//the "this" nodes, then on the clone of html it will contain
					//that "this" node, and that would be bad.
					var clone = html.cloneNode(true);
					if(node.parentNode){
						node.parentNode.replaceChild(clone, node);
					}
					//Find deepest element and insert old node in it.
					var insertion = getWrapInsertion(clone);
					insertion.appendChild(node);
				}
			}
			return this; //dojo.NodeList
		},

		wrapAll: function(/*String||DOMNode*/html){
			// summary:
			// 		Insert html where the first node in this NodeList lives, then place all
			// 		nodes in this NodeList as the child of the html.
			// description:
			// 		The nodes in the current NodeList will be returned, not the nodes from html.
			if(this[0]){
				html = makeWrapNode(html, this[0]);

				//Place the wrap HTML in place of the first node.
				this[0].parentNode.replaceChild(html, this[0]);

				//Now cycle through the elements and move them inside
				//the wrap.
				var insertion = getWrapInsertion(html);
				for(var i = 0, node; node = this[i]; i++){
					insertion.appendChild(node);
				}
			}
			return this; //dojo.NodeList
		},

		wrapInner: function(/*String||DOMNode*/html){
			// summary:
			// 		For each node in the NodeList, wrap all its children with the passed in html.
			// description:
			// 		html will be cloned if the NodeList has more than one
			// 		element. Only DOM nodes are cloned, not any attached
			// 		event handlers. The nodes in the current NodeList will
			// 		be returned, not the nodes from html.
			if(this[0]){
				html = makeWrapNode(html, this[0]);
				for(var i = 0; i < this.length; i++){
					//Always clone because if html is used to hold one of
					//the "this" nodes, then on the clone of html it will contain
					//that "this" node, and that would be bad.
					var clone = html.cloneNode(true);
					
					//Need to convert the childNodes to an array since wrapAll modifies the
					//DOM and can change the live childNodes NodeList.
					dojo._NodeListCtor._wrap(dojo._toArray(this[i].childNodes)).wrapAll(clone);
				}
			}
			return this; //dojo.NodeList
		},

		replaceWith: function(/*String||DOMNode||NodeList*/content){
			// summary:
			// 		Replaces each node in ths NodeList with the content passed to replaceWith.
			// description:
			// 		The content will be cloned if the length of NodeList
			// 		is greater than 1. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the replacing content.
			// 		Note that the returned nodes have been removed from the DOM.
			content = normalizeInsertData(content, this[0]);
			for(var i = 0, node; node = this[i]; i++){
				place(content, node, "before", i > 0);
				node.parentNode.removeChild(node);
			}
			return this; //dojo.NodeList
		},

		replaceAll: function(/*String*/query){
			// summary:
			// 		replaces nodes matched by the query passed to replaceAll with the nodes
			// 		in this NodeList.
			// description:
			// 		The nodes in this NodeList will be cloned if the query
			// 		matches more than one element. Only the DOM nodes are cloned, not
			// 		any attached event handlers. The nodes currently in
			// 		this NodeList will be returned, not the matched nodes
			// 		from the query. Note that the returned nodes have been
			// 		removed from the DOM.
			var nl = dojo.query(query);
			var content = normalizeInsertData(this, this[0]);
			for(var i = 0, node; node = nl[i]; i++){
				place(content, node, "before", i > 0);
				node.parentNode.removeChild(node);
			}
			return this; //dojo.NodeList
		},

		clone: function(){
			// summary:
			// 		Clones all the nodes in this NodeList and returns them as a new NodeList.
			// description:
			// 		Only the DOM nodes are cloned, not any attached event handlers.

			//TODO: need option to clone events?
			var ary = [];
			for(var i = 0; i < this.length; i++){
				ary.push(this[i].cloneNode(true));
			}
			return dojo._NodeListCtor._wrap(ary, this); //dojo.NodeList
		}
	});

	//set up html method if one does not exist
	if(!dojo.NodeList.prototype.html){
		dojo.NodeList.prototype.html = dojo.NodeList.prototype.innerHTML;
	}
})();
