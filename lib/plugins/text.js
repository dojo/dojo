//
// dojo text! plugin
//
// We choose to include our own plugin in hopes of leveraging functionality already contained in dojo
// and thereby reducing the size of the plugin compared to various loader implementations. Naturally, this
// allows AMD loaders to be used without their plugins.

// CAUTION, this module may return improper results if the AMD loader does not support toAbsMid and client
// code passes relative plugin resource module ids. In that case, you should consider using the text! plugin
// that comes with your loader.

define(["dojo", "dojo/cache"], function(dojo){
	var
		cached= {},

		cache= function(cacheId, url, value){
			cached[cacheId]= value;
			dojo.cache({toString:function(){return url;}}, value);
		},

		strip= function(text){
			//note: this function courtesy of James Burke (https://github.com/jrburke/requirejs)
			//Strips <?xml ...?> declarations so that external SVG and XML
			//documents can be added to a document without worry. Also, if the string
			//is an HTML document, only the part inside the body tag is returned.
			if(text){
				text= text.replace(/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, "");
				var matches= text.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
				if(matches){
					text= matches[1];
				}
			}else{
				text = "";
			}
			return text;
		};

	return {
		load:function(id, require, load){
			var match, cacheId, url, parts= id.split("!");
			if(require.toAbsMid){
				match= parts[0].match(/(.+)(\.[^\/]*)$/);
				cacheId= match ? require.toAbsMid(match[1]) + match[2] : require.toAbsMid(parts[0]);
				if(cacheId in cached){
					load(parts[1]=="strip" ? strip(cached[cacheId]) : cached[cacheId]);
					return;
				}
			}
			url= require.toUrl(parts[0]);
			dojo.xhrGet({
				url:url,
				load:function(text){
					cacheId && cache(cacheId, url, text);
					load(parts[1]=="strip" ? strip(text) : text);
				}
			});
		},

		cache:function(cacheId, mid, type, value) {
			cache(cacheId, require.nameToUrl(mid) + type, value);
		}
	};
});
