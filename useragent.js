var request = require('request'),
	L = require('.'),
	merge = require('merge'),
	fs = require('fs');

/**
 * Свой UserAgent. Обёртка над request для упрощения основных запросов и приведения к промисам, вместо колбек-стайл.
 */
var UA = {
	obj_to_query: obj => Object
		.keys(obj || {})
		.map(p => encodeURIComponent(p)+'='+encodeURIComponent(obj[p]))
		.join('&'),
	
	json: (uri, options) => {
		options = options || {};
		options.json = true;
		return UA.get(uri, options);
	},
	
	jsonPost: (uri, data) => UA.post(uri, data, {json:true}),
	
	// request support only OAuth1.0
	oauth: (uri, oauth, data) => UA.post(uri, data, {oauth:oauth}),
	// so we need some additional OAuth 2.0, functionality
	oauth2json: (uri, token, options) => UA.get(uri, merge(options||{}, {
		json: true,
		headers: {Authorization:`OAuth ${token}`}
	})),
		
	oauth2post: (uri, token, options) => UA.post(uri, null, merge({
		headers: {
			Authorization: `OAuth ${token}`
		}
	}, options)),
	
	get: (uri, options) => {
		options = options || {};
		options.uri = uri;
		options.method = 'GET';
		return UA.r(options);
	},
	
	post: (uri, data, options) => {
		options = options || {};
		options.uri = uri;
		options.method = 'POST';
		// если передать пустую data - request не заменит Content-Type на urlencoded
		if(!data && !options.body && !options.form) data = {};
		options.form = options.form || data;
		return UA.r(options);
	},
	
	download: (from, folder, ext) => L
		.tempnam(folder, ext)
		.then(tmp_file => new Promise((resolve, reject) => {
			var handleError = err => {
					reject(err);
					stream.end(n => fs.unlink(tmp_file, n => {}));
				},
				stream = fs.createWriteStream(tmp_file);
			
			stream.on('finish', err => {
				if(err) handleError(err);
				else{
					stream.end();
					resolve(tmp_file);
				}
			});
			
			stream.on('error', handleError);
			
			request(from)
				.on('error', handleError)
				.pipe(stream);
		})),
	
	r: options => new Promise((resolve, reject) => {
		request(options, function(error, response, body) {
			if(error || response.statusCode != 200)
				return reject(error || response.statusMessage);
			
			resolve(options.json ? body : response);
		});
	})
};

module.exports = UA;

