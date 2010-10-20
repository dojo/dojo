define("dojo/_base/eval", ["dojo"], function (dojo) {
  dojo["eval"]= function(/*String*/ scriptFragment) {
    //	summary:
  	//		Perform an evaluation in the global scope. Use this rather than
  	//		calling 'eval()' directly.
  	//	description:
  	//		Placed in a separate function to minimize size of trapped
  	//		exceptions. Calling eval() directly from some other scope may
  	//		complicate tracebacks on some platforms.
  	//	returns:
  	//		The result of the evaluation. Often `undefined`
  
  	// note:
  	//	 - JSC eval() takes an optional second argument which can be 'unsafe'.
  	//	 - Mozilla/SpiderMonkey eval() takes an optional second argument which is the
  	//  	 scope object for new symbols.
  
  	// FIXME: investigate Joseph Smarr's technique for IE:
  	//		http://josephsmarr.com/2007/01/31/fixing-eval-to-use-global-scope-in-ie/
  	//	see also:
  	// 		http://trac.dojotoolkit.org/ticket/744
  	return dojo.global.eval ? dojo.global.eval(scriptFragment) : eval(scriptFragment); 	// Object
  };
});
