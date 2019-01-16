const inspect = require('util').inspect

const Log = module.exports = {}

Object.assign(Log, {
	log: (data, msg, full) => {
		if(full) Log.dump(data, msg)
		else console.log(data, msg || 'LOGRETURN')
		return data
	},
	dump: (data, msg) => {
		console.log(inspect(data, false, null), msg || 'DUMPRETURN')
		return data
	},

	sql: (sql, msg) => Log
		.log(sql
			.toString()
			.replace(/[\s\n]+/g, ' '), msg || 'SQL'),
	
	die: function(){
		console.log.apply(console, arguments.length ? arguments : ['Died'])
		process.exit()
	},
	
	logdie: caption => Log.die.bind(Log, caption || 'Die log: '),
	rethrow: err => {
		console.log(err, 'LOGRETHROW')
		throw err
	}
})
