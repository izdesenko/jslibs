var Lib = {};

module.exports = Lib;

Lib.error = (error, code) => {
	var details, e;
	if(error instanceof Error) e = error;
	else if(error instanceof Array) details = {error:error};
	else if(error instanceof Object) {
		details = error;
		error = 'error';
	}
	e = e || new Error(error);
	e.status = e.status || code;
	e.details = details;
	return e;
};

Lib.random_int = max => Math.floor(Math.random()*max);

Lib.translit = (function() {
	var L = {
			А: 'a', а: 'a', Б: 'b', б: 'b', В: 'v', в: 'v', Г: 'g', г: 'g',
			Д: 'd', д: 'd', Е: 'e', е: 'e', Ё: 'yo', ё: 'yo', Ж: 'zh', ж: 'zh',
			З: 'z', з: 'z', И: 'i', и: 'i', Й: 'y', й: 'y', К: 'k', к: 'k',
			Л: 'l', л: 'l', М: 'm', м: 'm', Н: 'n', н: 'n', О: 'o', о: 'o',
			П: 'p', п: 'p', Р: 'r', р: 'r', С: 's', с: 's', Т: 't', т: 't',
			У: 'u', у: 'u', Ф: 'f', ф: 'f', Х: 'kh', х: 'kh', Ц: 'ts', ц: 'ts',
			Ч: 'ch', ч: 'ch', Ш: 'sh', ш: 'sh', Щ: 'sch', щ: 'sch', Ъ: '', ъ: '',
			Ы: 'y', ы: 'y', Ь: '', ь: '', Э: 'e', э: 'e', Ю: 'yu', ю: 'yu',
			Я: 'ya', я: 'ya'
		},
		r = '';
	
	Object.keys(L).forEach(k => r += k);
	r = new RegExp(`[${r}]`, 'g');
	return source => source
		.toLowerCase()
		.replace(r, a => L[a] || '');
})();

Lib.timestamp = n => Date.now();

Lib.shellrun = command => Lib
	.goPromise(require('child_process'), 'exec', command, {maxBuffer:3 * 1024 * 1024})
	.then(data => data[0]);

var debugLib = require('debug');
debugLib.formatArgs = function formatArgs() {
	var args = arguments,
		useColors = this.useColors,
		name = this.namespace;
	
	if(useColors) {
		var c = this.color;
		args[0] = `\u001b[3${c};1m${name} \u001b[0m${args[0]}\u001b[3${c}m +${debugLib.humanize(this.diff)}\u001b[0m`;
	}else{
		args[0] = `[${new Date().toUTCString()}] ${name} ${args[0]}`;
	}
	return args;
};

Lib.logname = filename => filename.replace(process.cwd(), 'PROJECT').replace(/\//g, ':');
Lib.log = file => function(first) {
	debugLib(Lib.logname(file)).apply(null, arguments);
	return first;
};

Lib.types = require('./types');
Lib.obj = require('./object');
Lib.string = require('./string');
Lib.array = require('./array');
Lib.goPromise = require('./promise');
Lib.fs = require('./fs');
Lib.Imap = require('./imap');
