define(["../../_base/declare", "../../_base/xhr", "../../_base/array", "../../_base/lang", "../../Deferred", "../../DeferredList", "../JsonRest", "./_Observable", "./util/MaterializedQuery"],
function(declare, xhr, array, lang, Deferred, DeferredList, _JsonRest, _Observable, MaterializedQuery){

// module:
//		dojo/store/observable/JsonRest

return declare("dojo.store.observable.JsonRest", [_JsonRest, _Observable], {
	// summary:
	//		This is an observable remote object store. It implements
	//		dojo/store/observable/api/Store.

	// pollInterval: Integer
	//		The rate at which (in milliseconds) the fetch() method will be called
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
		var self = this, query;

		query = self._queryToURLQuery(query, options) || "";
		if(options && options.expire){
			query = (query ? query + "&" : "?") + "expire=" + options.expire;
		}

		return self._materialize(query).then(function(response){
			var sub = new MaterializedQuery({
				store: self,
				id: response.querySubscriptionId,
				total: response.length,
				query: query
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
							sub.fetchTimeout = setTimeout(sub.fetch, self.pollInterval);
						}
					});
				};

				if(self.pollInterval){
					sub.fetchTimeout = setTimeout(sub.fetch, self.pollInterval);
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
			if(err.response.status === 410){
				// Query expired, rematerialize it and refresh all pages
				return self._rematerialize(sub);
			}else if(err.response.status === 404){
				// Updates not available, refresh all pages
				return self._refresh(sub);
			}else{
				throw err;
			}
		});
	},

	_materialize: function(query){
		return xhr("POST", {
			url: this.target + "query" + query,
			handleAs: "json",
			headers: lang.mixin({ Accept: this.accepts }, this.headers)
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

	_refresh: function(sub, subscribe){
		var self = this;
		return new DeferredList(array.map(sub.pages, function(page){
			return self.__slice(sub, page.start, page.count, subscribe).then(function(results){
				if(subscribe){
					page.id = results.id;
				}
				if(page.revision !== results.revision){
					page.refresh(results);
				}
			});
		}), false, true);
	},

	_rematerialize: function(sub){
		var self = this;
		return self._materialize(sub.query).then(function(response){
			sub.id = response.querySubscriptionId;
			sub.total = response.length;
			return self._refresh(sub, true);
		});
	},

	__slice: function(sub, start, count, subscribe){
		// Internal slice method, not to be called from outside of this file
		// as it skips the 410 processing and allows errors to propagate up.
		var query = xhr.objectToQuery({ start: start, count: count });
		return xhr((subscribe === true) ? "POST" : "GET", {
			url: this.target + "query/" + sub.id + (query ? "?" + query : ""),
			handleAs: "json",
			headers: lang.mixin({ Accept: this.accepts }, this.headers)
		}).then(function(page){
			var results = page.results;
			results.id = page.pageId;
			results.revision = page.revision;
			return results;
		});
	},

	_slice: function(sub, start, count, subscribe){
		var self = this;
		return self.__slice(sub, start, count, subscribe).then(null, function(err){
			if(err.response.status === 410){
				// Query expired, rematerialize it and refresh all pages
				return self._rematerialize(sub).then(function(){
					if(subscribe){
						// Make another attempt at creating the page
						return self.__slice(sub, start, count, subscribe);
					}
					// If this was a GET, the page has already been refreshed
					// in _rematerialize(). Return nothing here so that the
					// parent page.refresh() call does not emit a second
					// `refresh` event.
				});
			}
			throw err;
		});
	},

	_unsubscribe: function(sub, page){
		var self = this;
		if(sub !== undefined && page !== undefined){
			return xhr("DELETE", {
				url: self.target + "query/" + sub.id + "/" + page.id
			});
		}else if(sub !== undefined){
			return xhr("DELETE", {
				url: self.target + "query/" + sub.id
			}).then(function(){
				self.subscriptions = array.filter(self.subscriptions, function(s){
					if(s.id === sub.id){
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
