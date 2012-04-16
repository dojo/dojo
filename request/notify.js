define(['../topic'], function(topic){
	var pubCount = 0;
	var notify = {
		send: function(data){
			if(!pubCount){
				topic.publish('/dojo/request/start');
			}
			pubCount++;
			topic.publish('/dojo/request/send', data);
		},
		load: function(data){
			topic.publish('/dojo/request/load', data);
			notify.done(data);
		},
		error: function(data){
			topic.publish('/dojo/request/error', data);
			notify.done(data);
		},
		done: function(data){
			topic.publish('/dojo/request/done', data);
			pubCount--;
			if(pubCount <= 0){
				pubCount = 0;
				topic.publish('/dojo/request/stop');
			}
		}
	};

	return notify;
});
