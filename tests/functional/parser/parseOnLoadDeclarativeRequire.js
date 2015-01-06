define([
	'require',
	'intern!object',
	'intern/chai!assert',
	'../../support/ready'
], function (require, registerSuite, assert, ready) {
	registerSuite({
		name: 'dojo/parser - parseOnLoad + declarative require',

		test: function () {
			return ready(this.get('remote'), require.toUrl('./parseOnLoadDeclarativeRequire.html'))
				.setExecuteAsyncTimeout(5000)
				.executeAsync(function (done) {
					require([ 'dojo/ready' ], function (dojoReady) {
						dojoReady(function () {
							/* global dr1, dr2, dr3, dr4, dr5 */
							done({
								typeofDr1: typeof dr1,
								dr1Foo: dr1.params.foo,
								typeofDr2: typeof dr2,
								dr2Foo: dr2.params.foo,
								typeofDr3: typeof dr3,
								dr3Foo: dr3.params.foo,
								dr4Foo: dr4.params.foo,
								dr5Method1: dr5.method1(1)
							});
						});
					});
				})
				.then(function (results) {
					assert.deepEqual(results, {
						typeofDr1: 'object',
						dr1Foo: 'bar',
						typeofDr2: 'object',
						dr2Foo: 'bar',
						typeofDr3: 'object',
						dr3Foo: 'bar',
						dr4Foo: 2,
						dr5Method1: 3
					});
				});
		}
	});
});
