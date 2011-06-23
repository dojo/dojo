// this tests dojo.provide hooks
// here is an example that should NOT be hooked
//   dojo.provide("should.not.be.hooked.because.this.is.a.comment");

dojo.provide("my.module1");
//dojo.provide("my.module2"); don't hook commented out lines
dojo.provide("my.module3");

// here's a challenge with dojo.provide in a string
dojo.deprecated("dojo.provide", 'dojo.provide("some.module") should not be used', "2.0");




