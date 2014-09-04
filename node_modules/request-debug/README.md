# request-debug [![Build Status](https://travis-ci.org/nylen/request-debug.png?branch=master)](https://travis-ci.org/nylen/request-debug)

This Node.js module provides an easy way to debug HTTP(S) requests performed by
the [`request` module](https://github.com/mikeal/request), and their responses
from external servers.

## Usage

Basic usage is to require the module and call it, passing in the object
returned by `require('request')`:

```js
var request = require('request');

require('request-debug')(request);
```

This will set up event handlers on every request performed with the `request`
variable from this point.

You can also specify a function to handle request or response data:

```js
require('request-debug')(request, function(type, data) {
    // put your request or response handling logic here
});
```

If you specify your own handling function, `type` will be one of the following values:

- **request** - Headers were sent to the server and will be included as
  `data.headers`.  `data.body` may also be present for POST requests.

- **response** - Headers were received from the server and will be included as
  `data.headers`.  Note that `request` only buffers the response body if a
  callback was given, so it will only be available as `data.body` if the
  initial call to `request` included a callback.

- **redirect** - A redirect status code (*HTTP 3xx*) was received.  The `data`
  object will have properties `statusCode`, `headers`, and `uri` (the address
  of the next request).

- **auth** - A *HTTP 401 Unathorized* response was received.  Internally,
  `request` handles this like a redirect, so the same properties will be
  available on the `data` object.

The default handling function writes the data to *stderr* in Node's JSON-like object
display format.  See the example below for more details.

## Example

```js
var request = require('request');

require('request-debug')(request);

// digest.php is example 2 from:
// http://php.net/manual/en/features.http-auth.php

request({
    uri  : 'http://nylen.tv/digest.php',
    auth : {
        user : 'admin',
        pass : 'mypass',
        sendImmediately : false
    },
    rejectUnauthorized : false,
}, function(err, res, body) {
    console.log('REQUEST RESULTS:', err, res.statusCode, body);
});
```

Unless you provide your own function as the second parameter to the
`request-debug` call, this will produce console output similar to the
following:

```js
{ request: 
   { uri: 'http://nylen.tv/digest.php',
     method: 'GET',
     headers: { host: 'nylen.tv' } } }
{ auth: 
   { statusCode: 401,
     headers: 
      { date: 'Fri, 29 Aug 2014 00:10:11 GMT',
        server: 'Apache/2.4.6 (Debian)',
        'x-powered-by': 'PHP/5.5.6-1',
        'www-authenticate': 'Digest realm="Restricted area",qop="auth",nonce="53ffc4e3f308e",opaque="cdce8a5c95a1427d74df7acbf41c9ce0"',
        'content-length': '39',
        'keep-alive': 'timeout=5, max=100',
        connection: 'Keep-Alive',
        'content-type': 'text/html' },
     uri: 'http://nylen.tv/digest.php' } }
{ request: 
   { uri: 'http://nylen.tv/digest.php',
     method: 'GET',
     headers: 
      { authorization: 'Digest username="admin", realm="Restricted area", nonce="53ffc4e3f308e", uri="/digest.php", qop=auth, response="d7c6bf1c2657228e146da3edf034a419", nc=00000001, cnonce="4fa4a6af3d1d424397cb2c798d5a97df", opaque="cdce8a5c95a1427d74df7acbf41c9ce0"',
        host: 'nylen.tv' } } }
{ response: 
   { headers: 
      { date: 'Fri, 29 Aug 2014 00:10:12 GMT',
        server: 'Apache/2.4.6 (Debian)',
        'x-powered-by': 'PHP/5.5.6-1',
        'content-length': '27',
        'keep-alive': 'timeout=5, max=100',
        connection: 'Keep-Alive',
        'content-type': 'text/html' },
     statusCode: 200,
     body: 'You are logged in as: admin' } }
REQUEST RESULTS: null 200 'You are logged in as: admin'
```

## Compatibility

Tested with Node.js versions 0.8.x, 0.10.x, and 0.11.x on Travis.

Does not work with `request` versions older than 2.22.0 (July 2013).  Tests
don't start passing until version 2.28.0 (December 2013).
