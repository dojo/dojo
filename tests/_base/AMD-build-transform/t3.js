//this module will fail the AMD transform since it doesn't have a moduleId
define(["your/module", "his/module"], function(yours, his) {

var x= 1;

return ++x;

});
