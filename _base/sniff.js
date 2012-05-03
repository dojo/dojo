define(["./kernel", "../sniff"], function(dojo, has){
	// module:
	//		dojo/sniff
	// summary:
	//		Deprecated.   New code should use dojo/sniff.
	//		This module populates the dojo browser version sniffing properties like dojo.isIE.

	if(!has("host-browser")){
		return has;
	}

	dojo.isBrowser = true;
	dojo._name = "browser";

	/*=====
	dojo.isBrowser = {
		//	example:
		//	| if(dojo.isBrowser){ ... }
	};

	dojo.isFF = {
		//	example:
		//	| if(dojo.isFF > 1){ ... }
	};

	dojo.isIE = {
		// example:
		//	| if(dojo.isIE > 6){
		//	|		// we are IE7
		//	| }
	};

	dojo.isSafari = {
		//	example:
		//	| if(dojo.isSafari){ ... }
		//	example:
		//		Detect iPhone:
		//	| if(dojo.isSafari && navigator.userAgent.indexOf("iPhone") != -1){
		//	|		// we are iPhone. Note, iPod touch reports "iPod" above and fails this test.
		//	| }
	};

	dojo.mixin(dojo, {
		// isBrowser: Boolean
		//		True if the client is a web-browser
		isBrowser: true,
		//	isFF: Number | undefined
		//		Version as a Number if client is FireFox. undefined otherwise. Corresponds to
		//		major detected FireFox version (1.5, 2, 3, etc.)
		isFF: 2,
		//	isIE: Number | undefined
		//		Version as a Number if client is MSIE(PC). undefined otherwise. Corresponds to
		//		major detected IE version (6, 7, 8, etc.)
		isIE: 6,
		//	isKhtml: Number | undefined
		//		Version as a Number if client is a KHTML browser. undefined otherwise. Corresponds to major
		//		detected version.
		isKhtml: 0,
		//	isWebKit: Number | undefined
		//		Version as a Number if client is a WebKit-derived browser (Konqueror,
		//		Safari, Chrome, etc.). undefined otherwise.
		isWebKit: 0,
		//	isMozilla: Number | undefined
		//		Version as a Number if client is a Mozilla-based browser (Firefox,
		//		SeaMonkey). undefined otherwise. Corresponds to major detected version.
		isMozilla: 0,
		//	isOpera: Number | undefined
		//		Version as a Number if client is Opera. undefined otherwise. Corresponds to
		//		major detected version.
		isOpera: 0,
		//	isSafari: Number | undefined
		//		Version as a Number if client is Safari or iPhone. undefined otherwise.
		isSafari: 0,
		//	isChrome: Number | undefined
		//		Version as a Number if client is Chrome browser. undefined otherwise.
		isChrome: 0,
		//	isMac: Boolean
		//		True if the client runs on Mac
		isMac: 0,
		// isIos: Boolean
		//		True if client is iPhone, iPod, or iPad
		isIos: 0,
		// isAndroid: Number | undefined
		//		Version as a Number if client is android browser. undefined otherwise.
		isAndroid: 0,
		// isWii: Boolean
		//		True if client is Wii
		isWii: 0
	});
	=====*/

	dojo.isOpera = has("opera");
	dojo.isAIR = has("air");
	dojo.isKhtml = has("khtml");
	dojo.isWebKit = has("webkit");
	dojo.isChrome = has("chrome");
	dojo.isMac = has("mac");
	dojo.isSafari = has("safari");
	dojo.isMozilla = dojo.isMoz = has("mozilla");
	dojo.isIE = has("ie");
	dojo.isFF = has("ff");
	dojo.isQuirks = has("quirks");
	dojo.isIos = has("ios");
	dojo.isAndroid = has("android");

	dojo.locale = dojo.locale || (dojo.isIE ? navigator.userLanguage : navigator.language).toLowerCase();

	return has;
});
