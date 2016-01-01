define([
	'./dojo.intern'
], function (intern) {
	intern.tunnel = 'BrowserStackTunnel';

	intern.capabilities = {
		'idle-timeout': 30,
		timeout: 1800,
		project: 'Dojo',
		name: 'dojo/dojo'
	};

	intern.environments = [
		{ browserName: 'internet explorer', version: [ '7', '8', '9', '10' ], platform: 'WINDOWS' },
		{ browserName: 'chrome', platform: [ 'WINDOWS' ] },
		{ browserName: 'firefox', platform: [ 'WINDOWS' ] }
	];

	intern.maxConcurrency = 2;

	return intern;
});
