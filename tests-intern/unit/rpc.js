define([
	'require',
	'intern!object',
	'intern/chai!assert',
	'dojo-testing/rpc/JsonService',
	'dojo-testing/rpc/JsonpService'
], function (require, registerSuite, assert, JsonService, JsonpService) {
	registerSuite({
		name: 'dojo/rpc',

		'JsonService': {
			'echo': function () {
				var testSmd = {
					serviceURL: '/__services/rpc/json',
					methods: [{
						name: 'myecho',
						parameters: [{
							name: 'somestring',
							type: 'STRING'
						}]
					}]
				};

				var svc = new JsonService(testSmd);
				return svc.myecho('RPC TEST').then(function (result) {
					assert.strictEqual(result, '<P>RPC TEST</P>');
				});
			},

			'empty param': function () {
				var testSmd = {
					serviceURL: '/__services/rpc/json',
					methods: [{ name: 'contentB' }]
				};

				var svc = new JsonService(testSmd);
				return svc.contentB().then(function (result) {
					assert.strictEqual(result, '<P>Content B</P>');
				});
			},

			'SMD loading': function () {
				var svc = new JsonService(require.toUrl('./rpc/support/testClass.smd'));
				assert.strictEqual(svc.smd.objectName, 'testClass');
			}
		},

		'JsonpService': function () {
			// FIXME: This test fails because JsonpService uses dojo/io/script,
			// which fails to account for unfriendly characters like the - in dojo-testing.
			// Perhaps we should rename to dojo_testing?
			var testSmd = {
				methods: [{
					name: 'jsonp',
					serviceURL: '/__services/rpc/jsonp',
					parameters: [{
						name: 'query',
						type: 'STRING'
					}]
				}]
			};

			var svc = new JsonpService(testSmd);
			return svc.jsonp({ query: 'dojotoolkit' }).then(function (result) {
				assert.strictEqual(result.url, 'dojotoolkit.org/');
			});
		}
	});
});
