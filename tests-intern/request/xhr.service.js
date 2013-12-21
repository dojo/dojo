var qs = require('querystring'),
	promise = require('jsgi-node/promise');

function wait(delay) {
	//	summary:
	//		an identity function to delay the resolution
	//		of a promise
	return function (data) {
		var deferred = promise.defer();

		setTimeout(function () {
			deferred.resolve(data);
		}, delay);

		return deferred.promise;
	};
}

function xml(request) {
	return {
		status: 200,
		headers: {
			'Content-Type': 'application/xml'
		},
		body: [
			'<?xml version="1.0" encoding="UTF-8" ?>',
			'<foo><bar baz="thonk">blargh</bar><bar>blah</bar></foo>'
		]
	};
}

module.exports = function (request) {
	if (request.serviceURL.indexOf('/xml') > -1) {
		return xml(request);
	}

	if (request.data) {
		return request.data.then(function (data) {
			return {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				},
				body: [
					JSON.stringify(data)
				]
			};
		});
	}

	var deferred = promise.defer(),
		_promise = deferred.promise;

	function respond(data) {
		deferred.resolve({
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			},
			body: [
				JSON.stringify({
					method: request.method,
					query: request.query,
					headers: request.headers,
					payload: data || null
				})
			]
		});
	}

	var delay = request.query.delay;
	if (delay) {
		delay = parseInt(delay, 10);
		_promise = _promise.then(wait(delay));
	}

	if (request.method !== 'GET') {
		request.body.join().then(function (data) {
			respond(qs.parse(data));
		});
	}
	else {
		respond();
	}

	return _promise;
};
