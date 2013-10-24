define(["../../_base/declare", "../../_base/xhr", "../../_base/array", "../../_base/lang", "../../_base/Deferred", "../JsonRest", "./_Observable", "./util/MaterializedQuery"],
function(declare, xhr, array, lang, Deferred, _JsonRest, _Observable, MaterializedQuery){

// module:
//		dojo/store/observable/JsonRest

return declare("dojo.store.observable.JsonRest", [_JsonRest, _Observable], {
	// summary:
	//		This is an observable remote object store. It implements
	//		dojo/store/observable/api/Store.

	// pollInterval: Integer
	//		The rate at which (in seconds) the fetch() method will be called
	//		to update the store.
	pollInterval: null,

	// subscriptions: Array
	//		Internal tracking for all active subscriptions in this client
	subscriptions: [],

	materialize: function(query, options){
		// summary:
		//		Materialize a new query in the remote store. The results are
		//		stored and updated for future queries.
		// query: String|Object|Function
		//		The query to use
		// options: dojo/store/api/Store.QueryOptions?
		//		The optional arguments to apply to the results
		// returns: dojo/store/observable/api/Store.MaterializedQuery
		//		A materialized query interface
		var self = this,
			query = self._queryToURLQuery(query, options),
			headers = lang.mixin({ Accept: self.accepts }, self.headers);

		if(options && options.expire){
			query = (query ? query + "&" : "?") + "expire=" + options.expire;
		}

		return xhr("POST", {
			url: self.target + "query" + (query || ""),
			handleAs: "json",
			headers: headers
		}).then(function(response){
			var sub = new MaterializedQuery({
				store: self,
				id: response.querySubscriptionId,
				total: response.length
			});

			// Set up our fetch() method and, if configured, enable the
			// automated polling mechanism
			if(self._fetch){
				sub.fetch = function(){
					if(sub.fetchTimeout){
						clearTimeout(sub.fetchTimeout);
					}
					return self._fetch(sub).then(function(){
						if(self.pollInterval){
							sub.fetchTimeout = setTimeout(sub.fetch, self.pollInterval * 1000);
						}
					});
				};

				if(self.pollInterval){
					sub.fetchTimeout = setTimeout(sub.fetch, self.pollInterval * 1000);
				}
			}

			self.subscriptions.push(sub);
			return sub;
		});
	},

	_fetch: function(sub){
		var self = this, i,
			headers = lang.mixin({ Accept: self.accepts }, self.headers),
			revision = null;

		// Do nothing if there are no subscribed pages
		if(sub.pages.length === 0){
			var d = new Deferred();
			d.resolve();
			return d.promise;
		}

		// Find the most out-of-date page and request back to that revision
		for(i = 0; i < sub.pages.length; i++){
			if(revision === null || sub.pages[i].revision < revision){
				revision = sub.pages[i].revision;
			}
		}

		return xhr("GET", {
			url: self.target + "updates/" + sub.id + "?sinceRevision=" + revision,
			handleAs: "json",
			headers: headers
		}).then(function(updates){
			array.forEach(updates, function(update){
				var revision = update.revision,
					object = update.object,
					removedFrom = update.removedFrom,
					insertedInto = update.insertedInto,
					supplementaryData = update.supplementaryData;
				sub._notify(object, removedFrom, insertedInto, supplementaryData, revision);
			});
		}, function(err){
			// TODO: Smarter error handling
			throw err;
		});
	},

	_notify: function(object, existingId){
		var self = this;
		if(self._fetch){
			array.forEach(this.subscriptions, function(sub){
				sub.fetch();
			});
		}
	},

	_slice: function(subId, start, count, refresh){
		var self = this,
			query = xhr.objectToQuery({ start: start, count: count }),
			headers = lang.mixin({ Accept: self.accepts }, self.headers),
			method = (refresh === true) ? "GET" : "POST";
		return xhr(method, {
			url: self.target + "query/" + subId + (query ? "?" + query : ""),
			handleAs: "json",
			headers: headers
		}).then(function(page){
			var results = page.results;
			results.pageId = page.pageId;
			results.revision = page.revision;
			return results;
		});
	},

	_unsubscribe: function(subId, pageId){
		var self = this;
		if(subId !== undefined && pageId !== undefined){
			return xhr("DELETE", {
				url: self.target + "query/" + subId + "/" + pageId
			});
		}else if(subId !== undefined){
			return xhr("DELETE", {
				url: self.target + "query/" + subId
			}).then(function(){
				self.subscriptions = array.filter(self.subscriptions, function(s){
					if(s.id === subId){
						if(s.fetchTimeout){
							clearTimeout(s.fetchTimeout);
						}
						return false;
					}
					return true;
				});
			});
		}
	},
});

});
