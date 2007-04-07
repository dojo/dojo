dojo.provide("dojo.data.core.Read");
dojo.require("dojo.data.core.Result");
dojo.require("dojo.lang.declare");
dojo.require("dojo.experimental");

dojo.experimental("dojo.data.core.Read");

dojo.declare("dojo.data.core.Read", null, null, {
	/* summary:
	 *   This is an abstract API that data provider implementations conform to.  
	 *   This file defines methods signatures and intentionally leaves all the
	 *   methods unimplemented.  More documentation here --
	 *     http://manual.dojotoolkit.org/Book105
	 */

	getValue: function(/* item */ item, /* attribute || attribute-name-string */ attribute, /* value? */ defaultValue) {
		/* summary:
		 *   Returns a single attribute value.
		 *   Returns defaultValue if and only if *item* does not have a value for *attribute*.
		 *   Returns null if and only if null was explicitly set as the attribute value.
		 *   Returns undefined if and only if the item does not have a value for the given 
		 *   attribute (which is the same as saying the item does not have the attribute). 
		 * description:
		 *   Saying that an "item x does not have a value for an attribute y"
		 *   is identical to saying that an "item x does not have attribute y". 
		 *   It is an oxymoron to say "that attribute is present but has no values" 
		 *   or "the item has that attribute but does not have any attribute values".
		 *   If store.hasAttribute(item, attribute) returns false, then
		 *   store.getValue(item, attribute) will return undefined.
		 */
		 
		/* exceptions:
		 *   Conforming implementations should throw an exception if *item* is not
		 *   an item, or *attribute* is neither an attribute object or a string.
		 * examples:
		 *   var darthVader = store.getValue(lukeSkywalker, "father");
		 */
		dojo.unimplemented('dojo.data.core.Read.getValue');
		var attributeValue = null;
		return attributeValue; // a literal, an item, null, or undefined (never an array)
	},
	
	getValues: function(/* item */ item, /* attribute || attribute-name-string */ attribute) {
		/* summary:
		 *   This getValues() method works just like the getValue() method, but getValues()
		 *   always returns an array rather than a single attribute value.  The array
		 *   may be empty, may contain a single attribute value, or may contain many
		 *   attribute values.
		 *   If the item does not have a value for the given attribute, then getValues()
		 *   will return an empty array: [].  (So, if store.hasAttribute(item, attribute)
		 *   returns false, then store.getValues(item, attribute) will return [].)
		 */
		 
		/* exceptions:
		 *   Throws an exception if *item* is not an item, or *attribute* is neither an 
		 *   attribute object or a string.
		 * examples:
		 *   var friendsOfLuke = store.getValues(lukeSkywalker, "friends");
		 */
		dojo.unimplemented('dojo.data.core.Read.getValues');
		var array = null;
		return array; // an array that may contain literals and items
	},
	
	getAttributes: function(/* item */ item) {
		/* summary:
		 *   Returns an array with all the attributes that this item has.  This
		 *   method will always return an array; if the item has no attributes
		 *   at all, getAttributes() will return an empty array: [].
		 */
		 
		/* exceptions:
		 *   Throws an exception if *item* is not an item. 
		 * examples:
		 *   var array = store.getAttributes(kermit);
		 */
		dojo.unimplemented('dojo.data.core.Read.getAttributes');
		var array = null;
		return array; // array
	},
	
	hasAttribute: function(/* item */ item, /* attribute || attribute-name-string */ attribute) {
		/* summary:
		 *   Returns true if the given *item* has a value for the given *attribute*.
		 */
		 
		/* exceptions:
		 *   Throws an exception if *item* is not an item, or *attribute* is neither an 
		 *   attribute object or a string.
		 * examples:
		 *   var trueOrFalse = store.hasAttribute(kermit, "color");
		 */
		dojo.unimplemented('dojo.data.core.Read.hasAttribute');
		return false; // boolean
	},
	
	containsValue: function(/* item */ item, /* attribute || attribute-name-string */ attribute, /* anything */ value) {
		/* summary:
		 *   Returns true if the given *value* is one of the values that getValues()
		 *   would return.
		 */
		 
		/* exceptions:
		 *   Throws an exception if *item* is not an item, or *attribute* is neither an 
		 *   attribute object or a string.
		 * examples:
		 *   var trueOrFalse = store.containsValue(kermit, "color", "green");
		 */
		dojo.unimplemented('dojo.data.core.Read.containsValue');
		return false; // boolean
	},
	
	isItem: function(/* anything */ something) {
		/* summary:
		 *   Returns true if *something* is an item.  Returns false if *something*
		 *   is a literal or is any object other than an item.
		 */
		 
		/* examples:
		 *   var yes = store.isItem(store.newItem());
		 *   var no  = store.isItem("green");
		 */
		dojo.unimplemented('dojo.data.core.Read.isItem');
		return false; // boolean
	},
	
	isItemLoaded: function(/* anything */ something) {
		/* summary:
		 *   Returns false if isItem(something) is false.  Returns false if
		 *   if isItem(something) is true but the the item is not yet loaded
		 *   in local memory (for example, if the item has not yet been read
		 *   from the server).
		 */
		 
		/* examples:
		 *   var yes = store.isItemLoaded(store.newItem());
		 *   var no  = store.isItemLoaded("green");
		 */
		dojo.unimplemented('dojo.data.core.Read.isItemLoaded');
		return false; // boolean
	},
	
	loadItem: function(/* item */ item) {
		/* summary:
		 *   Given an item, this method loads the item so that a subsequent call
		 *   to store.isItemLoaded(item) will return true.  If a call to
		 *   to isItemLoaded() returns true before loadItem() is even called,
		 *   then loadItem() need not do any work at all.  A call to loadItem()
		 *   will block until the loadItem() implementation has loaded the item.
		 */
		if (this.isItemLoaded(item)) {
			return item;
		} else {
			dojo.unimplemented('dojo.data.core.Read.loadItem');
			return item; // item
		}
	},
	
	find: function(/* object? || dojo.data.core.Result */ keywordArgs) {
		/* summary:
		 *   Given a query, this method executes the query and makes the
		 *   results available as data items.
		 * description:
		 *   A Result object will always be returned, even if the result set
		 *   is empty.  A Result object will always be returned immediately.
		 *   By default the Result object will be fully populated with result
		 *   items as soon as it is created (synchronously).  The caller may 
		 *   request that the find() operation be executed asynchronously, in
		 *   which case the Result object will be returned immediately but 
		 *   will not yet be populated with result items.  
		 *   For more info about the Result API, see dojo.data.core.Result
		 * keywordArgs:
		 *   The keywordArgs parameter may either be an instance of 
		 *   dojo.data.core.Result or may be a simple anonymous object
		 *   that may contain any of the following:
		 *   { query: query-string or query-object,
		 *     sync: Boolean,
		 *     saveResult: Boolean,
		 *     onbegin: Function,
		 *     onnext: Function,
		 *     oncompleted: Function,
		 *     onerror: Function,
		 *     scope: object
		 *     }
		 *   All implementations should accept keywordArgs objects with any of
		 *   the 7 standard properties: query, sync, saveResult, onnext, oncompleted, 
		 *   onerror, and scope.  Some implementations may accept additional 
		 *   properties in the keywordArgs object as valid parameters, such as 
		 *   {maxResults:100} or {includeOutliers:true}.		 
		 * The *query* parameter.
		 *   The query may be optional in some data store implementations.
		 *   The dojo.data.core.Read API does not specify the syntax or semantics
		 *   of the query itself -- each different data store implementation
		 *   may have its own notion of what a query should look like.
		 *   In most implementations the query will probably be a string, but
		 *   in some implementations the query might be a Date, or a number,
		 *   or some complex keyword parameter object.  The dojo.data.core.Read
		 *   API is completely agnostic about what the query actually is.
		 * The *sync* parameter.
		 *   The sync parameter specifies whether the find operation is asynchronous 
		 *   or not, with {sync:false} for asynchronous finds operations and 
		 *   {sync:true} for synchronous find operations.  If no sync parameter
		 *   is specified, the default is {sync:true}.
		 * The *saveResult* parameter.
		 *   If saveResult is true, then the find call will return a Result
		 *   object that includes a property called *items*, and *items* will
		 *   contain an array of the items found by the query.  If no saveResult
		 *   parameter is specified and no onnext Function is set, the default 
		 *   saveResult value will be {saveResult:true}.  If no saveResult
		 *   parameter is specified but an onnext Function is set, the default 
		 *   saveResult value will be {saveResult:false}.  
		 * The *onbegin* parameter.
		 *   If an onbegin callback function is provided, the callback function
		 *   will be called just once, before the first onnext callback is called.
		 *   The onbegin callback function will be passed a single argument:
		 *   the Result object.  The onbegin callback will be called even if 
		 *   query returns zero items.
		 * The *onnext* parameter.
		 *   If an onnext callback function is provided, the callback function
		 *   will be called as each item in the result is received. The callback 
		 *   function will be passed two arguments: the item itself, and the
		 *   Result object.
		 * The *oncompleted* parameter.
		 *   If an oncompleted callback function is provided, the callback function
		 *   will be called just once, after the last onnext callback is called.
		 *   The oncompleted callback function will be passed a single argument:
		 *   the Result object.  The oncompleted callback will be called even if 
		 *   query returns zero items.
		 * The *onerror* parameter.
		 *   If an onerror callback function is provided, the callback function
		 *   will be called if there is any sort of error while attempting to
		 *   execute the query..
		 *   The onerror callback function will be passed two arguments:
		 *   an Error object and the Result object.
		 * The *scope* parameter.
		 *   If a scope object is provided, all of the callback function (onnext, 
		 *   oncompleted, onerror) will be invoked in the context of the scope
		 *   object.  In the body of the callback function, the value of the "this"
		 *   keyword will be the scope object.   If no scope object is provided,
		 *   the callback functions will be called in the context of dj_global.  
		 *   For example, onnext.call(scope, item, result) vs. 
		 *   onnext.call(dj_global, item, result)
		 * returns:
		 *   The find() method will return an instance of dojo.data.core.Result
		 *   (or an object that extends dojo.data.core.Result or conforms to the
		 *   dojo.data.core.Result API).  If the find() method was passed an
		 *   instance of dojo.data.core.Result as an argument, the same instance
		 *   will be returned.  If the find() method was passed a simple 
		 *   keywordArgs object, like {sync:true}, then the properties in the
		 *   keywordArgs object will be copied into the Result object that 
		 *   find() returns.  The Result object will also have additional 
		 *   properties when it is returned.  The result.store property will 
		 *   have a pointer to the datastore object that find() is a method of.
		 *   The result.length will be -1 if the find() operation has not 
		 *   finished or if there was an error; if the find() operation
		 *   finishes successfully, result.length will be the number of items
		 *   that were found.  If the saveResult property was set to true, or
		 *   if no onnext callback was set, the result.item property will 
		 *   contain an array of data items.  The result.resultMetadata property 
		 *   will contain an additional metaData that was returned by the query
		 *   along with the data items.  For example, if the query returned a
		 *   list of 500 houses for sales, the resultMetadata property might
		 *   contain the average asking price of the houses, or info about 
		 *   how long the query took to execute.
		 */
		
		/* exceptions:
		 *   Throws an exception if the query is not valid, or if the query
		 *   is required but was not supplied.
		 * examples:
		 *   var result = store.find({query:"all books"});
		 *   var result = store.find();
		 *   var result = store.find({query:"foo/bar", sync:true});
		 *   var result = store.find({query:"foo/bar", sync:false, onnext:callback});
		 *   var result = store.find({query:{author:"King"}, maxResults:100});
		 */
		dojo.unimplemented('dojo.data.core.Read.find');
		var result = null; // new dojo.data.core.Result().
		return result; // a dojo.data.core.Result object
	},
	
	getFeatures: function() {
		/* summary:
		 *   The getFeatures() method returns an simple keyword values object 
		 *   that specifies what interface features the datastore implements.  
		 *   A simple CsvStore may be read-only, and the only feature it 
		 *   implements will be the 'dojo.data.core.Read' interface, so the
		 *   getFeatures() method will return an object like this one:
		 *   {'dojo.data.core.Read': true}.
		 *   A more sophisticated datastore might implement a variety of
		 *   interface features, like 'dojo.data.core.Read', 'dojo.data.core.Write', 
		 *   'dojo.data.core.Identity', and 'dojo.data.core.Attribution'.
		 */
		 var features = {
			 'dojo.data.core.Read': true
		 };
		 return features;
	}

});
