dojo.provide("tests.date");

dojo.require("dojo.date");

tests.register("tests.date.util", 
	[
function test_date_setDayOfYear(t){
	t.is(23, dojo.date.setDayOfYear(new Date(2006,0,1), 23).getDate());
},

function test_date_getDayOfYear(t){
	t.is(1, dojo.date.getDayOfYear(new Date(2006,0,1)));
	t.is(32, dojo.date.getDayOfYear(new Date(2006,1,1)));
},

function test_date_setWeekOfYear(t){
	//dojo.date.setWeekOfYear(new Date(2006,2,1), 34);
	//dojo.date.setWeekOfYear(new Date(2006,2,1), 34, 1);
},

function test_date_getWeekOfYear(t){
	//dojo.date.getWeekOfYear(new Date(2006,1,1));
	//dojo.date.getWeekOfYear(new Date(2006,1,1), 1);
},

function test_date_setIsoWeekOfYear(t){
	var date = new Date(2006,10,10);
	var result = dojo.date.setIsoWeekOfYear(date, 1);
	t.is(new Date(2006,0,6), result);
	result = dojo.date.setIsoWeekOfYear(date, 10);
	result = dojo.date.setIsoWeekOfYear(date, 2);
	t.is(new Date(2006,0,13), result);
	result = dojo.date.setIsoWeekOfYear(date, 10);
	t.is(new Date(2006,2,10), result);
	result = dojo.date.setIsoWeekOfYear(date, 52);
	t.is(new Date(2006,11,29), result);
	var result = dojo.date.setIsoWeekOfYear(date, -1);
	t.is(new Date(2006,11,29), result);
	var result = dojo.date.setIsoWeekOfYear(date, -2);
	t.is(new Date(2006,11,22), result);
	var result = dojo.date.setIsoWeekOfYear(date, -10);
	t.is(new Date(2006,9,27), result);
	
	date = new Date(2004,10,10);
	result = dojo.date.setIsoWeekOfYear(date, 1);
	t.is(new Date(2003,11,31), result);
	result = dojo.date.setIsoWeekOfYear(date, 2);
	t.is(new Date(2004,0,7), result);
	result = dojo.date.setIsoWeekOfYear(date, -1);
	t.is(new Date(2004,11,29), result);
},

function test_date_getIsoWeekOfYear(t){
	var week = dojo.date.getIsoWeekOfYear(new Date(2006,0,1));
	t.is(52, week);
	week = dojo.date.getIsoWeekOfYear(new Date(2006,0,4));
	t.is(1, week);
	week = dojo.date.getIsoWeekOfYear(new Date(2006,11,31));
	t.is(52, week);
	week = dojo.date.getIsoWeekOfYear(new Date(2007,0,1));
	t.is(1, week);
	week = dojo.date.getIsoWeekOfYear(new Date(2007,11,31));
	t.is(53, week);
	week = dojo.date.getIsoWeekOfYear(new Date(2008,0,1));
	t.is(1, week);
	week = dojo.date.getIsoWeekOfYear(new Date(2007,11,31));
	t.is(53, week);
},


function test_date_getStartOfWeek(t){
	var weekStart;
	
	// Monday
	var date = new Date(2007, 0, 1);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 1), 1);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 2), 1);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 3), 1);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 4), 1);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 5), 1);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 6), 1);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 7), 1);
	t.is(date, weekStart);

	// Sunday
	date = new Date(2007, 0, 7);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 7), 0);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 8), 0);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 9), 0);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 10), 0);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 11), 0);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 12), 0);
	t.is(date, weekStart);
	weekStart = dojo.date.getStartOfWeek(new Date(2007, 0, 13), 0);
	t.is(date, weekStart);
},

