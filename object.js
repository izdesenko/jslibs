module.exports = {
	isEmpty: obj => {
		if(!obj) return true;
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop)) return false;
		}
		try{
			return JSON.stringify(obj) === '{}' && true;
		}catch(ex) { // на случай непредвиденной JSON circular ... ошибки
			return false;
		}
	},
	bindLate: (obj, fn) => function() {
		return obj[fn].apply(obj, arguments);
	},
	unset: (obj, keys) => keys.forEach(k => delete obj[k]),
	className: obj => {
		if(typeof obj === 'undefined') return 'undefined';
		if(obj === null) return 'null';
		return obj.constructor.name
			|| Object.prototype.toString.call(obj).match(/^\[object\s(.*)]$/)[0];
	},
	
	values: function(source) {
		return Object.keys(source).map(k => source[k]);
	},
	
	eachPair: function(source, cb) {
		for(var i = 0, keys = Object.keys(source); i < keys.length; i++)
			source[keys[i]] = cb(keys[i], source[keys[i]]);
		return source;
	},
	
	filterAndProcessEachPair: function(source, cb) {
		var obj = {};
		for(var i = 0, keys = Object.keys(source); i < keys.length; i++) {
			var v = cb(keys[i], source[keys[i]]);
			if(typeof v !== 'undefined') obj[keys[i]] = v;
		}
		
		return obj;
	},
	
	slice: function(source, a, filter) {
		if(filter && typeof filter != 'function') return this.slice([].slice.call(arguments, 1));
		var data = {};
		a.forEach(key => {
			if(!filter||filter(key, this[key]))
				data[key] = this[key];
		});
		return data;
	}
};
