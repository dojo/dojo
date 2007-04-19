if(window["dojo"]){
	dojo.provide("tests._browserRunner");
}

// FIXME: need to add prompting for monkey-do testing
// FIXME: need to implement progress bar
// FIXME: need to implement errors in progress bar

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
				var lb = byId("logBody");
				if(lb){
					// clear the console before each run
					while(lb.firstChild){
						lb.removeChild(lb.firstChild);
					}
				}
				oi.apply(tests, arguments);
			}
		})(tests._init);

		if(this["opera"] && opera.postError){
			tests.debug = function(){
				var msg = "";
				for(var x=0; x<arguments.length; x++){
					msg += " "+arguments[x];
				}
				sendToLogPane([msg]);
				opera.postError("DEBUG:"+msg);
			}
		}else if(window["console"]){
			if(console.info){
				tests.debug = function(){
					sendToLogPane.call(window, arguments);
					console.debug.apply(console, arguments);
				}
			}else{
				tests.debug = function(){
					var msg = "";
					for(var x=0; x<arguments.length; x++){
						msg += " "+arguments[x];
					}
					sendToLogPane([msg]);
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
			if(!byId("testList")){ return; }
			var tb = byId("testList").tBodies[0];
			var tg = groupTemplate.cloneNode(true);
			var tds = tg.getElementsByTagName("td");
			var rolledUp = true;
			var toggle = tds[0];
			toggle.onclick = function(){
				var nodes = groupNodes[group].__items;
				if(rolledUp){
					rolledUp = false;
					for(var x=0; x<nodes.length; x++){
						nodes[x].style.display = "";
					}
					toggle.innerHTML = "&#054;";
				}else{
					rolledUp = true;
					for(var x=0; x<nodes.length; x++){
						nodes[x].style.display = "none";
					}
					toggle.innerHTML = "&#052;";
				}
			}
			var cb = tds[1].getElementsByTagName("input")[0];
			cb.group = group;
			cb.onclick = function(evt){
				tests._groups[group].skip = (!this.checked);
			}
			tds[2].innerHTML = group;
			tds[3].innerHTML = "";

			tb.appendChild(tg);
			return tg;
		}

		var addFixtureToList = function(group, fixture){
			if(!testTemplate){ return; }
			var cgn = groupNodes[group];
			if(!cgn["__items"]){ cgn.__items = []; }
			var tn = testTemplate.cloneNode(true);
			var tds = tn.getElementsByTagName("td");

			tds[2].innerHTML = fixture.name;
			tds[3].innerHTML = "";

			var nn = (cgn.__lastFixture||cgn.__groupNode).nextSibling;
			if(nn){
				nn.parentNode.insertBefore(tn, nn);
			}else{
				cgn.__groupNode.parentNode.appendChild(tn);
			}
			// FIXME: need to make group display toggleable!!
			tn.style.display = "none";
			cgn.__items.push(tn);
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
			// console.debug("_groupStarted", group);
			var gn = getGroupNode(group);
			if(gn){
				gn.className = "inProgress";
			}
		}

		tests._groupFinished = function(group, success){
			// console.debug("_groupFinished", group);
			var gn = getGroupNode(group);
			if(gn){
				gn.className = (success) ? "success" : "failure";
			}
		}

		tests._testStarted = function(group, fixture){
			// console.debug("_testStarted", group, fixture.name);
			var fn = getFixtureNode(group, fixture);
			if(fn){
				fn.className = "inProgress";
			}
			fixture.startTime = new Date();
		}

		var _nameTimes = {};
		var _playSound = function(name){
			if(byId("hiddenAudio")){
				var nt = _nameTimes[name];
				if((!nt)||(((new Date)-nt) > 700)){
					_nameTimes[name] = new Date();
					var tc = document.createElement("span");
					byId("hiddenAudio").appendChild(tc);
					tc.innerHTML = '<embed src="_sounds/'+name+'.wav" autostart="true" loop="false" hidden="true" width="1" height="1"></embed>';
				}
			}
		}

		tests._testFinished = function(group, fixture, success){
			var fn = getFixtureNode(group, fixture);
			if(fn){
				fn.getElementsByTagName("td")[3].innerHTML = ((new Date())-fixture.startTime)+"ms";
				fn.className = (success) ? "success" : "failure";

				if(!success){
					_playSound("doh");
				}
			}
			this.debug(((success) ? "PASSED" : "FAILED"), "test:", fixture.name);
		}

		// FIXME: move implementation to _browserRunner?
		tests.registerUrl = function(	/*String*/ group, 
										/*String*/ url, 
										/*Integer*/ timeout){
			var tg = new String(group);
			this.register(group, {
				name: url,
				setUp: function(){
					tests.currentGroupName = tg;
					tests.currentGroup = this;
					tests.currentUrl = url;
					this.d = new tests.Deferred();
					tests.currentTestDeferred = this.d;
					showTestPage();
					byId("testBody").src = url;
				},
				timeout: timeout||10000, // 10s
				// timeout: timeout||1000, // 10s
				runTest: function(){
					// FIXME: implement calling into the url's groups here!!
					return this.d;
				},
				tearDown: function(){
					tests.currentGroupName = null;
					tests.currentGroup = null;
					tests.currentTestDeferred = null;
					tests.currentUrl = null;
					// this.d.errback(false);
					// byId("testBody").src = "about:blank";
					showLogPage();
				}
			});
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
			if(!byId("testList")){ return; }
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
			if(loaded){ return; }
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
				tests._onEnd = function(){
					if(tests._failureCount == 0){
						tests.debug("WOOHOO!!");
						_playSound("woohoo");
					}else{
						console.debug("tests._failureCount:", tests._failureCount);
					}
					if(byId("play")){
						toggleRunning();
					}
				}
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

		_tests = window.parent.tests;
		var _thisGroup = _tests.currentGroupName;
		var _thisUrl = _tests.currentUrl;
		if(_thisGroup){
			tests._testRegistered = function(group, tObj){
				_tests._updateTestList(_thisGroup, tObj);
			}
			tests._onEnd = function(){
				_tests._errorCount += tests._errorCount;
				_tests._failureCount += tests._failureCount;
				_tests._testCount += tests._testCount;
				// should we be really adding raw group counts?
				_tests._groupCount += tests._groupCount;
				_tests.currentTestDeferred.callback(true);
			}
			var otr = tests._getTestObj;
			tests._getTestObj = function(){
				var tObj = otr.apply(tests, arguments);
				tObj.name = _thisUrl+"::"+arguments[0]+"::"+tObj.name;
				return tObj;
			}
			tests.debug = tests.hitch(_tests, "debug");
			tests.registerUrl = tests.hitch(_tests, "registerUrl");
			tests._testStarted = function(group, fixture){
				_tests._testStarted(_thisGroup, fixture);
			}
			tests._testFinished = function(g, f, s){
				_tests._testFinished(_thisGroup, f, s);
			}
			tests._report = function(){};
		}
	}

})();