function test_date_getIsoWeeksInYear(t){
	// 44 long years in a 400 year cycle.
	var longYears = [4, 9, 15, 20, 26, 32, 37, 43, 48, 54, 60, 65, 71, 76, 82, 
		88,	93, 99, 105, 111, 116, 122, 128, 133, 139, 144, 150, 156, 161, 167,
		172, 178, 184, 189, 195, 201, 207, 212, 218, 224, 229, 235, 240, 246, 
		252, 257, 263, 268, 274, 280, 285, 291, 296, 303, 308, 314, 320, 325,
		331, 336, 342, 348, 353, 359, 364, 370, 376, 381, 387, 392, 398];

	var i, j, weeks, result;
	for(i=0; i < 400; i++) {
		weeks = 52;
		if(i == longYears[0]) { weeks = 53; longYears.shift(); }
		result = dojo.date.getIsoWeeksInYear(new Date(2000 + i, 0, 1));
		t.is(/*weeks +" weeks in "+ (2000+i), */weeks, result);
	}
},



/* Informational Functions
 **************************/

function test_date_getDaysInMonth(t){
	// months other than February
	t.is(31, dojo.date.getDaysInMonth(new Date(2006,0,1)));
	t.is(31, dojo.date.getDaysInMonth(new Date(2006,2,1)));
	t.is(30, dojo.date.getDaysInMonth(new Date(2006,3,1)));
	t.is(31, dojo.date.getDaysInMonth(new Date(2006,4,1)));
	t.is(30, dojo.date.getDaysInMonth(new Date(2006,5,1)));
	t.is(31, dojo.date.getDaysInMonth(new Date(2006,6,1)));
	t.is(31, dojo.date.getDaysInMonth(new Date(2006,7,1)));
	t.is(30, dojo.date.getDaysInMonth(new Date(2006,8,1)));
	t.is(31, dojo.date.getDaysInMonth(new Date(2006,9,1)));
	t.is(30, dojo.date.getDaysInMonth(new Date(2006,10,1)));
	t.is(31, dojo.date.getDaysInMonth(new Date(2006,11,1)));

	// Februarys
	t.is(28, dojo.date.getDaysInMonth(new Date(2006,1,1)));
	t.is(29, dojo.date.getDaysInMonth(new Date(2004,1,1)));
	t.is(29, dojo.date.getDaysInMonth(new Date(2000,1,1)));
	t.is(28, dojo.date.getDaysInMonth(new Date(1900,1,1)));
	t.is(28, dojo.date.getDaysInMonth(new Date(1800,1,1)));
	t.is(28, dojo.date.getDaysInMonth(new Date(1700,1,1)));
	t.is(29, dojo.date.getDaysInMonth(new Date(1600,1,1)));
},

function test_date_isLeapYear(t){
	t.f(dojo.date.isLeapYear(new Date(2006,0,1)));
	t.t(dojo.date.isLeapYear(new Date(2004,0,1)));
	t.t(dojo.date.isLeapYear(new Date(2000,0,1)));
	t.f(dojo.date.isLeapYear(new Date(1900,0,1)));
	t.f(dojo.date.isLeapYear(new Date(1800,0,1)));
	t.f(dojo.date.isLeapYear(new Date(1700,0,1)));
	t.t(dojo.date.isLeapYear(new Date(1600,0,1)));
},

