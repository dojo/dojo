/*
* Rhino host environment
*/

if(dojo.config["baseUrl"]){
	dojo.baseUrl = dojo.config["baseUrl"];
}else{
	dojo.baseUrl = "./";
}

dojo.locale = dojo.locale || String(java.util.Locale.getDefault().toString().replace('_','-').toLowerCase());
dojo._name = 'rhino';
dojo.isRhino = true;

if(typeof print == "function"){
	console.debug = print;
}

if(!("byId" in dojo)){
	dojo.byId = function(id, doc){
		if(id && (typeof id == "string" || id instanceof String)){
			if(!doc){ doc = document; }
			return doc.getElementById(id);
		}
		return id; // assume it's a node
	}
}

dojo._isLocalUrl = function(/*String*/ uri) {
	// summary:
	// 		determines if URI is local or not.

	var local = (new java.io.File(uri)).exists();
	if(!local){
		var stream;
		//Try remote URL. Allow this method to throw,
		//but still do cleanup.
		try{
			// try it as a file first, URL second
			stream = (new java.net.URL(uri)).openStream();
			// close the stream so we don't leak resources
			stream.close();
		}finally{
			if(stream && stream.close){
				stream.close();
			}
		}
	}
	return local;
}

// see comments in spidermonkey loadUri
dojo._loadUri = function(uri, cb){
	try{
		var local;
		try{
			local = dojo._isLocalUrl(uri);
		}catch(e){
			// no debug output; this failure just means the uri was not found.
			return false;
		}

		//FIXME: Use Rhino 1.6 native readFile/readUrl if available?
		if(cb){
			var contents = (local ? readText : readUri)(uri, "UTF-8");

			// patch up the input to eval until https://bugzilla.mozilla.org/show_bug.cgi?id=471005 is fixed.
			if(!eval("'\u200f'").length){
				contents = String(contents).replace(/[\u200E\u200F\u202A-\u202E]/g, function(match){ 
					return "\\u" + match.charCodeAt(0).toString(16); 
				})
			}

			cb(eval('('+contents+')'));
		}else{
			load(uri);
		}
		return true;
	}catch(e){
		console.debug("rhino load('" + uri + "') failed. Exception: " + e);
		return false;
	}
}

dojo.exit = function(exitcode){ 
	quit(exitcode);
}

// reading a file from disk in Java is a humiliating experience by any measure.
// Lets avoid that and just get the freaking text
function readText(path, encoding){
	encoding = encoding || "utf-8";
	// NOTE: we intentionally avoid handling exceptions, since the caller will
	// want to know
	var jf = new java.io.File(path);
	var is = new java.io.FileInputStream(jf);
	return dj_readInputStream(is, encoding);
}

function readUri(uri, encoding){
	var conn = (new java.net.URL(uri)).openConnection();
	encoding = encoding || conn.getContentEncoding() || "utf-8";
	var is = conn.getInputStream();
	return dj_readInputStream(is, encoding);
}

function dj_readInputStream(is, encoding){
	var input = new java.io.BufferedReader(new java.io.InputStreamReader(is, encoding));
	try {
		var sb = new java.lang.StringBuffer();
		var line = "";
		while((line = input.readLine()) !== null){
			sb.append(line);
			sb.append(java.lang.System.getProperty("line.separator"));
		}
		return sb.toString();
	} finally {
		input.close();
	}
}

dojo._getText = function(/*URI*/ uri, /*Boolean*/ fail_ok){
	// summary: Read the contents of the specified uri and return those contents.
	// uri:
	//		A relative or absolute uri.
	// fail_ok:
	//		Default false. If fail_ok and loading fails, return null
	//		instead of throwing.
	// returns: The response text. null is returned when there is a
	//		failure and failure is okay (an exception otherwise)
	try{
		var local = dojo._isLocalUrl(uri);
		var text = (local ? readText : readUri)(uri, "UTF-8");
		if(text !== null){
			//Force JavaScript string.
			text += "";
		}
		return text;
	}catch(e){
		if(fail_ok){
			return null;
		}else{
			throw e;
		}
	}
}

// summary:
//		return the document object associated with the dojo.global
dojo.doc = typeof document != "undefined" ? document : null;

dojo.body = function(){
	return document.body;	
}

// Supply setTimeout/clearTimeout implementations if they aren't already there
// Note: this assumes that we define both if one is not provided... there might
// be a better way to do this if there is a use case where one is defined but
// not the other
if(typeof setTimeout == "undefined" || typeof clearTimeout == "undefined"){
	dojo._timeouts = [];
	clearTimeout = function(idx){
		if(!dojo._timeouts[idx]){ return; }
		dojo._timeouts[idx].stop();
	}

	setTimeout = function(func, delay){
		// summary: provides timed callbacks using Java threads

		var def={
			sleepTime:delay,
			hasSlept:false,
		
			run:function(){
				if(!this.hasSlept){
					this.hasSlept=true;
					java.lang.Thread.currentThread().sleep(this.sleepTime);
				}
				try{
					func();
				}catch(e){
					console.debug("Error running setTimeout thread:" + e);
				}
			}
		};
	
		var runnable = new java.lang.Runnable(def);
		var thread = new java.lang.Thread(runnable);
		thread.start();
		return dojo._timeouts.push(thread)-1;
	}
}

//Register any module paths set up in djConfig. Need to do this
//in the hostenvs since hostenv_browser can read djConfig from a
//script tag's attribute.
if(dojo.config["modulePaths"]){
	for(var param in dojo.config["modulePaths"]){
		dojo.registerModulePath(param, dojo.config["modulePaths"][param]);
	}
}
