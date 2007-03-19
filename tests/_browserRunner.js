if(window["dojo"]){
	dojo.provide("tests._browserRunner");
}

// FIXME: need to "look up" to see what we should define/redefine if we're
// loaded in the child iframe for testing.
// FIXME: need to add prompting for monkey-do testing
// FIXME: need to implement progress bar
// FIXME: need to implement errors in progress bar
// FIXME: need to implement run/log tabs

(function(){
	if(window.parent == window){
		// we're the top-dog window.

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

			if((window["dojo"])&&(type == "load")){
				dojo.addOnLoad(enclosedFunc);
			}else{
				if(window["attachEvent"]){
					window.attachEvent("on"+type, enclosedFunc);
				}else if(window["addEventListener"]){
					window.addEventListener(type, enclosedFunc, false);
				}else if(document["addEventListener"]){
					document.addEventListener(type, enclosedFunc, false);
				}
			}
		};

		//
		// Over-ride or implement base runner.js-provided methods
		//
		var _logBacklog = [];
		var sendToLogPane = function(args, skip){
			var msg = "";
			for(var x=0; x<args.length; x++){
				msg += " "+args[x];
			}
			// workarounds for IE. Wheeee!!!
			msg = msg.replace("\t", "&nbsp;&nbsp;&nbsp;&nbsp;");
			msg = msg.replace(" ", "&nbsp;");
			msg = msg.replace("\n", "<br>&nbsp;");
			if(!byId("logBody")){
				_logBacklog.push(msg);
				return;
			}else if((_logBacklog.length)&&(!skip)){
				var tm;
				while(tm=_logBacklog.shift()){
					sendToLogPane(tm, true);
				}
			}
			var tn = document.createElement("div");
			tn.innerHTML = msg;
			byId("logBody").appendChild(tn);
		}

		tests._init = (function(oi){
			return function(){
				oi.apply(tests, arguments);
				var lb = byId("logBody");
				if(lb){
					// clear the console before each run
					while(lb.firstChild){
						lb.removeChild(lb.firstChild);
					}
				}
			}
		})(tests._init);

		if(window["console"]){
			if(console.info){
				tests.debug = function(){
					sendToLogPane.call(window, arguments);
					console.debug.apply(console, arguments);
				}
			}else{
				tests.debug = function(){
					sendToLogPane.apply(window, arguments);
					var msg = "";
					for(var x=0; x<arguments.length; x++){
						msg += " "+arguments[x];
					}
					console.log("DEBUG:"+msg);
				}
			}
		}else{
			tests.debug = function(){
				sendToLogPane.call(window, arguments);
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

			tb.appendChild(tg);
			return tg;
		}

		var addFixtureToList = function(group, fixture){
			var cgn = groupNodes[group];
			var tn = testTemplate.cloneNode(true);
			var tds = tn.getElementsByTagName("td");

			tds[1].innerHTML = fixture.name;
			tds[2].innerHTML = "";

			var nn = (cgn.__lastFixture||cgn.__groupNode).nextSibling;
			if(nn){
				nn.parentNode.insertBefore(tn, nn);
			}else{
				cgn.__groupNode.parentNode.appendChild(tn);
			}
			return cgn.__lastFixture = tn;
		}

		var getFixtureNode = function(group, fixture){
			if(groupNodes[group]){
				return groupNodes[group][fixture.name];
			}
			return null;
		}

		var getGroupNode = function(group){
			if(groupNodes[group]){
				return groupNodes[group].__groupNode;
			}
			return null;
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

		tests._groupStarted = function(group){
			getGroupNode(group).className = "inProgress";
		}

		tests._groupFinished = function(group, success){
			getGroupNode(group).className = (success) ? "success" : "failure";
		}

		tests._testStarted = function(group, fixture){
			getFixtureNode(group, fixture).className = "inProgress";
			fixture.startTime = new Date();
		}

		tests._testFinished = function(group, fixture, success){
			this.debug(((success) ? "PASSED" : "FAILED"), "test:", fixture.name);
			var fn = getFixtureNode(group, fixture);
			fn.className = (success) ? "success" : "failure";
			fn.getElementsByTagName("td")[2].innerHTML = ((new Date())-fixture.startTime)+"ms";
		}

		// 
		// Utility code for runner.html
		//
		// var isSafari = navigator.appVersion.indexOf("Safari") >= 0;
		var tabzidx = 1;
		var _showTab = function(toShow, toHide){
			// FIXME: I don't like hiding things this way.
			byId(toHide).style.display = "none";
			with(byId(toShow).style){
				display = "";
				zIndex = ++tabzidx;
			}
		}

		showTestPage = function(){
			_showTab("testBody", "logBody");
		}

		showLogPage = function(){
			_showTab("logBody", "testBody");
		}

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
			if(!tl){ return; }
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
			if(!groupTemplate){ 
				// make sure we've got an ammenable DOM structure
				return;
			}
			groupTemplate.parentNode.removeChild(groupTemplate);
			groupTemplate.style.display = "";
			testTemplate = byId("testTemplate");
			testTemplate.parentNode.removeChild(testTemplate);
			testTemplate.style.display = "";
			tests._updateTestList();
		});

		_addOnEvt("load", 
			function(){
				if(!byId("play")){ 
					// make sure we've got an ammenable DOM structure
					return;
				}
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
				tests.run = (function(oldRun){
					return function(){
						toggleRunning();
						return oldRun.apply(tests, arguments);
					}
				})(tests.run);
				var btns = byId("toggleButtons").getElementsByTagName("span");
				var node; var idx=0;
				while(node=btns[idx++]){
					node.onclick = toggleRunning;
				}
			}
		);
	}else{
		// we're in an iframe environment. Time to mix it up a bit.
		tests = window.parent.tests;
	}

})();
