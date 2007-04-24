dojo.provide("dojo.date.calc");

// Utility methods to do arithmetic calculations with Dates

dojo.date.calc.types={
	// 	summary
	//	bitmask for comparison operations.
	DATE:1, TIME:2 
};

dojo.date.calc.compare = function(/*Date|Number*/date1, /*Date|Number?*/date2, /*dojo.date.calc.types?*/type){
	//	summary
	//		Compare two date objects by date, time, or both.
	//
	//  description
	//  	Returns 0 if equal, positive if a > b, else negative.
	//
	//	date1
	//		Date object or Number equivalent
	//
	//	date2
	//		Date object or Number equivalent.  If not specified, the current Date is used.
	//
	//	type
	//		A constant representing DATE or TIME.  Compares DATE and TIME by default.
	//		See dojo.date.calc.types.

	date2 = date2 || new Date();

	var typeEnum = dojo.date.calc.types;
	var DATE = typeEnum.DATE;
	var TIME = typeEnum.TIME;
	if(type && type != DATE | TIME){
		date1 = new Date(date1);
		date2 = new Date(date2);
		if(type == DATE){
			// Ignore times and compare dates.
			date1.setHours(0, 0, 0, 0);
			date2.setHours(0, 0, 0, 0);
		}else if(type == TIME){
			// Ignore dates and compare times.
			date1.setFullYear(0, 0, 0);
			date2.setFullYear(0, 0, 0);
		}
	}
	
	if(date1 > date2){ return 1; } // int
	if(date1 < date2){ return -1; } // int
	return 0; // int
};

dojo.date.calc.parts = {
	//	summary
	//		constants for use in dojo.date.calc.add and .diff
	YEAR:0, MONTH:1, DAY:2, HOUR:3, MINUTE:4, SECOND:5, MILLISECOND:6, QUARTER:7, WEEK:8, WEEKDAY:9
};

dojo.date.calc.add = function(/*Date|Number*/date, /*dojo.date.calc.parts*/interval, /*int*/incr){
//	summary
//		Add to a Date in intervals of different size, from milliseconds to years
//
//	date
//		Date object to start with, or Number equivalent
//
//	interval
//		A constant representing the interval, e.g. YEAR, MONTH, DAY.  See dojo.date.calc.parts.
//
//	incr
//		How much to add to the date.

	if(typeof date == 'number'){date = new Date(date);}

	function fixOvershoot(){
		if (sum.getDate() < date.getDate()){
			sum.setDate(0);
		}
	}
	
	var sum = new Date(date);

	with(dojo.date.calc.parts){
		switch(interval){
			case YEAR:
				sum.setFullYear(date.getFullYear()+incr);
				// Keep increment/decrement from 2/29 out of March
				fixOvershoot();
				break;
			case QUARTER:
				// Naive quarter is just three months
				incr*=3;
				// fallthrough...
			case MONTH:
				sum.setMonth(date.getMonth()+incr);
				// Reset to last day of month if you overshoot
				fixOvershoot();
				break;
			case WEEK:
				incr*=7;
				// fallthrough...
			case DAY:
				sum.setDate(date.getDate() + incr);
				break;
			case WEEKDAY:
				//FIXME: assumes Saturday/Sunday weekend, but even this is not fixed.  There are CLDR entries to localize this.
				var dat = date.getDate();
				var weeks = 0;
				var days = 0;
				var strt = 0;
				var trgt = 0;
				var adj = 0;
				// Divide the increment time span into weekspans plus leftover days
				// e.g., 8 days is one 5-day weekspan / and two leftover days
				// Can't have zero leftover days, so numbers divisible by 5 get
				// a days value of 5, and the remaining days make up the number of weeks
				var mod = incr % 5;
				if (mod == 0) {
					days = (incr > 0) ? 5 : -5;
					weeks = (incr > 0) ? ((incr-5)/5) : ((incr+5)/5);
				}
				else {
					days = mod;
					weeks = parseInt(incr/5);
				}
				// Get weekday value for orig date param
				strt = date.getDay();
				// Orig date is Sat / positive incrementer
				// Jump over Sun
				if (strt == 6 && incr > 0) {
					adj = 1;
				}
				// Orig date is Sun / negative incrementer
				// Jump back over Sat
				else if (strt == 0 && incr < 0) {
					adj = -1;
				}
				// Get weekday val for the new date
				trgt = strt + days;
				// New date is on Sat or Sun
				if (trgt == 0 || trgt == 6) {
					adj = (incr > 0) ? 2 : -2;
				}
				// Increment by number of weeks plus leftover days plus
				// weekend adjustments
				sum.setDate(dat + (7*weeks) + days + adj);
				break;
			case HOUR:
				sum.setHours(sum.getHours()+incr);
				break;
			case MINUTE:
				sum.setMinutes(sum.getMinutes()+incr);
				break;
			case SECOND:
				sum.setSeconds(sum.getSeconds()+incr);
				break;
			case MILLISECOND:
				sum.setMilliseconds(sum.getMilliseconds()+incr);
				break;
			default:
				// Do nothing
				break;
		}
	}

	return sum; // Date
};

