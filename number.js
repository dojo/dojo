dojo.provide("dojo.number");

dojo.require("dojo.i18n");
dojo.requireLocalization("dojo.cldr", "number");
dojo.require("dojo.string");
dojo.require("dojo.regexp");

dojo.number.format = function(/*Number*/value, /*Object?*/options){
	// summary:
	//		Format a Number as a String, using locale-specific settings
	//
	// description:
	//		Create a string from a Number using a known localized pattern.
	//		Formatting patterns appropriate to the locale are chosen from the CLDR http://unicode.org/cldr
	//		as well as the appropriate symbols and delimiters.  See http://www.unicode.org/reports/tr35/#Number_Elements
	//
	// value:
	//		the number to be formatted.  If not a valid JavaScript number, return null.
	//
	// options: object {pattern: String?, type: String?, places: Number?, round: Number?, currency: String?, symbol: String?, locale: String?}
	//		pattern- override formatting pattern with this string (see dojo.number._applyPattern)
	//		type- choose a format type based on the locale from the following: decimal, scientific, percent, currency. decimal by default.
	//		places- fixed number of decimal places to show.  This overrides any information in the provided pattern.
	//		round- 5 rounds to nearest .5; 0 rounds to nearest whole (default). -1 means don't round.
	//		currency- iso4217 currency code
	//		symbol- localized currency symbol
	//		locale- override the locale used to determine formatting rules

	options = dojo.mixin({}, options || {});
	var locale = dojo.i18n.normalizeLocale(options.locale);
	var bundle = dojo.i18n.getLocalization("dojo.cldr", "number", locale);
	options.customs = bundle;
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
	if(isNaN(value)){ return null; } // null
	return dojo.number._applyPattern(value, pattern, options); // String
};

