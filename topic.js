define(["./Evented"], function(Evented){
	// summary:
	//		The export of this module is a pubsub hub	
	//		You can also use listen function itself as a pub/sub hub:
	//		| 	topic.on("some/topic", function(event){
	//		|	... do something with event
	//		|	});
	//		|	topic.emit("some/topic", {name:"some event", ...});

	return new Evented;
});
