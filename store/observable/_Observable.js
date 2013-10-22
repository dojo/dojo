define(["../../_base/declare", "../../_base/array", "../../when"],
function(declare, array, when){

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

	_notifyPage: function(page, supplementaryData, object, removedFrom, insertedInto){
		// summary:
		//		Update the given page to reflect the given object change. If a
		//		shift is necessary and a new object is to be inserted at a page
		//		boundary, it should be available in `supplementaryData`.
		// page: MaterializedPage
		//		The page to update
		// supplementaryData: Array|Object
		//		Additional objects needed to update this page
		// object: Object
		//		The object that changed
		// removedFrom: Integer
		//		The global index at which the object was removed
		// insertedInto: Integer
		//		The global index at which the object was inserted
		// returns: Array
		//		The generated events for this change
		var self = this,
			events = [];

		if(removedFrom === insertedInto){
			//updated
			if(insertedInto >= page.start && (page.count === null || insertedInto < page.start + page.count)){
				//in our page
				events.push([object, removedFrom - page.start, insertedInto - page.start]);
			}else{
				//before or after our page, do nothing
			}
		}else if(removedFrom === -1 || (page.count !== null && removedFrom >= page.start + page.count && insertedInto !== -1)){
			//added (from our perspective)
			if(insertedInto < page.start){
				//before our page, shift in new top element
				if(supplementaryData.length > page.start){
					page.results.unshift(supplementaryData[page.start]);
					events.push([page.results[0], -1, 0]);
				}
			}else if(page.count === null || insertedInto < page.start + page.count){
				//in our page, insert object
				page.results.splice(insertedInto - page.start, 0, object);
				events.push([object, -1, insertedInto - page.start]);
			}else{
				//after our page, do nothing
			}
			if(page.count !== null && page.results.length > page.count){
				//page count set, shift out bottom element
				events.push([page.results.pop(), page.count, -1]);
			}
		}else if(insertedInto === -1 || (page.count !== null && insertedInto >= page.start + page.count)){
			//removed (from our perspective)
			if(removedFrom < page.start){
				//before our page, shift out top element
				if(page.results.length){
					events.push([page.results.shift(), 0, -1]);
				}
			}else if(page.count === null || removedFrom < page.start + page.count){
				//in our page, remove object
				events.push([object, removedFrom - page.start, -1]);
				page.results.splice(removedFrom - page.start, 1);
			}else{
				//after our page, do nothing
			}
			if(page.count !== null && page.results.length < page.count && supplementaryData.length > page.start + page.count - 1){
				//page count set, shift in new bottom element
				page.results.push(supplementaryData[page.start + page.count - 1]);
				events.push([page.results[page.count - 1], -1, page.count - 1]);
			}
		}else{
			//moved
			if(removedFrom < page.start && insertedInto >= page.start){
				//into our page from before our page
				events.push([page.results.shift(), 0, -1])
				page.results.splice(insertedInto - page.start, 0, object);
				events.push([object, -1, insertedInto - page.start])
			}else if(removedFrom >= page.start && insertedInto < page.start){
				//before our page from in our page
				page.results.splice(removedFrom - page.start, 1);
				events.push([object, removedFrom - page.start, -1]);
				page.results.unshift(supplementaryData[page.start]);
				events.push([page.results[0], -1, 0]);
			}else if(removedFrom >= page.start && insertedInto >= page.start){
				//within our page
				page.results.splice(removedFrom - page.start, 1);
				page.results.splice(insertedInto - page.start, 0, object);
				events.push([object, removedFrom - page.start, insertedInto - page.start])
			}else{
				//from before our page to before our page, do nothing
			}
		}

		if(events.length){
			array.forEach(page.listeners, function(listener){
				array.forEach(events, function(ev){
					self._notifyListener(listener, ev[0], ev[1], ev[2]);
				});
			});
		}
		return events;
	},

	_notifyListener: function(listener, obj, from, to){
		// summary:
		//		Notify the given listener that an object change has occurred
		//		in the page. Notifications for in-place object updates will
		//		only be sent if `includeObjectUpdates` was set to `true` when
		//		the listener was registered.
		// listener: Array
		//		A listener registry, consisting of [id, fn, includeObjectUpdates]
		// obj: Object
		//		The object that changed
		// from: Integer
		//		The page-relative index at which the object was removed
		// to: Integer
		//		The page-relative index at which the object was inserted
		var listenerFn = listener[1],
			includeObjectUpdates = listener[2];
		if(from === to && !includeObjectUpdates){return;}
		try{
			listenerFn(obj, from, to);
		}catch(e){
			console.error("page listener error:", e);
		}
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
