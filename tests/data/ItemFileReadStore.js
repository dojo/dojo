// FIXME: this test assumes the existence of the global object "tests"
tests= typeof tests=="undefined" ? {} : tests;

define(["tests/data/readOnlyItemFileTestTemplates", "dojo/data/ItemFileReadStore" ], function() {
	tests.data.readOnlyItemFileTestTemplates.registerTestsForDatastore("dojo.data.ItemFileReadStore");
});

