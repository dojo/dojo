dojo.provide("dojo.robotx");
dojo.require("dojo.robot");
dojo.experimental("dojo.robotx");

// loads an external app into an iframe and points dojo.doc to the iframe document, allowing the robot to control it
// to use: set robotURL in djConfig to the URL you want to load
// dojo.require this file

(function(){
// have to wait for test page to load before testing!
doh.robot._runsemaphore.lock.push("dojo.robotx.lock");

var iframe = document.getElementById('robotapplication');

var groupStarted=dojo.connect(doh, '_groupStarted', function(){
	dojo.disconnect(groupStarted);
	iframe.style.visibility="visible";
});

var onIframeLoad=function(){
	//iframe = document.getElementById('robotapplication');
	doh.robot._updateDocument();
	onIframeLoad = null;
	var scrollRoot = (document.compatMode == 'BackCompat')? document.body : document.documentElement;
	var consoleHeight = document.getElementById('robotconsole').offsetHeight;
	if(consoleHeight){
		iframe.style.height = (scrollRoot.clientHeight - consoleHeight)+"px";
	}
	doh.run();
};

var iframeLoad=function(){
	if(onIframeLoad){
		onIframeLoad();
	}
	var unloadConnect = dojo.connect(dojo.body(), 'onunload', function(){
		dojo.global = window;
		dojo.doc = document;
		dojo.disconnect(unloadConnect);
	});
};

// write the firebug console to a place it will fit
dojo.config.debugContainerId = "robotconsole";
dojo.config.debugHeight = dojo.config.debugHeight || 200;
document.write('<div id="robotconsole" style="position:absolute;left:0px;bottom:0px;width:100%;"></div>');

// write the iframe
//document.writeln('<iframe id="robotapplication" style="visibility:hidden; border:0px none; padding:0px; margin:0px; position:absolute; left:0px; top:0px; width:100%; height:100%; z-index: 1;" src="'+dojo.config.robotURL+'" onload="iframeLoad();" ></iframe>');
iframe = document.createElement('iframe');
iframe.setAttribute("ALLOWTRANSPARENCY","true");
iframe.scrolling = dojo.isIE? "yes" : "auto";
dojo.style(iframe,{visibility:'hidden', border:'0px none', padding:'0px', margin:'0px', position:'absolute', left:'0px', top:'0px', width:'100%', height:'100%'});
if(iframe['attachEvent'] !== undefined){
	iframe.attachEvent('onload', iframeLoad);
}else{
	dojo.connect(iframe, 'onload', iframeLoad);
}

dojo.mixin(doh.robot,{
	_updateDocument: function(){
		dojo.setContext(iframe.contentWindow, iframe.contentWindow.document);
		var win = dojo.global;
		if(win["dojo"]){
			// allow the tests to subscribe to topics published by the iframe
			dojo._topics = win.dojo._topics;
		}
		 
	},

	initRobot: function(/*String*/ url){
		// summary:
		//		Opens the application at the specified URL for testing, redirecting dojo to point to the application environment instead of the test environment.
		//
		// url:
		//		URL to open. Any of the test's dojo.doc calls (e.g. dojo.byId()), and any dijit.registry calls (e.g. dijit.byId()) will point to elements and widgets inside this application.
		//
		iframe.src=url;
		dojo.addOnLoad(function(){
			var emptyStyle = {
				overflow: dojo.isWebKit? 'hidden' : 'visible',
				margin: '0px',
				borderWidth: '0px',
				height: '100%',
				width: '100%'
			};
			dojo.style(document.documentElement, emptyStyle);
			dojo.style(document.body, emptyStyle);
			document.body.appendChild(iframe);
			var base=document.createElement('base');
			base.href=url;
			document.getElementsByTagName("head")[0].appendChild(base);
		});
	},

	waitForPageToLoad: function(/*Function*/ submitActions){
		// summary:
		// 		Notifies DOH that the doh.robot is about to make a page change in the application it is driving,
		//		returning a doh.Deferred object the user should return in their runTest function as part of a DOH test.
		//
		// description:
		// 		Notifies DOH that the doh.robot is about to make a page change in the application it is driving,
		//		returning a doh.Deferred object the user should return in their runTest function as part of a DOH test.
		//		Example:
		//			runTest:function(){
		//				return waitForPageLoad(function(){ doh.robot.keyPress(dojo.keys.ENTER, 500); });
		//			}
		//
		// submitActions:
		//		The doh.robot will execute the actions the test passes into the submitActions argument (like clicking the submit button),
		//		expecting these actions to create a page change (like a form submit).
		//		After these actions execute and the resulting page loads, the next test will start.
		//

		var d = new doh.Deferred();
		// create iframe event handler to track submit progress
		onIframeLoad = function(){
			onIframeLoad = null;
			// set dojo.doc on every page change to point to the iframe doc so the robot works
			doh.robot._updateDocument();
			d.callback(true);
		};
		submitActions();
		return d;
	}

});

})();
