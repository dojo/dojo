//
// dojo text! plugin
//
// We choose to include our own plugin in hopes of leveraging functionality already contained in dojo
// and thereby reducing the size of the plugin compared to various loader implementations. Naturally, this
// allows AMD loaders to be used without their plugins.

define(["dojo"], function(dojo){
	var 
		cached= {},
		cache= function(url, value){
			define("text!" + url, 0, value);
			cached[url]= value;
		},
		strip= function(text){
			//note: this function courtesy of James Burke (https://github.com/jrburke/requirejs)
			//Strips <?xml ...?> declarations so that external SVG and XML
			//documents can be added to a document without worry. Also, if the string
			//is an HTML document, only the part inside the body tag is returned.
			if(text){
				text= text.replace(/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, "");
				var matches= text.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
				if (matches) {
					text= matches[1];
				}
			}else{
				text = "";
			}
			return text;
		};

	return {
		load: function(require, id, loaded){
			var
				parts= id.split("!"),
				url= require.nameToUrl(parts[0]),
				pqn= "text!"+url;
			if(url in cached){
				loaded(parts[1] && parts[1]=="strip" ? strip(cached[url]) : cached[url]);
			}else{
				dojo.xhrGet({
					url:url, 
					load:function(text){ 
						cache(url, text);
						loaded(parts[1] && parts[1]=="strip" ? strip(text) : text);
					}
				});
			}
		},
		cache:cache
	};
});
