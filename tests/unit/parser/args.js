define([
	'intern!object',
	'intern/chai!assert',
	'../../../parser',
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/_base/window',
	'./support/util'
], function (registerSuite, assert, parser, declare, domConstruct, win, util) {

	var container;

	declare('tests/parser/Class1', null, {
		constructor: function (args) {
			this.params = args;
			declare.safeMixin(this, args);
		}
	});

	registerSuite({
		name: 'args scope test',

		setup: function () {
			// jshint maxlen:160
			container = domConstruct.place('<div>' +
				'<div data-myscope-type="tests/parser/Class1" data-myscope-id="scopeObj" data-myscope-props="strProp1:\'text\'"></div>' +
				util.fixScope('<div data-${dojo}-type="tests/parser/Class1" data-${dojo}-id="normalObj" data-${dojo}-props="strProp1:\'text\'"></div>') +
			'</div>', win.body());
		},

		teardown: function () {
			domConstruct.destroy(container);
		},

		'no args': function () {
			var widgets = parser.parse();
			assert.lengthOf(widgets, 1);
			assert.strictEqual(widgets[0].strProp1, 'text');
		},

		'options only': function () {
			/*globals scopeObj*/
			var widgets = parser.parse({
				scope: 'myscope'
			});

			assert.lengthOf(widgets, 1);
			assert.strictEqual(scopeObj.strProp1, 'text');
		}
	});
});
