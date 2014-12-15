module.exports = function (grunt) {
	grunt.loadNpmTasks('intern-geezer');

	grunt.initConfig({
		intern: {
			local: {
				options: {
					runType: 'runner',
					config: 'tests/dojo.intern.local',
					reporters: ['runner']
				}
			},
			remote: {
				options: {
					runType: 'runner',
					config: 'tests/dojo.intern',
					reporters: ['runner']
				}
			},
			proxy: {
				options: {
					runType: 'runner',
					proxyOnly: true,
					config: 'tests/dojo.intern.proxy',
					reporters: ['runner']
				}
			},
			node: {
				options: {
					runType: 'client',
					config: 'tests/dojo.intern',
					reporters: ['console']
				}
			}
		}
	});

	grunt.registerTask('test', function (target) {
		if (!target || target === 'coverage' || target === 'pretty') {
			target = 'remote';
		}

		function addReporter(reporter) {
			var property = 'intern.' + target + '.options.reporters',
				value = grunt.config.get(property);

			if (value.indexOf(reporter) !== -1) {
				return;
			}

			value.push(reporter);
			grunt.config.set(property, value);
		}
		if (this.flags.coverage) {
			addReporter('lcovhtml');
		}

		if (this.flags.console) {
			addReporter('console');
		}

		if (this.flags.pretty) {
			addReporter('pretty');
		}

		grunt.task.run('intern:' + target);
	});
};
