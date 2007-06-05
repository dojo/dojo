dojo.provide("dojo.date.stamp");

// Methods to convert dates to or from a wire (string) format using well-known conventions

dojo.date.stamp.fromISOString = function(/*String*/formattedString, /*Number*/defaultTime){
	//	summary:
	//		Returns a Date object given a string formatted according to a subset of the ISO-8601 standard
	//
	//	description:
	//		Accepts a string formatted according to a profile of ISO8601 as defined by
	//		RFC3339 (http://www.ietf.org/rfc/rfc3339.txt).  Additionally, partial input is allowed.
	//		The following combinations are valid:
	//			yyyy-MM-dd
	//			THH:mm:ss
	//			yyyy-MM-ddTHH:mm:ss
	//			THH:mm:ssTZD
	//			yyyy-MM-ddTHH:mm:ssTZD
	//		where TZD is Z or +/- followed by a time expression HH:mm
	//		Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
	//		input may return an invalid date object.  Arguments which are out of bounds will be handled
	// 		by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
	//
  	//	formattedString:
	//		A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
	//
	//	defaultTime:
	//		Used for defaults for fields omitted in the formattedString.  If omitted,
	//		uses 1970-01-01T00:00:00.0Z for default.

//TODO: this is frustratingly close to http://www.w3.org/TR/NOTE-datetime.  We could match this by making MM dd and TZD
//	optional, and the date mandatory.
//TODO: can a regexp be crafted to do this as efficiently?  Is it worth providing validation?
	var result = new Date(defaultTime || 0);
	var segments = formattedString.split("T");
	if(segments[0]){
		var dateSegments = segments[0].split("-");
		result.setFullYear(dateSegments[0]);
		result.setMonth(0); // need to do this so the date doesn't wrap around; reconsider defaultTime arg?
		result.setDate(dateSegments[2]);
		result.setMonth(dateSegments[1]-1);
	}
	if(segments[1]){
		var timeSegments = segments[1].substring(0, 8).split(":");
		result.setHours(timeSegments[0]);
		result.setMinutes(timeSegments[1]);
		result.setSeconds(timeSegments[2]);
		var remainder = segments[1].substring(8);
		if(remainder.charAt(0) === "."){
			//TODO: millis?
		}
		if(remainder){
			var offset = 0;
			if(remainder.charAt(0) != 'Z'){
				var gmtOffset = remainder.substring(1).split(":");
				offset = (gmtOffset[0] * 60) + (Number(gmtOffset[1]) || 0);
				if(remainder.charAt(0) != '-'){ offset *= -1; }
			}
			offset -= result.getTimezoneOffset();
			if(offset){
				result.setTime(result.getTime() + offset * 60000);
			}
		}
	}

	return result;
}

dojo.date.stamp.toISOString = function(/*Date*/dateObject, /*Object*/options){
	//	summary:
	//		Format a Date object as a string according a subset of the ISO-8601 standard
	//
	//	description:
	//		When selector option is omitted, output follows RFC3339 ((http://www.ietf.org/rfc/rfc3339.txt)
	//		Times are formatted using the local time zone.  Does not check bounds.
	//
	//	dateObject:
	//		A Date object
	//
	//	object {selector: string, zulu: boolean}
	//		selector- "date" or "time" for partial formatting of the Date object.
	//			Both date and time will be formatted by default.
	//		zulu- if true, UTC/GMT is used for a timezone

	var _ = function(n){ return (n < 10) ? "0" + n : n; }
	options = options || {};
	var formattedDate = [];
	var getter = options.zulu ? "getUTC" : "get";
	var date = "";
	if(options.selector != "time"){
		date = [dateObject[getter+"FullYear"](), _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
	}
	formattedDate.push(date);
	if(options.selector != "date"){
		var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
//		var millis = dateObject[getter+"Milliseconds"]();
//		if(options.milliseconds){
//			time += "."+millis;
//		}
		if(options.zulu){
			time += "Z";
		}else{
			var timezoneOffset = dateObject.getTimezoneOffset();
			var absOffset = Math.abs(timezoneOffset);
			time += (timezoneOffset > 0 ? "-" : "+") + 
				_(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
		}
		formattedDate.push(time);
	}
	return formattedDate.join('T'); // String
}
