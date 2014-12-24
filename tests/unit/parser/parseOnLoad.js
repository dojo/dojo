// jshint maxlen: 160
define([
	'intern!object',
	'intern/chai!assert',
	'../../../parser',
	'dojo/dom-construct',
	'dojo/_base/window',
	'./support/util'
], function (registerSuite, assert, parser, domConstruct, win, util) {
	/*globals dr1, dr2, dr3, dr4, dr5*/
	var container;

	registerSuite({
		name: 'parser auto-require',

		setup: function () {
			container = domConstruct.place(
				util.fixScope('<div id="main">' +
					'<div data-${dojo}-id="dr1" data-${dojo}-type="dojo/tests/unit/parser/support/AMDWidget" data-${dojo}-props="foo: \'bar\'"></div>' +
					'<div data-${dojo}-id="dr2" data-${dojo}-type="dojo/tests/unit/parser/support/AMDWidget2" data-${dojo}-props="foo: \'bar\'"></div>' +
					'<div data-${dojo}-id="dr3" data-${dojo}-type="dojo/tests/unit/parser/support/AMDWidget3" data-${dojo}-props="foo: \'bar\'"></div>' +
				'</div>'), win.body());
			return parser.parse();
		},

		teardown: function () {
			domConstruct.destroy(container);
			container = null;
			window.dr1 = window.dr2 = window.dr3 = undefined;
		},

		'parseOnLoad': function () {
			assert.isObject(dr1, 'object using MID mapped to return var');
			assert.equal(dr1.params.foo, 'bar', 'parameters set on instantiation');
			assert.isObject(dr2, 'object using MID mapped to return var');
			assert.equal(dr2.params.foo, 'bar', 'parameters set on instantiation');
			assert.isObject(dr3, 'object using fully required');
			assert.equal(dr3.params.foo, 'bar', 'parameters set on instantiation');
		}
	});

	registerSuite({
		name: 'parser parseOnLoad:true, async:false',

		setup: function () {
			container = domConstruct.place(
				util.fixScope('<div id="main">' +
					'<script type="dojo/require">' +
					'</script>' +
					'<div data-${dojo}-id="dr1" data-${dojo}-type="AMDWidget" data-${dojo}-props="foo: \'bar\'"></div>' +
					'<div data-${dojo}-id="dr2" data-${dojo}-type="AMDWidget2" data-${dojo}-props="foo: \'bar\'"></div>' +
					'<div data-${dojo}-id="dr3" data-${dojo}-type="acme.AMDWidget3" data-${dojo}-props="foo: \'bar\'"></div>' +
					'<div data-${dojo}-id="dr4" data-${dojo}-type="AMDWidget" data-${dojo}-props="foo: amdmodule(1)"></div>' +
					'<div data-${dojo}-id="dr5" data-${dojo}-type="AMDWidget2">' +
					'</div>' +
				'</div>'), win.body());
			var script = document.createElement('script');
			script.type = 'dojo/require';
			script.text = util.fixScope(
				'AMDWidget: "${dojo}/tests/unit/parser/support/AMDWidget",' +
				'AMDWidget2: "${dojo}/tests/unit/parser/support/AMDWidget2",' +
				'"acme.AMDWidget3": "${dojo}/tests/unit/parser/support/AMDWidget3",' +
				'amdmodule: "${dojo}/tests/unit/parser/support/amdmodule"'
			);
			domConstruct.place(script, container, 'first');
			
			script = document.createElement('script');
			script.type = 'dojo/aspect';
			script.setAttribute(util.fixScope('data-${dojo}-advice'), 'before');
			script.setAttribute(util.fixScope('data-${dojo}-method'), 'method1');
			script.setAttribute(util.fixScope('data-${dojo}-args'), 'value');
			script.text = 'return [amdmodule(value)];';
			domConstruct.place(script, container.lastChild);
		},

		teardown: function () {
			domConstruct.destroy(container);
			container = null;
			window.dr1 = window.dr2 = window.dr3 = window.dr4 = window.dr5 = undefined;
		},

		'parseOnLoad': function () {
			var dfd = this.async();
			setTimeout(function () {
				parser.parse().then(
					dfd.callback(function () {
						assert.isObject(dr1, 'dr1 created');
						assert.equal(dr1.params.foo, 'bar', 'dr1 parameters set on instantiation');
						assert.isObject(dr2, 'dr2 created');
						assert.equal(dr2.params.foo, 'bar', 'dr2 parameters set on instantiation');
						assert.isObject(dr3, 'dr3 created');
						assert.equal(dr3.params.foo, 'bar', 'dr3 parameters set on instantiation');
						assert.equal(dr4.params.foo, 2, 'module loaded and executed');
						assert.equal(dr5.method1(1), 3, 'declarative script has access to parser scope');
					}),
					dfd.reject
				);
			}, 500);
		}
	});
});
