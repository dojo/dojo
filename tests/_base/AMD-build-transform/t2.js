// test lower case amd pragmas
// amd-id "my/module"
define(["your/module", "his/module"], function(yours, his) {

var x= 1;

return a.b.x; //amd-return

function() {
  return ++x;
}

return x;
});
