dojo.provide("dojo.data.api.Write");
dojo.require("dojo.data.api.Read");

dojo.declare("dojo.data.api.Write", dojo.data.api.Read, {
	//	summary:
	//		This is an abstract API that data provider implementations conform to.  
	//		This file defines function signatures and intentionally leaves all the
	//		functionss unimplemented.

	getFeatures: function(){
		//	summary: 
		//		See dojo.data.api.Read.getFeatures()
		return {
			'dojo.data.api.Read': true,
			'dojo.data.api.Write': true
		};
	},

	newItem: function(/* Object? */ keywordArgs){
		//	summary:
		//		Returns a newly created item.  Sets the attributes of the new
		//		item based on the *keywordArgs* provided.  In general, the attribute
		//		names in the keywords become the attributes in the new item and as for
		//		the attribute values in keywordArgs, they become the values of the attributes
		//		in the new item.
		//
		//	keywordArgs:
		//		A javascript object defining the initial content of the item as a set of JavaScript 'property name: value' pairs.
		//
		//	exceptions:
		//		Throws an exception if *keywordArgs* is a string or a number or
		//		anything other than a simple anonymous object.
		//	examples:
		//		var kermit = store.newItem({name: "Kermit", color:[blue, green]});

		var newItem;
		throw new Error('Unimplemented API: dojo.data.api.Write.newItem');
		return newItem; // item
	},

	deleteItem: function(/* item */ item){
		//	summary:
		//		Deletes an item from the store.
		//
		//	item: 
		//		The item to delete.
		//
		//	exceptions:
		//		Throws an exception if the argument *item* is not an item 
		//		(if store.isItem(item) returns false).
		//	examples:
		//		var success = store.deleteItem(kermit);
		throw new Error('Unimplemented API: dojo.data.api.Write.deleteItem');
		return false; // boolean
	},

	setValue: function(	/* item */ item, 
						/* string */ attribute,
						/* almost anything */ value){
		//	summary:
		//		Sets the value of an attribute on an item.
		//		Replaces any previous value or values.
		//
		//	item:
		//		The item to modify.
		//	attribute:
		//		The attribute of the item to change represented as a string name.
		//	value:
		//		The value to assign to the item.
		//
		//	exceptions:
		//		Throws an exception if *item* is not an item, or if *attribute*
		//		is neither an attribute object or a string.
		//		Throws an exception if *value* is undefined.
		//	examples:
		//		var success = store.set(kermit, "color", "green");
		throw new Error('Unimplemented API: dojo.data.api.Write.setValue');
		return false; // boolean
	},

	setValues: function(/* item */ item,
						/* string */ attribute, 
						/* array */ values){
		//	summary:
		//		Adds each value in the *values* array as a value of the given
		//		attribute on the given item.
		//		Replaces any previous value or values.
		//		Calling store.setValues(x, y, []) (with *values* as an empty array) has
		//		the same effect as calling store.unsetAttribute(x, y).
		//
		//	item:
		//		The item to modify.
		//	attribute:
		//		The attribute of the item to change represented as a string name.
		//	values:
		//		An array of values to assign to the attribute..
		//
		//	exceptions:
		//		Throws an exception if *values* is not an array, if *item* is not an
		//		item, or if *attribute* is neither an attribute object or a string.
		//	examples:
		//		var success = store.setValues(kermit, "color", ["green", "aqua"]);
		//		success = store.setValues(kermit, "color", []);
		//		if (success) {assert(!store.hasAttribute(kermit, "color"));}
		throw new Error('Unimplemented API: dojo.data.api.Write.setValues');
		return false; // boolean
	},

	unsetAttribute: function(	/* item */ item, 
								/* string */ attribute){
		//	summary:
		//		Deletes all the values of an attribute on an item.
		//
		//	item:
		//		The item to modify.
		//	attribute:
		//		The attribute of the item to unset represented as a string.
		//
		//	exceptions:
		//		Throws an exception if *item* is not an item, or if *attribute*
		//		is neither an attribute object or a string.
		//	examples:
		//		var success = store.unsetAttribute(kermit, "color");
		//		if (success) {assert(!store.hasAttribute(kermit, "color"));}
		throw new Error('Unimplemented API: dojo.data.api.Write.clear');
		return false; // boolean
	},

	save: function(/* object */ keywordArgs){
		//	summary:
		//		Saves to the server all the changes that have been made locally.
		//		The save operation may take some time and is generally performed
		//		in an asynchronous fashion.  The outcome of the save action is 
		//		is passed into the set of supported callbacks for the save.
		//   
		//	keywordArgs:
		//		{
		//			onComplete: function
		//			onError: function
		//			scope: object
		//		}
		//
		//	The *onComplete* parameter.
		//		function();
		//
		//		If an onComplete callback function is provided, the callback function
		//		will be called just once, after the save has completed.  No parameters
		//		are generally passed to the onComplete.
		//
		//	The *onError* parameter.
		//		function(errorData); 
		//
		//		If an onError callback function is provided, the callback function
		//		will be called if there is any sort of error while attempting to
		//		execute the save.  The onError function will be based one parameter, the
		//		error.
		//
		//	The *scope* parameter.
		//		If a scope object is provided, all of the callback function (
		//		onComplete, onError, etc) will be invoked in the context of the scope
		//		object.  In the body of the callback function, the value of the "this"
		//		keyword will be the scope object.   If no scope object is provided,
		//		the callback functions will be called in the context of dojo.global.  
		//		For example, onComplete.call(scope) vs. 
		//		onComplete.call(dojo.global)
		//
		//	returns:
		//		Nothing.  Since the saves are generally asynchronous, there is 
		//		no need to return anything.  All results are passed via callbacks.
		//	examples:
		//		store.save({onComplete: onSave});
		//		store.save({scope: fooObj, onComplete: onSave, onError: saveFailed});
		throw new Error('Unimplemented API: dojo.data.api.Write.save');
	},

	revert: function(){
		//	summary:
		//		Discards any unsaved changes.
		//	description:
		//		Discards any unsaved changes.
		//
		//	examples:
		//		var success = store.revert();
		throw new Error('Unimplemented API: dojo.data.api.Write.revert');
		return false; // boolean
	},

	isDirty: function(/* item? */ item){
		//	summary:
		//		Given an item, isDirty() returns true if the item has been modified 
		//		since the last save().  If isDirty() is called with no *item* argument,  
		//		then this function returns true if any item has been modified since
		//		the last save().
		//
		//	item:
		//		The item to check.
		//
		//	exceptions:
		//		Throws an exception if isDirty() is passed an argument and the
		//		argument is not an item.
		//	examples:
		//		var trueOrFalse = store.isDirty(kermit); // true if kermit is dirty
		//		var trueOrFalse = store.isDirty();       // true if any item is dirty
		throw new Error('Unimplemented API: dojo.data.api.Write.isDirty');
		return false; // boolean
	}
});
