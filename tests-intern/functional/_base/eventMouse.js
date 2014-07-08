define([
	'require',
	'intern!object',
	'intern/chai!assert'
], function (require, registerSuite, assert) {
	/*jshint -W020 */
	/* global moveEvents, downEvents */
	registerSuite({
		name: 'mouseenter/mouseleave',

		setup: function () {
			return this.get('remote')
				.setAsyncScriptTimeout(5000)
				.get(require.toUrl('./eventMouse.html'))
				.waitForConditionInBrowser('ready')
				.elementById('header')
					.moveTo(1, 1)
				.end()
				.click();
		},

		'enter middle': function () {
			return this.get('remote')
				.execute(function () {
					moveEvents = [];
				})
				.elementById('outer')
					.moveTo(1, 1)
				.end()
				.wait(1000)
				.elementById('middleLabel')
					.moveTo(1, 1)
				.end()
				.execute(function () {
					return moveEvents;
				})
				.then(function (moveEvents) {
					assert.strictEqual(1, moveEvents.length, 'one event');
					assert.strictEqual('mouseenter', moveEvents[0].event, 'mouse enter event');
					assert.strictEqual('outer', moveEvents[0].target, 'mouse enter target');
				});
		},

		'enter inner1': function () {
			return this.get('remote')
				.execute(function () {
					moveEvents = [];
				})
				.elementById('inner1')
					.moveTo(1, 1)
				.end()
				.execute(function () {
					return moveEvents;
				})
				.then(function (moveEvents) {
					assert.strictEqual(0, moveEvents.length, 'no events');
				});
		},

		'after outer': function () {
			return this.get('remote')
				.execute(function () {
					moveEvents = [];
				})
				.elementById('outer')
					.moveTo(1, 1)
				.end()
				.wait(1000)
				.elementById('afterOuter')
					.moveTo(1, 1)
				.end()
				.execute(function () {
					return moveEvents;
				})
				.then(function (moveEvents) {
					assert.strictEqual(1, moveEvents.length, 'one event');
					assert.strictEqual('mouseleave', moveEvents[0].event, 'mouse leave event');
					assert.strictEqual('outer', moveEvents[0].target, 'mouse leave target');
				});
		}
	});

	registerSuite({
		name: 'mousedown, stopEvent',

		'mousedown inner1 div': function () {
			return this.get('remote')
				.execute(function () {
					downEvents = [];
				})
				.elementById('inner1')
					.moveTo(1, 1)
				.end()
				.click()
				.execute(function () {
					return downEvents;
				})
				.then(function (downEvents) {
					assert.strictEqual(2, downEvents.length, 'two mousedown events');
					assert.strictEqual('mousedown', downEvents[0].event, 'downEvents[0].event');
					assert.strictEqual('inner1', downEvents[0].target, 'downEvents[0].target');
					assert.isTrue(downEvents[0].isLeft, 'downEvents[0].isLeft');
					assert.isFalse(downEvents[0].isRight, 'downEvents[0].isRight');
					assert.strictEqual('mousedown', downEvents[1].event, 'downEvents[1].event');
					assert.strictEqual('middle', downEvents[1].currentTarget, 'downEvents[1].currentTarget');
					assert.strictEqual('inner1', downEvents[1].target, 'downEvents[1].target');
					assert.isTrue(downEvents[1].isLeft, 'downEvents[1].isLeft');
					assert.isFalse(downEvents[1].isRight, 'downEvents[1].isRight');
				});
		},

		'mousedown outer div': function () {
			return this.get('remote')
				.execute(function () {
					downEvents = [];
				})
				.elementById('outerLabel')
					.moveTo(1, 1)
				.end()
				.click()
				.execute(function () {
					return downEvents;
				})
				.then(function (downEvents) {
					assert.strictEqual(1, downEvents.length, 'one event');
					assert.strictEqual('mousedown', downEvents[0].event, 'mousedown event');
					assert.strictEqual('outerLabel', downEvents[0].target, 'mousedown target');
					assert.strictEqual('outer', downEvents[0].currentTarget, 'mousedown current target');

					// TODO: Selenium isn't getting the button number
					//assert.isFalse(downEvents[0].isLeft, 'downEvents[0].isLeft');
					//assert.isTrue(downEvents[0].isMiddle, 'downEvents[0].isMiddle');
				});
		}
	});
});
