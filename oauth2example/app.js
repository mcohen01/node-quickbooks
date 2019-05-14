'use strict'

var http = require('http');
var port = process.env.PORT || 3000;
var request = require('request');
var qs = require('querystring');
var util = require('util');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var express = require('express');
var app = express();
var QuickBooks = require('../index');
var Tokens = require('csrf');
var csrf = new Tokens();
var config = require('./config');
var OAuthClient = require('intuit-oauth');

QuickBooks.setOauthVersion('2.0');

// Generic Express config
app.set('port', port);
app.set('views', 'views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('brad'));
app.use(session({ resave: false, saveUninitialized: false, secret: 'smith' }));

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

/**
 * Instantiate new Client
 * @type {OAuthClient}
 */

var oauthClient,companyId;

app.get('/', function (req, res) {
  res.redirect('/start');
});

app.get('/start', function (req, res) {
  res.render('intuit.ejs', { port: port, appCenter: QuickBooks.APP_CENTER_BASE });
});


app.get('/requestToken', function (req, res) {

  oauthClient = new OAuthClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    environment: config.environment,
    redirectUri: config.redirectUri
  });

  var authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.Accounting],state:'node-quickbooks-oauth2-test'});
  res.redirect(authUri);

});

app.get('/callback', function (req, res) {

  var accessToken;

  oauthClient.createToken(req.url)
    .then(function(authResponse) {
      accessToken = authResponse.getJson();
      companyId = authResponse.token.realmId;
    })
    .then(function(response){
      /**
       * // save the access token somewhere on behalf of the logged in user
       * @type {QuickBooks}
       */
      var qbo = new QuickBooks(oauthClient.clientId,
        oauthClient.clientSecret,
        accessToken.access_token, /* oAuth access token */
        false, /* no token secret for oAuth 2.0 */
        companyId,
        true, /* use a sandbox account */
        true, /* turn debugging on */
        34, /* minor version */
        '2.0', /* oauth version */
        accessToken.refresh_token /* refresh token */);

      qbo.findAccounts(function (_, accounts) {
        accounts.QueryResponse.Account.forEach(function (account) {
          console.log(account.Name);
        });
      });
    })
    .catch(function(e) {
      console.error(e);
    });

  res.send('<!DOCTYPE html><html lang="en"><head></head><body><script>window.opener.location.reload(); window.close();</script></body></html>');

});