// The getTimezone function pulls from either the date's toString or
// toLocaleString method -- it's really just a string-processing
// function (assuming the Date obj passed in supporting both toString 
// and toLocaleString) and as such can be tested for multiple browsers
// by manually settting up fake Date objects with the actual strings
// produced by various browser/OS combinations.
// FIXME: the function and tests are not localized.
function test_date_getTimezoneName(t){
	
	// Create a fake Date object with toString and toLocaleString
	// results manually set to simulate tests for multiple browsers
	function fakeDate(str, strLocale){
		this.str = str || '';
		this.strLocale = strLocale || '';
		this.toString = function() {
			return this.str;
		};
		this.toLocaleString = function(){
			return this.strLocale;
		};
	}
	var dt = new fakeDate();
	
	// FF 1.5 Ubuntu Linux (Breezy)
	dt.str = 'Sun Sep 17 2006 22:25:51 GMT-0500 (CDT)';
	dt.strLocale = 'Sun 17 Sep 2006 10:25:51 PM CDT';
	t.is('CDT', dojo.date.getTimezoneName(dt));

	// Safari 2.0 Mac OS X 10.4
	dt.str = 'Sun Sep 17 2006 22:55:01 GMT-0500';
	dt.strLocale = 'September 17, 2006 10:55:01 PM CDT';
	t.is('CDT', dojo.date.getTimezoneName(dt));

	// FF 1.5 Mac OS X 10.4
	dt.str = 'Sun Sep 17 2006 22:57:18 GMT-0500 (CDT)';
	dt.strLocale = 'Sun Sep 17 22:57:18 2006';
	t.is('CDT', dojo.date.getTimezoneName(dt));

	// Opera 9 Mac OS X 10.4 -- no TZ data expect empty string return
	dt.str = 'Sun, 17 Sep 2006 22:58:06 GMT-0500';
	dt.strLocale = 'Sunday September 17, 22:58:06 GMT-0500 2006';
	t.is('', dojo.date.getTimezoneName(dt));
	
	// IE 6 Windows XP
	dt.str = 'Mon Sep 18 11:21:07 CDT 2006';
	dt.strLocale = 'Monday, September 18, 2006 11:21:07 AM';
	t.is('CDT', dojo.date.getTimezoneName(dt));

	// Opera 9 Ubuntu Linux (Breezy) -- no TZ data expect empty string return 
	dt.str = 'Mon, 18 Sep 2006 13:30:32 GMT-0500';
	dt.strLocale = 'Monday September 18, 13:30:32 GMT-0500 2006';
	t.is('', dojo.date.getTimezoneName(dt));
	
	// IE 5.5 Windows 2000
	dt.str = 'Mon Sep 18 13:49:22 CDT 2006';
	dt.strLocale = 'Monday, September 18, 2006 1:49:22 PM';
	t.is('CDT', dojo.date.getTimezoneName(dt));
}
	]
);

