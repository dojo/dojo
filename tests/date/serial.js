dojo.provide("tests.date.serial");

dojo.require("dojo.date.serial");

tests.register("tests.date.serial", 
	[
function test_date_rfc3339(t){
	var rfc  = "2005-06-29T08:05:00-07:00";
	var date = dojo.date.serial.fromRfc3339(rfc);
	t.is(2005,date.getFullYear());
	t.is(5,date.getMonth());
	t.is(29,date.getDate());
	t.is(15,date.getUTCHours());
	t.is(5,date.getMinutes());
	t.is(0,date.getSeconds());

	rfc  = "2004-02-29Tany";
	date = dojo.date.serial.fromRfc3339(rfc);
	t.is(2004,date.getFullYear());
	t.is(1,date.getMonth());
	t.is(29,date.getDate());

	date = new Date(2005,5,29,8,5,0);
	rfc = dojo.date.serial.toRfc3339(date);
	//truncate for comparison
	t.is("2005-06",rfc.substring(0,7));
},

/* ISO 8601 Functions
 *********************/

function test_date_fromIso8601(t){
	var iso  = "20060210T000000Z";
	var date = dojo.date.serial.fromIso8601(iso);
	t.is(2006,date.getFullYear());
	t.is(1,date.getMonth());
	t.is(10,date.getUTCDate());

	iso = "20070116T141500+09";
	date = dojo.date.serial.fromIso8601(iso);
	t.is(2007,date.getFullYear());
},

function test_date_fromIso8601Date(t){
	
	//YYYY-MM-DD
	var date = dojo.date.serial.fromIso8601Date("2005-02-22");
	t.is(2005, date.getFullYear());
	t.is(1, date.getMonth());
	t.is(22, date.getDate());
	
	//YYYYMMDD
	var date = dojo.date.serial.fromIso8601Date("20050222");
	t.is(2005, date.getFullYear());
	t.is(1, date.getMonth());
	t.is(22, date.getDate());
	
	//YYYY-MM
	var date = dojo.date.serial.fromIso8601Date("2005-08");
	t.is(2005, date.getFullYear());
	t.is(7, date.getMonth());
	
	//YYYYMM
	var date = dojo.date.serial.fromIso8601Date("200502");
	t.is(2005, date.getFullYear());
	t.is(1, date.getMonth());
	
	//YYYY
	var date = dojo.date.serial.fromIso8601Date("2005");
	t.is(2005, date.getFullYear());
	
	//1997-W01 or 1997W01
	var date = dojo.date.serial.fromIso8601Date("2005-W22");
	t.is(2005, date.getFullYear());
	t.is(5, date.getMonth());
	t.is(6, date.getDate());

	var date = dojo.date.serial.fromIso8601Date("2005W22");
	t.is(2005, date.getFullYear());
	t.is(5, date.getMonth());
	t.is(6, date.getDate());
	
	//1997-W01-2 or 1997W012
	var date = dojo.date.serial.fromIso8601Date("2005-W22-4");
	t.is(2005, date.getFullYear());
	t.is(5, date.getMonth());
	t.is(9, date.getDate());

	var date = dojo.date.serial.fromIso8601Date("2005W224");
	t.is(2005, date.getFullYear());
	t.is(5, date.getMonth());
	t.is(9, date.getDate());

		
	//1995-035 or 1995035
	var date = dojo.date.serial.fromIso8601Date("2005-146");
	t.is(2005, date.getFullYear());
	t.is(4, date.getMonth());
	t.is(26, date.getDate());
	
	var date = dojo.date.serial.fromIso8601Date("2005146");
	t.is(2005, date.getFullYear());
	t.is(4, date.getMonth());
	t.is(26, date.getDate());
	
},

function test_date_fromIso8601Time(t){
	
	//23:59:59
	var date = dojo.date.serial.fromIso8601Time("18:46:39");
	t.is(18, date.getHours());
	t.is(46, date.getMinutes());
	t.is(39, date.getSeconds());
	
	//235959
	var date = dojo.date.serial.fromIso8601Time("184639");
	t.is(18, date.getHours());
	t.is(46, date.getMinutes());
	t.is(39, date.getSeconds());
	
	//23:59, 2359, or 23
	var date = dojo.date.serial.fromIso8601Time("18:46");
	t.is(18, date.getHours());
	t.is(46, date.getMinutes());

	var date = dojo.date.serial.fromIso8601Time("1846");
	t.is(18, date.getHours());
	t.is(46, date.getMinutes());

	var date = dojo.date.serial.fromIso8601Time("18");
	t.is(18, date.getHours());

	//23:59:59.9942 or 235959.9942
	var date = dojo.date.serial.fromIso8601Time("18:46:39.9942");
	t.is(18, date.getHours());
	t.is(46, date.getMinutes());
	t.is(39, date.getSeconds());
	t.is(994, date.getMilliseconds());

	var date = dojo.date.serial.fromIso8601Time("184639.9942");
	t.is(18, date.getHours());
	t.is(46, date.getMinutes());
	t.is(39, date.getSeconds());
	t.is(994, date.getMilliseconds());
	
	//1995-02-04 24:00 = 1995-02-05 00:00

	//timezone tests
	var offset = new Date().getTimezoneOffset()/60;
	var date = dojo.date.serial.fromIso8601Time("18:46:39+07:00");
	t.is(11, date.getUTCHours());

	var date = dojo.date.serial.fromIso8601Time("18:46:39+00:00");
	t.is(18, date.getUTCHours());

	var date = dojo.date.serial.fromIso8601Time("16:46:39-07:00");
	t.is(23, date.getUTCHours());
	
	//+hh:mm, +hhmm, or +hh
	
	//-hh:mm, -hhmm, or -hh
	}
	]
);
