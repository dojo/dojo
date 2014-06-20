define([
	'./_base',
	'./AdapterRegistry',
	'./io-query',
	'./request',
	'./store/Memory',
	'./string',
	'./regexp',
	'./when',
	'./on',
	'./Evented',
	'./topic',
	'./date/stamp',

	// host-specific tests
	'intern/dojo/has!host-browser?./dom-form',
	'intern/dojo/has!host-browser?./hash',
	'intern/dojo/has!host-browser?./io/iframe',
	'intern/dojo/has!host-node?./node',
	'intern/dojo/has!host-browser?./router'
], function(){});
