dojo.provide("dojo.behavior");

dojo.behavior = new function(){
	function arrIn(obj, name){
		if(!obj[name]){ obj[name] = []; }
		return obj[name];
	}

	var _inc = 0;

	function forIn(obj, scope, func){
		var tmpObj = {};
		for(var x in obj){
			if(typeof tmpObj[x] == "undefined"){
				if(!func){
					scope(obj[x], x);
				}else{
					func.call(scope, obj[x], x);
				}
			}
		}
	}

	// FIXME: need a better test so we don't exclude nightly Safari's!
	this.behaviors = {};
	this.add = function(behaviorObj){
		/*	behavior objects are specified in the following format:
		 *
		 *	{ 
		 *	 	"#id": {
		 *			"found": function(element){
		 *				// ...
		 *			},
		 *
		 *			"onblah": {targetObj: foo, targetFunc: "bar"},
		 *
		 *			"onblarg": "/foo/bar/baz/blarg",
		 *
		 *			"onevent": function(evt){
		 *			},
		 *
		 *			"onotherevent: function(evt){
		 *				// ...
		 *			}
		 *		},
		 *
		 *		"#id2": {
		 *			// ...
		 *		},
		 *
		 *		"#id3": function(element){
		 *			// ...
		 *		},
		 *
		 *		// publish the match on a topic
		 *		"#id4": "/found/topic/name",
		 *
		 *		// match all direct descendants
		 *		"#id4 > *": function(element){
		 *			// ...
		 *		},
		 *
		 *		// match the first child node that's an element
		 *		"#id4 > :first-child": { ... },
		 *
		 *		// match the last child node that's an element
		 *		"#id4 > :last-child":  { ... },
		 *
		 *		// all elements of type tagname
		 *		"tagname": {
		 *			// ...
		 *		},
		 *
		 *		"tagname1 tagname2 tagname3": {
		 *			// ...
		 *		},
		 *
		 *		".classname": {
		 *			// ...
		 *		},
		 *
		 *		"tagname.classname": {
		 *			// ...
		 *		},
		 *	}
		 *
		 *	The "found" method is a generalized handler that's called as soon
		 *	as the node matches the selector. Rules for values that follow also
		 *	apply to the "found" key.
		 *	
		 *	The "on*" handlers are attached with dojo.connect(). 
		 *
		 *	If the value corresponding to the ID key is a function and not a
		 *	list, it's treated as though it was the value of "found".
		 *
		 */

		var tmpObj = {};
		forIn(behaviorObj, this, function(behavior, name){
			var tBehavior = arrIn(this.behaviors, name);
			if(typeof tBehavior["id"] != "number"){
				tBehavior.id = _inc++;
			}
			var cversion = [];
			tBehavior.push(cversion);
			if((dojo.isString(behavior))||(dojo.isFunction(behavior))){
				behavior = { found: behavior };
			}
			forIn(behavior, function(rule, ruleName){
				arrIn(cversion, ruleName).push(rule);
			});
		});
	}

	this.apply = function(){
		forIn(this.behaviors, function(tBehavior, id){
			var elems = dojo.query(id);
			dojo.forEach(elems, 
				function(elem){
					var runFrom = 0;
					var bid = "_dj_behavior_"+tBehavior.id;
					if(typeof elem[bid] == "number"){
						runFrom = elem[bid];
						if(runFrom == (tBehavior.length-1)){
							return;
						}
					}
					// run through the versions, applying newer rules at each step

					for(var x=runFrom, tver; tver = tBehavior[x]; x++){
						forIn(tver, function(ruleSet, ruleSetName){
							if(dojo.isArray(ruleSet)){
								dojo.forEach(ruleSet, function(action){
									dojo.behavior.applyToNode(elem, action, ruleSetName);
								});
							}
						});
					}

					// ensure that re-application only adds new rules to the node
					elem[bid] = tBehavior.length-1;
				}
			);
		});
	}


	this.applyToNode = function(node, action, ruleSetName){
		if(dojo.isString(action)){
			// dojo.topic.registerPublisher(action, node, ruleSetName);
		}else if(dojo.isFunction(action)){
			if(ruleSetName == "found"){
				action(node);
			}else{
				dojo.connect(node, ruleSetName, action);
			}
		}
	}
}

dojo.addOnLoad(dojo.behavior, "apply");
