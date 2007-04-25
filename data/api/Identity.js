dojo.provide("dojo.data.api.Identity");
dojo.require("dojo.data.api.Read");

dojo.declare("dojo.data.api.Identity",dojo.data.api.Read,null,{
	//	summary:
	//		This is an abstract API that data provider implementations conform to.
	//		This file defines methods signatures and intentionally leaves all the
	//		methods unimplemented.

	getFeatures: function(){
		//	summary: 
		//		See dojo.data.api.Read.getFeatures()
		return {
			 'dojo.data.api.Read': true,
			 'dojo.data.api.Identity': true
		};
	},

	getIdentity: function(/* item */ item){
		//	summary:
		//		Returns a unique identifer for an item.  The return value will be
		//		either a string or something that has a toString() method (such as,
		//		for example, a dojo.uuid.Uuid object).
		//	exceptions:
		//		Conforming implementations may throw an exception or return null if
		//		item is not an item.
		//	examples:
		//		var itemId = store.getIdentity(kermit);
		//		assert(kermit === store.findByIdentity(store.getIdentity(kermit)));
		dojo.unimplemented('dojo.data.api.Identity.getIdentity');
		var itemIdentityString = null;
		return itemIdentityString; // string
	},

	getItemByIdentity: function(/* string || object */ identity){
		//	summary:
		//		Given the identity of an item, this method returns the item that has 
		//		that identity.  Conforming implementations should return null if there 
		//		is no item with the given identity.  Implementations of getItemByIdentity() 
		//		may sometimes return an item from a local cache and may sometimes 
		//		fetch an item from a remote server, in which case the call to 
		//		getItemByIdentity() will block until the getItemByIdentity() implementation 
		//		has the item to return.	
		//
		//	identity:
		//		The identity of the object to locate.  It should be a string or an 
		//		object that toString() can be called on (such as a dojo.uuid object).
		//
		//	examples:
		//		var alaska = store.getItemByIdentity("AK");
		//		assert("AK" == store.getItemByIdentity(store.getItemByIdentity("AK")));
		dojo.unimplemented('dojo.data.api.Identity.getItemByIdentity');
		var item = null;
		return item; // item
	}
});
