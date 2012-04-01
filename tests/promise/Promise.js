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

		"both() will be invoked for resolution and rejection": function(t){
			var obj = {};
			var deferred1 = new Deferred();
			var thenResult, bothResult;
			deferred1.promise.then(function(result){ thenResult = result; });
			deferred1.promise.both(function(result){ bothResult = result; });
			deferred1.resolve(obj);
			t.t(bothResult === obj);
			t.t(bothResult === thenResult);

			var deferred2 = new Deferred();
			var thenResult2, bothResult2;
			deferred2.promise.then(null, function(result){ thenResult2 = result; });
			deferred2.promise.both(function(result){ bothResult2 = result; });
			deferred2.reject(obj);
			t.t(bothResult2 === obj);
			t.t(bothResult2 === thenResult2);
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
