define(["./_base/kernel", "./_base/lang", "./dom"], function(dojo, lang, dom){
	// module:
	//		dojo/dom-class
	// summary:
	//		This module defines the core dojo DOM class API.

	//TODO: use HTML5 class list methods, example: http://github.com/uxebu/embedjs/blob/master/src/html/classList.js

	// =============================
	// (CSS) Class Functions
	// =============================
	var _className = "className";

	dojo.hasClass = function(/*DomNode|String*/node, /*String*/classStr){
		// summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node.
		//
		// node:
		//		String ID or DomNode reference to check the class for.
		//
		// classStr:
		//		A string class name to look for.
		//
		// example:
		//		Do something if a node with id="someNode" has class="aSillyClassName" present
		//	|	if(dojo.hasClass("someNode","aSillyClassName")){ ... }

		return ((" " + dom.byId(node)[_className] + " ").indexOf(" " + classStr + " ") >= 0); // Boolean
	};

	var spaces = /\s+/, a1 = [""],
		fakeNode = {},
		str2array = function(s){
			if(typeof s == "string" || s instanceof String){
				if(s.indexOf(" ") < 0){
					a1[0] = s;
					return a1;
				}else{
					return s.split(spaces);
				}
			}
			// assumed to be an array
			return s || "";
		};

	dojo.addClass = function(/*DomNode|String*/node, /*String|Array*/classStr){
		// summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node. Will not re-apply duplicate classes.
		//
		// node:
		//		String ID or DomNode reference to add a class string too
		//
		// classStr:
		//		A String class name to add, or several space-separated class names,
		//		or an array of class names.
		//
		// example:
		//		Add a class to some node:
		//	|	dojo.addClass("someNode", "anewClass");
		//
		// example:
		//		Add two classes at once:
		//	|	dojo.addClass("someNode", "firstClass secondClass");
		//
		// example:
		//		Add two classes at once (using array):
		//	|	dojo.addClass("someNode", ["firstClass", "secondClass"]);
		//
		// example:
		//		Available in `dojo.NodeList` for multiple additions
		//	|	dojo.query("ul > li").addClass("firstLevel");

		node = dom.byId(node);
		classStr = str2array(classStr);
		var cls = node[_className], oldLen;
		cls = cls ? " " + cls + " " : " ";
		oldLen = cls.length;
		for(var i = 0, len = classStr.length, c; i < len; ++i){
			c = classStr[i];
			if(c && cls.indexOf(" " + c + " ") < 0){
				cls += c + " ";
			}
		}
		if(oldLen < cls.length){
			node[_className] = cls.substr(1, cls.length - 2);
		}
	};

	dojo.removeClass = function(/*DomNode|String*/node, /*String|Array?*/classStr){
		// summary:
		//		Removes the specified classes from node. No `dojo.hasClass`
		//		check is required.
		//
		// node:
		//		String ID or DomNode reference to remove the class from.
		//
		// classStr:
		//		An optional String class name to remove, or several space-separated
		//		class names, or an array of class names. If omitted, all class names
		//		will be deleted.
		//
		// example:
		//		Remove a class from some node:
		//	|	dojo.removeClass("someNode", "firstClass");
		//
		// example:
		//		Remove two classes from some node:
		//	|	dojo.removeClass("someNode", "firstClass secondClass");
		//
		// example:
		//		Remove two classes from some node (using array):
		//	|	dojo.removeClass("someNode", ["firstClass", "secondClass"]);
		//
		// example:
		//		Remove all classes from some node:
		//	|	dojo.removeClass("someNode");
		//
		// example:
		//		Available in `dojo.NodeList()` for multiple removal
		//	|	dojo.query(".foo").removeClass("foo");

		node = dom.byId(node);
		var cls;
		if(classStr !== undefined){
			classStr = str2array(classStr);
			cls = " " + node[_className] + " ";
			for(var i = 0, len = classStr.length; i < len; ++i){
				cls = cls.replace(" " + classStr[i] + " ", " ");
			}
			cls = lang.trim(cls);
		}else{
			cls = "";
		}
		if(node[_className] != cls){ node[_className] = cls; }
	};

	dojo.replaceClass = function(/*DomNode|String*/node, /*String|Array*/addClassStr, /*String|Array?*/removeClassStr){
		// summary:
		//		Replaces one or more classes on a node if not present.
		//		Operates more quickly than calling dojo.removeClass and dojo.addClass
		// node:
		//		String ID or DomNode reference to remove the class from.
		// addClassStr:
		//		A String class name to add, or several space-separated class names,
		//		or an array of class names.
		// removeClassStr:
		//		A String class name to remove, or several space-separated class names,
		//		or an array of class names.
		//
		// example:
		//	|	dojo.replaceClass("someNode", "add1 add2", "remove1 remove2");
		//
		// example:
		//	Replace all classes with addMe
		//	|	dojo.replaceClass("someNode", "addMe");
		//
		// example:
		//	Available in `dojo.NodeList()` for multiple toggles
		//	|	dojo.query(".findMe").replaceClass("addMe", "removeMe");

		node = dom.byId(node);
		fakeNode[_className] = node[_className];

		dojo.removeClass(fakeNode, removeClassStr);
		dojo.addClass(fakeNode, addClassStr);

		if(node[_className] !== fakeNode[_className]){
			node[_className] = fakeNode[_className];
		}
	};

	dojo.toggleClass = function (/*DomNode|String*/node, /*String|Array*/classStr, /*Boolean?*/condition){
		// summary:
		//		Adds a class to node if not present, or removes if present.
		//		Pass a boolean condition if you want to explicitly add or remove.
		//      Returns the condition that was specified directly or indirectly.
		// condition:
		//		If passed, true means to add the class, false means to remove.
		//
		// example:
		//	|	dojo.toggleClass("someNode", "hovered");
		//
		// example:
		//		Forcefully add a class
		//	|	dojo.toggleClass("someNode", "hovered", true);
		//
		// example:
		//		Available in `dojo.NodeList()` for multiple toggles
		//	|	dojo.query(".toggleMe").toggleClass("toggleMe");

		if(condition === undefined){
			condition = !dojo.hasClass(node, classStr);
		}
		dojo[condition ? "addClass" : "removeClass"](node, classStr);
		return condition;   // Boolean
	};

	// FIXME: module return names don't match globals. how TODOC
	return {
		has:     dojo.hasClass,
		add:     dojo.addClass,
		remove:  dojo.removeClass,
		replace: dojo.replaceClass,
		toggle:  dojo.toggleClass
	};
});
