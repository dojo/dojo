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
			var svc = new JsonpService(require.toUrl('./rpc/support/yahoo_smd_v1.smd'), { appid: 'foo' });
			return svc.webSearch({ query: 'dojotoolkit' }).then(function (result) {
				// assert.strictEqual(result.ResultSet.Result[0].DisplayUrl, 'dojotoolkit.org/');
			});
		}
	});
});
