define([
	'./dojo.intern'
], function (intern) {
	intern.capabilities = {
		project: 'Dojo',
		name: 'dojo/dojo',
		'record-screenshots': false,
		'sauce-advisor': false,
		'video-upload-on-pass': false,
		'max-duration': 2100  // test can seriously take over 30 minutes!!!
	};

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '6', '7' ], platform: 'Windows XP',
			'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		{ browserName: 'internet explorer', version: [ '8', '9', '10' ], platform: 'Windows 7',
		 	'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		// { browserName: 'internet explorer', version: '10', platform: 'Windows 8',
		// 	'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		// { browserName: 'internet explorer', version: '11', platform: 'Windows 10',
			// 'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		{ browserName: 'firefox', platform: [ 'OS X 10.11', 'Windows 7', 'Windows 10' ] },
		{ browserName: 'chrome', platform: [ 'OS X 10.11', 'Windows 7', 'Windows 10' ] }
		// { browserName: 'safari', version: '7', platform: 'OS X 10.9' },
		// { browserName: 'safari', version: '8', platform: 'OS X 10.10' },
		// { browserName: 'safari', version: '9', platform: 'OS X 10.11' }
	];

	intern.maxConcurrency = 5;

	return intern;
});
