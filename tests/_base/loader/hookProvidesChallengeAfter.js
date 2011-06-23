



dojo.provide("my.module1");

dojo.provide("my.module3");


dojo.deprecated("dojo.provide", 'dojo.provide("some.module") should not be used', "2.0");




require.provideFinish("my.module1",'path/to/reference/module');
require.provideFinish("my.module3",'path/to/reference/module');
