var T = {
	isString: obj => typeof obj == 'string' || obj instanceof String,
	isNumber: obj => !isNaN(parseFloat(obj)),
	isScalar: obj => T.isString(obj) || T.isNumber(obj),
	isArray: obj => Array.isArray(obj),
	isObject: obj => obj !== null && typeof obj === 'object',
	isPrimitive: obj => obj === null || ['number', 'string', 'boolean', 'undefined'].indexOf(typeof obj) > -1
};
module.exports = T;
