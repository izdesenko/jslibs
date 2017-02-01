var S = {
	ucfirst: function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	},
	sanify: function(str) {
		return str
			.replace(/[^\s0-9a-zA-Zа-яА-ЯёЁ"«»…—,–.;:_=+!?()%¹²³‰$¢≠€®™„“£¥₴°&§≈×©-]/gi, ' ')
			.replace(/\s+/g, ' ')
			.replace(/^\s|\s$/g, '');
	},
	escapeJSON: function(str) {
		return str
			.replace(/\n/g, '\\n')
			.replace(/'/g, "\\'")
			.replace(/"/g, '\\"')
			.replace(/&/g, '\\&')
			.replace(/\r/g, '\\r')
			.replace(/\t/g, '\\t')
			.replace(/\f/g, '\\f')
			.replace(/(\b)/g, '\\$1');
	},
	strip_tags: function(str) {
		return str
			.replace(/<[^>]+>/gi, ' ')
			.replace(/\s+/, ' ');
	},
	
	random_char: n => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random()*62)),
	
	random_string: length => Array
		.apply(0, Array(length))
		.map(n => S.random_char()).join('')
};

module.exports = S;
