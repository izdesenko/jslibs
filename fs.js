var fs = require('fs'),
	tmp = require('tmp'),
	goPromise = require('./promise'),
	libstr = require('./string'),
	FS = {};

FS.streamread = (path, cb) => {
	var stream = fs.createReadStream(path);
	
	stream.on('data', cb);
	return new Promise((resolve, reject) => {
		stream.on('end', n => resolve(1));
		stream.on('error', err => reject(err));
	});
};

FS.linebyline = (path_or_buffer, linecb) => {
	var text = '',
		cb = lines => {
			text += lines;
			
			var index;
			while((index = text.indexOf('\n')) > -1) {
				var line = text.substring(0, index).replace(/\r$/, '');
				text = text.substring(index+1);
				if(!line) continue;
				linecb(line);
			}
		};
	
	if(path_or_buffer instanceof Buffer) return Promise.resolve(cb(path_or_buffer+''));
	return FS.streamread(path_or_buffer, cb);
};

FS.parseCSV = (path, sep, cb) => {
	sep = sep || ',';
	var head, data = [],
		callback = line => {
			var d = line.split(sep);
			
			if(head) {
				var h = {};
				head.forEach((v, i) => h[v] = d[i]);
				if(cb) h = cb(h);
				data.push(h);
			}else{
				head = d.map(s => s.trim());
			}
		};
	
	return FS
		.linebyline(path, callback)
		.then(n => data);
};

FS.simpleCSV = (path, sep, cb) => {
	sep = sep || ',';
	var data = [],
		callback = line => {
			var d = line.split(sep);
			if(cb) d = cb(d);
			if(d) data.push(d);
		};
	
	return FS
		.linebyline(path, callback)
		.then(n => data);
};

FS.tempnam = (folder, ext) => 
	goPromise(tmp, 'tmpName', {dir:folder, prefix:libstr.random_char(), postfix:ext})
	.then(file => goPromise(fs, 'stat', file)
		.then(n => FS.tempnam(folder, ext)) // Рекурсивный вызов, на случай, если такой файл уже есть.
		.catch(err => file));


FS.rename = (from, to) => goPromise(fs, 'rename', from, to);

module.exports = FS;

