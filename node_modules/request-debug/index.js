var clone = require('clone');

module.exports = exports = function(request, log) {
    log = log || exports.log;

    var proto;
    if (request.Request) {
        proto = request.Request.prototype;
    } else if (request.get && request.post) {
        // The object returned by request.defaults() doesn't include the
        // Request property, so do this horrible thing to get at it.  Per
        // Wikipedia, port 4 is unassigned.
        var req = request('http://localhost:4').on('error', function() { });
        proto = req.constructor.prototype;
    } else {
        throw new Error(
            "Pass the object returned by require('request') to this function.");
    }

    if (!proto._initBeforeDebug) {
        proto._initBeforeDebug = proto.init;

        proto.init = function() {
            if (!this._debugHandlersAdded) {

                this.on('request', function(req) {
                    var obj = {
                        uri     : this.uri.href,
                        method  : this.method,
                        headers : clone(this.headers)
                    };
                    if (this.body) {
                        obj.body = this.body.toString('utf8');
                    }
                    log('request', obj);

                }).on('response', function(res) {
                    if (this.callback) {
                        // callback specified, request will buffer the body for
                        // us, so wait until the complete event to do anything
                    } else {
                        // cannot get body since no callback specified
                        log('response', {
                            headers    : clone(res.headers),
                            statusCode : res.statusCode
                        });
                    }

                }).on('complete', function(res, body) {
                    if (this.callback) {
                        log('response', {
                            headers    : clone(res.headers),
                            statusCode : res.statusCode,
                            body       : res.body
                        });
                    }

                }).on('redirect', function() {
                    var type = (this.response.statusCode == 401 ? 'auth' : 'redirect');
                    log(type, {
                        statusCode : this.response.statusCode,
                        headers    : clone(this.response.headers),
                        uri        : this.uri.href
                    });
                });

                this._debugHandlersAdded = true;
            }

            return proto._initBeforeDebug.apply(this, arguments);
        };
    }
};

exports.log = function(type, obj) {
    var toLog = {};
    toLog[type] = obj;
    console.error(toLog);
};
