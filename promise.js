Object.defineProperties(Promise, {
	delay: {
		enumerable: false,
		value: (timeout, cb) => new Promise((resolve, reject) => setTimeout(n => resolve(cb && cb()), timeout))
	}
});

module.exports = function(obj, func) {
	return new Promise((resolve, reject) => {
		var params = Array.prototype.slice.call(arguments, 2);

		params.push(function(err, result) {
			if(err) {
				reject(err);
			}else{
				resolve(arguments.length > 2 ? Array.prototype.slice.call(arguments, 1) : result);
			}
		});

		obj[func].apply(obj, params);
	});
};
