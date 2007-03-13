// FIXME: need to add async tests
// FIXME: need to handle URL wrapping and test registration/running from URLs

// package system gunk. 
if(this["dojo"]){
	// Ensure we can run w/o Dojo in a Rhino or SM environment
	dojo.provide("tests.runner");
}else if(!this["tests"]){
	tests = {};
}

//
// Utility Functions and Classes
//

tests._line = "------------------------------------------------------------";

/*
tests._delegate = function(obj, props){
	// boodman-crockford delegation
	function TMP(){};
	TMP.prototype = obj;
	var tmp = new TMP();
	if(props){
		dojo.lang.mixin(tmp, props);
	}
	return tmp;
}
*/

tests.debug = function(){
	// summary:
	//		takes any number of arguments and sends them to whatever debugging
	//		or logging facility is available in this environment

	// YOUR TEST RUNNER NEEDS TO IMPLEMENT THIS
}

tests._AssertFailure = function(msg){
	// idea for this as way of dis-ambiguating error types is from JUM. 
	// The JUM is dead! Long live the JUM!

	if(!(this instanceof tests._AssertFailure)){
		return new tests._AssertFailure(msg);
	}
	this.message = new String(msg||"");
	return this;
}
tests._AssertFailure.prototype = new Error();
tests._AssertFailure.prototype.constructor = tests._AssertFailure;
tests._AssertFailure.prototype.name = "tests._AssertFailure";

//
// State Keeping and Reporting
//

tests._testCount = 0;
tests._errorCount = 0;
tests._failureCount = 0;
tests._passedCount = 0;
tests._currentGroup = null;
tests._currentTest = null;
tests._paused = true;

tests._init = function(){
	this._currentGroup = null;
	this._currentTest = null;
	this._errorCount = 0;
	this._failureCount = 0;
	this._passedCount = 0;
}

// tests._urls = [];
tests._groups = {};

//
// Test Registration
//

tests.registerTestNs = function(/*String*/ group, /*Object*/ ns){
	// summary:
	//		adds the passed namespace object to the list of objects to be
	//		searched for test groups. Only "public" functions (not prefixed
	//		with "_") will be added as tests to be run. If you'd like to use
	//		fixtures (setUp(), tearDown(), and runTest()), please use
	//		registerTest() or registerTests().
	for(var x in ns){
		if(	(x.charAt(0) == "_") &&
			(typeof ns[x] == "function") ){
			this.registerTest(group, ns[x]);
		}
	}
}

tests._testRegistered = function(group, fixture){
	// slot to be filled in
}

tests._groupStarted = function(group){
	// slot to be filled in
}

tests._groupFinished = function(group, success){
	// slot to be filled in
}

tests._testStarted = function(group, fixture){
	// slot to be filled in
}

tests._testFinished = function(group, fixture, success){
	// slot to be filled in
}

tests.registerTest = function(/*String*/ group, /*Function or Object*/ test){
	// summary:
	//		add the provided test function or fixture object to the specified
	//		test group.
	// group:
	//		string name of the group to add the test to
	// test:
	//		either a function or an object. If an object, it must contain at
	//		*least* a "runTest" method, and may also contain "setUp" and
	//		"tearDown" methods. These will be invoked on either side of the
	//		"runTest" method (respectively) when the test is run.
	if(!this._groups[group]){
		this._groups[group] = [];
	}
	var tObj = test;
	if(typeof test == "function"){
		// if we didn't get a fixture, wrap the function
		tObj = { "runTest": test };
		if(test["name"]){
			tObj.name = test.name;
		}else{
			try{
				tests.debug(tObj.runTest.toSource());
			}catch(e){
			}
		}
		// FIXME: try harder to get the test name here
	}
	this._groups[group].push(tObj);
	this._testCount++;
	this._testRegistered(group, tObj);
}

tests.registerTests = function(/*String*/ group, /*Array*/ testArr){
	// summary:
	//		registers a group of tests, treating each element of testArr as
	//		though it were being (along with group) passed to the registerTest
	//		method.
	for(var x=0; x<testArr.length; x++){
		this.registerTest(group, testArr[x]);
	}
}

tests.registerTestUrl = function(/*String*/ group, /*String*/ url){
	this.debug("ERROR:");
	this.debug("\tNO registerTestUrl() METHOD AVAILABLE.");
	// this._urls.push(url);
}

tests.add = function(groupOrNs, testOrNull){
	// summary:
	// 		"magical" variant of registerTests, registerTest, and
	// 		registerTestNs. Will accept the calling arguments of any of these
	// 		methods and will correctly guess the right one to register with.
	if(	(arguments.length == 1)&&
		(typeof groupOrNs == "string") ){
		this.registerTestUrl(groupOrNs);
	}
	if(arguments.length == 1){
		this.debug("invalid args passed to tests.add():", groupOrNs, ",", testOrNull);
		return;
	}
	if(typeof testOrNull == "string"){
		this.registerTestNs(groupOrNs, testOrNull);
		return;
	}
	if(	tests._isArray(testOrNull) ){
		this.registerTests(groupOrNs, testOrNull);
		return;
	}
	this.registerTest(groupOrNs, testOrNull);
}

//
// Assertions and In-Test Utilities
//

tests.isTrue = function(/*Object*/ condition){
	// summary:
	//		is the passed item "truthy"?
	if(!eval(condition)){
		throw tests._AssertFailure("isTrue('" + condition + "') failed");
	}
}

