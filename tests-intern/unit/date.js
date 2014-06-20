define([
	'intern!object',
	'intern/chai!assert',
	'dojo/date'
], function (registerSuite, assert, date) {
	function assertDateEqual(date1, date2) {
		assert.instanceOf(date1, Date);
		assert.instanceOf(date2, Date);
		assert.equal(date1.getTime(), date2.getTime());
	}

	registerSuite({
		name: 'dojo/date',

		'.getTimezoneName': (function () {
			var dt;

			// Create a fake Date object with toString and toLocaleString
			// results manually set to simulate tests for multiple browsers
			function FakeDate(str, strLocale) {
				this.str = str || '';
				this.strLocale = strLocale || '';
				this.toString = function () {
					return this.str;
				};
				this.toLocaleString = function () {
					return this.strLocale;
				};
			}

			return {
				'before': function () {
					dt = new FakeDate();
				},

				'FF 1.5 Ubuntu Linux (Breezy)': function () {
					dt.str = 'Sun Sep 17 2006 22:25:51 GMT-0500 (CDT)';
					dt.strLocale = 'Sun 17 Sep 2006 10:25:51 PM CDT';
					assert.equal(date.getTimezoneName(dt), 'CDT');
				},

				'Safari 2.0 Mac OS X 10.4': function () {
					dt.str = 'Sun Sep 17 2006 22:55:01 GMT-0500';
					dt.strLocale = 'September 17, 2006 10:55:01 PM CDT';
					assert.equal(date.getTimezoneName(dt), 'CDT');
				},

				'FF 1.5 Mac OS X 10.4': function () {
					dt.str = 'Sun Sep 17 2006 22:57:18 GMT-0500 (CDT)';
					dt.strLocale = 'Sun Sep 17 22:57:18 2006';
					assert.equal(date.getTimezoneName(dt), 'CDT');
				},

				'Opera 9 Mac OS X 10.4': function () {
					// no TZ data expect empty string return
					dt.str = 'Sun, 17 Sep 2006 22:58:06 GMT-0500';
					dt.strLocale = 'Sunday September 17, 22:58:06 GMT-0500 2006';
					assert.equal(date.getTimezoneName(dt), '');
				},

				'IE 6 Windows XP': function () {
					dt.str = 'Mon Sep 18 11:21:07 CDT 2006';
					dt.strLocale = 'Monday, September 18, 2006 11:21:07 AM';
					assert.equal(date.getTimezoneName(dt), 'CDT');
				},

				'Opera 9 Ubuntu Linux (Breezy)': function () {
					// no TZ data expect empty string return
					dt.str = 'Mon, 18 Sep 2006 13:30:32 GMT-0500';
					dt.strLocale = 'Monday September 18, 13:30:32 GMT-0500 2006';
					assert.equal(date.getTimezoneName(dt), '');
				},

				'IE 5.5 Windows 2000': function () {
					dt.str = 'Mon Sep 18 13:49:22 CDT 2006';
					dt.strLocale = 'Monday, September 18, 2006 1:49:22 PM';
					assert.equal(date.getTimezoneName(dt), 'CDT');
				}
			};
		})(),

		'.compare': function () {
			var d1 = new Date();
			d1.setHours(0);
			var d2 = new Date();
			d2.setFullYear(2005);
			d2.setHours(12);

			assert.equal(date.compare(d1, d1), 0);
			assert.equal(date.compare(d1, d2, 'date'), 1);
			assert.equal(date.compare(d2, d1, 'date'), -1);
			assert.equal(date.compare(d1, d2, 'time'), -1);
			assert.equal(date.compare(d1, d2, 'datetime'), 1);
		},

		'.add': {
			'year': function () {
				var interval = 'year';
				var dateA;
				var dateB;

				dateA = new Date(2005, 11, 27);
				dateB = new Date(2006, 11, 27);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2005, 11, 27);
				dateB = new Date(2004, 11, 27);
				assertDateEqual(dateB, date.add(dateA, interval, -1));

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2001, 1, 28);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2005, 1, 28);
				assertDateEqual(dateB, date.add(dateA, interval, 5));

				dateA = new Date(1900, 11, 31);
				dateB = new Date(1930, 11, 31);
				assertDateEqual(dateB, date.add(dateA, interval, 30));

				dateA = new Date(1995, 11, 31);
				dateB = new Date(2030, 11, 31);
				assertDateEqual(dateB, date.add(dateA, interval, 35));
			},

			'quarter': function () {
				var interval = 'quarter';
				var dateA;
				var dateB;

				dateA = new Date(2000, 0, 1);
				dateB = new Date(2000, 3, 1);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2000, 7, 29);
				assertDateEqual(dateB, date.add(dateA, interval, 2));

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2001, 1, 28);
				assertDateEqual(dateB, date.add(dateA, interval, 4));
			},

			'month': function () {
				var interval = 'month';
				var dateA;
				var dateB;

				dateA = new Date(2000, 0, 1);
				dateB = new Date(2000, 1, 1);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2000, 0, 31);
				dateB = new Date(2000, 1, 29);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2001, 1, 28);
				assertDateEqual(dateB, date.add(dateA, interval, 12));
			},

			'week': function () {
				var interval = 'week';
				var dateA;
				var dateB;

				dateA = new Date(2000, 0, 1);
				dateB = new Date(2000, 0, 8);
				assertDateEqual(dateB, date.add(dateA, interval, 1));
			},

			'day': function () {
				var interval = 'day';
				var dateA;
				var dateB;

				dateA = new Date(2000, 0, 1);
				dateB = new Date(2000, 0, 2);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2001, 0, 1);
				dateB = new Date(2002, 0, 1);
				assertDateEqual(dateB, date.add(dateA, interval, 365));

				dateA = new Date(2000, 0, 1);
				dateB = new Date(2001, 0, 1);
				assertDateEqual(dateB, date.add(dateA, interval, 366));

				dateA = new Date(2000, 1, 28);
				dateB = new Date(2000, 1, 29);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2001, 1, 28);
				dateB = new Date(2001, 2, 1);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2000, 2, 1);
				dateB = new Date(2000, 1, 29);
				assertDateEqual(dateB, date.add(dateA, interval, -1));

				dateA = new Date(2001, 2, 1);
				dateB = new Date(2001, 1, 28);
				assertDateEqual(dateB, date.add(dateA, interval, -1));

				dateA = new Date(2000, 0, 1);
				dateB = new Date(1999, 11, 31);
				assertDateEqual(dateB, date.add(dateA, interval, -1));
			},

			'weekday': function () {
				var interval = 'weekday';
				var dateA;
				var dateB;

				// Sat, Jan 1
				dateA = new Date(2000, 0, 1);
				// Should be Mon, Jan 3
				dateB = new Date(2000, 0, 3);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				// Sun, Jan 2
				dateA = new Date(2000, 0, 2);
				// Should be Mon, Jan 3
				dateB = new Date(2000, 0, 3);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				// Sun, Jan 2
				dateA = new Date(2000, 0, 2);
				// Should be Fri, Jan 7
				dateB = new Date(2000, 0, 7);
				assertDateEqual(dateB, date.add(dateA, interval, 5));

				// Sun, Jan 2
				dateA = new Date(2000, 0, 2);
				// Should be Mon, Jan 10
				dateB = new Date(2000, 0, 10);
				assertDateEqual(dateB, date.add(dateA, interval, 6));

				// Mon, Jan 3
				dateA = new Date(2000, 0, 3);
				// Should be Mon, Jan 17
				dateB = new Date(2000, 0, 17);
				assertDateEqual(dateB, date.add(dateA, interval, 10));

				// Sat, Jan 8
				dateA = new Date(2000, 0, 8);
				// Should be Mon, Jan 3
				dateB = new Date(2000, 0, 3);
				assertDateEqual(dateB, date.add(dateA, interval, -5));

				// Sun, Jan 9
				dateA = new Date(2000, 0, 9);
				// Should be Wed, Jan 5
				dateB = new Date(2000, 0, 5);
				assertDateEqual(dateB, date.add(dateA, interval, -3));

				// Sun, Jan 23
				dateA = new Date(2000, 0, 23);
				// Should be Fri, Jan 7
				dateB = new Date(2000, 0, 7);
				assertDateEqual(dateB, date.add(dateA, interval, -11));
			},

			'hour': function () {
				var interval = 'hour';
				var dateA;
				var dateB;

				dateA = new Date(2000, 0, 1, 11);
				dateB = new Date(2000, 0, 1, 12);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2001, 9, 28, 0);
				dateB = new Date(dateA.getTime() + (60 * 60 * 1000));
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2001, 9, 28, 23);
				dateB = new Date(2001, 9, 29, 0);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2001, 11, 31, 23);
				dateB = new Date(2002, 0, 1, 0);
				assertDateEqual(dateB, date.add(dateA, interval, 1));
			},

			'minute': function () {
				var interval = 'minute';
				var dateA;
				var dateB;

				dateA = new Date(2000, 11, 31, 23, 59);
				dateB = new Date(2001, 0, 1, 0, 0);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2000, 11, 27, 12, 2);
				dateB = new Date(2000, 11, 27, 13, 2);
				assertDateEqual(dateB, date.add(dateA, interval, 60));
			},

			'second': function () {
				var interval = 'second';
				var dateA;
				var dateB;

				dateA = new Date(2000, 11, 31, 23, 59, 59);
				dateB = new Date(2001, 0, 1, 0, 0, 0);
				assertDateEqual(dateB, date.add(dateA, interval, 1));

				dateA = new Date(2000, 11, 27, 8, 10, 59);
				dateB = new Date(2000, 11, 27, 8, 11, 59);
				assertDateEqual(dateB, date.add(dateA, interval, 60));
			}
		},

		'.difference': {
			'year': function () {
				var interval = 'year';
				var dateA;
				var dateB;

				dateA = new Date(2005, 11, 27);
				dateB = new Date(2006, 11, 27);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				dateA = new Date(2000, 11, 31);
				dateB = new Date(2001, 0, 1);
				assert.equal(date.difference(dateA, dateB, interval), 1);
			},

			'quarter': function () {
				var interval = 'quarter';
				var dateA;
				var dateB;

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2001, 2, 1);
				assert.equal(date.difference(dateA, dateB, interval), 4);

				dateA = new Date(2000, 11, 1);
				dateB = new Date(2001, 0, 1);
				assert.equal(date.difference(dateA, dateB, interval), 1);
			},

			'month': function () {
				var interval = 'month';
				var dateA;
				var dateB;

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2001, 2, 1);
				assert.equal(date.difference(dateA, dateB, interval), 13);

				dateA = new Date(2000, 11, 1);
				dateB = new Date(2001, 0, 1);
				assert.equal(date.difference(dateA, dateB, interval), 1);
			},

			'week': function () {
				var interval = 'week';
				var dateA;
				var dateB;

				dateA = new Date(2000, 1, 1);
				dateB = new Date(2000, 1, 8);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				dateA = new Date(2000, 1, 28);
				dateB = new Date(2000, 2, 6);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				dateA = new Date(2000, 2, 6);
				dateB = new Date(2000, 1, 28);
				assert.equal(date.difference(dateA, dateB, interval), -1);
			},

			'day': function () {
				var interval = 'day';
				var dateA;
				var dateB;

				dateA = new Date(2000, 1, 29);
				dateB = new Date(2000, 2, 1);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				dateA = new Date(2000, 11, 31);
				dateB = new Date(2001, 0, 1);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				// DST leap -- check for rounding err
				// This is dependent on US calendar, but
				// shouldn't break in other locales
				dateA = new Date(2005, 3, 3);
				dateB = new Date(2005, 3, 4);
				assert.equal(date.difference(dateA, dateB, interval), 1);
			},

			'weekday': function () {
				var interval = 'weekday';
				var dateA;
				var dateB;

				dateA = new Date(2006, 7, 3);
				dateB = new Date(2006, 7, 11);
				assert.equal(date.difference(dateA, dateB, interval), 6);

				// Positive diffs
				dateA = new Date(2006, 7, 4);
				dateB = new Date(2006, 7, 11);
				assert.equal(date.difference(dateA, dateB, interval), 5);

				dateA = new Date(2006, 7, 5);
				dateB = new Date(2006, 7, 11);
				assert.equal(date.difference(dateA, dateB, interval), 5);

				dateA = new Date(2006, 7, 6);
				dateB = new Date(2006, 7, 11);
				assert.equal(date.difference(dateA, dateB, interval), 5);

				dateA = new Date(2006, 7, 7);
				dateB = new Date(2006, 7, 11);
				assert.equal(date.difference(dateA, dateB, interval), 4);

				dateA = new Date(2006, 7, 7);
				dateB = new Date(2006, 7, 13);
				assert.equal(date.difference(dateA, dateB, interval), 4);

				dateA = new Date(2006, 7, 7);
				dateB = new Date(2006, 7, 14);
				assert.equal(date.difference(dateA, dateB, interval), 5);

				dateA = new Date(2006, 7, 7);
				dateB = new Date(2006, 7, 15);
				assert.equal(date.difference(dateA, dateB, interval), 6);

				dateA = new Date(2006, 7, 7);
				dateB = new Date(2006, 7, 28);
				assert.equal(date.difference(dateA, dateB, interval), 15);

				dateA = new Date(2006, 2, 2);
				dateB = new Date(2006, 2, 28);
				assert.equal(date.difference(dateA, dateB, interval), 18);

				// Negative diffs
				dateA = new Date(2006, 7, 11);
				dateB = new Date(2006, 7, 4);
				assert.equal(date.difference(dateA, dateB, interval), -5);

				dateA = new Date(2006, 7, 11);
				dateB = new Date(2006, 7, 5);
				assert.equal(date.difference(dateA, dateB, interval), -4);

				dateA = new Date(2006, 7, 11);
				dateB = new Date(2006, 7, 6);
				assert.equal(date.difference(dateA, dateB, interval), -4);

				dateA = new Date(2006, 7, 11);
				dateB = new Date(2006, 7, 7);
				assert.equal(date.difference(dateA, dateB, interval), -4);

				dateA = new Date(2006, 7, 13);
				dateB = new Date(2006, 7, 7);
				assert.equal(date.difference(dateA, dateB, interval), -5);

				dateA = new Date(2006, 7, 14);
				dateB = new Date(2006, 7, 7);
				assert.equal(date.difference(dateA, dateB, interval), -5);

				dateA = new Date(2006, 7, 15);
				dateB = new Date(2006, 7, 7);
				assert.equal(date.difference(dateA, dateB, interval), -6);

				dateA = new Date(2006, 7, 28);
				dateB = new Date(2006, 7, 7);
				assert.equal(date.difference(dateA, dateB, interval), -15);

				dateA = new Date(2006, 2, 28);
				dateB = new Date(2006, 2, 2);
				assert.equal(date.difference(dateA, dateB, interval), -18);

				// Sat, Jan 8
				// Range starts on a Saturday with negative days
				dateA = new Date(2000, 0, 8);
				dateB = new Date(2000, 0, 3);
				assert.equal(date.difference(dateA, dateB, interval), -5);

				// Two days on the same weekend -- no weekday diff
				dateA = new Date(2006, 7, 5);
				dateB = new Date(2006, 7, 6);
				assert.equal(date.difference(dateA, dateB, interval), 0);
			},

			'hour': function () {
				var interval = 'hour';
				var dateA;
				var dateB;

				dateA = new Date(2000, 11, 31, 23);
				dateB = new Date(2001, 0, 1, 0);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				dateA = new Date(2000, 11, 31, 12);
				dateB = new Date(2001, 0, 1, 0);
				assert.equal(date.difference(dateA, dateB, interval), 12);
			},

			'minute': function () {
				var interval = 'minute';
				var dateA;
				var dateB;

				dateA = new Date(2000, 11, 31, 23, 59);
				dateB = new Date(2001, 0, 1, 0, 0);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				dateA = new Date(2000, 1, 28, 23, 59);
				dateB = new Date(2000, 1, 29, 0, 0);
				assert.equal(date.difference(dateA, dateB, interval), 1);
			},

			'second': function () {
				var interval = 'second';
				var dateA;
				var dateB;

				dateA = new Date(2000, 11, 31, 23, 59, 59);
				dateB = new Date(2001, 0, 1, 0, 0, 0);
				assert.equal(date.difference(dateA, dateB, interval), 1);
			},

			'millisecond': function () {
				var interval = 'millisecond';
				var dateA;
				var dateB;

				dateA = new Date(2000, 11, 31, 23, 59, 59, 999);
				dateB = new Date(2001, 0, 1, 0, 0, 0, 0);
				assert.equal(date.difference(dateA, dateB, interval), 1);

				dateA = new Date(2000, 11, 31, 23, 59, 59, 0);
				dateB = new Date(2001, 0, 1, 0, 0, 0, 0);
				assert.equal(date.difference(dateA, dateB, interval), 1000);
			}
		}
	});
});