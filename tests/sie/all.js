define("tests/sie/all", ["doh/runner"], function() {

// we use dojo.require instead of dojo.req because we want this
// module to work with the v1.5 loader and bootstrap which does
// not define dojo.req
dojo.require("tests._base.array");
dojo.require("tests._base.Color");
dojo.require("tests._base.lang");
dojo.require("tests._base.declare");
dojo.require("tests._base.connect");
dojo.require("tests._base.Deferred");
dojo.require("tests._base.json");
dojo.require("tests._base.object");
if (dojo.isBrowser) {
  dojo.require("tests._base.html", true);
  dojo.require("tests._base.fx", true);
  dojo.require("tests._base.query", true);
  dojo.require("tests._base.xhr", true);
  dojo.require("tests._base.window", true);
}

});