dojo.provide("tests.date.util");

dojo.require("dojo.date.util");

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
