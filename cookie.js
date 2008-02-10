dojo.provide("dojo.cookie");

dojo.require("dojo.regexp");

/*=====
dojo.__cookieProps = function(kwArgs){
	//	expires: Date|String|Number?
	//		If a number, the number of days from today at which the cookie
	//		will expire. If a date, the date past which the cookie will expire.
	//		If expires is in the past, the cookie will be deleted.
	//		If expires is omitted or is 0, the cookie will expire when the browser closes.
	//	path: String?
	//		The path to use for the cookie.
	//	domain: String?
	//		The domain to use for the cookie.
	//	secure: Boolean?
	//		Whether to only send the cookie on secure connections
}
=====*/


dojo.cookie = function(/*String*/name, /*String?*/value, /*dojo.__cookieProps?*/props){
	//	summary: 
	//		Get or set a cookie.
	//	description:
	// 		If one argument is passed, returns the value of the cookie
	// 		For two or more arguments, acts as a setter.
	//	name:
	//		Name of the cookie
	//	value:
	//		Value for the cookie
	//	props: 
	//		Properties for the cookie
	//	example:
	//		set a cookie with the JSON-serialized contents of an object which
	//		will expire 5 days from now:
	//	|	dojo.cookie("configObj", dojo.toJson(config), { expires: 5 });
	//	
	//	example:
	//		de-serialize a cookie back into a JavaScript object:
	//	|	var config = dojo.fromJson(dojo.cookie("configObj"));
	//	
	//	example:
	//		delete a cookie:
	//	|	dojo.cookie("configObj", null, {expires: -1});
	var c = document.cookie;
	if(arguments.length == 1){
		var matches = c.match(new RegExp("(?:^|(?:; ))" + dojo.regexp.escapeString(name) + "=([^;]*)"));
		return matches ? decodeURIComponent(matches[1]) : undefined; // String or undefined
	}else{
		props = props || {};
// FIXME: expires=0 seems to disappear right away, not on close? (FF3)  Change docs?
		var exp = props.expires;
		if(typeof exp == "number"){ 
			var d = new Date();
			d.setTime(d.getTime() + exp*24*60*60*1000);
			props.expires = d;
		}
		if(exp && exp.toUTCString){ props.expires = exp.toUTCString(); }

		value = encodeURIComponent(value);
		var updatedCookie = name + "=" + value;
		for(propName in props){
			updatedCookie += "; " + propName;
			var propValue = props[propName];
			if(propValue !== true){ updatedCookie += "=" + propValue; }
		}
		document.cookie = updatedCookie;
	}
};

dojo.cookie.useObject = function(/*String*/name, /*String?*/value, /*Object?*/props){
	//	summary:
	//		Extends the dojo.cookie function. Calling this method will allow you to
	//		easily store an object into a cookie, as well as pull an object back out
	//		from the cookie.
	//
	//	example:
	//	|	// set a cookie object
	//	|	dojo.cookie.useObject("foo",{ bar:"baz" });
	//
	//	example:
	//	|	// get a cookie object
	//	|	var obj = dojo.cookie.useObject("foo");
	//	|	// same as
	//	|	// var obj = dojo.fromJson(dojo.cookie("foo"));
	
	if(arguments.length == 1){
		return dojo.fromJson(this(name));
	}else{
		this(name, dojo.toJson(value), props||{});
	}
};

dojo.cookie.isSupported = function(){
	//	summary:
	//		Use to determine if the current browser supports cookies or not.
	//		
	//		Returns true if user allows cookies.
	//		Returns false if user doesn't allow cookies.
	
	if(typeof navigator.cookieEnabled != "boolean"){
		this("__djCookieTest__", "CookiesAllowed", { expires: 90 });
		var cookieVal = this("__djCookieTest__");
		navigator.cookieEnabled = (cookieVal == "CookiesAllowed");
		if(navigator.cookieEnabled){
			this("__djCookieTest__", "", 0);
		}
	}
	return navigator.cookieEnabled;
};
