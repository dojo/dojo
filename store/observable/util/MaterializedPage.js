define(["../../../_base/array", "../../../_base/lang", "../../../when", "../../../Evented", "../../util/QueryResults"],
function(array, lang, when, Evented, QueryResults){

// module:
//		dojo/store/observable/util/MaterializedPage

var MaterializedPage = function(results, config){
	// summary:
	//		A materialized page, providing the user with an interface for
	//		observing changes.
	// results: Array
	//		The array of objects that make up this page
	// config: Object
	//		An object containing `id`, `start`, `count` and `query`.

	var self = QueryResults(results);
	lang.mixin(self, config);
	lang.mixin(self, Evented.prototype);

	self.unsubscribe = function(){
		// summary:
		//		Unsubscribe this page, causing it to no longer receive
		//		updates from the master query.
		// returns: undefined|Promise
		//		Returns a promise if this is a remote store.
		return when(self.query.store._unsubscribe(self.query, self), function(){
			self.query.pages = array.filter(self.query.pages, function(p){
				return p.id !== self.id;
			});
		});
	};

	self.refresh = function(results){
		// summary:
		//		Refresh this page, causing it to completely replace its
		//		contents with the most recent slice from the master query.
		// results: Array?
		//		The contents to refresh this page with. If not specified, the
		//		page contents are fetched from the store.
		// returns: undefined|Promise
		//		Return a promise if this is a remote store.
		results = results || self.query.store._slice(self.query, self.start, self.count);
		return when(results, function(results){
			// If the query is expired, the refresh will be handled elsewhere
			// and this call should not duplicate the 'refresh' event.
			if(results !== undefined){
				self.revision = results.revision; // may or may not be defined
				self.splice(0);
				self.push.apply(self, results);
				self.emit("refresh");
			}
		});
	};

	self._notify = function(object, removedFrom, insertedInto, supplementaryData){
		// summary:
		//		Update the page to reflect the given object change. If a
		//		shift is necessary and a new object is to be inserted at a page
		//		boundary, it should be available in `supplementaryData`.
		// object: Object
		//		The object that changed
		// removedFrom: Integer
		//		The global index at which the object was removed
		// insertedInto: Integer
		//		The global index at which the object was inserted
		// supplementaryData: Array|Object
		//		Additional objects needed to update this page
		// returns: Array
		//		The generated events for this change
		var events = [];

		var getSupplemental = function(index){
			var obj = supplementaryData[index];
			if(obj === undefined){
				throw "Supplementary data incomplete, required index: " + index;
			}
			return obj
		};

		if(removedFrom === insertedInto){
			//updated
			if(insertedInto >= self.start && (self.count === null || insertedInto < self.start + self.count)){
				//in our page
				events.push([object, removedFrom - self.start, insertedInto - self.start]);
			}else{
				//before or after our page, do nothing
			}
		}else if(removedFrom === -1 || (self.count !== null && removedFrom >= self.start + self.count && insertedInto !== -1)){
			//added (from our perspective)
			if(insertedInto < self.start){
				//before our page, shift in new top element
				if(supplementaryData.length > self.start){
					self.unshift(getSupplemental(self.start));
					events.push([self[0], -1, 0]);
				}
			}else if(self.count === null || insertedInto < self.start + self.count){
				//in our page, insert object
				self.splice(insertedInto - self.start, 0, object);
				events.push([object, -1, insertedInto - self.start]);
			}else{
				//after our page, do nothing
			}
			if(self.count !== null && self.length > self.count){
				//page count set, shift out bottom element
				events.push([self.pop(), self.count, -1]);
			}
		}else if(insertedInto === -1 || (self.count !== null && insertedInto >= self.start + self.count)){
			//removed (from our perspective)
			if(removedFrom < self.start){
				//before our page, shift out top element
				if(self.length){
					events.push([self.shift(), 0, -1]);
				}
			}else if(self.count === null || removedFrom < self.start + self.count){
				//in our page, remove object
				events.push([object, removedFrom - self.start, -1]);
				self.splice(removedFrom - self.start, 1);
			}else{
				//after our page, do nothing
			}
			if(self.count !== null && self.length < self.count && supplementaryData.length > self.start + self.count - 1){
				//page count set, shift in new bottom element
				self.push(getSupplemental(self.start + self.count - 1));
				events.push([self[self.count - 1], -1, self.count - 1]);
			}
		}else{
			//moved
			if(removedFrom < self.start && insertedInto >= self.start){
				//into our page from before our page
				events.push([self.shift(), 0, -1])
				self.splice(insertedInto - self.start, 0, object);
				events.push([object, -1, insertedInto - self.start])
			}else if(removedFrom >= self.start && insertedInto < self.start){
				//before our page from in our page
				self.splice(removedFrom - self.start, 1);
				events.push([object, removedFrom - self.start, -1]);
				self.unshift(getSupplemental(self.start));
				events.push([self[0], -1, 0]);
			}else if(removedFrom >= self.start && insertedInto >= self.start){
				//within our page
				self.splice(removedFrom - self.start, 1);
				self.splice(insertedInto - self.start, 0, object);
				events.push([object, removedFrom - self.start, insertedInto - self.start])
			}else{
				//from before our page to before our page, do nothing
			}
		}

		array.forEach(events, function(ev){
			self.emit("update", ev[0], ev[1], ev[2]);
		});
		return events;
	};

	return self;
};

lang.setObject("dojo.store.observable.util.MaterializedPage", MaterializedPage);
return MaterializedPage;

});
