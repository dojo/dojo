define([
	'./dojo.intern'
], function (intern) {
	intern.tunnel = 'BrowserStackTunnel';

	intern.capabilities = {
		'selenium-version': '2.43.1',
		'idle-timeout': 30,
		project: 'Dojo',
		name: 'dojo/dojo'
	};

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '6', '7', '8', '9', '10', '11' ], platform: 'WINDOWS' },
		{ browserName: 'firefox', platform: [ 'WINDOWS', 'MAC' ] },
		{ browserName: 'chrome', platform: [ 'WINDOWS', 'MAC' ] },
	];

	intern.maxConcurrency = 1;

	return intern;
});
