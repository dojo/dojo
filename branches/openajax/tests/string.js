dojo.provide("tests.string");

dojo.require("dojo.string");

tests.register("tests.string", 
	[
		function test_string_pad(t){
			t.is("00001", dojo.string.pad("1", 5));
			t.is("000001", dojo.string.pad("000001", 5));
			t.is("10000", dojo.string.pad("1", 5, null, true));
		},

		function test_string_substitute(t){
			t.is("File 'foo.html' is not found in directory '/temp'.", dojo.string.substitute("File '${0}' is not found in directory '${1}'.", ["foo.html","/temp"]));
			t.is("File 'foo.html' is not found in directory '/temp'.", dojo.string.substitute("File '${name}' is not found in directory '${info.dir}'.", {name: "foo.html", info: {dir: "/temp"}}));
		},
		
		function test_string_trim(t){
			t.is("astoria", dojo.string.trim("   \f\n\r\t      astoria           "));
			t.is("astoria", dojo.string.trim("astoria                            "));
			t.is("astoria", dojo.string.trim("                            astoria"));
			t.is("astoria", dojo.string.trim("astoria"));
		}
	]
);
