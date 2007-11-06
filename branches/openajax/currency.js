dojo.provide("dojo.currency");

dojo.require("dojo.number");
dojo.require("dojo.i18n");
dojo.requireLocalization("dojo.cldr", "currency");
dojo.require("dojo.cldr.monetary");

dojo.currency._mixInDefaults = function(options){
	options = options || {};
	options.type = "currency";

	// Get locale-depenent currency data, like the symbol
	var bundle = dojo.i18n.getLocalization("dojo.cldr", "currency", options.locale) || {};

	// Mixin locale-independent currency data, like # of places
	var iso = options.currency;
	var data = dojo.cldr.monetary.getData(iso);

	dojo.forEach(["displayName","symbol","group","decimal"], function(prop){
		data[prop] = bundle[iso+"_"+prop];
	});

	data.fractional = [true, false];

	// Mixin with provided options
	return dojo.mixin(data, options);
}

dojo.currency.format = function(/*Number*/value, /*Object?*/options){
// summary:
//		Format a Number as a String, using locale-specific settings
//
// description:
//		Create a string from a Number using a known localized pattern.
//		Formatting patterns appropriate to the locale are chosen from the CLDR http://unicode.org/cldr
//		as well as the appropriate symbols and delimiters.  See http://www.unicode.org/reports/tr35/#Number_Elements
//
// value:
//		the number to be formatted.
//
// options: object {currency: String, pattern: String?, places: Number?, round: Number?, symbol: String?, locale: String?}
//		currency- the ISO4217 currency code, a three letter sequence like "USD"
//			See http://en.wikipedia.org/wiki/ISO_4217
//		symbol- override currency symbol. Normally, will be looked up in table of supported currencies, and ISO currency code will
//			be used if not found.  See dojo.i18n.cldr.nls->currency.js
//		pattern- override formatting pattern with this string (see dojo.number.applyPattern)
//		places- fixed number of decimal places to show.  Default is defined by the currency.
//	    round- 5 rounds to nearest .5; 0 rounds to nearest whole (default). -1 means don't round.
//		locale- override the locale used to determine formatting rules

	return dojo.number.format(value, dojo.currency._mixInDefaults(options));
}

dojo.currency.regexp = function(/*Object?*/options){
//
// summary:
//		Builds the regular needed to parse a number
//
// description:
//		returns regular expression with positive and negative match, group and decimal separators
//
// options: object {pattern: String, locale: String, strict: Boolean, places: mixed}
//		currency- the ISO4217 currency code, a three letter sequence like "USD"
//			See http://en.wikipedia.org/wiki/ISO_4217
//		symbol- override currency symbol. Normally, will be looked up in table of supported currencies, and ISO currency code will
//			be used if not found.  See dojo.i18n.cldr.nls->currency.js
//		pattern- override pattern with this string
//		locale- override the locale used to determine formatting rules
//		strict- strict parsing, false by default
//		places- number of decimal places to accept.  Default is defined by currency.
	return dojo.number.regexp(dojo.currency._mixInDefaults(options)); // String
}

dojo.currency.parse = function(/*String*/expression, /*Object?*/options){
//
// summary:
//		Convert a properly formatted string to a primitive Number,
//		using locale-specific settings.
//
// description:
//		Create a Number from a string using a known localized pattern.
//		Formatting patterns are chosen appropriate to the locale.
//		Formatting patterns are implemented using the syntax described at *URL*
//
// expression: A string representation of a Number
//
// options: object {pattern: string, locale: string, strict: boolean}
//		currency- the ISO4217 currency code, a three letter sequence like "USD"
//			See http://en.wikipedia.org/wiki/ISO_4217
//		symbol- override currency symbol. Normally, will be looked up in table of supported currencies, and ISO currency code will
//			be used if not found.  See dojo.i18n.cldr.nls->currency.js
//		pattern- override pattern with this string
//		locale- override the locale used to determine formatting rules
//		strict- strict parsing, false by default
//		places- number of decimal places to accept.  Default is defined by currency.
//		fractional- where places are implied by pattern or explicit 'places' parameter, whether to include the fractional portion.
//			By default for currencies, it the fractional portion is optional.
	return dojo.number.parse(expression, dojo.currency._mixInDefaults(options));
}
