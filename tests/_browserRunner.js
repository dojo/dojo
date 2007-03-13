if(this["dojo"]){
	dojo.provide("tests._browserRunner");
}

(function(){
	// borrowed from Dojo, etc.
	var byId = function(id){
		return document.getElementById(id);
	}

	var _addOnEvt = function(	type,		// string
								refOrName,	// function or string
								scope){		// object, defaults is window

		if(!scope){ scope = window; }

		var funcRef = refOrName;
		if(typeof refOrName == "string"){
			funcRef = scope[refOrName];
		}
		var enclosedFunc = function(){ return funcRef.apply(scope, arguments); };

		if(window["attachEvent"]){
			window.attachEvent("on"+type, enclosedFunc);
		}else if(window["addEventListener"]){
			window.addEventListener(type, enclosedFunc, false);
		}else if(document["addEventListener"]){
			document.addEventListener(type, enclosedFunc, false);
		}
	};

	//
	// Over-ride or implement base runner.js-provided methods
	//
	if(window["console"]){
		if(console.info){
			tests.debug = console.debug;
		}else{
			tests.debug = function(){
				var msg = "";
				for(var x=0; x<arguments.length; x++){
					msg += " "+arguments[x];
				}
				console.log("DEBUG:"+msg);
			}
		}
	}

	var loaded = false;
	var groupTemplate = null;
	var testTemplate = null;

	var groupNodes = {};

	var addGroupToList = function(group){
		var tb = byId("testList").tBodies[0];
		var tg = groupTemplate.cloneNode(true);
		var tds = tg.getElementsByTagName("td");
		var cb = tds[0].getElementsByTagName("input")[0];
		cb.group = group;
		cb.onclick = function(evt){
			tests._groups[group].skip = (!this.checked);
		}
		tds[1].innerHTML = group;
		tds[2].innerHTML = "";
		tds[3].innerHTML = "";

		tb.appendChild(tg);
		return tg;
	}

	var addFixtureToList = function(group, fixture){
		var cgn = groupNodes[group];
		var tn = testTemplate.cloneNode(true);
		var tds = tn.getElementsByTagName("td");

		tds[1].innerHTML = fixture.name;
		tds[2].innerHTML = "";
		tds[3].innerHTML = "";

		var nn = (cgn.__lastFixture||cgn.__groupNode).nextSibling;
		if(nn){
			nn.parentNode.insertBefore(tn, nn);
		}else{
			cgn.__groupNode.parentNode.appendChild(tn);
		}
		return cgn.__lastFixture = tn;
	}

	var getFixtureNode = function(group, fixture){
	}

	var getGroupNode = function(group){
		if(groupNodes[group]){
		}
	}

	var updateBacklog = [];
	tests._updateTestList = function(group, fixture, unwindingBacklog){
		if(!loaded){
			if(group && fixture){
				updateBacklog.push([group, fixture]);
			}
			return;
		}else if((updateBacklog.length)&&(!unwindingBacklog)){
			var tr;
			while(tr=updateBacklog.shift()){
				tests._updateTestList(tr[0], tr[1], true);
			}
		}
		if(group && fixture){
			if(!groupNodes[group]){
				groupNodes[group] = {
					"__groupNode": addGroupToList(group)
				};
			}
			if(!groupNodes[group][fixture.name]){
				groupNodes[group][fixture.name] = addFixtureToList(group, fixture)
			}
		}
	}

	tests._testRegistered = tests._updateTestList;

	// FIXME: need to add prompting for monkey-do testing

	// 
	// Utility code for runner.html
	//
	var runAll = true;
	toggleRunAll = function(){
		// would be easier w/ query...sigh
		runAll = (!runAll);
		var tb = byId("testList").tBodies[0];
		var inputs = tb.getElementsByTagName("input");
		var x=0; var tn;
		while(tn=inputs[x++]){
			tn.checked = runAll;
			tests._groups[tn.group].skip = (!runAll);
		}
	}

	var listHeightTimer = null;
	var setListHeight = function(){
		if(listHeightTimer){
			clearTimeout(listHeightTimer);
		}
		var tl = byId("testList");
		listHeightTimer = setTimeout(function(){
			tl.style.display = "none";
			tl.style.display = "";

		}, 10);
	}

	_addOnEvt("resize", setListHeight);
	_addOnEvt("load", setListHeight);
	_addOnEvt("load", function(){
		loaded = true;
		groupTemplate = byId("groupTemplate");
		groupTemplate.parentNode.removeChild(groupTemplate);
		groupTemplate.style.display = "";
		testTemplate = byId("testTemplate");
		testTemplate.parentNode.removeChild(testTemplate);
		testTemplate.style.display = "";
		tests._updateTestList();
	});

	_addOnEvt("load", 
		function(){
			var isRunning = false;
			var toggleRunning = function(){
				// ugg, this would be so much better w/ dojo.query()
				if(isRunning){
					byId("play").style.display = byId("pausedMsg").style.display = "";
					byId("playingMsg").style.display = byId("pause").style.display = "none";
					isRunning = false;
				}else{
					byId("play").style.display = byId("pausedMsg").style.display = "none";
					byId("playingMsg").style.display = byId("pause").style.display = "";
					isRunning = true;
				}
			}
			tests._onEnd = toggleRunning;
			var btns = byId("toggleButtons").getElementsByTagName("span");
			var node; var idx=0;
			while(node=btns[idx++]){
				node.onclick = toggleRunning;
			}
		}
	);

})();
