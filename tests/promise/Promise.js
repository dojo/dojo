define([
	"doh",
	"dojo/Deferred"
], function(doh, Deferred){
	var tests = {
		"fail(…) is equivalent to then(null, …)": function(t){
			var obj = {};
			var thenResult, failResult;
			this.deferred.then(null, function(result){ thenResult = result; });
			this.deferred.promise.fail(function(result){ failResult = result; });
			this.deferred.reject(obj);
			t.t(failResult === obj);
			t.t(failResult === thenResult);
		},

		"always() will be invoked for resolution and rejection": function(t){
			var obj = {};
			var deferred1 = new Deferred();
			var thenResult, alwaysResult;
			deferred1.promise.then(function(result){ thenResult = result; });
			deferred1.promise.always(function(result){ alwaysResult = result; });
			deferred1.resolve(obj);
			t.t(alwaysResult === obj);
			t.t(alwaysResult === thenResult);

			var deferred2 = new Deferred();
			var thenResult2, alwaysResult2;
			deferred2.promise.then(null, function(result){ thenResult2 = result; });
			deferred2.promise.always(function(result){ alwaysResult2 = result; });
			deferred2.reject(obj);
			t.t(alwaysResult2 === obj);
			t.t(alwaysResult2 === thenResult2);
		},

		"trace() returns the same promise": function(t){
			var promise = this.deferred.promise.trace();
			t.t(promise === this.deferred.promise);
		},

		"traceRejected() returns the same promise": function(t){
			var promise = this.deferred.promise.traceRejected();
			t.t(promise === this.deferred.promise);
		}
	};

	var wrapped = [];
	for(var name in tests){
		wrapped.push({
			name: name,
			setUp: setUp,
			runTest: tests[name]
		});
	}

	function setUp(){
		this.deferred = new Deferred;
	}

	doh.register("tests.promise.Promise", wrapped);
});
