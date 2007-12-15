dojo.provide("dojo.cookie");

/*=====
dojo.__cookieProps = function(kwArgs){
	//	expires: Date|Number?
	//		If a number, seen as the number of days from today. If a date, the
	//		date past which the cookie is invalid. If expires is in the past,
	//		the cookie will be deleted If expires is left out or is 0, the
	//		cookie will expire when the browser closes.
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
	// 		If you pass in one argument, the the value of the cookie is returned
	//
	// 		If you pass in two arguments, the cookie value is set to the second
	// 		argument.
	//
	// 		If you pass in three arguments, the cookie value is set to the
	// 		second argument, and the options on the third argument are used for
	// 		extended properties on the cookie
	//	name:
	//		The name of the cookie
	//	value:
	//		Optional. The value for the cookie.
	//	props: 
	//		Optional additional properties for the cookie
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
	//	|	dojo.cookie("configObj", null);
	var c = document.cookie;
	if(arguments.length == 1){
		var idx = c.lastIndexOf(name+'=');
		if(idx == -1){ return null; }
		var start = idx+name.length+1;
		var end = c.indexOf(';', idx+name.length+1);
		if(end == -1){ end = c.length; }
		return decodeURIComponent(c.substring(start, end)); 
	}else{
		props = props || {};
		value = encodeURIComponent(value);
		if(typeof(props.expires) == "number"){ 
			var d = new Date();
			d.setTime(d.getTime()+(props.expires*24*60*60*1000));
			props.expires = d;
		}
		document.cookie = name + "=" + value 
			+ (props.expires ? "; expires=" + props.expires.toUTCString() : "")
			+ (props.path ? "; path=" + props.path : "")
			+ (props.domain ? "; domain=" + props.domain : "")
			+ (props.secure ? "; secure" : "");
		return null;
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
