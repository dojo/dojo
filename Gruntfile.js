module.exports = function (grunt) {
	grunt.loadNpmTasks('intern-geezer');

	var req = (function () {
		this.dojoConfig = {
			async: true,
			baseUrl: __dirname,
			packages: [
				{ name: 'intern', location: 'node_modules/intern-geezer' },
				{ name: 'when', location: 'node_modules/when', main: 'when' },
				{ name: 'dojo', location: '.' }
			],
			map: {
				'*': {
					'intern/dojo': 'intern/node_modules/dojo'
				}
			}
		};
		require('intern-geezer/node_modules/dojo/dojo');
		return this.require;
	})();

	grunt.initConfig({
		intern: {
			local: {
				options: {
					runType: 'runner',
					config: 'tests-intern/intern.local',
					reporters: ['runner']
				}
			},
			remote: {
				options: {
					runType: 'runner',
					config: 'tests-intern/intern',
					reporters: ['runner']
				}
			},
			proxy: {
				options: {
					runType: 'runner',
					proxyOnly: true,
					config: 'tests-intern/intern',
					reporters: ['runner']
				}
			}
		}
	});

	var servicesServer;
	grunt.registerTask('proxy', function () {
		var done = this.async();
		req(['dojo/tests-intern/services/main'], function (services) {
			services.start().then(function (server) {
				servicesServer = server;
				done(true);
			});
		});
	});

	grunt.registerTask('test', function (target) {
		if (!target || target === 'coverage' || target === 'lcov') {
			target = 'remote';
		}

		var property = 'intern.' + target + '.options.reporters',
			value = grunt.config.get(property);
		if (this.flags.coverage) {
			value.push('lcovhtml');
		}
		if (this.flags.lcov) {
			value.push('lcov');
		}
		grunt.config.set(property, value);

		grunt.task.run('proxy');
		grunt.task.run('intern:' + target);
	});
};
