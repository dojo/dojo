// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.
define({
	// The port on which the instrumenting proxy will listen
	proxyPort: 9000,

	// A fully qualified URL to the Intern proxy
	proxyUrl: 'http://localhost:9001/',

	// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
	// specified browser environments in the `environments` array below as well. See
	// https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
	// https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
	// Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
	// automatically
	capabilities: {
		'selenium-version': '2.41.0',
		'record-screenshots': false,
		'sauce-advisor': false,
		'video-upload-on-pass': false,
		'max-duration': 300
	},

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [
		{ browserName: 'internet explorer', version: '11', platform: 'Windows 8.1', 'prerun': 'http://localhost:9001/tests-intern/support/prerun.bat' },
		{ browserName: 'internet explorer', version: '10', platform: 'Windows 8', 'prerun': 'http://localhost:9001/tests-intern/support/prerun.bat' },
		{ browserName: 'internet explorer', version: [ '8', '9', '10' ], platform: 'Windows 7', 'prerun': 'http://localhost:9001/tests-intern/support/prerun.bat' },
		// { browserName: 'internet explorer', version: [ '6', '7', '8' ], platform: 'Windows XP', 'iedriver-version': '2.41.0', 'prerun': 'http://localhost:9001/tests-intern/support/prerun.bat' },
		{ browserName: 'firefox', version: '', platform: [ 'OS X 10.9', 'Windows 7', 'Windows XP', 'Linux' ] },
		{ browserName: 'chrome', version: '', platform: [ 'Linux', 'OS X 10.8', /* TODO: SauceLabs is giving an Unknown command 'WaitForAllTabsToStopLoading' on 'OS X 10.9',*/ 'Windows XP', 'Windows 7', 'Windows 8', 'Windows 8.1' ] },
		{ browserName: 'safari', version: '6', platform: 'OS X 10.8' }/*,
		TODO: SauceLabs is having problems with the proxy { browserName: 'safari', version: '7', platform: 'OS X 10.9' }*/
	],

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 3,
	tunnel: 'SauceLabsTunnel',

	// Configuration options for the module loader; any AMD configuration options supported by the specified AMD loader
	// can be used here
	loader: {
		packages: [
			// Placeholder for the base directory -- we need something different from the dojo-under-test package name
			// to use for loading tests
			{ name: 'base', location: '.' },
			// The dojo-under-test
			{ name: 'dojo-testing', location: '.' },
			// The dojo used for writing tests
			{ name: 'dojo', location: 'node_modules/dojo' },
			{ name: 'sinon', location: 'node_modules/sinon/lib', main: 'sinon'}
		],
		map: {
			// Any dojo modules loaded by dojo-under-test modules should come from the dojo-under-test, not the dojo
			// used for writing tests
			'dojo-testing': {
				'dojo': 'dojo-testing'
			}
		}
	},

	// Non-functional test suite(s) to run in each browser
	suites: [ 'base/tests-intern/unit/all' ],

	// Functional test suite(s) to run in each browser once non-functional tests are completed
	functionalSuites: [ 'base/tests-intern/functional/all' ],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: /^(?:node_modules|tests-intern|tests)\//
});
