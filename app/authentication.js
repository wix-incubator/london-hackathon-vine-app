var url = require('url');
var APP_SECRET = 'cf15b709-8201-4ed4-bc55-ea8d3b81b933';
var crypto = require("crypto");

function Authentication() {
    this.authenticate = function(req, res, next) {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        if (query.instance || query.origCompId || query.compId) {
            verify = verifyInstance(query.instance, APP_SECRET);
            if (verify.valid) {
                var key = JSON.parse(verify.key).instanceId + ':';
                if (query.origCompId) {
                    key = key + query.origCompId;
                } else if (query.compId) {
                    key = key + query.compId;
                }
                req.key = key;
                next();
            } else {
                res.render('invalid-secret');
            }
        } else {
            res.render('invalid-secret');
        }
    }
}

function verifyInstance(instance, secret) {
    // spilt the instance into signature and data
    var pair = instance.split('.');
    var signature = decode(pair[0], 'binary');
    var data = pair[1];
    // sign the data using hmac-sha1-256
    var hmac = crypto.createHmac('sha256', secret);
    var newSignature = hmac.update(data).digest('binary');
    return {valid: signature === newSignature,
        key: new Buffer(data, 'base64').toString()};
}

function decode(data, encoding) {
    encoding = encoding === undefined ? 'utf8' : encoding
    var buf = new Buffer(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
    return encoding ? buf.toString(encoding) : buf;
}

module.exports = Authentication;