dojo.provide("dojo.hash");
//TODOC: where does this go?
// summary: 
//		Methods for monitoring and updating the hash in the browser URL.
//
// example:
//		dojo.subscribe("/dojo/hashchange", context, callback);
//
//		function callback (hashValue){
//			// do something based on the hash value.
// 		}

(function(){
	dojo.hash = function(/* String? */ hash, /* Boolean? */ replace){
		//	summary:
		//		Gets or sets the hash string.
		//	description:
		//		Handles getting and setting of location.hash.
		//		 - If no arguments are passed, acts as a getter.
		//		 - If a string is passed, acts as a setter.
		//	hash: 
		//		String: the hash is set - #string.
		//	replace:
		//		Boolean: If true, updates the hash value in the current history 
		//			state instead of creating a new history state.
		//	returns:
		//		when used as a getter, returns the current hash string.
		//		when used as a setter, returns the new hash string.
		
		// getter
		if(!arguments.length){
			return _getHash();
		}
		// setter
		if(hash.charAt(0) == "#"){
			hash = hash.substring(1);
		}
		if(replace){
			_replace(hash);
		}else{
			location.href = "#" + hash;
		}
		return hash; // String
	}

	// Global vars
	var _recentHash = null,
		_ieUriMonitor = null,
		_pollFrequency = dojo.config.hashPollFrequency || 100;

	//Internal functions
	function _getHash(){
		var h = location.hash;
		if(h.charAt(0) == "#"){
			h = h.substring(1);
		}
		return dojo.isMoz ? h : decodeURIComponent(h);
	}

	function _dispatchEvent(){
		dojo.publish("/dojo/hashchange", [_getHash()]);
	}		

	function _pollLocation(){
		if(_getHash() === _recentHash){
			return;
		}
		_recentHash = _getHash();
		_dispatchEvent();
	}
	
	function _replace(hash){
		if(_ieUriMonitor){
			if(_ieUriMonitor.isTransitioning()){
				setTimeout(dojo.hitch(null,_replace,hash), _pollFrequency);
				return;
			}
			var href = _ieUriMonitor.iframe.location.href;
			var index = href.indexOf('?');
			// main frame will detect and update itself
			_ieUriMonitor.iframe.location.replace(href.substring(0, index) + "?" + hash);
			return;
		}
		location.replace("#"+hash);
		_pollLocation();
	}

	function IEUriMonitor(){
		// summary:
		//		Determine if the browser's URI has changed or if the user has pressed the 
		//		back or forward button. If so, call _dispatchEvent.
		//
		//	description:
		//		IE doesn't add changes to the URI's hash into the history unless the hash
		//		value corresponds to an actual named anchor in the document. To get around
		//      this IE difference, we use a background IFrame to maintain a back-forward
		//		history, by updating the IFrame's query string to correspond to the
		//		value of the main browser location's hash value.
		//
		//		E.g. if the value of the browser window's location changes to
		//
		//		#action=someAction
		//
		//		... then we'd update the IFrame's source to:
		//
		//		?action=someAction
		//
		//		This design leads to a somewhat complex state machine, which is
		//		described below:
		//
		//		s1: Stable state - neither the window's location has changed nor
		//			has the IFrame's location. Note that this is the 99.9% case, so
		//			we optimize for it.
		//			Transitions: s1, s2, s3
		//		s2: Window's location changed - when a user clicks a hyperlink or
		//			code programmatically changes the window's URI.
		//			Transitions: s4
		//		s3: Iframe's location changed as a result of user pressing back or
		//			forward - when the user presses back or forward, the location of
		//			the background's iframe changes to the previous or next value in
		//			its history.
		//			Transitions: s1
		//		s4: IEUriMonitor has programmatically changed the location of the
		//			background iframe, but it's location hasn't yet changed. In this
		//			case we do nothing because we need to wait for the iframe's
		//			location to reflect its actual state.
		//			Transitions: s4, s5
		//		s5:	IEUriMonitor has programmatically changed the location of the
		//			background iframe, and the iframe's location has caught up with
		//			reality. In this case we need to transition to s1.
		//			Transitions: s1
		//

		// create and append iframe
		var ifr = document.createElement("iframe"),
			IFRAME_ID = "dojo-hash-iframe";
		ifr.id = IFRAME_ID;
		ifr.src = dojo.moduleUrl("dojo", "resources/blank.html?" + _getHash());
		ifr.style.display = "none";
		document.body.appendChild(ifr);

		this.iframe = dojo.global[IFRAME_ID];
		var recentIframeQuery, transitioning, expectedIFrameQuery, docTitle,
			iframeLoc = this.iframe.location,
			winLoc = dojo.global.location;

		function resetState(){
			_recentHash = winLoc.hash;
			recentIframeQuery = iframeLoc.search;
			transitioning = false;
			expectedIFrameQuery = null;
		}

		this.isTransitioning = function(){
			return transitioning;
		}
		
		this.pollLocation = function(){
			// check to see if we're in an iframe transition (s4 or s5)
			if(transitioning && _recentHash === winLoc.hash){
				// s4 (waiting for iframe to catch up to main window)
				if(iframeLoc.search === expectedIFrameQuery){
					// s5 (iframe caught up to main window), transition back to s1
					resetState();
				}
				return;
			}
			if(document.title != docTitle){
				docTitle = this.iframe.document.title = document.title;
			}
			// check to see if we're in a stable state (iframe query == main window hash)
			if(_recentHash === winLoc.hash && recentIframeQuery === iframeLoc.search){
				// s1 (stable state), do nothing
				return;
			}

			// if we're still going, the user has initiated a URL change somehow.
			// sync iframe query <-> main window hash
			if(_recentHash !== winLoc.hash){
				// s2 (main window location changed), set iframe url and transition to s4
				_recentHash = winLoc.hash;
				transitioning = true;
				expectedIFrameQuery = "?" + _getHash();
				ifr.src = ifr.src.split("?")[0] + expectedIFrameQuery;
			}else{
				// s3 (iframe location changed via back/forward button), set main window url and transition to s1.
				winLoc.href = "#" + iframeLoc.search.substring(1);
				resetState();
			}
			// fire onhashchange event
			_dispatchEvent();
		}
		resetState(); // initialize state (transition to s1)
		setInterval(dojo.hitch(this,this.pollLocation), _pollFrequency);
	}
	
	dojo.addOnLoad(function(){
		if("onhashchange" in dojo.global && (!dojo.isIE || dojo.isIE >= 8)){	//need this IE browser test because "onhashchange" exists in IE8 in IE7 mode
			dojo.connect(dojo.global,"onhashchange",_dispatchEvent);
		}else{
			if(document.addEventListener){ // Non-IE
				_recentHash = _getHash();
				setInterval(_pollLocation, _pollFrequency); //Poll the window location for changes
			}else if(document.attachEvent){ // IE7-
				//Use hidden iframe in versions of IE that don't have onhashchange event
				_ieUriMonitor = new IEUriMonitor();
			} 
			// else non-supported browser, do nothing.
		}
	});
})();