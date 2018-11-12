module.exports = {
  consumerKey:     '',
  consumerSecret:  '',
  token:           '',
  tokenSecret:     '', // set to false for OAuth 2.0 flow
  realmId:         '',
  useSandbox:      true,
  debug:           false,
  //
  // Set useSandbox to false when moving to production. For info, see the following url:
  // https://developer.intuit.com/v2/blog/2014/10/24/intuit-developer-now-offers-quickbooks-sandboxes

  testEmail:       '',  // Use this email address for testing send*Pdf functions
  minorversion: '', // Use to set minorversion for request,
  //
  // If using OAuth 2.0, uncomment the following two lines and fill in the refresh token
  // oauthversion: '2.0',
  // refreshToken: ''
}
