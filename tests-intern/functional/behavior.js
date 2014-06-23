define([
	'require',
	'intern!object',
	'intern/chai!assert'
], function (require, registerSuite, assert) {
	/* global behavior, behaviorObject, applyCount, topicCount, initialize */
	registerSuite({
		name: 'dojo/behavior',

		before: function () {
			return this.get('remote')
				.setAsyncScriptTimeout(5000)
				.get(require.toUrl('./behavior.html'))
				.waitForConditionInBrowser('ready');
		},

		'.add': function () {
			return this.get('remote')
				.execute(function () {
					return {
						bar: !!behavior._behaviors['.bar'],
						foo: !!behavior._behaviors['.foo > span']
					};
				})
				.then(function (result) {
					assert.ok(!result.bar);
					assert.ok(!result.foo);
				})
				.execute(function () {
					behavior.add(behaviorObject);
					return {
						bar: behavior._behaviors['.bar'] && behavior._behaviors['.bar'].length,
						foo: behavior._behaviors['.foo > span'] && behavior._behaviors['.foo > span'].length,
						applyCount: applyCount
					};
				})
				.then(function (result) {
					assert.strictEqual(result.bar, 1);
					assert.strictEqual(result.foo, 1);
					assert.strictEqual(result.applyCount, 0);
				})
			;
		},

		'.apply': function () {
			return this.get('remote')
				.execute(function () {
					behavior.apply();
					return applyCount;
				})
				.then(function (applyCount) {
					assert.strictEqual(applyCount, 2);
				})
				.execute(function () {
					behavior.apply();
					return applyCount;
				})
				.then(function (applyCount) {
					// assure it only matches once
					assert.strictEqual(applyCount, 2);
				})
			;
		},

		'reapply': function () {
			return this.get('remote')
				.execute(function () {
					behavior.add(behaviorObject);
					behavior.apply();
					return applyCount;
				})
				.then(function (applyCount) {
					assert.strictEqual(applyCount, 4);
				})
			;
		},

		'events': function () {
			return this.get('remote')
				.execute(function () {
					behavior.add({
						'.foo': '/foo'
					});
					behavior.apply();
					return topicCount;
				})
				.then(function (topicCount) {
					assert.strictEqual(topicCount, 2);
				})
				.elementById('another')
					.click()
				.end()
				.execute(function () {
					behavior.add({
						'.foo': {
							'onfocus': '/foo'
						}
					});
					behavior.apply();
					return topicCount;
				})
				.then(function (topicCount) {
					assert.strictEqual(topicCount, 2);
				})
				.elementById('blah')
					.click()
				.end()
				.wait(500)
				.execute(function () {
					return topicCount;
				})
				.then(function (topicCount) {
					assert.strictEqual(topicCount, 3);
				})
				.elementById('another')
					.click()
				.end()
				.wait(500)
				.elementById('blah')
					.click()
				.end()
				.wait(500)
				.execute(function () {
					return topicCount;
				})
				.then(function (topicCount) {
					assert.strictEqual(topicCount, 4);
				})
			;
		}
	});
});
