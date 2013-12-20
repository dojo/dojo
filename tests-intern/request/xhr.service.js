var qs = require('querystring'),
	promise = require('jsgi-node/promise'),
	nodeWrapper = require('jsgi-node/jsgi/node').Node,
	formidable = require('formidable');

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

function multipart(request) {
	var parser = new formidable.IncomingForm(),
		deferred = promise.defer();

	nodeWrapper(function (request) {
		parser.parse(request, function (err, fields, files) {
			if (err) {
				deferred.reject(err);
			}
			var incoming = {};
			deferred.resolve({
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				},
				body: [
					JSON.stringify(fields)
				]
			});
		});
	})(request);

	return deferred.promise;
}

module.exports = function (request) {
	if (request.serviceURL.indexOf('/xml') > -1) {
		return xml(request);
	}

	if (request.serviceURL.indexOf('/multipart') > -1) {
		return multipart(request);
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
		var data = '';
		request.body.forEach(function (chunk) {
			data += chunk;
		}).then(function () {
			respond(qs.parse(data));
		});
	}
	else {
		respond();
	}

	return _promise;
};
