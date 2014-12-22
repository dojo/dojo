define([
	'intern!object',
	'intern/chai!assert',
	'../../../parser',
	'dojo/Deferred',
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/_base/window',
	'dojo/_base/array',
	'./support/util'
], function (registerSuite, assert, parser, Deferred, declare, domConstruct, win, array, util) {
	/*globals asyncWidget, syncWidget*/

	var finishCreatingAsyncWidgets = new Deferred(),
		container;

	var SyncWidget = declare('SyncWidget', null, {
		declaredClass: 'SyncWidget',

		constructor: function (args) {
			this.params = args;
			declare.safeMixin(this, args);
		},

		startup: function () {
			this._started = true;
		}
	});

	var AsyncWidget = declare('AsyncWidget', SyncWidget, {
		declaredClass: 'AsyncWidget',
		markupFactory: function (params, node) {
			return finishCreatingAsyncWidgets.promise.then(function () {
				return new AsyncWidget(params, node);
			});
		}
	});

	registerSuite({
		name: 'parser async tests',

		setup: function () {
			container = domConstruct.place(
				util.fixScope('<div id=main>' +
					'<span data-${dojo}-id="asyncWidget" data-${dojo}-type="AsyncWidget">hi</span>' +
					'<span data-${dojo}-id="syncWidget" data-${dojo}-type="SyncWidget">there</span>' +
				'</div>'), win.body());
		},

		teardown: function () {
			domConstruct.empty(container);
		},

		'parse': function () {
			var d = this.async(1000),
				parsePromise = parser.parse(document.getElementById('main'));

			assert.isFalse(parsePromise.isFulfilled());
			assert.isUndefined(window.asyncWidget);
			assert.isUndefined(syncWidget._started);

			finishCreatingAsyncWidgets.resolve(true);

			parsePromise.then(d.callback(function (list) {
				assert.isTrue(asyncWidget._started);
				assert.strictEqual('AsyncWidget, SyncWidget',
					array.map(list, function (cls) { return cls.declaredClass; }).join(', '));
			}));
		}
	});
});
