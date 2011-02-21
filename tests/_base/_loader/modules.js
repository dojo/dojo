// this module should not be transformed by the build inverse AMD-transform;
// keeping define from the first line of the file and not providing an AMD-ID pragma prevents this module from being transformed
define("dojo/tests/_base/_loader/modules", ["require", "dojo/_base/connect", "./modules/anon","./modules/wrapped","dojo/tests/_base/_loader/modules/full","./modules/data",".modules/factoryArity"], function(require, connect, anon, wrapped, factoryArity){

tests.register("dojo.tests._base._loader.modules",
	[
		function testAMD(t){
			// test AMD module API
			t.assertEqual(anon.theAnswer, 42);
			t.assertEqual(require('./modules/anon').five, 5);
			t.assertEqual(wrapped.five, 5);
			t.assertEqual(dojo.require('dojo.tests._base._loader.modules.wrapped').exports, require('./modules/wrapped'));
			t.assertEqual(require('./modules/full').twiceTheAnswer, 84);
			t.assertEqual(require('./modules/data').five, 5);
			t.assertEqual(require('./modules/factoryArity').i, 5);
			t.assertEqual(connect, dojo.connect);
		}
	]
);
});

