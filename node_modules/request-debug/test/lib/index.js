var express        = require('express'),
    fs             = require('fs'),
    http           = require('http'),
    https          = require('https'),
    mocha          = require('mocha'),
    passport       = require('passport'),
    DigestStrategy = require('passport-http').DigestStrategy,
    path           = require('path'),
    should         = require('should'),
    util           = require('util');

var app,
    ports = {
        http  : 8480,
        https : 8443
    };

exports.ports    = ports;
exports.requests = [];
exports.urls     = {};

for (var proto in ports) {
    exports.urls[proto] = util.format(
        '%s://localhost:%d',
        proto,
        ports[proto]);
}

exports.enableDebugging = function(request) {
    // enable debugging
    require('../..')(request, function(type, data) {
        var obj = {};
        obj[type] = data;
        exports.requests.push(obj);
    });
};

exports.clearRequests = function() {
    exports.requests = [];
};

var fixHeader = {
    date : function(val) {
        return '<date>';
    },
    etag : function(val) {
        return val.split('"')[0] + '"<etag>"';
    },
    connection : function(val) {
        return val.replace(/^(close|keep-alive)$/, '<close or keep-alive>');
    },
    authorization : function(val) {
        var arr = val.split(', ');
        if (arr.length > 1) {
            val = util.format(
                '%s <+%s>',
                arr[0],
                arr.slice(1).map(function(v) {
                    return v.split('=')[0]
                }).join(','));
        }
        return val;
    }
};
fixHeader['www-authenticate'] = fixHeader.authorization;

exports.fixVariableHeaders = function() {
    exports.requests.forEach(function(req) {
        for (var type in req) {
            for (var header in req[type].headers) {
                if (fixHeader[header]) {
                    req[type].headers[header] =
                        fixHeader[header](req[type].headers[header]);
                }
            }
        }
    });
};

exports.startServers = function() {
    passport.use(new DigestStrategy(
        { qop : 'auth' },
        function(user, done) {
            return done(null, 'admin', 'mypass');
        }
    ));

    app = express();

    app.use(passport.initialize());

    function handleRequest(req, res) {
        if (req.params.level == 'bottom') {
            if (req.header('accept') == 'application/json') {
                res.json({ key : 'value' });
            } else {
                res.send('Request OK');
            }
            return;
        }
        var level = (req.params.level == 'top' ? 'middle' : 'bottom');
        if (req.params.proto && req.params.proto != req.protocol) {
            res.redirect(exports.urls[req.params.proto] + '/' + level);
        } else {
            res.redirect('/' + level);
        }
    }

    var auth = passport.authenticate('digest', { session : false });
    app.get('/auth/:level/:proto?', auth, handleRequest);

    app.get('/:level/:proto?', handleRequest);

    http.createServer(app).listen(ports.http);

    https.createServer({
        key  : fs.readFileSync(path.join(__dirname, 'key.pem')),
        cert : fs.readFileSync(path.join(__dirname, 'cert.pem'))
    }, app).listen(ports.https);
};
