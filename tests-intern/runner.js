if (typeof process !== 'undefined' && typeof define === 'undefined') {
	(function () {
		var path = require('path'),
			dojoDir = path.resolve(__dirname, '..');
		process.chdir(dojoDir);
		this.dojoConfig = {
			async: true,
			baseUrl: dojoDir,
			deps: [ 'tests-intern/runner' ],
			packages: [
				{ name: 'intern', location: 'node_modules/intern-geezer' },
				{ name: 'when', location: 'node_modules/when', main: 'when' }
			],
			map: {
				intern: {
					dojo: 'intern/node_modules/dojo',
					chai: 'intern/node_modules/chai/chai'
				},
				'*': {
					'intern/dojo': 'intern/node_modules/dojo'
				}
			},
			tlmSiblingOfDojo: false,
			useDeferredInstrumentation: false
		};

		require('intern-geezer/node_modules/dojo/dojo');
	})();
}
else {
	define([
		'./services'
	], function (services) {
		services.start(9001).done(function (server) {
			var configRE = /^config=/;
			if (!process.argv.some(function (arg) {
				return configRE.test(arg);
			})) {
				process.argv.push('config=tests-intern/intern');
			}
			require(['intern/dojo/topic'], function (topic) {
				topic.subscribe('/runner/end', function () {
					server.close();
				});

				require(['intern/runner']);
			});
		});
	});
}
