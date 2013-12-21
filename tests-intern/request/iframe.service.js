var promise = require('jsgi-node/promise'),
	qs = require('querystring'),
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

function xml() {
	return {
		status: 200,
		headers: {
			'Content-Type': 'text/xml'
		},
		body: [
			'<?xml version="1.0" encoding="UTF-8"?>\n',
			'<Envelope title="Test of dojo.io.iframe xml test">\n',
				'<Children>\n',
					'<child>FOO</child>\n',
					'<child>BAR</child>\n',
					'<child>BAZ</child>\n',
					'<child>BAT</child>\n',
				'</Children>\n',
				'<![CDATA[\n',
					'function(){\n',
						'for(var i=0; i<somethign; i++){\n',
							'if(foo>bar){ /* whatever */ }\n',
						'}\n',
					'}\n',
				']]>\n',
				'<a href="something">something else</a>\n',
			'</Envelope>'
		]
	};
}

function html(data) {
	return {
		status: 200,
		headers: {
			'Content-Type': 'text/html'
		},
		body: [
			'<html>',
			'<head></head>',
			'<body>',
			data,
			'</body>',
			'</html>'
		]
	};
}

function textarea(data) {
	return '<textarea style="width:100%; height: 100px;">' + data + '</textarea>';
}

function multipart(request) {
	var parser = new formidable.IncomingForm(),
		deferred = promise.defer();

	nodeWrapper(function (request) {
		parser.parse(request, function (err, fields, files) {
			if (err) {
				deferred.reject(err);
			}
			deferred.resolve(fields);
		});
	})(request);

	return deferred.promise;
}

module.exports = function (request) {
	var deferred = promise.defer(),
		_promise = deferred.promise;

	function respond(data) {
		if (request.query.type === 'html') {
			data = '<h1>SUCCESSFUL HTML response</h1>';
		}
		else {
			if (request.query.type === 'json') {
				data = JSON.stringify({
					method: request.method,
					query: request.query,
					payload: data
				});
			}
			else if (request.query.type === 'javascript') {
				data = 'window.iframeTestingFunction = function(){ return 42; };';
			}
			else if (request.query.text) {
				data = request.query.text;
			}
			else {
				data = 'iframe succeeded';
			}
			data = textarea(data);
		}
		deferred.resolve(
			html(data)
		);
		return _promise;
	}

	var delay = request.query.delay;
	if (delay) {
		delay = parseInt(delay, 10);
		_promise = _promise.then(wait(delay));
	}

	if (request.query.type === 'xml') {
		deferred.resolve(xml());
		return _promise;
	}

	if (request.data) {
		return request.data.then(respond);
	}

	if (request.method !== 'GET') {
		return request.body.join().then(function (data) {
			data = qs.parse(data);
			if (!delay) {
				delay = data.delay;
				if (delay) {
					delay = parseInt(delay, 10);
					_promise = _promise.then(wait(delay));
				}
			}
			return respond(data);
		});
	}

	return respond();
};