dojo.date.calc.diff = function(/*Date|Number*/date1, /*Date|Number*/date2, /*dojo.date.calc.parts*/interval){
//	summary
//		Get the difference in a specific unit of time (e.g., number of months, weeks,
//		days, etc.) between two dates.
//
//	date1
//		Date object or Number equivalent
//
//	date2
//		Date object or Number equivalent
//
//	interval
//		A constant representing the interval, e.g. YEAR, MONTH, DAY.  See dojo.date.calc.parts.

	// Accept timestamp input
	if(typeof date1 == 'number'){date1 = new Date(date1);}
	if(typeof date2 == 'number'){date2 = new Date(date2);}
	var yeaDiff = date2.getFullYear() - date1.getFullYear();
	var monDiff = (date2.getMonth() - date1.getMonth()) + (yeaDiff * 12);
	var msDiff = date2.getTime() - date1.getTime(); // Millisecs
	var secDiff = msDiff/1000;
	var minDiff = secDiff/60;
	var houDiff = minDiff/60;
	var dayDiff = houDiff/24;
	var weeDiff = dayDiff/7;
	var delta = 0; // Integer return value

	with(dojo.date.calc.parts){
		switch(interval){
			case YEAR:
				delta = yeaDiff;
				break;
			case QUARTER:
				var m1 = date1.getMonth();
				var m2 = date2.getMonth();
				// Figure out which quarter the months are in
				var q1 = Math.floor(m1/3) + 1;
				var q2 = Math.floor(m2/3) + 1;
				// Add quarters for any year difference between the dates
				q2 += (yeaDiff * 4);
				delta = q2 - q1;
				break;
			case MONTH:
				delta = monDiff;
				break;
			case WEEK:
				// Truncate instead of rounding
				// Don't use Math.floor -- value may be negative
				delta = parseInt(weeDiff);
				break;
			case DAY:
				delta = dayDiff;
				break;
			case WEEKDAY:
				var days = Math.round(dayDiff);
				var weeks = parseInt(days/7);
				var mod = days % 7;

				// Even number of weeks
				if(mod == 0){
					days = weeks*5;
				}else{
					// Weeks plus spare change (< 7 days)
					var adj = 0;
					var aDay = date1.getDay();
					var bDay = date2.getDay();
	
					weeks = parseInt(days/7);
					mod = days % 7;
					// Mark the date advanced by the number of
					// round weeks (may be zero)
					var dtMark = new Date(date1);
					dtMark.setDate(dtMark.getDate()+(weeks*7));
					var dayMark = dtMark.getDay();

					// Spare change days -- 6 or less
					if(dayDiff > 0){
						switch(true){
							// Range starts on Sat
							case aDay == 6:
								adj = -1;
								break;
							// Range starts on Sun
							case aDay == 0:
								adj = 0;
								break;
							// Range ends on Sat
							case bDay == 6:
								adj = -1;
								break;
							// Range ends on Sun
							case bDay == 0:
								adj = -2;
								break;
							// Range contains weekend
							case (dayMark + mod) > 5:
								adj = -2;
								break;
							default:
								// Do nothing
								break;
						}
					}else if(dayDiff < 0){
						switch (true){
							// Range starts on Sat
							case aDay == 6:
								adj = 0;
								break;
							// Range starts on Sun
							case aDay == 0:
								adj = 1;
								break;
							// Range ends on Sat
							case bDay == 6:
								adj = 2;
								break;
							// Range ends on Sun
							case bDay == 0:
								adj = 1;
								break;
							// Range contains weekend
							case (dayMark + mod) < 0:
								adj = 2;
								break;
							default:
								// Do nothing
								break;
						}
					}
					days += adj;
					days -= (weeks*2);
				}
				delta = days;

				break;
			case HOUR:
				delta = houDiff;
				break;
			case MINUTE:
				delta = minDiff;
				break;
			case SECOND:
				delta = secDiff;
				break;
			case MILLISECOND:
				delta = msDiff;
				break;
			default:
				// Do nothing
				break;
		}
	}

	// Round for fractional values and DST leaps
	return Math.round(delta); // Number (integer)
};
