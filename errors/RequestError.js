define(['./create'], function(create){
	return create("RequestError", function(message, response){
		this.response = response;
	});
});
