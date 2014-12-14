/* global xdomainExecSequence */
xdomainExecSequence.push('local1-dep-1');
var x1 = dojo.provide('dojo.tests-intern._base.loader.xdomain.local1-dep');
dojo.getObject('dojo.tests-intern._base.loader.xdomain.local1-dep').status =
	'dojo.tests-intern._base.loader.xdomain.local1-dep-ok';
xdomainExecSequence.push('local1-dep-2');
