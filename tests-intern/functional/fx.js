/* globals fx, on, domGeometry, domClass, baseFx, aspect, createAnimationList */
define([
	'require',
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!leadfoot/helpers/pollUntil'
], function (require, registerSuite, assert, pollUntil) {
	var FX_URL = './support/fx.html';

	function getPage(context, url) {
		return context.get('remote')
			.setExecuteAsyncTimeout(5000)
			.get(require.toUrl(url))
			.then(pollUntil('return ready;'));
	}

	function applyCompressClass(context) {
		return context
			.execute(function () {
				domClass.add('foo', 'compressed');
				return domGeometry.position('foo');
			})
			.then(function (results) {
				assert.isTrue(results.h < 10);
			});
	}

	registerSuite({
		name: 'dojo/fx',

		'.slideTo': function () {
			return getPage(this, FX_URL)
				.executeAsync(function (done) {
					var anim = fx.slideTo({
						node: 'foo',
						duration: 500,
						left: 500,
						top: 50
					}).play();

					on(anim, 'End', function () {
						done(domGeometry.getMarginBox('foo'));
					});
				}).then(function (results) {
					assert.equal(results.t, 50);
					assert.equal(results.l, 500);
				});
		},

		'.wipeOut': {
			'.play': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var anim = fx.wipeOut({
							node: 'foo'
						}).play();

						on(anim, 'End', function () {
							done(domGeometry.position('foo'));
						});
					}).then(function (results) {
						assert.isTrue(results.w < 5);
					});
			},

			'onStop': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var anim = fx.wipeOut({
							node: 'foo',
							duration: 1000
						});

						aspect.after(anim, 'onStop', function () {
							done(true);
						}, true);
						anim.play();
						setTimeout(function () {
							anim.stop();
						}, 100);
					})
					.then(function (results) {
						assert.isTrue(results);
					});
			}
		},

		'.wipeIn': {
			'.play': function () {
				return applyCompressClass(getPage(this, FX_URL))
					.executeAsync(function (done) {
						var anim = fx.wipeIn({
							node: 'foo'
						}).play();

						on(anim, 'End', function () {
							done(domGeometry.position('foo'));
						});
					}).then(function (results) {
						assert.isTrue(results.h > 10);
					});
			},

			'onStop': function () {
				return applyCompressClass(getPage(this, FX_URL))
					.executeAsync(function (done) {
						var anim = fx.wipeIn({
							node: 'foo',
							duration: 1000
						});

						aspect.after(anim, 'onStop', function () {
							done(true);
						}, true);
						anim.play();
						setTimeout(function () {
							anim.stop();
						}, 100);
					})
					.then(function (results) {
						assert.isTrue(results);
					});
			}
		},

		'.chain': {
			'onEnd both children animations are stopped': function () {
				return applyCompressClass(getPage(this, FX_URL))
					.executeAsync(function (done) {
						var wipeInAnim = fx.wipeIn({
							node: 'foo',
							duration: 500
						});
						var fadeOutAnim = baseFx.fadeOut({
							node: 'foo',
							duration: 500
						});
						var anim = fx.chain([wipeInAnim, fadeOutAnim]);

						on(anim, 'End', function () {
							done({
								status: {
									wipeIn: wipeInAnim.status(),
									fadeOut: fadeOutAnim.status(),
									anim: anim.status()
								}
							});
						});

						anim.play();
					})
					.then(function (results) {
						assert.equal(results.status.wipeIn, 'stopped');
						assert.equal(results.status.fadeOut, 'stopped');
						assert.equal(results.status.anim, 'stopped');
					});
			},

			'delay': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var anim = fx.chain(createAnimationList());
						var timer;

						aspect.after(anim, 'onEnd', function () {
							done({
								expected: anim.duration,
								actual: Date.now() - timer
							});
						}, true);

						timer = Date.now();
						anim.play();
					}).then(function (results) {
						assert.isTrue(results.actual > 100);
						assert.closeTo(results.actual, results.actual, 100);
					});
			},

			'onEnd is called': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var fadeOutAnim = baseFx.fadeOut({ node: 'foo2', duration: 400 });
						var fadeInAnim = baseFx.fadeIn({ node: 'foo2', duration: 400 });
						var anim = fx.chain([fadeOutAnim, fadeInAnim]);
						aspect.after(anim, 'onEnd', function () {
							done();
						}, true);
						anim.play();
					});
			},

			'onPlay is called': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var fadeOutAnim = baseFx.fadeOut({ node: 'foo2', duration: 400 });
						var fadeInAnim = baseFx.fadeIn({ node: 'foo2', duration: 400 });
						var anim = fx.chain([fadeOutAnim, fadeInAnim]);
						aspect.after(anim, 'onPlay', function () {
							done();
						}, true);
						anim.play();
					});
			},

			'chain multiple combine animations': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						// test chaining two combined() animations
						var anim1 = fx.combine([
							baseFx.fadeIn({ node: 'chained' }),
							baseFx.fadeOut({ node: 'chainedtoo' })
						]);
						var anim2 = fx.combine([
							baseFx.fadeOut({ node: 'chained' }),
							baseFx.fadeIn({ node: 'chainedtoo' })
						]);

						var anim = fx.chain([anim1, anim2]);

						aspect.after(anim, 'onEnd', function () {
							done(true);
						}, true);
						anim.play();
					})
					.then(function (results) {
						assert.isTrue(results);
					});
			}
		},


		'.combine': {
			'test basic functionality': function () {
				return applyCompressClass(getPage(this, FX_URL))
					.executeAsync(function (done) {
						var wipeInAnim = fx.wipeIn({
							node: 'foo',
							duration: 500
						});
						var fadeInAnim = baseFx.fadeIn({
							node: 'foo',
							duration: 1000
						});
						var anim = fx.combine([wipeInAnim, fadeInAnim]);

						aspect.after(anim, 'onEnd', function () {
							done({
								status: {
									wipeIn: wipeInAnim.status(),
									fadeIn: fadeInAnim.status(),
									combine: anim.status()
								}
							});
						}, true);

						anim.play();
					})
					.then(function (results) {
						assert.equal(results.status.wipeIn, 'stopped');
						assert.equal(results.status.fadeIn, 'stopped');
						assert.equal(results.status.combine, 'stopped');
					});
			},

			'beforeBegin is called': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var fadeOutAnim = baseFx.fadeOut({ node: 'foo2', duration: 400 });
						var fadeInAnum = baseFx.fadeIn({ node: 'foo2', duration: 400 });
						var anim = fx.combine([fadeOutAnim, fadeInAnum]);

						aspect.after(anim, 'beforeBegin', function () {
							done(true);
						}, true);
						anim.play();
					})
					.then(function (results) {
						assert.isTrue(results);
					});
			},

			'delay': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var anim = fx.combine(createAnimationList());
						var timer;

						aspect.after(anim, 'onEnd', function () {
							done({
								expected: anim.duration,
								actual: Date.now() - timer
							});
						}, true);

						timer = Date.now();
						anim.play();
					})
					.then(function (results) {
						assert.isTrue(results.actual > 100);
						assert.closeTo(results.actual, results.actual, 100);
					});
			},

			'onEnd is called': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var fadeOutAnim = baseFx.fadeOut({ node: 'foo2', duration: 400 });
						var fadeInAnim = baseFx.fadeIn({ node: 'foo2', duration: 400 });
						var anim = fx.combine([fadeOutAnim, fadeInAnim]);
						aspect.after(anim, 'onEnd', function () {
							done();
						}, true);
						anim.play();
					});
			},

			'onPlay is called': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var fadeOutAnim = baseFx.fadeOut({ node: 'foo2', duration: 400 });
						var fadeInAnim = baseFx.fadeIn({ node: 'foo2', duration: 400 });
						var anim = fx.combine([fadeOutAnim, fadeInAnim]);
						aspect.after(anim, 'onPlay', function () {
							done();
						}, true);
						anim.play();
					});
			},

			'combining chains': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						// test combining two chained() animations
						var anim1 = fx.chain([
							baseFx.fadeIn({ node: 'chained' }),
							baseFx.fadeOut({ node: 'chained' })
						]);
						var anim2 = fx.chain([
							baseFx.fadeOut({ node: 'chainedtoo' }),
							baseFx.fadeIn({ node: 'chainedtoo' })
						]);
						var anim = fx.combine([anim1, anim2]);

						aspect.after(anim, 'onEnd', function () {
							done(true);
						}, true);
						anim.play();
					})
					.then(function (results) {
						assert.isTrue(results);
					});
			}
		},

		'.stop': {
			'delay': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var anim = baseFx.fadeOut({ node: 'foo2', delay: 400 });
						aspect.after(anim, 'onPlay', function () {
							done(false);
						}, true);
						anim.play();
						anim.stop();
						setTimeout(function(){
							done(true);
						}, 500);
					})
					.then(function (results) {
						assert.isTrue(results);
					});
			},

			'delay passed to play': function () {
				return getPage(this, FX_URL)
					.executeAsync(function (done) {
						var anim = baseFx.fadeOut({ node: 'foo2' });

						aspect.after(anim, 'onPlay', function () {
							done(false);
						}, true);
						anim.play(400);
						anim.stop();
						setTimeout(function(){
							done(true);
						}, 600);
					})
					.then(function (results) {
						assert.isTrue(results);
					});
			}
		}
	});
});