tests.isFalse = function(/*Object*/ condition){
	// summary:
	//		is the passed item "falsey"?
	if(eval(condition)){
		throw tests._AssertFailure("isFalse('" + condition + "') failed");
	}
}

tests.isEq = function(/*Object*/ expected, /*Object*/ actual){
	// summary:
	//		are the passed expected and actual objects/values deeply
	//		equivalent?
	if((expected == undefined)&&(actual == undefined)){ 
		return true;
	}
	if(expected === actual){
		return true;
	}
	if(expected == actual){ 
		return true;
	}
	if(	(this._isArray(expected) && this._isArray(actual))&&
		(this._arrayEq(expected, actual)) ){
		return true;
	}
	if( ((typeof expected == "object")&&((typeof actual == "object")))&&
		(this._objPropEq(expected, actual)) ){
		return true;
	}
	throw new tests._AssertFailure("isEq() failed: expected |"+expected+"| but got |"+actual+"|");
}

tests._arrayEq = function(expected, actual){
	if(expected.length != actual.length){ return false; }
	// FIXME: we're not handling circular refs. Do we care?
	for(var x=0; x<expected.length; x++){
		if(!tests.isEq(expected[x], actual[x])){ return false; }
	}
	return true;
}

tests._objPropEq = function(expected, actual){
	for(var x in expected){
		if(!tests.isEq(expected[x], actual[x])){
			return false;
		}
	}
}

tests._isArray = function(arr){
	return ((arr instanceof Array)||(typeof arr == "array") );
}

//
// Runner-Wrapper
//

tests._setupGroupForRun = function(/*String*/ groupName, /*Integer*/ idx){
}

tests.runGroup = function(/*String*/ groupName, /*Integer*/ idx){
	// summary:
	//		runs the specified test group

	var tg = this._groups[groupName];
	if(tg.skip === true){ return; }
	if(this._isArray(tg)){
		this._setupGroupForRun(groupName, idx);
		this.debug(this._line, "\nGROUP", "\""+groupName+"\"", "has", tg.length, "test"+((tg.length > 1) ? "s" : "")+" to run");
		for(var y=(idx||0); y<tg.length; y++){
			if(this._paused){
				this._currentTest = y;
				this.debug("PAUSED at", this._currentGroup, this._currentTest);
				return;
			}
			var tt = tg[y];
			var threw = false;
			// run it, catching exceptions and reporting them
			try{
				if(tt["setUp"]){ tt.setUp(this); }
				if(tt["runTest"]){ tt.runTest(this); }
				if(tt["tearDown"]){ tt.tearDown(this); }
				this._passedCount++;
			}catch(e){
				var threw = true;
				this.debug("FAILED test:", y);
				// mostly borrowed from JUM
				var out = "";
				if(e instanceof this._AssertFailure){
					this._failureCount++;
					if(e["fileName"]){ out += e.fileName + ':'; }
					if(e["lineNumber"]){ out += e.lineNumber + ' '; }
					out += e.message;
					this.debug("\t_AssertFailure:", out);
				}else{
					this._errorCount++;
				}
				// this.debug(e);
				if(tt.runTest["toSource"]){
					var ss = tt.runTest.toSource();
					// var ss = tt.runTest.toSource().split("{", 2)[1];
					// ss = ss.substr(0, ss.lastIndexOf("}"));
					this.debug("\tERROR IN:\n\t\t", ss);
				}
				/*
				for(var x in e){
					this.debug("\t", x, ":", x[e]);
				}
				throw e;
				*/
			}
			if(!threw){
				this.debug("PASSED test:", y);
			}
		}
	}
}

tests._onEnd = function(){}

tests._report = function(){
	// summary:
	//		a private method to be implemented/replaced by the "locally
	//		appropriate" test runner
	this.debug("ERROR:");
	this.debug("\tNO REPORTING OUTPUT AVAILABLE.");
	this.debug("\tIMPLEMENT tests._report() IN YOUR TEST RUNNER");
}

tests.togglePaused = function(){
	this[(this._paused) ? "run" : "pause"]();
}

tests.pause = function(){
	// summary:
	//		halt test run. Can be resumed.
	this._paused = true;
}

tests.run = function(){
	// summary:
	//		begins or resumes the test process.
	this.debug("STARTING");
	this._paused = false;
	var cg = this._currentGroup;
	var ct = this._currentTest;
	var found = false;
	if(!cg){
		this._init(); // we weren't paused
		found = true;
	}
	this._currentGroup = null;
	this._currentTest = null;

	for(var x in this._groups){
		if(
			( (!found)&&(x == cg) )||( found )
		){
			if(this._paused){ return; }
			this._currentGroup = x;
			if(!found){
				found = true;
				this.runGroup(x, ct);
			}else{
				this.runGroup(x);
			}
		}
	}
	this._currentGroup = null;
	this._currentTest = null;
	this._paused = true;
	this._onEnd();
	this._report();
}

if(this["dojo"]){
	dojo.compoundRequire({
		browser: ["tests._browserRunner"],
		rhino: ["tests._rhinoRunner"]
	});
	dojo.require("tests._base");
	dojo.addOnLoad(tests.runner, "run");
	// set us up for a run
}else if(this["load"]){
	load("_rhinoRunner.js");
	load("_base.js");

	print("\n"+tests._line);
	print("The Dojo Unit Test Harness, $Rev$");
	print("Copyright (c) 2007, The Dojo Foundation, All Rights Reserved");
	print(tests._line, "\n");

	tests.run();
}
