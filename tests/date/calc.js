dojo.provide("tests.date.calc");

dojo.require("dojo.date.calc");

tests.register("tests.date.calc", 
	[
function test_date_compare(t){
	var d1=new Date();
	d1.setHours(0);
	var d2=new Date();
	d2.setFullYear(2005);
	d2.setHours(12);
	t.is(0, dojo.date.calc.compare(d1, d1));
	t.is(1, dojo.date.calc.compare(d1, d2, dojo.date.calc.types.DATE));
	t.is(-1, dojo.date.calc.compare(d2, d1, dojo.date.calc.types.DATE));
	t.is(-1, dojo.date.calc.compare(d1, d2, dojo.date.calc.types.TIME));
	t.is(1, dojo.date.calc.compare(d1, d2, dojo.date.calc.types.DATE|dojo.date.calc.types.TIME));
},
function test_date_add(t){
	var interv = ''; // Interval (e.g., year, month)
	var dtA = null; // Date to increment
	var dtB = null; // Expected result date
	
	interv = dojo.date.calc.parts.YEAR;
	dtA = new Date(2005, 11, 27);
	dtB = new Date(2006, 11, 27);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2005, 11, 27);
	dtB = new Date(2004, 11, 27);
	t.is(dtB, dojo.date.calc.add(dtA, interv, -1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2005, 1, 28);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 5));
	
	dtA = new Date(1900, 11, 31);
	dtB = new Date(1930, 11, 31);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 30));
	
	dtA = new Date(1995, 11, 31);
	dtB = new Date(2030, 11, 31);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 35));

	interv = dojo.date.calc.parts.QUARTER;
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 3, 1);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2000, 7, 29);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 2));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 4));
	
	interv = dojo.date.calc.parts.MONTH;
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 1, 1);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2000, 0, 31);
	dtB = new Date(2000, 1, 29);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 12));
	
	interv = dojo.date.calc.parts.WEEK;
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 0, 8);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));

	var interv = dojo.date.calc.parts.DAY;
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2000, 0, 2);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2001, 0, 1);
	dtB = new Date(2002, 0, 1);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 365));
	
	dtA = new Date(2000, 0, 1);
	dtB = new Date(2001, 0, 1);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 366));
	
	dtA = new Date(2000, 1, 28);
	dtB = new Date(2000, 1, 29);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2001, 1, 28);
	dtB = new Date(2001, 2, 1);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	dtA = new Date(2000, 2, 1);
	dtB = new Date(2000, 1, 29);
	t.is(dtB, dojo.date.calc.add(dtA, interv, -1));
	
	dtA = new Date(2001, 2, 1);
	dtB = new Date(2001, 1, 28);
	t.is(dtB, dojo.date.calc.add(dtA, interv, -1));
	
	dtA = new Date(2000, 0, 1);
	dtB = new Date(1999, 11, 31);
	t.is(dtB, dojo.date.calc.add(dtA, interv, -1));
	
	interv = dojo.date.calc.parts.WEEKDAY;
	// Sat, Jan 1
	dtA = new Date(2000, 0, 1);
	// Should be Mon, Jan 3
	dtB = new Date(2000, 0, 3);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	// Sun, Jan 2
	dtA = new Date(2000, 0, 2);
	// Should be Mon, Jan 3
	dtB = new Date(2000, 0, 3);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	
	// Sun, Jan 2
	dtA = new Date(2000, 0, 2);
	// Should be Fri, Jan 7
	dtB = new Date(2000, 0, 7);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 5));
	
	// Sun, Jan 2
	dtA = new Date(2000, 0, 2);
	// Should be Mon, Jan 10
	dtB = new Date(2000, 0, 10);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 6));
	
	// Mon, Jan 3
	dtA = new Date(2000, 0, 3);
	// Should be Mon, Jan 17
	dtB = new Date(2000, 0, 17);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 10));
	
	// Sat, Jan 8
	dtA = new Date(2000, 0, 8);
	// Should be Mon, Jan 3
	dtB = new Date(2000, 0, 3);
	t.is(dtB, dojo.date.calc.add(dtA, interv, -5));
	
	// Sun, Jan 9
	dtA = new Date(2000, 0, 9);
	// Should be Wed, Jan 5
	dtB = new Date(2000, 0, 5);
	t.is(dtB, dojo.date.calc.add(dtA, interv, -3));
	
	// Sun, Jan 23
	dtA = new Date(2000, 0, 23);
	// Should be Fri, Jan 7
	dtB = new Date(2000, 0, 7);
	t.is(dtB, dojo.date.calc.add(dtA, interv, -11));
	
	interv = dojo.date.calc.parts.HOUR;
	dtA = new Date(2000, 0, 1, 11);
	dtB = new Date(2000, 0, 1, 12);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));

	dtA = new Date(2001, 9, 28, 0);
	dtB = new Date(2001, 9, 28, 1);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));

	dtA = new Date(2001, 9, 28, 23);
	dtB = new Date(2001, 9, 29, 0);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));

	dtA = new Date(2001, 11, 31, 23);
	dtB = new Date(2002, 0, 1, 0);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));

	interv = dojo.date.calc.parts.MINUTE;
	dtA = new Date(2000, 11, 31, 23, 59);
	dtB = new Date(2001, 0, 1, 0, 0);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));

	dtA = new Date(2000, 11, 27, 12, 02);
	dtB = new Date(2000, 11, 27, 13, 02);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 60));
	
	interv = dojo.date.calc.parts.SECOND;
	dtA = new Date(2000, 11, 31, 23, 59, 59);
	dtB = new Date(2001, 0, 1, 0, 0, 0);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 1));

	dtA = new Date(2000, 11, 27, 8, 10, 59);
	dtB = new Date(2000, 11, 27, 8, 11, 59);
	t.is(dtB, dojo.date.calc.add(dtA, interv, 60));
	
	// Test environment JS Date doesn't support millisec?
	//interv = dojo.date.calc.parts.MILLISECOND;
	//
	//dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
	//dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
	//t.is(dtB, dojo.date.calc.add(dtA, interv, 1));
	//
	//dtA = new Date(2000, 11, 27, 8, 10, 53, 2);
	//dtB = new Date(2000, 11, 27, 8, 10, 54, 2);
	//t.is(dtB, dojo.date.calc.add(dtA, interv, 1000));
},
function test_date_diff(t){
	var dtA = null; // First date to compare
	var dtB = null; // Second date to compare
	var interv = ''; // Interval to compare on (e.g., year, month)
	
	interv = dojo.date.calc.parts.YEAR;
	dtA = new Date(2005, 11, 27);
	dtB = new Date(2006, 11, 27);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.QUARTER;
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 2, 1);
	t.is(4, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 1);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.MONTH;
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2001, 2, 1);
	t.is(13, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 1);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.WEEK;
	dtA = new Date(2000, 1, 1);
	dtB = new Date(2000, 1, 8);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 1, 28);
	dtB = new Date(2000, 2, 6);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 2, 6);
	dtB = new Date(2000, 1, 28);
	t.is(-1, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.DAY;
	dtA = new Date(2000, 1, 29);
	dtB = new Date(2000, 2, 1);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31);
	dtB = new Date(2001, 0, 1);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	// DST leap -- check for rounding err
	// This is dependent on US calendar, but
	// shouldn't break in other locales
	dtA = new Date(2005, 3, 3);
	dtB = new Date(2005, 3, 4);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.WEEKDAY;
	dtA = new Date(2006, 7, 3);
	dtB = new Date(2006, 7, 11);
	t.is(6, dojo.date.calc.diff(dtA, dtB, interv));
	
	// Positive diffs
	dtA = new Date(2006, 7, 4);
	dtB = new Date(2006, 7, 11);
	t.is(5, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 5);
	dtB = new Date(2006, 7, 11);
	t.is(5, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 6);
	dtB = new Date(2006, 7, 11);
	t.is(5, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 11);
	t.is(4, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 13);
	t.is(4, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 14);
	t.is(5, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 15);
	t.is(6, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 7);
	dtB = new Date(2006, 7, 28);
	t.is(15, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 2, 2);
	dtB = new Date(2006, 2, 28);
	t.is(18, dojo.date.calc.diff(dtA, dtB, interv));
	
	// Negative diffs
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 4);
	t.is(-5, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 5);
	t.is(-4, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 6);
	t.is(-4, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 11);
	dtB = new Date(2006, 7, 7);
	t.is(-4, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 13);
	dtB = new Date(2006, 7, 7);
	t.is(-5, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 14);
	dtB = new Date(2006, 7, 7);
	t.is(-5, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 15);
	dtB = new Date(2006, 7, 7);
	t.is(-6, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 7, 28);
	dtB = new Date(2006, 7, 7);
	t.is(-15, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2006, 2, 28);
	dtB = new Date(2006, 2, 2);
	t.is(-18, dojo.date.calc.diff(dtA, dtB, interv));

	// Two days on the same weekend -- no weekday diff
	dtA = new Date(2006, 7, 5);
	dtB = new Date(2006, 7, 6);
	t.is(0, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.HOUR;
	dtA = new Date(2000, 11, 31, 23);
	dtB = new Date(2001, 0, 1, 0);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31, 12);
	dtB = new Date(2001, 0, 1, 0);
	t.is(12, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.MINUTE;
	dtA = new Date(2000, 11, 31, 23, 59);
	dtB = new Date(2001, 0, 1, 0, 0);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 1, 28, 23, 59);
	dtB = new Date(2000, 1, 29, 0, 0);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.SECOND;
	dtA = new Date(2000, 11, 31, 23, 59, 59);
	dtB = new Date(2001, 0, 1, 0, 0, 0);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	interv = dojo.date.calc.parts.MILLISECOND;
	dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
	dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
	t.is(1, dojo.date.calc.diff(dtA, dtB, interv));
	
	dtA = new Date(2000, 11, 31, 23, 59, 59, 0);
	dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
	t.is(1000, dojo.date.calc.diff(dtA, dtB, interv));
}
	]
);
