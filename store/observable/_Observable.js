define(["../../_base/declare", "../../when"], function(declare, when){

// module:
//		dojo/store/observable/_Observable

return declare("dojo.store.observable._Observable", null, {
	// summary:
	//		This is a collection of common methods used across all observable
	//		data stores.

	_notify: function(object, existingId){
		// summary:
		//		Handle the change by either processing it locally or
		//		requesting updates from a remote source.
	},

	_inMethod: false,

	_whenFinished: function(method, args, action){
		if(this._inMethod){
			// if one method calls another (like add() calling put()) we don't want two events
			return this.inherited(method, args);
		}else{
			this._inMethod = true;
			try{
				var results = this.inherited(method, args);
				when(results, action);
				return results;
			}finally{
				this._inMethod = false;
			}
		}
	},

	put: function(object, options){
		var self = this;
		return this._whenFinished("put", arguments, function(){
			self._notify(object, self.getIdentity(object));
		});
	},

	add: function(object, options){
		var self = this;
		return this._whenFinished("add", arguments, function(){
			self._notify(object);
		});
	},

	remove: function(id){
		var self = this;
		return this._whenFinished("remove", arguments, function(){
			self._notify(undefined, id);
		});
	}
});

});
