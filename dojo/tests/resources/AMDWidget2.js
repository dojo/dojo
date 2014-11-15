define(["../../../../../arcgis/3.0/jsapi/js/dojo/dojo/_base/declare"], function(declare){

	return declare(null, {
		constructor: function(args, node){
			this.params = args;
		},

		method1: function(value){
			value++;
			return value;
		}
	});

});
