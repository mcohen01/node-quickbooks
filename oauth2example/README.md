# node-quickbooks-oauth2.0-sample

Sample demonstrating Intuit's [QuickBooks API][1] using [intuit-oauth][2] 

## Installation

```bash
$ npm install
$ npm start
```

## Documentation

1. You can authenticate and authorize using the instance of `intuit-oauth` library as shown in [app.js][3] :

```javascript

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

```

2. You can make API calls by instantiating `Quickbooks` class as shown in [app.js][3] once you get the tokens from step 1 :

```javascript

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
 

```

**Note :** You can find the clientId and clientSecret for your app [here][4] 


[1]: https://developer.intuit.com/docs/api/accounting
[2]: https://github.com/intuit/oauth-jsclient
[3]: https://github.com/mcohen01/node-quickbooks/blob/master/oauth2example/app.js
[4]: https://developer.intuit.com/app/developer/qbo/docs/get-started#create-an-app