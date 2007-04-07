dojo.provide("dojo.data.core.Identity");
dojo.require("dojo.data.core.Read");
dojo.require("dojo.lang.declare");
dojo.require("dojo.experimental");

dojo.experimental("dojo.data.core.Identity");

dojo.declare("dojo.data.core.Identity", dojo.data.core.Read, null, {
	/* summary:
	 *   This is an abstract API that data provider implementations conform to.
	 *   This file defines methods signatures and intentionally leaves all the
	 *   methods unimplemented.
	 */
	getFeatures: function() {
		// summary: See dojo.data.core.Read.getFeatures()
		var features = {
			 'dojo.data.core.Read': true,
			 'dojo.data.core.Identity': true
		};
		return features;
	},
	
	getIdentity: function(/* item */ item) {
		/* summary:
		 *   Returns a unique identifer for an item.  The return value will be
		 *   either a string or something that has a toString() method (such as,
		 *   for example, a dojo.uuid.Uuid object).
		 */
		 
		/* exceptions:
		 *   Conforming implementations may throw an exception or return null if
		 *   item is not an item.
		 * examples:
		 *   var itemId = store.getIdentity(kermit);
		 *   assert(kermit === store.findByIdentity(store.getIdentity(kermit)));
		 */
		dojo.unimplemented('dojo.data.core.Identity.getIdentity');
		var itemIdentityString = null;
		return itemIdentityString; // string
	},
	
	findByIdentity: function(/* string */ identity) {
		/* summary:
		 *   Given the identity of an item, this method returns the item that has 
		 *   that identity.  Conforming implementations should return null if there 
		 *   is no item with the given identity.  Implementations of findByIdentity() 
		 *   may sometimes return an item from a local cache and may sometimes 
		 *   fetch an item from a remote server, in which case the call to 
		 *   findByIdentity() will block until the findByIdentity() implementation 
		 *   has the item to return.
		 */
		 
		/* examples:
		 *   var alaska = store.findByIdentity("AK");
		 *   assert("AK" == store.getIdentity(store.findByIdentity("AK")));
		 */
		dojo.unimplemented('dojo.data.core.Identity.findByIdentity');
		var item = null;
		return item; // item
	}
});
