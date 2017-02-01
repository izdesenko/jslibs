var atob = require('atob'),
	obj = require('./object'),
	merge = require('merge'),
	error = require('.').error,
	Socket = require('tls').TLSSocket;

function Imap(conf) {
	this.conf = conf;
	this.client = new Socket();
	this.last_message = '';
	this.mailbox = {};
	this.log = '';
	this.last_command = '';
	this.bindEvents();
}

// Создаём новый промис на каждое действие, при обработке событий
// от Socket'а - сдерживаем промис, выполняем след.действие
// TODO функционал манипуляции с промисами надо вынести в отдельный модуль.
Imap.prototype.prepareNextStep = function() {
	return this.promise = new Promise((resolve, reject) => {
		this._rslv = resolve;
		this._rjct = reject;
	});
};

Imap.prototype.resolve = function(data) {
	this.message = data;
	return obj.bindLate(this, '_resolve')();
};
Imap.prototype._resolve = function() {
	return this._rslv(this.message);
};
Imap.prototype.reject = function(err) {
	if(this.promise) return obj.bindLate(this, '_reject')(err);
};
Imap.prototype._reject = function(err) {
	return this._rjct(err);
};

Imap.prototype.connect = function() {
	if(!this.client.connected) {
		this.client.connect(this.conf.port || 993, this.conf.host);
		return this
			.prepareNextStep()
			.then(n => this.client.connected = true);
	}
	return Promise.resolve(1);
};

Imap.prototype.login = function() {
	if(!this.mailbox.authorized) {
		return this
			.command('login', this.conf.username, this.conf.pass)
			.then(n => this.mailbox.authorized = true);
	}else{
		return Promise.resolve('auth');
	}
};

Imap.prototype.selectMailbox = function(name) {
	name = name || this.conf.name;
	if(this.mailbox.name != name) {
		this.mailbox.name = name;
		this.mailbox.uids = null;
		return this.command('select', name);
	}else{
		return Promise.resolve(this);
	}
};

Imap.prototype.parseMailboxInfo = function() {
	this.mailbox.last_uid = this.message.match(/ (\d+) EXISTS/)[1];
	return Promise.resolve(1);
};

// не везде поддерживается :((
Imap.prototype.sort = function() {
	return this
		.command('SORT (DATE) UTF-8 ALL')
		.then(n => this);
};

Imap.prototype.searchAllUIDs = function() {
	if(!this.mailbox.uids) return this
		.command('UID SEARCH ALL')
		.then(n => this.parseUIDS());
};

Imap.prototype.parseUIDS = function() {
	this.mailbox.uids = this.message.split(' ').filter(u => /^\d+$/.test(u));
	return Promise.resolve(this);
};

Imap.prototype.fetchFromEnd = function() {
	if(!this.mailbox.uids || !this.mailbox.uids.length) {
		return this
			.logout()
			.then(n => {
				this.client.emit('close', 'exhausted');
				return Promise.reject(error('exhausted', 204));
			});
	}
	return this
		.command('uid fetch', this.mailbox.uids.pop(), 'BODY.PEEK[]');
};

Imap.prototype.fetchFromBegin = function() {
	if(!this.mailbox.uids || !this.mailbox.uids.length) {
		return this
			.logout()
			.then(n => {
				this.client.emit('close', 'exhausted');
				return Promise.reject(error('exhausted', 204));
			});
	}
	return this.command('fetch', parseInt(this.mailbox.uids.shift()), 'BODY.PEEK[]');
};

Imap.prototype.parseMessage = function(msg) {
	if(msg === undefined) {
		msg = this.message.substr(this.message.indexOf('\r\n')+2);
	}
	var _hpos = msg.indexOf('\r\n\r\n'),
		hpos = _hpos > -1 ? _hpos : msg.length, // если нет разделителя header\r\n\r\nbody - значит, всё сообщение - header
		head = msg.substr(0, hpos),
		body = msg.substr(hpos + 4),
		headers = {},
		data = {};
	
	head
		.replace(/\r\n\s+/g, ' ')
		.split(/\r\n/)
		.forEach(h => {
			var hp = h.trim().split(/:\s*/);
			if(hp.length) headers[hp.shift().toLowerCase()] = hp.join(':');
		});
	
	data.headers = headers;
	
	var disp = this.parseContentDisposition(headers['content-disposition']);
	if(disp) {
		data.attachments = data.attachments || [];
		disp.content = this.decodeAttachment(body.trim(), disp);
		data.attachments.push(disp);
	}
	
	var ctype = this.parseContentType(headers['content-type']);
	if(ctype.multipart) {
		return Promise
			.all(body
				.split(ctype.boundary)
				.slice(1, -1)
				.map(part => this.parseMessage(part)
					.then(one => {
						data = merge(data, one || {});
						return data;
					})))
			.then(n => data);
	}else if(ctype.text) {
		data.body = data.body || {};
		data.body.text = data.body.text || {};
		data.body.text[ctype.subtype] = body;
	}
	return Promise.resolve(data);
};

Imap.prototype.logout = function() {
	return this.command('logout');
};

Imap.prototype.lastPromise = function() { return obj.bindLate(this, 'getPromise')(); };
Imap.prototype.getPromise = function() { return this.promise; };

Imap.prototype.command = function(c) {
	this.last_command = c;
	var args = [].slice.call(arguments);
	args[0] = '';
	this.last_message = '';
	this.client.write(`? ${c.toUpperCase()}${args.join(' ')}\r\n`);
	return this.prepareNextStep();
};

Imap.prototype.bindEvents = function() {
	var msg = '';
	this.client.on('connect', n => {
		this.connected = true;
		this.resolve('connect');
	});
	this.client.on('data', data => {
		data += '';
		this.log += data;
		if(/completed/i.test(data)) {
			this.resolve(msg);
			msg = '';
		}else{
			msg += data.trim();
		}
		if(/bad command/i.test(data)) this.client.emit('error', data+'');
	});
	this.client.on('error', err => this.reject(err));
	this.client.on('close', err => {
		this.connected = false;
		if(err) this.reject(err);
		else this.resolve('close');
	});
	this.client.on('timeout', n => this.reject('Timeout'));
};

Imap.prototype.decodeAttachment = function(raw) {
	return new Buffer(decodeURIComponent(escape(atob(raw))));
};

Imap.prototype.parseContentType = function(string) {
	string = (string || '').trim();
	if(!string) return {};
	var ctype = {},
		parts = string.match(/(\w+)\/([\w-]+)(;\s*(\w+)="?([\w\d/-]+)"?)?$/);
	
	ctype[parts[1]] = true;
	ctype[parts[2]] = true;
	ctype.type = parts[1];
	ctype.subtype = parts[2];
	ctype[parts[4]] = parts[4] == 'boundary' ? new RegExp(`[\r\n-]*${parts[5]}[\r\n]*`) : parts[5];
	
	return ctype;
};

Imap.prototype.parseContentDisposition = function(string) {
	string = (string || '').trim();
	if(!string) return;
	var disp = {};
	var parts = string.match(/(\w+)(; (.*))?/);
	disp[parts[1]] = true;
	parts[3].split(/;\s*/).forEach(at => {
		var kv = at.match(/(\w+)="?([\w+\d+?=-]+)"?/);
		disp[kv[1]] = kv[2];
	});
	
	if(disp.filename) disp.filename = this.mime_decode(disp.filename);
	
	return disp;
};

Imap.prototype.mime_decode = function(string) {
	var m = string.match(/=\?([^ ?]+)\?([BQbq])\?([^ ?]+)\?=/);
	return atob(m[3]);
};

module.exports = Imap;

