dojo.provide("dojo.data.api.Notification");
dojo.require("dojo.data.api.Read");

dojo.declare("dojo.data.api.Notification",dojo.data.api.Read,null,{
	//	summary:
	//		This is an abstract API that data provider implementations conform to.
	//		This file defines methods signatures and intentionally leaves all the
	//		methods unimplemented.
	//
	//	description:
	//		This API defines a set of APIs that all datastores that conform to the
	//		Notifications API must implement.  In general, most stores will implement 
	//		these APIs as no-op functions for users who wish to monitor them to be able
	//		to connect to then via dojo.event.connect().  For non-users of 
	//		dojo.event.connect, they should be able to just replace the method on the 
	//		store to obtain notifications.  Both read-only and read-write stores may implement
	//		this feature.  In the case of a read-only store, this feature makes sense if 
	//		the store itself does internal polling to a back-end server and periodically updates
	//		its cache of items (deletes, adds, and updates).
	//
	//	examples:
	//
	//		function onSet(item, attribute, oldValue, newValue) {
	//			//Do something with the information...
	//		};
	//		var store = new some.newStore();
	//		dojo.event.connect(store, "onSet", onUpdate);

	getFeatures: function(){
		//	summary: 
		//		See dojo.data.api.Read.getFeatures()
		return {
			'dojo.data.api.Read': true,
			'dojo.data.api.Notification': true
		};
	},

	onSet: function(/* item */ item, 
					/*attribute | attribute-name-string*/ attribute, 
					/*object | array*/ oldValue,
					/*object | array*/ newValue){
		//	summary:
		//		This method is called any time an item is modified via setValue, setValues, unsetAttribute, etc.  
		//	description:
		//		This method is called any time an item is modified via setValue, setValues, unsetAttribute, etc.  
		//		Its purpose is to provide a hook point for those who wish to monitor actions on items in the store 
		//		in a simple manner.  The general expected usage is to dojo.event.connect() to the store's 
		//		implementation and be called after the store method is called.
		//
		//	item:
		//		The item being modified.
		//	attribute:
		//		The attrubite being changed.  It may be either a string name of the attribute, or an item that represents
		//		that attribute.
		//	oldValue:
		//		The old value of the attribute.  In the case of single value calls, such as setValue, unsetAttribute, etc,
		//		this value will be generally be an atomic value of some sort (string, int, etc, object).  In the case of 
		//		multi-valued attributes, it will be an array.
		//	newValue:
		//		The new value of the attribute.  In the case of single value calls, such as setValue, this value will be 
		//		generally be an atomic value of some sort (string, int, etc, object).  In the case of multi-valued attributes, 
		//		it will be an array.  In the case of unsetAttribute, the new value will be 'undefined'.
		//
		//	returns:
		//		Nothing.
		throw new Error('Unimplemented API: dojo.data.api.Notification.onSet');
	},

	onNew: function(/* item */ newItem){
		//	summary:
		//		This method is called any time a new item is created in the store.
		//		It is called immediately after the store newItem processing has completed.
		//	description:
		//		This method is called any time a new item is created in the store.
		//		It is called immediately after the store newItem processing has completed.
		//
		//	newItem:
		//		The item created..
		//
		//	returns:
		//		Nothing.
		throw new Error('Unimplemented API: dojo.data.api.Notification.onNew');
	},

	onDelete: function(/* item */ deletedItem){
		//	summary:
		//		This method is called any time an item is deleted from the store.
		//		It is called immediately after the store deleteItem processing has completed.
		//	description:
		//		This method is called any time an item is deleted from the store.
		//		It is called immediately after the store deleteItem processing has completed.
		//
		//	deletedItem:
		//		The item deleted.
		//
		//	returns:
		//		Nothing.
		throw new Error('Unimplemented API: dojo.data.api.Notification.onDelete');
	}
});
