define([
	"doh",
	"require",
	"./loader/modules",
	"./loader/moduleIds",
	"./loader/bootstrap"], function(doh, require){
	if(doh.isBrowser){
		doh.register("config", require.toUrl("./loader/config.html")+"?dojoConfig-djConfig-require");
		doh.register("config", require.toUrl("./loader/config.html")+"?dojoConfig-require");
		doh.register("config", require.toUrl("./loader/config.html")+"?dojoConfig-djConfig");
		doh.register("config", require.toUrl("./loader/config.html")+"?dojoConfig");
		doh.register("config", require.toUrl("./loader/config.html")+"?djConfig-require");
		doh.register("config", require.toUrl("./loader/config.html")+"?djConfig");
		doh.register("config", require.toUrl("./loader/config.html")+"?require");
		doh.register("config", require.toUrl("./loader/configApi.html"));
		doh.register("config", require.toUrl("./loader/config-sniff.html"));
		doh.register("config", require.toUrl("./loader/config-sniff-djConfig.html"));
		doh.register("config", require.toUrl("./loader/config-has.html"));
		doh.register("error-api", require.toUrl("./loader/errorApi.html"));
		doh.register("error-api", require.toUrl("./loader/errorApi.html")+"?noCatch");
		//TODO: doh.register("cdn-load", require.toUrl("./loader/cdnTest.html"));

		doh.register("publish-require-result", require.toUrl("./loader/publishRequireResult.html"));
		doh.register("no-publish-require-result", require.toUrl("./loader/publishRequireResult.html")+"?do-not-publish");

		// the requirejs test suite. The following tests are not used:
		//
		//   * baseUrl: dojo's baseUrl is different--it defaults to the dojo tree. See TODO
		//   * layers: dojo's build system does things differently
		//   * afterload: is not constructed in a way that works with doh
		//   * plugin/sync: this test seems like it will always fail in async mode; TODO check with James
        //
		doh.register("requirejs-simple-sync", require.toUrl("./loader/requirejs/simple.html"), {async:0});
		doh.register("requirejs-simple-async", require.toUrl("./loader/requirejs/simple.html"), {async:1});

		doh.register("requirejs-config-sync", require.toUrl("./loader/requirejs/config.html"), {async:0});
		doh.register("requirejs-config-async", require.toUrl("./loader/requirejs/config.html"), {async:1});

		doh.register("requirejs-dataMain-sync", require.toUrl("./loader/requirejs/dataMain.html"), {async:0});
		doh.register("requirejs-dataMain-async", require.toUrl("./loader/requirejs/dataMain.html"), {async:1});

		doh.register("requirejs-simple-nohead-sync", require.toUrl("./loader/requirejs/simple-nohead.html"), {async:0});
		doh.register("requirejs-simple-nohead-async", require.toUrl("./loader/requirejs/simple-nohead.html"), {async:1});

		function compactPath(path){
			var
				result= [],
				segment, lastSegment;
		    path= path.split("/");
			while(path.length){
				segment= path.shift();
				if(segment==".." && result.length && lastSegment!=".."){
					result.pop();
				}else if(segment!="."){
					result.push(lastSegment= segment);
				} // else ignore "."
			}
			return result.join("/");
		}
		var
			qstart= location.href.indexOf(location.search),
		    root= qstart!=-1 ? location.href.substring(0, qstart) : location.href,
			setup= compactPath(root + "/../" + require.toUrl("./loader/requirejs/requirejs-setup.js")),
			baseUrl= setup.substring(0, setup.length - "/requirejs-setup.js".length);
		doh.register("requirejs-simple-badbase-sync", require.toUrl("./loader/requirejs/simple-badbase.html"), {
			async:0,
			baseUrl:baseUrl,
			setup:setup,
			dojo:compactPath(root + "/../" + require.toUrl("../../dojo.js"))
		});
		doh.register("requirejs-simple-badbase-async", require.toUrl("./loader/requirejs/simple-badbase.html"), {
			async:1,
			baseUrl:baseUrl,
			setup:setup,
			dojo:compactPath(root + "/../" + require.toUrl("../../dojo.js"))
		});

		doh.register("requirejs-circular-sync", require.toUrl("./loader/requirejs/circular.html"), {async:0});
		doh.register("requirejs-circular-async", require.toUrl("./loader/requirejs/circular.html"), {async:1});

		doh.register("requirejs-depoverlap-sync", require.toUrl("./loader/requirejs/depoverlap.html"), {async:0});
		doh.register("requirejs-depoverlap-async", require.toUrl("./loader/requirejs/depoverlap.html"), {async:1});

		doh.register("requirejs-urlfetch-sync", require.toUrl("./loader/requirejs/urlfetch/urlfetch.html"), {async:0});
		doh.register("requirejs-urlfetch-async", require.toUrl("./loader/requirejs/urlfetch/urlfetch.html"), {async:1});

		doh.register("requirejs-uniques-sync", require.toUrl("./loader/requirejs/uniques/uniques.html"), {async:0});
		doh.register("requirejs-uniques-async", require.toUrl("./loader/requirejs/uniques/uniques.html"), {async:1});

		doh.register("requirejs-i18nlocaleunknown-sync", require.toUrl("./loader/requirejs/i18n/i18n.html")+"?bundle=i18n!nls/fr-fr/colors", {async:0});
		doh.register("requirejs-i18nlocaleunknown-async", require.toUrl("./loader/requirejs/i18n/i18n.html")+"?bundle=i18n!nls/fr-fr/colors", {async:1});

		doh.register("requirejs-i18n-sync", require.toUrl("./loader/requirejs/i18n/i18n.html"), {async:0});
		doh.register("requirejs-i18n-async", require.toUrl("./loader/requirejs/i18n/i18n.html"), {async:1});

		doh.register("requirejs-i18nlocale-sync", require.toUrl("./loader/requirejs/i18n/i18n.html")+"?locale=en-us-surfer", {async:0});
		doh.register("requirejs-i18nlocale-async", require.toUrl("./loader/requirejs/i18n/i18n.html")+"?locale=en-us-surfer", {async:1});

		doh.register("requirejs-i18nbundle-sync", require.toUrl("./loader/requirejs/i18n/i18n.html")+"?bundle=i18n!nls/en-us-surfer/colors", {async:0});
		doh.register("requirejs-i18nbundle-async", require.toUrl("./loader/requirejs/i18n/i18n.html")+"?bundle=i18n!nls/en-us-surfer/colors", {async:1});

		doh.register("requirejs-i18ncommon-sync", require.toUrl("./loader/requirejs/i18n/common.html"), {async:0});
		doh.register("requirejs-i18ncommon-async", require.toUrl("./loader/requirejs/i18n/common.html"), {async:1});

		doh.register("requirejs-i18ncommonlocale-sync", require.toUrl("./loader/requirejs/i18n/common.html")+"?locale=en-us-surfer", {async:0});
		doh.register("requirejs-i18ncommonlocale-async", require.toUrl("./loader/requirejs/i18n/common.html")+"?locale=en-us-surfer", {async:1});

		doh.register("requirejs-paths-sync", require.toUrl("./loader/requirejs/paths/paths.html"), {async:0});
		doh.register("requirejs-paths-async", require.toUrl("./loader/requirejs/paths/paths.html"), {async:1});

		doh.register("requirejs-relative-sync", require.toUrl("./loader/requirejs/relative/relative.html"), {async:0});
		doh.register("requirejs-relative-async", require.toUrl("./loader/requirejs/relative/relative.html"), {async:1});

		doh.register("requirejs-text-sync", require.toUrl("./loader/requirejs/text/text.html"), {async:0});
		doh.register("requirejs-text-async", require.toUrl("./loader/requirejs/text/text.html"), {async:1});

		doh.register("requirejs-textOnly-sync", require.toUrl("./loader/requirejs/text/textOnly.html"), {async:0});
		doh.register("requirejs-textOnly-async", require.toUrl("./loader/requirejs/text/textOnly.html"), {async:1});

		doh.register("requirejs-exports-sync", require.toUrl("./loader/requirejs/exports/exports.html"), {async:0});
		doh.register("requirejs-exports-async", require.toUrl("./loader/requirejs/exports/exports.html"), {async:1});
	}
});
