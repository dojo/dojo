define(['./has'], function(has){
	var global = this,
		doc = document,
		readyStates = { 'loaded': 1, 'complete': 1 },
		fixReadyState = typeof doc.readyState != "string",
		ready = /*require.pageLoaded || */!!readyStates[doc.readyState],
		tests = [],
		readyQ, div, on, detectReady, detectDoScroll, poller;

	// For FF <= 3.5
	if(fixReadyState){ doc.readyState = "loading"; }

	if(!ready){
		detectReady = function(evt){
			if(ready){ return; }
			if(evt && evt.type == "readystatechange" && !readyStates[doc.readyState]){ return; }
			ready = 1;

			// For FF <= 3.5
			if(fixReadyState){ doc.readyState = "complete"; }

			while(readyQ.length){
				(readyQ.shift())();
			}

			console.log(evt.type || evt);
		};

		if(has("dom-addeventlistener")){
			on = function(node, event){
				node.addEventListener(event, detectReady, false);
				return function(){ node.removeEventListener(event, detectReady, false); };
			};
		}else{
			on = function(node, event){
				event = 'on' + event;
				node.attachEvent(event, detectReady);
				return function(){ node.detachEvent(event, detectReady); };
			};

			div = doc.createElement("div");
			detectDoScroll = function(){
				// Derived with permission from Diego Perini's IEContentLoaded
				// http://javascript.nwbox.com/IEContentLoaded/
				try{
					div.doScroll("left");
					return 1;
				}catch(e){}
			};

			// only do the doScroll poll if doScroll exists and if
			// it throws when it's called; otherwise it's useless
			if(div.doScroll && !detectDoScroll()){
				tests.push(detectDoScroll);
			}
		}

		readyQ = [
			on(doc, "DOMContentLoaded"),
			on(global, "load")
		];

		if("onreadystatechange" in doc){
			readyQ.push(on(doc, "readystatechange"));
		}else if(!fixReadyState){
			// if the ready state property exists and there's
			// no readystatechange event, poll for the state
			// to change
			tests.push(function(){
				return readyStates[doc.readyState];
			});
		}

		if(tests.length){
			poller = function(){
				if(ready){ return; }
				var i = tests.length;
				while(i--){
					if(tests[i]()){
						detectReady("poller");
						return;
					}
				}
				setTimeout(poller, 30);
			};
			poller();
		}
	}

	function domReady(callback){
		if(ready){
			callback(1);
		}else{
			readyQ.push(callback);
		}
	}
	domReady.load = function(id, req, load){
		domReady(load);
	};

	return domReady;
});
