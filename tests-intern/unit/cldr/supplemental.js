define([
	'intern!object',
	'intern/chai!assert',
	'dojo/cldr/supplemental'
], function (registerSuite, assert, supplemental) {
	registerSuite({
		name: 'dojo/cldr/supplemental',

		'.getWeekend': function () {
			assert.equal(supplemental.getWeekend('en-us').start, 6);
			assert.equal(supplemental.getWeekend('en').end, 0);
			assert.equal(supplemental.getWeekend('he-il').start, 5);
			assert.equal(supplemental.getWeekend('he').end, 6);
		}
	});
});