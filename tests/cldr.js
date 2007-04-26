dojo.provide("tests.cldr");

dojo.require("dojo.cldr.supplemental");
dojo.require("dojo.cldr.monetary");

tests.register("tests.cldr", 
	[
function test_date_isWeekend(t){
	var thursday = new Date(2006, 8, 21);
	var friday = new Date(2006, 8, 22);
	var saturday = new Date(2006, 8, 23);
	var sunday = new Date(2006, 8, 24);
	var monday = new Date(2006, 8, 25);
	t.f(dojo.cldr.supplemental.isWeekend(thursday, 'en-us'));
	t.t(dojo.cldr.supplemental.isWeekend(saturday, 'en-us'));
	t.t(dojo.cldr.supplemental.isWeekend(sunday, 'en-us'));
	t.f(dojo.cldr.supplemental.isWeekend(monday, 'en-us'));
//	t.f(dojo.cldr.supplemental.isWeekend(saturday, 'en-in'));
//	t.t(dojo.cldr.supplemental.isWeekend(sunday, 'en-in'));
//	t.f(dojo.cldr.supplemental.isWeekend(monday, 'en-in'));
//	t.t(dojo.cldr.supplemental.isWeekend(friday, 'he-il'));
//	t.f(dojo.cldr.supplemental.isWeekend(sunday, 'he-il'));
}
	]
);
