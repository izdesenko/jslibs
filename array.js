var types = require('./types');

module.exports = {
	// Диапазон целых от start до end
	range: (start, end, cb) => Array(end - start).fill().map((n, i) => cb ? cb(start+i) : start+i),
	
	// Возвращает переданный аргумент если это массив, иначе приводит к массиву если не пустой.
	one_for_all: one => typeof one === 'undefined' || types.isArray(one) ? one : [one],
	
	// Последовательно подмешивает (вставляет примерно на одинаковом расстоянии) в первый переданный массив
	// элементы последующих параметров-массивов. Применив к ним коллбек, если он передан последним.
	mixin: function mixin() {
		var r=[], a=[].slice.call(arguments, 0),
			cb = typeof a[a.length - 1] == 'function' ? a.pop() : n => n,
			push = list => {
				if(list.length) {
					r.push(cb(list.shift()));
				}
			};

		if(a[2]) {
			return mixin(mixin.apply(null, a.slice(0, a.length-1), cb), a.pop(), cb);
		}else{
			var cff = Math.ceil(a[0].length / (a[1].length || 1)),
				t = 0;
			while(a.find(i => i.length)) {
				if(!t--) {
					push(a[1]);
					t = cff;
				}else{
					push(a[0]);
				}
			}
			return r;
		}
	},
	/* perl qw analogue */
	qw: str => (str || '').split(/ /),
	
	sum: function(source) {
		return source.reduce((a, b) => a+b, 0);
	},
	
	random_slice: function(source, num) {
		return source
			.sort(n => 0.5 - Math.random())
			.slice(0, num);
	},
	
	random_in_range: function(source, start, end) {
		end = end || source.length;
		var left = start + Math.floor(Math.random() * (end - start) / 2),
			right = left + Math.floor(Math.random() * (end - left));
		right = right == left ? end : right;
		return source.slice(left, right);
	},
	
	aggregate: function(source, cb, initial) {
		initial = initial || {};
		return source.reduce((a, b)=>cb(a, b), initial);
	},
	shuffle: function(source) {
		for(var i = source.length; i; i -= 1) {
			var j = Math.floor(Math.random() * i),
				x = source[i - 1];
			source[i - 1] = source[j];
			source[j] = x;
		}
		return source;
	},
	between: function(source, min, max) {
		return source.length >= min && this.length <= max;
	}
};
