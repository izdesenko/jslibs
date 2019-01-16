const URL = require('url')
const mcache = require('memory-cache')

const Cache = module.exports = {
	middleware: ttl => async (req, res, next) => {
		let key = Cache.gen_key(req),
			store = Cache.get_store(req),
			data = await store.get(key)
		
		if(data) return res.send(data)
		
		res._original_send = res.send
		res.send = async function(body){
			await store.put(key, body, (ttl || 60 * 60) * 1000)
			return res._original_send(body)
		}
		next()
	},
	
	get_store: req => mcache, // database, redis ...
	
	gen_key: req => {
		let params = Object.assign({}, req.body, req.params, req.query)
		
		return URL.parse(req.originalUrl).pathname + Object
			.keys(params)
			.sort()
			.map(k => `${k}=${params[k]}`)
			.join(',')
	}
}
