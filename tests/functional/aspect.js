define([
	'require',
	'intern!object',
	'intern/chai!assert',
	'../support/ready'
], function (require, registerSuite, assert, ready) {
	/* global aspectOne, aspectTwo */
	
	registerSuite({
		name: 'dojo/aspect',

		before: function () {
			return ready(this.get('remote'), require.toUrl('./aspect.html'));
		},

		'multiple dojo version': function () {
			return this.get('remote')
				.setExecuteAsyncTimeout(100000)
				.executeAsync(function (send) {
					//empty function to aspect on
					document.onclick = function() {};
					
					var aspectAfterCount = 0;
					
					aspectOne.after(document, 'onclick', function() {
						aspectAfterCount++;
					});
					aspectTwo.after(document, 'onclick', function() {
						aspectAfterCount++;
					});
					aspectTwo.after(document, 'onclick', function() {
						aspectAfterCount++;
					});
	
					document.onclick();

					setTimeout(function () {
						send(aspectAfterCount);
					}, 100);
				})
				.then(function (result) {
					assert.equal(result, 3);
				})
			;
		}
	});
});
