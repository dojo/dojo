define([
	'./dojo.intern'
], function (intern) {
	intern.capabilities = {
		project: 'Dojo',
		name: 'dojo/dojo',
		'record-screenshots': false,
		'sauce-advisor': false,
		'video-upload-on-pass': false,
		'max-duration': 900
	};

	intern.environments = [
		// { browserName: 'internet explorer', version: [ '8', '9', '10' ], platform: 'Windows 7',
		// 	'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		// { browserName: 'internet explorer', version: '10', platform: 'Windows 8',
		// 	'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		// { browserName: 'internet explorer', version: '11', platform: 'Windows 10',
		// 	'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		{ browserName: 'firefox', platform: [ 'OS X 10.10', 'Windows 7' ] },
		{ browserName: 'chrome', platform: [ 'OS X 10.10', 'Windows 7' ] },
		{ browserName: 'safari', version: '9', platform: 'OS X 10.11' }
	];

	intern.maxConcurrency = 5;

	return intern;
});