tests.register("tests.date.math", 
	[
function test_date_compare(t){
	var d1=new Date();
	d1.setHours(0);
	var d2=new Date();
	d2.setFullYear(2005);
	d2.setHours(12);
	t.is(0, dojo.date.compare(d1, d1));
	t.is(1, dojo.date.compare(d1, d2, "date"));
	t.is(-1, dojo.date.compare(d2, d1, "date"));
	t.is(-1, dojo.date.compare(d1, d2, "time"));
	t.is(1, dojo.date.compare(d1, d2, "datetime"));
},
function test_date_add(t){
	var interv = ''; // Interval (e.g., year, month)
	var dtA = null; // Date to increment
	var dtB = null; // Expected result date
	
	interv = "year";
	dtA = new Date(2005, 11, 27);
	dtB = new Date(2006, 11, 27);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2005, 11, 27);
	dtB = new Date(2004, 11, 27);
	t.is(dtB, dojo.date.add(dtA, interv, -1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2005, 1, 28);
	t.is(dtB, dojo.date.add(dtA, interv, 5));
	
	dtA = new Date(1900, 11, 31);
	dtB = new Date(1930, 11, 31);
	t.is(dtB, dojo.date.add(dtA, interv, 30));
	
	dtA = new Date(1995, 11, 31);
	dtB = new Date(2030, 11, 31);
	t.is(dtB, dojo.date.add(dtA, interv, 35));

	interv = "quarter";
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 3, 1);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2000, 7, 29);
	t.is(dtB, dojo.date.add(dtA, interv, 2));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.add(dtA, interv, 4));
	
	interv = "month";
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 1, 1);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2000, 0, 31);
	dtB = new Date(2000, 1, 29);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.add(dtA, interv, 12));
	
	interv = "week";
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 0, 8);
	t.is(dtB, dojo.date.add(dtA, interv, 1));

	var interv = "day";
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 0, 2);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2001, 0, 1);
	dtB = new Date(2002, 0, 1);
	t.is(dtB, dojo.date.add(dtA, interv, 365));
	
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2001, 0, 1);
	t.is(dtB, dojo.date.add(dtA, interv, 366));
	
	dtA = new Date(2000, 1, 28);
	dtB = new Date(2000, 1, 29);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2001, 1, 28);
	dtB = new Date(2001, 2, 1);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	dtA = new Date(2000, 2, 1);
	dtB = new Date(2000, 1, 29);
	t.is(dtB, dojo.date.add(dtA, interv, -1));
	
	dtA = new Date(2001, 2, 1);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.add(dtA, interv, -1));
	
	dtA = new Date(2000, 0, 1);
	dtB = new Date(1999, 11, 31);
	t.is(dtB, dojo.date.add(dtA, interv, -1));
	
	interv = "weekday";
	// Sat, Jan 1
	dtA = new Date(2000, 0, 1);
	// Should be Mon, Jan 3
	dtB = new Date(2000, 0, 3);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	// Sun, Jan 2
	dtA = new Date(2000, 0, 2);
	// Should be Mon, Jan 3
	dtB = new Date(2000, 0, 3);
	t.is(dtB, dojo.date.add(dtA, interv, 1));
	
	// Sun, Jan 2
	dtA = new Date(2000, 0, 2);
	// Should be Fri, Jan 7
	dtB = new Date(2000, 0, 7);
	t.is(dtB, dojo.date.add(dtA, interv, 5));
	
	// Sun, Jan 2
	dtA = new Date(2000, 0, 2);
	// Should be Mon, Jan 10
	dtB = new Date(2000, 0, 10);
	t.is(dtB, dojo.date.add(dtA, interv, 6));
	
	// Mon, Jan 3
	dtA = new Date(2000, 0, 3);
	// Should be Mon, Jan 17
	dtB = new Date(2000, 0, 17);
	t.is(dtB, dojo.date.add(dtA, interv, 10));
	
	// Sat, Jan 8
	dtA = new Date(2000, 0, 8);
	// Should be Mon, Jan 3
	dtB = new Date(2000, 0, 3);
	t.is(dtB, dojo.date.add(dtA, interv, -5));
	
	// Sun, Jan 9
	dtA = new Date(2000, 0, 9);
	// Should be Wed, Jan 5
	dtB = new Date(2000, 0, 5);
	t.is(dtB, dojo.date.add(dtA, interv, -3));
	
	// Sun, Jan 23
	dtA = new Date(2000, 0, 23);
	// Should be Fri, Jan 7
	dtB = new Date(2000, 0, 7);
	t.is(dtB, dojo.date.add(dtA, interv, -11));
	
	interv = "hour";
	dtA = new Date(2000, 0, 1, 11);
	dtB = new Date(2000, 0, 1, 12);
	t.is(dtB, dojo.date.add(dtA, interv, 1));

	dtA = new Date(2001, 9, 28, 0);
	dtB = new Date(2001, 9, 28, 1);
	t.is(dtB, dojo.date.add(dtA, interv, 1));

	dtA = new Date(2001, 9, 28, 23);
	dtB = new Date(2001, 9, 29, 0);
	t.is(dtB, dojo.date.add(dtA, interv, 1));

	dtA = new Date(2001, 11, 31, 23);
	dtB = new Date(2002, 0, 1, 0);
	t.is(dtB, dojo.date.add(dtA, interv, 1));

	interv = "minute";
	dtA = new Date(2000, 11, 31, 23, 59);
	dtB = new Date(2001, 0, 1, 0, 0);
	t.is(dtB, dojo.date.add(dtA, interv, 1));

	dtA = new Date(2000, 11, 27, 12, 02);
	dtB = new Date(2000, 11, 27, 13, 02);
	t.is(dtB, dojo.date.add(dtA, interv, 60));
	
	interv = "second";
	dtA = new Date(2000, 11, 31, 23, 59, 59);
	dtB = new Date(2001, 0, 1, 0, 0, 0);
	t.is(dtB, dojo.date.add(dtA, interv, 1));

	dtA = new Date(2000, 11, 27, 8, 10, 59);
	dtB = new Date(2000, 11, 27, 8, 11, 59);
	t.is(dtB, dojo.date.add(dtA, interv, 60));
	
	// Test environment JS Date doesn't support millisec?
	//interv = "millisecond";
	//
	//dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
	//dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
	//t.is(dtB, dojo.date.add(dtA, interv, 1));
	//
	//dtA = new Date(2000, 11, 27, 8, 10, 53, 2);
	//dtB = new Date(2000, 11, 27, 8, 10, 54, 2);
	//t.is(dtB, dojo.date.add(dtA, interv, 1000));
},
function test_date_diff(t){
	var dtA = null; // First date to compare
	var dtB = null; // Second date to compare
	var interv = ''; // Interval to compare on (e.g., year, month)
	
	interv = "year";
	dtA = new Date(2005, 11, 27);
	dtB = new Date(2006, 11, 27);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	interv = "quarter";
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 2, 1);
	t.is(4, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 1);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	interv = "month";
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 2, 1);
	t.is(13, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 1);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	interv = "week";
	dtA = new Date(2000, 1, 1);
	dtB = new Date(2000, 1, 8);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 1, 28);
	dtB = new Date(2000, 2, 6);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 2, 6);
	dtB = new Date(2000, 1, 28);
	t.is(-1, dojo.date.diff(dtA, dtB, interv));
	
	interv = "day";
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2000, 2, 1);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	// DST leap -- check for rounding err
	// This is dependent on US calendar, but
	// shouldn't break in other locales
	dtA = new Date(2005, 3, 3);
	dtB = new Date(2005, 3, 4);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	interv = "weekday";
	dtA = new Date(2006, 7, 3);
	dtB = new Date(2006, 7, 11);
	t.is(6, dojo.date.diff(dtA, dtB, interv));
	
	// Positive diffs
	dtA = new Date(2006, 7, 4);
	dtB = new Date(2006, 7, 11);
	t.is(5, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 5);
	dtB = new Date(2006, 7, 11);
	t.is(5, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 6);
	dtB = new Date(2006, 7, 11);
	t.is(5, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 11);
	t.is(4, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 13);
	t.is(4, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 14);
	t.is(5, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 15);
	t.is(6, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 28);
	t.is(15, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 2, 2);
	dtB = new Date(2006, 2, 28);
	t.is(18, dojo.date.diff(dtA, dtB, interv));
	
	// Negative diffs
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 4);
	t.is(-5, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 5);
	t.is(-4, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 6);
	t.is(-4, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 7);
	t.is(-4, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 13);
	dtB = new Date(2006, 7, 7);
	t.is(-5, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 14);
	dtB = new Date(2006, 7, 7);
	t.is(-5, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 15);
	dtB = new Date(2006, 7, 7);
	t.is(-6, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 28);
	dtB = new Date(2006, 7, 7);
	t.is(-15, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 2, 28);
	dtB = new Date(2006, 2, 2);
	t.is(-18, dojo.date.diff(dtA, dtB, interv));

	// Two days on the same weekend -- no weekday diff
	dtA = new Date(2006, 7, 5);
	dtB = new Date(2006, 7, 6);
	t.is(0, dojo.date.diff(dtA, dtB, interv));
	
	interv = "hour";
	dtA = new Date(2000, 11, 31, 23);
	dtB = new Date(2001, 0, 1, 0);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31, 12);
	dtB = new Date(2001, 0, 1, 0);
	t.is(12, dojo.date.diff(dtA, dtB, interv));
	
	interv = "minute";
	dtA = new Date(2000, 11, 31, 23, 59);
	dtB = new Date(2001, 0, 1, 0, 0);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 1, 28, 23, 59);
	dtB = new Date(2000, 1, 29, 0, 0);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	interv = "second";
	dtA = new Date(2000, 11, 31, 23, 59, 59);
	dtB = new Date(2001, 0, 1, 0, 0, 0);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	interv = "millisecond";
	dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
	dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
	t.is(1, dojo.date.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31, 23, 59, 59, 0);
	dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
	t.is(1000, dojo.date.diff(dtA, dtB, interv));
}
	]
);

dojo.require("tests.date.locale");
dojo.require("tests.date.stamp");
