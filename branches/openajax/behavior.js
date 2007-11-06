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
	this._behaviors = {};
	this.add = function(behaviorObj){
		//	summary:
		//		add the specified behavior to the list of behaviors which will
		//		be applied the next time apply() is called. Calls to add() for
		//		an already existing behavior do not replace the previous rules,
		//		but are instead additive. New nodes which match the rule will
		//		have all add()-ed behaviors applied to them when matched.
		//
		//	description:
		//		behavior objects are specified in the following format(s):
		//		
		//			{ 
		//			 	"#id": {
		//					"found": function(element){
		//						// ...
		//					},
		//			
		//					"onblah": {targetObj: foo, targetFunc: "bar"},
		//			
		//					"onblarg": "/foo/bar/baz/blarg",
		//			
		//					"onevent": function(evt){
		//					},
		//			
		//					"onotherevent: function(evt){
		//						// ...
		//					}
		//				},
		//			
		//				"#id2": {
		//					// ...
		//				},
		//			
		//				"#id3": function(element){
		//					// ...
		//				},
		//			
		//				// publish the match on a topic
		//				"#id4": "/found/topic/name",
		//			
		//				// match all direct descendants
		//				"#id4 > *": function(element){
		//					// ...
		//				},
		//			
		//				// match the first child node that's an element
		//				"#id4 > :first-child": { ... },
		//			
		//				// match the last child node that's an element
		//				"#id4 > :last-child":  { ... },
		//			
		//				// all elements of type tagname
		//				"tagname": {
		//					// ...
		//				},
		//			
		//				"tagname1 tagname2 tagname3": {
		//					// ...
		//				},
		//			
		//				".classname": {
		//					// ...
		//				},
		//			
		//				"tagname.classname": {
		//					// ...
		//				},
		//			}
		//		
		//		The "found" method is a generalized handler that's called as soon
		//		as the node matches the selector. Rules for values that follow also
		//		apply to the "found" key.
		//		
		//		The "on*" handlers are attached with dojo.connect(). 
		//		
		//		If the value corresponding to the ID key is a function and not a
		//		list, it's treated as though it was the value of "found".

		var tmpObj = {};
		forIn(behaviorObj, this, function(behavior, name){
			var tBehavior = arrIn(this._behaviors, name);
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

	var _applyToNode = function(node, action, ruleSetName){
		if(dojo.isString(action)){
			if(ruleSetName == "found"){
				dojo.publish(action, [ node ]);
			}else{
				dojo.connect(node, ruleSetName, function(){
					dojo.publish(action, arguments);
				});
			}
		}else if(dojo.isFunction(action)){
			if(ruleSetName == "found"){
				action(node);
			}else{
				dojo.connect(node, ruleSetName, action);
			}
		}
	}

	this.apply = function(){
		// summary:
		//		applies all currently registered behaviors to the document,
		//		taking care to ensure that only incremental updates are made
		//		since the last time add() or apply() were called. If new
		//		matching nodes have been added, all rules in a behavior will be
		//		applied to that node. For previously matched nodes, only
		//		behaviors which have been added since the last call to apply()
		//		will be added to the nodes.
		forIn(this._behaviors, function(tBehavior, id){
			dojo.query(id).forEach( 
				function(elem){
					var runFrom = 0;
					var bid = "_dj_behavior_"+tBehavior.id;
					if(typeof elem[bid] == "number"){
						runFrom = elem[bid];
						// console.debug(bid, runFrom);
						if(runFrom == (tBehavior.length)){
							return;
						}
					}
					// run through the versions, applying newer rules at each step

					for(var x=runFrom, tver; tver = tBehavior[x]; x++){
						// console.debug(tver);
						forIn(tver, function(ruleSet, ruleSetName){
							if(dojo.isArray(ruleSet)){
								dojo.forEach(ruleSet, function(action){
									_applyToNode(elem, action, ruleSetName);
								});
							}
						});
					}

					// ensure that re-application only adds new rules to the node
					elem[bid] = tBehavior.length;
				}
			);
		});
	}
}

dojo.addOnLoad(dojo.behavior, "apply");