//dojo.number._numberPatternRE = /(?:[#0]*,?)*[#0](?:\.0*#*)?/; // not precise, but good enough
dojo.number._numberPatternRE = /[#0,]*[#0](?:\.0*#*)?/; // not precise, but good enough

dojo.number._applyPattern = function(/*Number*/value, /*String*/pattern, /*Object?*/options){
	// summary: Apply pattern to format value as a string using options. Gives no consideration to local customs.
	// value: the number to be formatted.
	// pattern: a pattern string as described in http://www.unicode.org/reports/tr35/#Number_Format_Patterns
	// options: object {customs: Object?, places: Number?, currency: String?, round: Number?, symbol: String?}
	//  customs- a hash containing: decimal, group, ...

//TODO: support escapes
	options = options || {};
	var group = options.customs.group;
	var decimal = options.customs.decimal;

	var patternList = pattern.split(';');
	var positivePattern = patternList[0];
	pattern = patternList[(value < 0) ? 1 : 0] || ("-" + positivePattern);

	//TODO: only test against unescaped
	if(pattern.indexOf('%') != -1){
		value *= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		value *= 1000; // per mille
	}else if(pattern.indexOf('\u00a4') != -1){
		group = options.customs.currencyGroup || group;//mixins instead?
		decimal = options.customs.currencyDecimal || decimal;// Should these be mixins instead?
		pattern = pattern.replace(/\u00a4{1,3}/, function(match){
			var prop = ["symbol", "currency", "displayName"][match.length-1];
			return options[prop] || options.currency || "";
		});
	}else if(pattern.indexOf('E') != -1){
		throw new Error("exponential notation not supported");
	}
	
//TODO: support @ sig figs?
	var numberPatternRE = dojo.number._numberPatternRE;
	var numberPattern = positivePattern.match(numberPatternRE);
	if(!numberPattern){
		throw new Error("unable to find a number expression in pattern: "+pattern);
	}
	return pattern.replace(numberPatternRE,
		dojo.number._formatAbsolute(value, numberPattern[0], {decimal: decimal, group: group, places: options.places}));
}

dojo.number.round = function(/*Number*/value, /*Number*/places, /*Number?*/multiple){
	// summary: Rounds the number at the given number of places
	// value: the number to round
	// places: the number of decimal places where rounding takes place
	// multiple: rounds next place to nearest multiple

	var pieces = String(value).split(".");
	var length = (pieces[1] && pieces[1].length) || 0;
	if(length > places){
		var factor = Math.pow(10, places);
		if(multiple > 0){factor *= 10/multiple;places++;} //FIXME
		value = Math.round(value * factor)/factor;

		// truncate to remove any residual floating point values
		pieces = String(value).split(".");
		length = (pieces[1] && pieces[1].length) || 0;
		if(length > places){
			pieces[1] = pieces[1].substr(0, places);
			value = Number(pieces.join("."));
		}
	}
	return value; //Number
}

dojo.number._formatAbsolute = function(/*Number*/value, /*String*/pattern, /*Object?*/options){
	// summary: 
	//		Apply numeric pattern to absolute value using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted, ignores sign
	// pattern:
	//		the number portion of a pattern (e.g. #,##0.00)
	// options:
	//		object {decimal: String?, group: String?, places: Number?}
	//  		decimal: the decimal separator
	//  		group: the group separator
	//  		places: number of decimal places
	//  		round: 5 rounds to nearest .5; 0 rounds to nearest whole (default). -1 means don't round.
	options = options || {};
	if(options.places === true){options.places=0;}
	if(options.places === Infinity){options.places=6;} // avoid a loop; pick a limit

	var patternParts = pattern.split(".");
	var maxPlaces = (options.places >= 0) ? options.places : (patternParts[1] && patternParts[1].length) || 0;
	if(!(options.round < 0)){
		value = dojo.number.round(value, maxPlaces, options.round);
	}

	var valueParts = String(Math.abs(value)).split(".");
	var fractional = valueParts[1] || "";
	if(options.places){
		valueParts[1] = dojo.string.pad(fractional.substr(0, options.places), options.places, '0', true);
	}else if(patternParts[1] && options.places !== 0){
		// Pad fractional with trailing zeros
		var pad = patternParts[1].lastIndexOf("0") + 1;
		if(pad > fractional.length){
			valueParts[1] = dojo.string.pad(fractional, pad, '0', true);
		}

		// Truncate fractional
		var places = patternParts[1].length;
		if(places < fractional.length){
			valueParts[1] = fractional.substr(0, places);
		}
	}else{
		if(valueParts[1]){ valueParts.pop(); }
	}

	// Pad whole with leading zeros
	var patternDigits = patternParts[0].replace(',', '');
	pad = patternDigits.indexOf("0");
	if(pad != -1){
		pad = patternDigits.length - pad;
		if(pad > valueParts[0].length){
			valueParts[0] = dojo.string.pad(valueParts[0], pad);
		}

		// Truncate whole
		if(patternDigits.indexOf("#") == -1){
			valueParts[0] = valueParts[0].substr(valueParts[0].length - pad);
		}
	}

	// Add group separators
	var index = patternParts[0].lastIndexOf(',');
	var groupSize, groupSize2;
	if(index != -1){
		groupSize = patternParts[0].length - index - 1;
		var remainder = patternParts[0].substr(0, index);
		index = remainder.lastIndexOf(',');
		if(index != -1){
			groupSize2 = remainder.length - index - 1;
		}
	}
	var pieces = [];
	for(var whole = valueParts[0]; whole;){
		var off = whole.length - groupSize;
		pieces.push((off > 0) ? whole.substr(off) : whole);
		whole = (off > 0) ? whole.slice(0, off) : "";
		if(groupSize2){
			groupSize = groupSize2;
			delete groupSize2;
		}
	}
	valueParts[0] = pieces.reverse().join(options.group || ",");

	return valueParts.join(options.decimal || ".");
};

dojo.number.regexp = function(/*Object?*/options){
	//
	// summary:
	//		Builds the regular needed to parse a number
	//
	// description:
	//		returns regular expression with positive and negative match, group
	//		and decimal separators
	//
	// options: object {pattern: String, type: String locale: String, strict: Boolean, places: mixed}
	//		pattern- override pattern with this string
	//		type- choose a format type based on the locale from the following: decimal, scientific, percent, currency. decimal by default.
	//		locale- override the locale used to determine formatting rules
	//		strict- strict parsing, false by default
	//		places- number of decimal places to accept: Infinity, a positive number, or a range "n,m"
	return dojo.number._parseInfo(options).regexp; // String
}

dojo.number._parseInfo = function(/*Object?*/options){
	options = options || {};
	var locale = dojo.i18n.normalizeLocale(options.locale);
	var bundle = dojo.i18n.getLocalization("dojo.cldr", "number", locale);
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
//TODO: memoize?
	var group = bundle.group;
	var decimal = bundle.decimal;
	var factor = 1;

	if(pattern.indexOf('%') != -1){
		factor /= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		factor /= 1000; // per mille
	}else{
		var isCurrency = pattern.indexOf('\u00a4') != -1;
		if(isCurrency){
			group = bundle.currencyGroup || group;
			decimal = bundle.currencyDecimal || decimal;
		}
	}

	if(group == '\xa0'){ group = ' '; }

	//TODO: handle quoted escapes
	var patternList = pattern.split(';');
	if(patternList.length == 1){
		patternList.push("-" + patternList[0]);
	}

	var re = dojo.regexp.buildGroupRE(patternList, function(pattern){
		pattern = "(?:"+dojo.regexp.escapeString(pattern, '.')+")";
		return pattern.replace(dojo.number._numberPatternRE, function(format){
			var flags = {
				signed: false,
				separator: options.strict ? group : [group,""],
				fractional: options.fractional,
				decimal: decimal,
				exponent: false};
			var parts = format.split('.');
			var places = options.places;
			if(parts.length == 1 || places === 0){flags.fractional = false;}
			else{
				if(typeof places == "undefined"){ places = parts[1].lastIndexOf('0')+1; }
				if(places && options.fractional == undefined){flags.fractional = true;} // required fractional, unless otherwise specified
				if(!options.places && (places < parts[1].length)){ places += "," + parts[1].length; }
				flags.places = places;
			}
			var groups = parts[0].split(',');
			if(groups.length>1){
				flags.groupSize = groups.pop().length;
				if(groups.length>1){
					flags.groupSize2 = groups.pop().length;
				}
			}
			return "("+dojo.number._realNumberRegexp(flags)+")";
		});
	}, true);

	if(isCurrency){
		// substitute the currency symbol for the placeholder in the pattern
		re = re.replace(/(\s*)(\u00a4{1,3})(\s*)/g, function(match, before, target, after){
			var prop = ["symbol", "currency", "displayName"][target.length-1];
			var symbol = dojo.regexp.escapeString(options[prop] || options.currency || "");
			before = before ? "\\s" : "";
			after = after ? "\\s" : "";
			if(!options.strict){
				if(before){before += "*";}
				if(after){after += "*";}
				return "(?:"+before+symbol+after+")?";
			}
			return before+symbol+after;
		});
	}

//TODO: substitute localized sign/percent/permille/etc.?

	return {regexp: re, group: group, decimal: decimal, factor: factor}; // Object
}

dojo.number.parse = function(/*String*/expression, /*Object?*/options){
	// summary:
	//		Convert a properly formatted string to a primitive Number,
	//		using locale-specific settings.
	//
	// description:
	//		Create a Number from a string using a known localized pattern.
	//		Formatting patterns are chosen appropriate to the locale.
	//		Formatting patterns are implemented using the syntax described at
	//		*URL*
	//
	// expression: A string representation of a Number
	//
	// options: 
	//		object {pattern: string, locale: string, strict: boolean}
	//		pattern:
	//			override pattern with this string
	//		type:
	//			choose a format type based on the locale from the following:
	//			decimal, scientific, percent, currency. decimal by default.
	//		locale:
	//			override the locale used to determine formatting rules
	//		strict: 
	//			strict parsing, false by default
	//		currency:
	//			object with currency information

	var info = dojo.number._parseInfo(options);

	var results = (new RegExp("^"+info.regexp+"$")).exec(expression);
		if(!results){
			return NaN; //NaN
	}
	var absoluteMatch = results[1]; // match for the positive expression
	if(!results[1]){
		if(!results[2]){
			return NaN; //NaN
		}
		// matched the negative pattern
		absoluteMatch = results[2];
		info.factor *= -1;
	}

	// Transform it to something Javascript can parse as a number
	while(absoluteMatch.indexOf(info.group) != -1){
		absoluteMatch = absoluteMatch.replace(info.group, "");
	}
	absoluteMatch = absoluteMatch.replace(info.decimal, ".");

	// Adjust for negative sign, percent, etc. as necessary
	return Number(absoluteMatch) * info.factor; //Number
};

dojo.number._realNumberRegexp = function(/*Object?*/flags){
	// summary: Builds a regular expression to match a real number in exponential notation
	//
	// flags:An object
	//		flags.places:
	//			The integer number of decimal places or a range given as "n,m".
	//			If not given, the decimal part is optional and the number of
	//			places is unlimited.
	//		flags.decimal:
	//			A string for the character used as the decimal point.  Default
	//			is ".".
	//    flags.fractional:
	//			Whether decimal places are allowed.  Can be true, false, or
	//			[true, false].  Default is [true, false]
	//    flags.exponent:
	//			Express in exponential notation.  Can be true, false, or [true,
	//			false]. Default is [true, false], (i.e. will match if the
	//			exponential part is present are not).
	//    flags.eSigned:
	//			The leading plus-or-minus sign on the exponent.  Can be true,
	//			false, or [true, false].  Default is [true, false], (i.e. will
	//			match if it is signed or unsigned).  flags in regexp.integer
	//			can be applied.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.places == "undefined"){ flags.places = Infinity; }
	if(typeof flags.decimal != "string"){ flags.decimal = "."; }
	if(typeof flags.fractional == "undefined"){ flags.fractional = [true, false]; }
	if(typeof flags.exponent == "undefined"){ flags.exponent = [true, false]; }
	if(typeof flags.eSigned == "undefined"){ flags.eSigned = [true, false]; }

	// integer RE
	var integerRE = dojo.number._integerRegexp(flags);

	// decimal RE
	var decimalRE = dojo.regexp.buildGroupRE(flags.fractional,
		function(q){
			var re = "";
			if(q && (flags.places!==0)){
				re = "\\" + flags.decimal;
				if(flags.places == Infinity){ 
					re = "(?:" + re + "\\d+)?"; 
				}else{
					re += "\\d{" + flags.places + "}"; 
				}
			}
			return re;
		},
		true
	);

	// exponent RE
	var exponentRE = dojo.regexp.buildGroupRE(flags.exponent,
		function(q){ 
			if(q){ return "([eE]" + dojo.number._integerRegexp({ signed: flags.eSigned}) + ")"; }
			return ""; 
		}
	);

	// real number RE
	var realRE = integerRE + decimalRE;
	// allow for decimals without integers, e.g. .25
	if(decimalRE){realRE = "(?:(?:"+ realRE + ")|(?:" + decimalRE + "))";}
	return realRE + exponentRE; // String
};

dojo.number._integerRegexp = function(/*Object?*/flags){
	// summary: 
	//		Builds a regular expression that matches an integer
	// flags: 
	//		An object
	//		flags.signed :
	//			The leading plus-or-minus sign. Can be true, false, or [true,
	//			false]. Default is [true, false], (i.e. will match if it is
	//			signed or unsigned).
	//		flags.separator:
	//			The character used as the thousands separator. Default is no
	//			separator. For more than one symbol use an array, e.g. [",",
	//			""], makes ',' optional.
	//		flags.groupSize: group size between separators
	//		flags.groupSize2: second grouping (for India)

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.signed == "undefined"){ flags.signed = [true, false]; }
	if(typeof flags.separator == "undefined"){
		flags.separator = "";
	}else if(typeof flags.groupSize == "undefined"){
		flags.groupSize = 3;
	}
	// build sign RE
	var signRE = dojo.regexp.buildGroupRE(flags.signed,
		function(q) { return q ? "[-+]" : ""; },
		true
	);

	// number RE
	var numberRE = dojo.regexp.buildGroupRE(flags.separator,
		function(sep){ 
			if(!sep){ 
				return "(?:0|[1-9]\\d*)";
			}
			sep = dojo.regexp.escapeString(sep);
			var grp = flags.groupSize, grp2 = flags.groupSize2;
			if(grp2){
				var grp2RE = "(?:0|[1-9]\\d{0," + (grp2-1) + "}(?:[" + sep + "]\\d{" + grp2 + "})*[" + sep + "]\\d{" + grp + "})";
				return ((grp-grp2) > 0) ? "(?:" + grp2RE + "|(?:0|[1-9]\\d{0," + (grp-1) + "}))" : grp2RE;
			}
			return "(?:0|[1-9]\\d{0," + (grp-1) + "}(?:[" + sep + "]\\d{" + grp + "})*)";
		},
		true
	);

	// integer RE
	return signRE + numberRE; // String
}
