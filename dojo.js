if(typeof dojo == "undefined"){
	(function(){
		var hostEnv = "browser";
		var isRhino = false;
		var isSpidermonkey = false;
		if(
			(typeof this["load"] == "function")&&
			(
				(typeof this["Packages"] == "function")||
				(typeof this["Packages"] == "object")
			)
		){
			var isRhino = true;
			hostEnv = "rhino";
		}else if(typeof this["load"] == "function"){
			isSpidermonkey  = true;
			hostEnv = "spidermonkey";
		}
		var tmps = ["bootstrap.js", "loader.js", "hostenv_"+hostEnv+".js"];
	
		if(
			(this["djConfig"])&&
			(
				(djConfig["forceXDomain"])||
				(djConfig["useXDomain"])
			)
		){
			tmps.push("loader_xd.js");
		}
	
		if((this["djConfig"])&&(djConfig["baseUrl"])){
			var root = djConfig["baseUrl"];
		}else{
			var root = "./";
			if(isSpidermonkey){
				// auto-detect the base path via an exception. Hack!
				try{ throw new Error(""); }catch(e){ root = e.fileName.split("dojo.js")[0]; };
			}
			if(!this["djConfig"]){
				djConfig = { baseUrl: root };
			}
	
			// attempt to figure out the path to dojo if it isn't set in the config
			if((this["document"])&&(this["document"]["getElementsByTagName"])){
				var scripts = document.getElementsByTagName("script");
				var rePkg = /dojo\.js([\?\.]|$)/i;
				for(var i = 0; i < scripts.length; i++){
					var src = scripts[i].getAttribute("src");
					if(!src){ continue; }
					var m = src.match(rePkg);
					if(m){
						root = src.substring(0, m.index);
						if(!this["djConfig"]){ djConfig = {}; }
						djConfig["baseUrl"] = root;
						break;
					}
				}
			}
		}
	
		for(var x=0; x < tmps.length; x++){
			var spath = root+"_base/_loader/"+tmps[x];
			if(isRhino||isSpidermonkey){
				load(spath);
			}else{
				try{
					document.write("<scr"+"ipt type='text/javascript' src='"+spath+"'></scr"+"ipt>");
				}catch(e){
					var script = document.createElement("script");
					script.src = spath;
					document.getElementsByTagName("head")[0].appendChild(script);
				}
			}
		}
	})();
};
