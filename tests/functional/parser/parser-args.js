define([
	'require',
	'intern!object',
	'intern/chai!assert',
	'../../support/ready'
], function (require, registerSuite, assert, ready) {
	registerSuite({
		name: 'dojo/parser - arguments',

		test: function () {
			var remote = this.get('remote');
			return ready(remote, require.toUrl('./parser-args.html'))
				.setExecuteAsyncTimeout(5000)
				.executeAsync(function (done) {
					require([
						'testing/parser',
						'dojo/_base/lang',
						'dojo/_base/declare',
						'dojo/domReady!'
					], function (parser, lang, declare) {
						declare('tests.parser.Class1', null, {
							constructor: function (args) {
								this.params = args;
								lang.mixin(this, args);
							},
							strProp1: 'original1',
							strProp2: 'original2'
						});

						var widgets = parser.parse();
						done({
							widgetsLength: widgets.length,
							strProp1: widgets[0].strProp1
						});
					});
				})
				.then(function (results) {
					assert.deepEqual(results, {
						widgetsLength: 1,
						strProp1: 'text'
					});

					return remote
						.executeAsync(function (done) {
							require([ 'testing/parser' ], function (parser) {
								// Test when only the options argument is passed, and it does not contain a rootNode.
								// For 2.0, if we drop scope parameter, change this test.
								var widgets = parser.parse({
									scope: 'myscope'
								});
								done({
									widgetsLength: widgets.length,
									strProp1: widgets[0].strProp1
								});
							});
						})
						.then(function (results) {
							assert.deepEqual(results, {
								widgetsLength: 1,
								strProp1: 'text'
							});
						});
				});
		}
	});
});
