dojo.provide("dojo.date.util");

dojo.require("dojo.date.calc");

dojo.date.setDayOfYear = function(/*Date*/dateObject, /*Number*/dayOfYear){
	// summary: sets dateObject according to day of the year (1..366)
	dateObject.setMonth(0);
	dateObject.setDate(dayOfYear);
	return dateObject; // Date
}

dojo.date.getDayOfYear = function(/*Date*/dateObject){
	// summary: gets the day of the year as represented by dateObject
	var fullYear = dateObject.getFullYear();
	var lastDayOfPrevYear = new Date(fullYear-1, 11, 31);
	return Math.floor((dateObject.getTime() -
		lastDayOfPrevYear.getTime()) / 86400000); // Number
}

dojo.date.setWeekOfYear = function(/*Date*/dateObject, /*Number*/week, /*Number*/firstDay){
	if(arguments.length == 2){ firstDay = 0; } // Sunday
	dojo.unimplemented("dojo.date.setWeekOfYear");
}

dojo.date.getWeekOfYear = function(/*Date*/dateObject, /*Number*/firstDay){
	if(arguments.length == 1){ firstDay = 0; } // Sunday

	// work out the first day of the year corresponding to the week
	var firstDayOfYear = new Date(dateObject.getFullYear(), 0, 1);
	var day = firstDayOfYear.getDay();
	firstDayOfYear.setDate(firstDayOfYear.getDate() -
			day + firstDay - (day > firstDay ? 7 : 0));

	return Math.floor((dateObject.getTime() -
		firstDayOfYear.getTime()) / 604800000);
}

dojo.date.setIsoWeekOfYear = function(/*Date*/dateObject, /*Number*/week){
	// summary: Set the ISO8601 week number of the given date.
	//   The week containing January 4th is the first week of the year.
	// week:
	//   can be positive or negative: -1 is the year's last week.
	if(!week){ return dateObject; }
	var currentWeek = dojo.date.getIsoWeekOfYear(dateObject);
	var offset = week - currentWeek;
	if(week < 0){
		var weeks = dojo.date.getIsoWeeksInYear(dateObject);
		offset = (weeks + week + 1) - currentWeek;
	}
	return dojo.date.calc.add(dateObject, dojo.date.calc.parts.WEEK, offset); // Date
}

dojo.date.getIsoWeekOfYear = function(/*Date*/dateObject){
	// summary: Get the ISO8601 week number of the given date.
	//   The week containing January 4th is the first week of the year.
	//   See http://en.wikipedia.org/wiki/ISO_week_date
	var weekStart = dojo.date.getStartOfWeek(dateObject, 1);
	var yearStart = new Date(dateObject.getFullYear(), 0, 4); // January 4th
	yearStart = dojo.date.getStartOfWeek(yearStart, 1);
	var diff = weekStart.getTime() - yearStart.getTime();
	if(diff < 0){ return dojo.date.getIsoWeeksInYear(weekStart); } // Integer
	return Math.ceil(diff / 604800000) + 1; // Integer
}

dojo.date.getStartOfWeek = function(/*Date*/dateObject, /*Number*/firstDay){
	// summary: Return a date object representing the first day of the given
	//   date's week.
	if(isNaN(firstDay)){
		firstDay = dojo.date.getFirstDayOfWeek ? dojo.date.getFirstDayOfWeek() : 0;
	}
	var offset = firstDay;
	if(dateObject.getDay() >= firstDay){
		offset -= dateObject.getDay();
	}else{
		offset -= (7 - dateObject.getDay());
	}
	var date = new Date(dateObject);
	date.setHours(0, 0, 0, 0);
	return dojo.date.calc.add(date, dojo.date.calc.parts.DAY, offset); // Date
}

dojo.date.getIsoWeeksInYear = function(/*Date*/dateObject) {
	// summary: Determine the number of ISO8601 weeks in the year of the given 
	//   date. Most years have 52 but some have 53.
	//   See http://www.phys.uu.nl/~vgent/calendar/isocalendar_text3.htm	
	function p(y) {
		return y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400);
	}
	var y = dateObject.getFullYear();
	return ( p(y) % 7 == 4 || p(y-1) % 7 == 3 ) ? 53 : 52;
}

dojo.date.getDaysInMonth = function(/*Date*/dateObject){
	// summary: returns the number of days in the month used by dateObject
	var month = dateObject.getMonth();
	var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (month == 1 && dojo.date.isLeapYear(dateObject)){ return 29; } // Number
	return days[month]; // Number
}

dojo.date.isLeapYear = function(/*Date*/dateObject){
// summary:
//	Determines if the year of the dateObject is a leap year
//
// description:
//	Leap years are years with an additional day YYYY-02-29, where the year
//	number is a multiple of four with the following exception: If a year
//	is a multiple of 100, then it is only a leap year if it is also a
//	multiple of 400. For example, 1900 was not a leap year, but 2000 is one.

	var year = dateObject.getFullYear();
	return !(year%400) || (!(year%4) && !!(year%100)); // Boolean
}

// FIXME: This is not localized
dojo.date.getTimezoneName = function(/*Date*/dateObject){
// summary:
//	Get the user's time zone as provided by the browser
//
// dateObject: needed because the timezone may vary with time (daylight savings)
//
// description:
//	Try to get time zone info from toString or toLocaleString
//	method of the Date object -- UTC offset is not a time zone.
//	See http://www.twinsun.com/tz/tz-link.htm
//	Note: results may be inconsistent across browsers.

	var str = dateObject.toString(); // Start looking in toString
	var tz = ''; // The result -- return empty string if nothing found
	var match;

	// First look for something in parentheses -- fast lookup, no regex
	var pos = str.indexOf('(');
	if(pos > -1){
		pos++;
		tz = str.substring(pos, str.indexOf(')'));
	}
	// If at first you don't succeed ...
	else{
		// If IE knows about the TZ, it appears before the year
		// Capital letters or slash before a 4-digit year 
		// at the end of string
		var pat = /([A-Z\/]+) \d{4}$/;
		if((match = str.match(pat))){
			tz = match[1];
		}else{
		// Some browsers (e.g. Safari) glue the TZ on the end
		// of toLocaleString instead of putting it in toString
			str = dateObject.toLocaleString();
			// Capital letters or slash -- end of string, 
			// after space
			pat = / ([A-Z\/]+)$/;
			if((match = str.match(pat))){
				tz = match[1];
			}
		}
	}

	// Make sure it doesn't somehow end up return AM or PM
	return tz == 'AM' || tz == 'PM' ? '' : tz; //String
}
