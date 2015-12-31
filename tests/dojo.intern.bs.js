define([
	'./dojo.intern'
], function (intern) {
	intern.tunnel = 'BrowserStackTunnel';

	intern.capabilities = {
		project: 'Dojo',
		name: 'dojo/dojo'
	};

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '8', '9', '10', '11' ], platform: 'WINDOWS',
			'prerun': 'http://localhost:9001/tests/support/prerun.bat' },
		{ browserName: 'edge', version: '12', platform: 'WINDOWS' },
		{ browserName: 'firefox', platform: [ 'WINDOWS', 'MAC' ] },
		{ browserName: 'chrome', platform: [ 'WINDOWS', 'MAC' ] },
		{ browserName: 'safari', version: [ '6', '7', '8' ], platform: 'MAC' }
	];

	intern.maxConcurrency = 2;

	return intern;
});
