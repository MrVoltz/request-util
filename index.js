var request = require("request-promise"),
	requestErrors = require('request-promise/errors'),
	origRequest = require("request"),
	_ = require("underscore"),
	fs = require("fs"),
	net = require("net"),
	Promise = require("bluebird"),
	iconv = require("iconv-lite"),
	cheerio = require("cheerio"),
	path = require("path");

Promise.promisifyAll(fs);

var RequestUtil = module.exports = {
	StatusCodeError: requestErrors.StatusCodeError,
	Errors: requestErrors,

	defaultOptions: {},

	request: function(options) {
		if(_.isString(options))
			options = { url: options };

		var iconvEncoding = options.encoding;

		options = _.extend({}, RequestUtil.defaultOptions, {
			timeout: 10000,
			maxRedirects: 10
		}, options, {
			encoding: iconvEncoding ? null : "utf8"
		});

		return request(options).then(function(body) {
			var res;
			if(options.resolveWithFullResponse) {
				res = body;
				body = res.body;
			}

			if(iconvEncoding)
				body = iconv.decode(body, iconvEncoding);
			if(options.cheerio)
				body = cheerio.load(body);

			if(options.resolveWithFullResponse)
				return [ res, body ];
			else
				return body;
		});
	},
	downloadFile: function(options, outputFile) {
		if(_.isString(options))
			options = { url: options };

		options = _.extend({}, RequestUtil.defaultOptions, {
			timeout: 10000
		}, options);

		return new Promise(function(resolve, reject) {
			function handleError(err) {
				fs.unlink(outputFile, function(err2) {
					reject(err);
				});
			}

			origRequest(options)
				.on("error", handleError)
				.pipe(fs.createWriteStream(outputFile))
				.on("error", handleError)
				.on("close", resolve);
		});
	},

	requestCheerio: function(options) {
		if(_.isString(options))
			options = { url: options };

		options = _.extend({
			cheerio: true
		}, options);

		return RequestUtil.request(options);
	},
	getCheerio: function(options) {
		if(_.isString(options))
			options = { url: options };

		options = _.extend({
			cheerio: true,
			method: "GET"
		}, options);

		return RequestUtil.request(options);
	},
	postCheerio: function(options) {
		if(_.isString(options))
			options = { url: options };

		options = _.extend({
			cheerio: true,
			method: "POST"
		}, options);

		return RequestUtil.request(options);
	}
};
