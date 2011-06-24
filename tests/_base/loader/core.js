define([
	"doh",
	"dojo/text!./commentChallengeBefore.js",
	"dojo/text!./commentChallengeAfter.js",
	"dojo/text!./hookProvidesChallengeBefore.js",
	"dojo/text!./hookProvidesChallengeAfter.js"
	], function(
		doh,
		commentBefore,
		commentAfter,
		hookProvidesBefore,
		hookProvidesAfter){

console.log(hookProvidesBefore);
	doh.register("dojo.tests._base._loader.internals", [
		function compactPath(t){
			var compactPath = require.compactPath;
			t.is(compactPath("../../dojo/../../mytests"), "../../../mytests");
			t.is(compactPath("module"), "module");
			t.is(compactPath("a/./b"), "a/b");
			t.is(compactPath("a/../b"), "b");
			t.is(compactPath("a/./b/./c/./d"), "a/b/c/d");
			t.is(compactPath("a/../b/../c/../d"), "d");
			t.is(compactPath("a/b/c/../../d"), "a/d");
			t.is(compactPath("a/b/c/././d"), "a/b/c/d");
			t.is(compactPath("./a/b"), "a/b");
			t.is(compactPath("../a/b"), "../a/b");
			t.is(compactPath(""), "");
		}/*,

		function removeComments(t){
			t.is(commentAfter, require.removeComments(commentBefore));
		},

		function hookProvides(t){
			t.is(hookProvidesAfter, require.hookProvides({pqn:"path/to/reference/module"}, hookProvidesBefore, true));
		}
*/
	]);
});
