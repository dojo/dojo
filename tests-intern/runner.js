#!/usr/bin/env node
var path = require('path'),
	services = require('./services');

process.chdir(path.resolve(__dirname, '..'));

services.start(9001, function (server) {
	var configRE = /^config=/;
	if (!process.argv.some(function (arg) {
		return configRE.test(arg);
	})) {
		process.argv.push('config=tests-intern/intern');
	}
	require('intern-geezer/runner');

	global.require(['intern/node_modules/dojo/topic'], function (topic) {
		topic.subscribe('/runner/end', function () {
			server.close();
		});
	});
});
