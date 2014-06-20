define([
	'./_base',
	'./AdapterRegistry',
	'./colors',
	'./io-query',
	'./request',
	'./store/Memory',
	'./string',
	'./regexp',
	'./when',
	'./on',
	'./Evented',
	'./topic',
	'./json',
	'./currency',
	'./date',
	'./date/locale',
	'./date/stamp',

	 //host-specific tests
	'intern/dojo/has!host-browser?./dom-form',
	'intern/dojo/has!host-browser?./hash',
	'intern/dojo/has!host-browser?./io/iframe',
	'intern/dojo/has!host-browser?./mouse',
	'intern/dojo/has!host-node?./node',
	'intern/dojo/has!host-browser?./require/require',
	'intern/dojo/has!host-browser?./router'
], function () {});
