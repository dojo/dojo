define("dojo/_base/version", ["dojo"], function(dojo) {
  // RCGTODO: Find out if this line is automatically generated somehow.
	var rev = "$Rev$".match(/\d+/);

  dojo.version= {
    major: 1,
    minor: 5,
    patch: 0,
    flag: "sie",
		revision: rev ? +rev[0] : NaN,
		toString: function(){
			with(dojo.version){
				return major + "." + minor + "." + patch + flag + " (" + revision + ")";	// String
			}
		}
  };
});
