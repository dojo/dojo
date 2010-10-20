define("dojo/_base/unloadDetect", ["dojo"], function (dojo) {
  var 
    createHandler= function(event, stack) {
      var disconnect= require.addNodeEvent(window, event, function() {
        while (stack.length) {
          stack.pop().call(null);
        }
        disconnect();
        stack==windowUnloadStack && (dojo= null);
      });
    },
    unloadStack= dojo.unloadStack= [],
    windowUnloadStack= dojo.unloadStack= [];

  createHandler("beforeunload", unloadStack);
  createHandler("unload", windowUnloadStack);

	dojo.addOnUnload = function(context, callback) {
    unloadStack.push(dojo.hitch(context, callback));
	};

	dojo.addOnWindowUnload = function(context, callback) {
    windowUnloadStack.push(dojo.hitch(context, callback));
	};

});
// Copyright (c) 2008-2010, Rawld Gill and ALTOVISO LLC (www.altoviso.com). Use, modification, and distribution subject to terms of license.
