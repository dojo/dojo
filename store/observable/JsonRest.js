define(["../../_base/declare", "../../_base/xhr", "../../_base/array", "../../_base/lang", "../../_base/Deferred", "../JsonRest", "./_Observable", "../util/QueryResults" /*=====, "./api/Store" =====*/],
function(declare, xhr, array, lang, Deferred, _JsonRest, _Observable, QueryResults /*=====, Store =====*/){

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

	subscriptions: [],

	materialize: function(query, options){
		var self = this,
			query = self._queryToURLQuery(query, options),
			headers = lang.mixin({ Accept: self.accepts }, self.headers);
		return xhr("POST", {
			url: self.target + "query" + (query || ""),
			handleAs: "json",
			headers: headers
		}).then(function(qsub){
			var sId = qsub.querySubscriptionId;
			qsub.pages = [];
			qsub.pollTimeout = null;
			self.subscriptions.push(qsub);
			return {
				total: qsub.length,

				unsubscribe: function(){
					return xhr("DELETE", {
						url: self.target + "query/" + sId
					}).then(function(){
						self.subscriptions = array.filter(self.subscriptions, function(s){
							return s.querySubscriptionId !== sId;
						});
					});
				},

				page: function(start, count){
					start = start || 0;
					count = count || null;
					var query = xhr.objectToQuery({ start: start, count: count });
					return xhr("POST", {
						url: self.target + "query/" + sId + (query ? "?" + query : ""),
						handleAs: "json",
						headers: headers
					}).then(function(page){
						var pId = page.pageId,
							results = QueryResults(page.results);
						page.start = start;
						page.count = count;
						page.listeners = [];
						page.nextListenerId = 0;
						page.refreshCallbacks = [];
						page.nextRefreshCallbackId = 0;
						qsub.pages.push(page);

						results.start = start;
						results.count = count;
						results.unsubscribe = function(){
							return xhr("DELETE", {
								url: self.target + "query/" + sId + "/" + pId
							}).then(function(){
								qsub.pages = array.filter(qsub.pages, function(p){
									return p.pageId !== pId;
								});
							});
						};
						results.refresh = function(){
							return xhr("GET", {
								url: self.target + "query/" + sId + (query ? "?" + query : ""),
								handleAs: "json",
								headers: headers
							}).then(function(_page){
								page.revision = _page.revision;
								page.results.splice(0);
								page.results.push.apply(page.results, _page.results);
								array.forEach(page.refreshCallbacks, function(callback){
									try{
										callback[1]();
									}catch(e){
										console.error("refresh callback error:", e);
									}
								});
							});
						};
						results.onRefresh = function(callback){
							var cId = page.nextRefreshCallbackId++;
							page.refreshCallbacks.push([cId, callback]);
							return {
								remove: function(){
									page.refreshCallbacks = array.filter(page.refreshCallbacks, function(c){
										return c[0] !== cId;
									});
								}
							};
						};
						results.observe = function(listener, includeObjectUpdates){
							var lId = page.nextListenerId++;
							page.listeners.push([lId, listener, includeObjectUpdates]);
							return {
								remove: function(){
									page.listeners = array.filter(page.listeners, function(l){
										return l[0] !== lId;
									});
								}
							};
						};
						return results;
					});
				},

				fetch: function(){
					return self._fetch && self._fetch(qsub);
				},

				processUpdate: function(update){
					self._processUpdate(qsub, update);
				}
			};
		});
	},

	_fetch: function(qsub){
		var self = this, i,
			sId = qsub.querySubscriptionId,
			headers = lang.mixin({ Accept: self.accepts }, self.headers),
			revision = null;

		// Do nothing if there are no subscribed pages
		if(qsub.pages.length === 0){
			var d = new Deferred();
			d.resolve();
			return d.promise;
		}

		// Find the most out-of-date page and request back to that revision
		for(i = 0; i < qsub.pages.length; i++){
			if(revision === null || qsub.pages[i].revision < revision){
				revision = qsub.pages[i].revision;
			}
		}

		return xhr("GET", {
			url: self.target + "updates/" + sId + "?sinceRevision=" + revision,
			handleAs: "json",
			headers: headers
		}).then(function(updates){
			array.forEach(updates, function(update){
				self._processUpdate(qsub, update);
			});
		}, function(err){
			throw err;
		});
	},

	_processUpdate: function(qsub, update){
		var self = this;
		array.forEach(qsub.pages, function(page){
			if(page.revision >= update.revision){
				// Ignore changes that the page already has
				return;
			}
			if(update.revision !== page.revision + 1){
				throw "Update received out of order, expecting revision: " + (page.revision + 1) + ", got revision: " + update.revision;
			}
			self._notifyPage(page, update.supplementaryData, update.object, update.removedFrom, update.insertedInto);
			page.revision++;
		});
	},

	_notify: function(object, existingId){
		if(self._fetch){
			array.forEach(this.subscriptions, this._fetch);
		}
	}
});

});
