dojo.provide("dojo.cookie");

dojo.cookie = function(/*String*/name, /*String?*/value, /*Object?*/props){
	//	summary: 
	//		Get or set a cookie.
	//
	// 		If you pass in one argument, the the value of the cookie is returned
	//
	// 		If you pass in two arguments, the cookie value is set to the second
	// 		argument.
	//
	// 		If you pass in three arguments, the cookie value is set to the
	// 		second argument, and the options on the third argument are used for
	// 		extended properties on the cookie
	//
	//	name: The name of the cookie
	//	value: Optional. The value for the cookie.
	//	props: 
	//		Optional additional properties for the cookie
	//       expires: Date or Number. Number is seen as days.
	//                If expires is in the past, the cookie will be deleted
	//                If expires is left out or is 0, the cookie will expire 
	//                when the browser closes.
	//       path: String. The path to use for the cookie.
	//       domain: String. The domain to use for the cookie.
	//       secure: Boolean. Whether to only send the cookie on secure connections
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
