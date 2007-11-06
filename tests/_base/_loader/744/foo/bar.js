dojo.provide("foo.bar");

//Define some globals and see if we can read them.

//This is OK
barMessage = "It Worked";

//This one FAILS in IE/Safari 2 with regular eval.
function getBarMessage(){
	return barMessage;
}

//This is OK
getBar2Message = function(){
	return getBarMessage();
}
