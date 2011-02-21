// test leading commentary, AMD-ID pragma, AMD-return pragmas, auto strip last return
//
// some commentary
/*
 * more commentary
 *
 */
// AMD-ID "my/module"
define(["your/module", "his/module"], function(yours, his) {

var x= 1;

// AMD-return with and without spaces and additional commentary

return ++x1;//AMD-return
return ++x2;// AMD-return
return ++x3; //AMD-return
return ++x4; // AMD-return
return ++x5; //AMD-return stuff
return ++x6; // AMD-return stuff
return ++x7; //AMD-return stuff
return ++x8; // AMD-return stuff

return ++x9;//amd-return
return ++xa;// amd-return
return ++xb; //amd-return
return ++xc; // amd-return
return ++xd; //amd-return stuff
return ++xe; // amd-return stuff
return ++xf; //amd-return stuff
return ++xg; // amd-return stuff

//the next return should be stripped by the build transform
return x;



});
