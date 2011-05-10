define(["./kernel", "../has", "require"], function(dojo, has, require) {
	// module:
	//		dojo/_base/lader
	// summary:
	//		This module defines the v1.x synchronous loader API.

	if (!has("dojo-loader")){
		console.error("cannot load the Dojo v1.x loader with a foreign loader");
		return;
	}

	has.add("dojo-loader", 1, 0, 1);

	var dojoRequire = require.getDojoLoader(dojo, dojo.dijit, dojo.dojox);

	has.add("config-publishRequireResult", 1, 0, 0);
	dojo.require = function(moduleName, omitModuleCheck) {
		var result = dojoRequire(moduleName);
		if (!omitModuleCheck && !result) {
			// TODO throw?
		}
		if(has("config-publishRequireResult") && !dojo.exists(moduleName) && result!==undefined){
			dojo.setObject(moduleName, result);
		}
		return result;
	};

	dojo.loadInit = function(f) {
		f();
	};

	dojo.registerModulePath = function(/*String*/moduleName, /*String*/prefix){
		//	summary:
		//		Maps a module name to a path
		//	description:
		//		An unregistered module is given the default path of ../[module],
		//		relative to Dojo root. For example, module acme is mapped to
		//		../acme.  If you want to use a different module name, use
		//		dojo.registerModulePath.
		//	example:
		//		If your dojo.js is located at this location in the web root:
		//	|	/myapp/js/dojo/dojo/dojo.js
		//		and your modules are located at:
		//	|	/myapp/js/foo/bar.js
		//	|	/myapp/js/foo/baz.js
		//	|	/myapp/js/foo/thud/xyzzy.js
		//		Your application can tell Dojo to locate the "foo" namespace by calling:
		//	|	dojo.registerModulePath("foo", "../../foo");
		//		At which point you can then use dojo.require() to load the
		//		modules (assuming they provide() the same things which are
		//		required). The full code might be:
		//	|	<script type="text/javascript"
		//	|		src="/myapp/js/dojo/dojo/dojo.js"></script>
		//	|	<script type="text/javascript">
		//	|		dojo.registerModulePath("foo", "../../foo");
		//	|		dojo.require("foo.bar");
		//	|		dojo.require("foo.baz");
		//	|		dojo.require("foo.thud.xyzzy");
		//	|	</script>

		var paths = {};
		paths[moduleName.replace(/\./g, "/")] = prefix;
		require({paths:paths});
	};

	dojo.platformRequire = function(/*Object*/modMap){
		//	summary:
		//		require one or more modules based on which host environment
		//		Dojo is currently operating in
		//	description:
		//		This method takes a "map" of arrays which one can use to
		//		optionally load dojo modules. The map is indexed by the
		//		possible dojo.name_ values, with two additional values:
		//		"default" and "common". The items in the "default" array will
		//		be loaded if none of the other items have been choosen based on
		//		dojo.name_, set by your host environment. The items in the
		//		"common" array will *always* be loaded, regardless of which
		//		list is chosen.
		//	example:
		//		|	dojo.platformRequire({
		//		|		browser: [
		//		|			"foo.sample", // simple module
		//		|			"foo.test",
		//		|			["foo.bar.baz", true] // skip object check in _loadModule (dojo.require)
		//		|		],
		//		|		default: [ "foo.sample._base" ],
		//		|		common: [ "important.module.common" ]
		//		|	});

		var common = modMap.common || [];
		var result = common.concat(modMap[dojo._name] || modMap["default"] || []);

		for(var x=0; x<result.length; x++){
			var curr = result[x];
			if(curr.constructor == Array){
				dojo.require.apply(dojo, curr);
			}else{
				dojo.require(curr);
			}
		}
	};

	dojo.requireIf = dojo.requireAfterIf = function(/*Boolean*/ condition, /*String*/ moduleName, /*Boolean?*/omitModuleCheck){
		// summary:
		//		If the condition is true then call `dojo.require()` for the specified
		//		resource
		//
		// example:
		//	|	dojo.requireIf(dojo.isBrowser, "my.special.Module");

		if(condition){
			dojo.require(moduleName, omitModuleCheck);
		}
	};

	dojo.requireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale){
		require(["../i18n"], function(i18n){
			i18n.getLocalization(moduleName, bundleName, locale);
		});
	};

	// FIXME: this dependency needs to be removed from the demos
	dojo._getText = require.getText;
});
