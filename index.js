/**
 * @file Node.js client for QuickBooks V3 API
 * @name node-quickbooks
 * @author Michael Cohen <michael_cohen@intuit.com>
 * @license ISC
 * @copyright 2014 Michael Cohen
 */

var request = require('request'),
    uuid    = require('uuid'),
    debug   = require('request-debug'),
    util    = require('util'),
    moment  = require('moment'),
    _       = require('underscore'),
    Promise = require('bluebird'),
    version = require('./package.json').version,
    jxon    = require('jxon');

module.exports = QuickBooks

QuickBooks.APP_CENTER_BASE = 'https://appcenter.intuit.com';
QuickBooks.V3_ENDPOINT_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com/v3/company/';
QuickBooks.QUERY_OPERATORS = ['=', 'IN', '<', '>', '<=', '>=', 'LIKE'];
QuickBooks.TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

var OAUTH_ENDPOINTS = {
  '1.0a': function (callback) {
    callback({
      REQUEST_TOKEN_URL: 'https://oauth.intuit.com/oauth/v1/get_request_token',
      ACCESS_TOKEN_URL: 'https://oauth.intuit.com/oauth/v1/get_access_token',
      APP_CENTER_URL: QuickBooks.APP_CENTER_BASE + '/Connect/Begin?oauth_token=',
      RECONNECT_URL: QuickBooks.APP_CENTER_BASE + '/api/v1/connection/reconnect',
      DISCONNECT_URL: QuickBooks.APP_CENTER_BASE + '/api/v1/connection/disconnect'
    });
  },

  '2.0': function (callback, discoveryUrl) {
    var NEW_ENDPOINT_CONFIGURATION = {};
    request({
      url: discoveryUrl,
      headers: {
        Accept: 'application/json'
      }
    }, function (err, res) {
      if (err) {
        console.log(err);
        return err;
      }

      var json;
      try {
          json = JSON.parse(res.body);
      } catch (error) {
          console.log(error);
          return error;
      }
      NEW_ENDPOINT_CONFIGURATION.AUTHORIZATION_URL = json.authorization_endpoint;;
      NEW_ENDPOINT_CONFIGURATION.TOKEN_URL = json.token_endpoint;
      NEW_ENDPOINT_CONFIGURATION.USER_INFO_URL = json.userinfo_endpoint;
      NEW_ENDPOINT_CONFIGURATION.REVOKE_URL = json.revocation_endpoint;
      callback(NEW_ENDPOINT_CONFIGURATION);
    });
  }
};

OAUTH_ENDPOINTS['1.0'] = OAUTH_ENDPOINTS['1.0a'];

/**
 * Sets endpoints per OAuth version
 *
 * @param version - 1.0 for OAuth 1.0a, 2.0 for OAuth 2.0
 * @param useSandbox - true to use the OAuth 2.0 sandbox discovery document, false (or unspecified, for backward compatibility) to use the prod discovery document.
 */
QuickBooks.setOauthVersion = function (version, useSandbox) {
  version = (typeof version === 'number') ? version.toFixed(1) : version;
  QuickBooks.version = version;
  var discoveryUrl = useSandbox ? 'https://developer.intuit.com/.well-known/openid_sandbox_configuration/' : 'https://developer.api.intuit.com/.well-known/openid_configuration/';
  OAUTH_ENDPOINTS[version](function (endpoints) {
    for (var k in endpoints) {
      QuickBooks[k] = endpoints[k];
    }
  }, discoveryUrl);
};

QuickBooks.setOauthVersion('1.0');

/**
 * Node.js client encapsulating access to the QuickBooks V3 Rest API. An instance
 * of this class should be instantiated on behalf of each user accessing the api.
 *
 * @param consumerKey - application key
 * @param consumerSecret  - application password
 * @param token - the OAuth generated user-specific key
 * @param tokenSecret - the OAuth generated user-specific password
 * @param realmId - QuickBooks companyId, returned as a request parameter when the user is redirected to the provided callback URL following authentication
 * @param useSandbox - boolean - See https://developer.intuit.com/v2/blog/2014/10/24/intuit-developer-now-offers-quickbooks-sandboxes
 * @param debug - boolean flag to turn on logging of HTTP requests, including headers and body
 * @param minorversion - integer to set minorversion in request
 * @constructor
 */
function QuickBooks(consumerKey, consumerSecret, token, tokenSecret, realmId, useSandbox, debug, minorversion, oauthversion, refreshToken) {
  var prefix = _.isObject(consumerKey) ? 'consumerKey.' : '';
  this.consumerKey = eval(prefix + 'consumerKey');
  this.consumerSecret = eval(prefix + 'consumerSecret');
  this.token = eval(prefix + 'token');
  this.tokenSecret = eval(prefix + 'tokenSecret');
  this.realmId = eval(prefix + 'realmId');
  this.useSandbox = eval(prefix + 'useSandbox');
  this.debug = eval(prefix + 'debug');
  this.endpoint = this.useSandbox
    ? QuickBooks.V3_ENDPOINT_BASE_URL
    : QuickBooks.V3_ENDPOINT_BASE_URL.replace('sandbox-', '');
  this.minorversion = eval(prefix + 'minorversion') || 4;
  this.oauthversion = eval(prefix + 'oauthversion') || '1.0a';
  this.refreshToken = eval(prefix + 'refreshToken') || null;
  if (!eval(prefix + 'tokenSecret') && this.oauthversion !== '2.0') {
    throw new Error('tokenSecret not defined');
  }
}

/**
 *
 * Use the refresh token to obtain a new access token.
 *
 *
 */

QuickBooks.prototype.refreshAccessToken = function(callback) {
    var auth = (new Buffer(this.consumerKey + ':' + this.consumerSecret).toString('base64'));

    var postBody = {
        url: QuickBooks.TOKEN_URL,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + auth,
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken
        }
    };

    request.post(postBody, (function (e, r, data) {
        if (r && r.body) {
            var refreshResponse = JSON.parse(r.body);
            this.refreshToken = refreshResponse.refresh_token;
            this.token = refreshResponse.access_token;
            if (callback) callback(e, refreshResponse);
        } else {
            if (callback) callback(e, r, data);
        }
    }).bind(this));
};

/**
 * Use either refresh token or access token to revoke access (OAuth2).
 *
 * @param useRefresh - boolean - Indicates which token to use: true to use the refresh token, false to use the access token.
 * @param {function} callback - Callback function to call with error/response/data results.
 */
QuickBooks.prototype.revokeAccess = function(useRefresh, callback) {
    var auth = (new Buffer(this.consumerKey + ':' + this.consumerSecret).toString('base64'));
    var revokeToken = useRefresh ? this.refreshToken : this.token;
    var postBody = {
        url: QuickBooks.REVOKE_URL,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + auth,
        },
        form: {
            token: revokeToken
        }
    };

    request.post(postBody, (function(e, r, data) {
        if (r && r.statusCode === 200) {
            this.refreshToken = null;
            this.token = null;
            this.realmId = null;
        }
        if (callback) callback(e, r, data);
    }).bind(this));
};

/**
 * Get user info (OAuth2).
 *
 * @param {function} callback - Callback function to call with error/response/data results.
 */
QuickBooks.prototype.getUserInfo = function(callback) {
  module.request(this, 'get', {url: QuickBooks.USER_INFO_URL}, null, callback);
};

/**
 * Batch operation to enable an application to perform multiple operations in a single request.
 * The following batch items are supported:
     create
     update
     delete
     query
 * The maximum number of batch items in a single request is 25.
 *
 * @param  {object} items - JavaScript array of batch items
 * @param  {function} callback - Callback function which is called with any error and list of BatchItemResponses
 */
QuickBooks.prototype.batch = function(items, callback) {
  module.request(this, 'post', {url: '/batch'}, {BatchItemRequest: items}, callback)
}

/**
 * The change data capture (CDC) operation returns a list of entities that have changed since a specified time.
 *
 * @param  {object} entities - Comma separated list or JavaScript array of entities to search for changes
 * @param  {object} since - JavaScript Date or string representation of the form '2012-07-20T22:25:51-07:00' to look back for changes until
 * @param  {function} callback - Callback function which is called with any error and list of changes
 */
QuickBooks.prototype.changeDataCapture = function(entities, since, callback) {
  var url = '/cdc?entities='
  url += typeof entities === 'string' ? entities : entities.join(',')
  url += '&changedSince='
  url += typeof since === 'string' ? since : moment(since).format()
  module.request(this, 'get', {url: url}, null, callback)
}

/**
 * Uploads a file as an Attachable in QBO, optionally linking it to the specified
 * QBO Entity.
 *
 * @param  {string} filename - the name of the file
 * @param  {string} contentType - the mime type of the file
 * @param  {object} stream - ReadableStream of file contents
 * @param  {object} entityType - optional string name of the QBO entity the Attachable will be linked to (e.g. Invoice)
 * @param  {object} entityId - optional Id of the QBO entity the Attachable will be linked to
 * @param  {function} callback - callback which receives the newly created Attachable
 */
QuickBooks.prototype.upload = function(filename, contentType, stream, entityType, entityId, callback) {
  var that = this
  var opts = {
    url: '/upload',
    formData: {
      file_content_01: {
        value: stream,
        options: {
          filename: filename,
          contentType: contentType
        }
      }
    }
  }
  module.request(this, 'post', opts, null, module.unwrap(function(err, data) {
    if (err || data[0].Fault) {
      (callback || entityType)(err || data[0], null)
    } else if (_.isFunction(entityType)) {
      entityType(null, data[0].Attachable)
    } else {
      var id = data[0].Attachable.Id
      that.updateAttachable({
        Id: id,
        SyncToken: '0',
        AttachableRef: [{
          EntityRef: {
            type: entityType,
            value: entityId + ''
          }
        }]
      }, function(err, data) {
        callback(err, data)
      })
    }
  }, 'AttachableResponse'))
}

/**
 * Creates the Account in QuickBooks
 *
 * @param  {object} account - The unsaved account, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
QuickBooks.prototype.createAccount = function(account, callback) {
  module.create(this, 'account', account, callback)
}

/**
 * Creates the Attachable in QuickBooks
 *
 * @param  {object} attachable - The unsaved attachable, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
QuickBooks.prototype.createAttachable = function(attachable, callback) {
  module.create(this, 'attachable', attachable, callback)
}

/**
 * Creates the Bill in QuickBooks
 *
 * @param  {object} bill - The unsaved bill, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
QuickBooks.prototype.createBill = function(bill, callback) {
  module.create(this, 'bill', bill, callback)
}

/**
 * Creates the BillPayment in QuickBooks
 *
 * @param  {object} billPayment - The unsaved billPayment, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
QuickBooks.prototype.createBillPayment = function(billPayment, callback) {
  module.create(this, 'billPayment', billPayment, callback)
}

/**
 * Creates the Class in QuickBooks
 *
 * @param  {object} class - The unsaved class, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
QuickBooks.prototype.createClass = function(klass, callback) {
  module.create(this, 'class', klass, callback)
}

/**
 * Creates the CreditMemo in QuickBooks
 *
 * @param  {object} creditMemo - The unsaved creditMemo, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
QuickBooks.prototype.createCreditMemo = function(creditMemo, callback) {
  module.create(this, 'creditMemo', creditMemo, callback)
}

/**
 * Creates the Customer in QuickBooks
 *
 * @param  {object} customer - The unsaved customer, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
QuickBooks.prototype.createCustomer = function(customer, callback) {
  module.create(this, 'customer', customer, callback)
}

/**
 * Creates the Department in QuickBooks
 *
 * @param  {object} department - The unsaved department, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
QuickBooks.prototype.createDepartment = function(department, callback) {
  module.create(this, 'department', department, callback)
}

/**
 * Creates the Deposit in QuickBooks
 *
 * @param  {object} deposit - The unsaved Deposit, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Deposit
 */
QuickBooks.prototype.createDeposit = function(deposit, callback) {
  module.create(this, 'deposit', deposit, callback)
}

/**
 * Creates the Employee in QuickBooks
 *
 * @param  {object} employee - The unsaved employee, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
QuickBooks.prototype.createEmployee = function(employee, callback) {
  module.create(this, 'employee', employee, callback)
}

/**
 * Creates the Estimate in QuickBooks
 *
 * @param  {object} estimate - The unsaved estimate, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
QuickBooks.prototype.createEstimate = function(estimate, callback) {
  module.create(this, 'estimate', estimate, callback)
}

/**
 * Creates the Invoice in QuickBooks
 *
 * @param  {object} invoice - The unsaved invoice, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
QuickBooks.prototype.createInvoice = function(invoice, callback) {
  module.create(this, 'invoice', invoice, callback)
}

/**
 * Creates the Item in QuickBooks
 *
 * @param  {object} item - The unsaved item, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
QuickBooks.prototype.createItem = function(item, callback) {
  module.create(this, 'item', item, callback)
}

/**
 * Creates the JournalCode in QuickBooks
 *
 * @param  {object} journalCode - The unsaved journalCode, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalCode
 */
QuickBooks.prototype.createJournalCode = function(journalCode, callback) {
  module.create(this, 'journalCode', journalCode, callback)
}

/**
 * Creates the JournalEntry in QuickBooks
 *
 * @param  {object} journalEntry - The unsaved journalEntry, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
QuickBooks.prototype.createJournalEntry = function(journalEntry, callback) {
  module.create(this, 'journalEntry', journalEntry, callback)
}

/**
 * Creates the Payment in QuickBooks
 *
 * @param  {object} payment - The unsaved payment, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
QuickBooks.prototype.createPayment = function(payment, callback) {
  module.create(this, 'payment', payment, callback)
}

/**
 * Creates the PaymentMethod in QuickBooks
 *
 * @param  {object} paymentMethod - The unsaved paymentMethod, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
QuickBooks.prototype.createPaymentMethod = function(paymentMethod, callback) {
  module.create(this, 'paymentMethod', paymentMethod, callback)
}

/**
 * Creates the Purchase in QuickBooks
 *
 * @param  {object} purchase - The unsaved purchase, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
QuickBooks.prototype.createPurchase = function(purchase, callback) {
  module.create(this, 'purchase', purchase, callback)
}

/**
 * Creates the PurchaseOrder in QuickBooks
 *
 * @param  {object} purchaseOrder - The unsaved purchaseOrder, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
QuickBooks.prototype.createPurchaseOrder = function(purchaseOrder, callback) {
  module.create(this, 'purchaseOrder', purchaseOrder, callback)
}

/**
 * Creates the RefundReceipt in QuickBooks
 *
 * @param  {object} refundReceipt - The unsaved refundReceipt, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
QuickBooks.prototype.createRefundReceipt = function(refundReceipt, callback) {
  module.create(this, 'refundReceipt', refundReceipt, callback)
}

/**
 * Creates the SalesReceipt in QuickBooks
 *
 * @param  {object} salesReceipt - The unsaved salesReceipt, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
QuickBooks.prototype.createSalesReceipt = function(salesReceipt, callback) {
  module.create(this, 'salesReceipt', salesReceipt, callback)
}

/**
 * Creates the TaxAgency in QuickBooks
 *
 * @param  {object} taxAgency - The unsaved taxAgency, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
QuickBooks.prototype.createTaxAgency = function(taxAgency, callback) {
  module.create(this, 'taxAgency', taxAgency, callback)
}

/**
 * Creates the TaxService in QuickBooks
 *
 * @param  {object} taxService - The unsaved taxService, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxService
 */
QuickBooks.prototype.createTaxService = function(taxService, callback) {
  module.create(this, 'taxService/taxcode', taxService, callback)
}

/**
 * Creates the Term in QuickBooks
 *
 * @param  {object} term - The unsaved term, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
QuickBooks.prototype.createTerm = function(term, callback) {
  module.create(this, 'term', term, callback)
}

/**
 * Creates the TimeActivity in QuickBooks
 *
 * @param  {object} timeActivity - The unsaved timeActivity, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
QuickBooks.prototype.createTimeActivity = function(timeActivity, callback) {
  module.create(this, 'timeActivity', timeActivity, callback)
}

/**
 * Creates the Transfer in QuickBooks
 *
 * @param  {object} transfer - The unsaved Transfer, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Transfer
 */
QuickBooks.prototype.createTransfer = function(transfer, callback) {
  module.create(this, 'transfer', transfer, callback)
}

/**
 * Creates the Vendor in QuickBooks
 *
 * @param  {object} vendor - The unsaved vendor, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
QuickBooks.prototype.createVendor = function(vendor, callback) {
  module.create(this, 'vendor', vendor, callback)
}

/**
 * Creates the VendorCredit in QuickBooks
 *
 * @param  {object} vendorCredit - The unsaved vendorCredit, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
QuickBooks.prototype.createVendorCredit = function(vendorCredit, callback) {
  module.create(this, 'vendorCredit', vendorCredit, callback)
}



/**
 * Retrieves the Account from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Account
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
QuickBooks.prototype.getAccount = function(id, callback) {
  module.read(this, 'account', id, callback)
}

/**
 * Retrieves the Attachable from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Attachable
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
QuickBooks.prototype.getAttachable = function(id, callback) {
  module.read(this, 'attachable', id, callback)
}

/**
 * Retrieves the Bill from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Bill
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
QuickBooks.prototype.getBill = function(id, callback) {
  module.read(this, 'bill', id, callback)
}

/**
 * Retrieves the BillPayment from QuickBooks
 *
 * @param  {string} Id - The Id of persistent BillPayment
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
QuickBooks.prototype.getBillPayment = function(id, callback) {
  module.read(this, 'billPayment', id, callback)
}

/**
 * Retrieves the Class from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Class
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
QuickBooks.prototype.getClass = function(id, callback) {
  module.read(this, 'class', id, callback)
}

/**
 * Retrieves the CompanyInfo from QuickBooks
 *
 * @param  {string} Id - The Id of persistent CompanyInfo
 * @param  {function} callback - Callback function which is called with any error and the persistent CompanyInfo
 */
QuickBooks.prototype.getCompanyInfo = function(id, callback) {
  module.read(this, 'companyInfo', id, callback)
}

/**
 * Retrieves the CreditMemo from QuickBooks
 *
 * @param  {string} Id - The Id of persistent CreditMemo
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
QuickBooks.prototype.getCreditMemo = function(id, callback) {
  module.read(this, 'creditMemo', id, callback)
}

/**
 * Retrieves the Customer from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Customer
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
QuickBooks.prototype.getCustomer = function(id, callback) {
  module.read(this, 'customer', id, callback)
}

/**
 * Retrieves the Department from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Department
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
QuickBooks.prototype.getDepartment = function(id, callback) {
  module.read(this, 'department', id, callback)
}

/**
 * Retrieves the Deposit from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Deposit
 * @param  {function} callback - Callback function which is called with any error and the persistent Deposit
 */
QuickBooks.prototype.getDeposit = function(id, callback) {
  module.read(this, 'deposit', id, callback)
}

/**
 * Retrieves the Employee from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Employee
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
QuickBooks.prototype.getEmployee = function(id, callback) {
  module.read(this, 'employee', id, callback)
}

/**
 * Retrieves the Estimate from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Estimate
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
QuickBooks.prototype.getEstimate = function(id, callback) {
  module.read(this, 'estimate', id, callback)
}

/**
 * Retrieves an ExchangeRate from QuickBooks
 *
 * @param  {object} options - An object with options including the required `sourcecurrencycode` parameter and optional `asofdate` parameter.
 * @param  {function} callback - Callback function which is called with any error and the ExchangeRate
 */
QuickBooks.prototype.getExchangeRate = function(options, callback) {
  var url = "/exchangerate";
  module.request(this, 'get', {url: url, qs: options}, null, callback)
}


/**
 * Retrieves the Estimate PDF from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Estimate
 * @param  {function} callback - Callback function which is called with any error and the Estimate PDF
 */
QuickBooks.prototype.getEstimatePdf = function(id, callback) {
    module.read(this, 'Estimate', id + '/pdf', callback)
};

/**
 * Emails the Estimate PDF from QuickBooks to the address supplied in Estimate.BillEmail.EmailAddress
 * or the specified 'sendTo' address
 *
 * @param  {string} Id - The Id of persistent Estimate
 * @param  {string} sendTo - optional email address to send the PDF to. If not provided, address supplied in Estimate.BillEmail.EmailAddress will be used
 * @param  {function} callback - Callback function which is called with any error and the Estimate PDF
 */
QuickBooks.prototype.sendEstimatePdf = function(id, sendTo, callback) {
  var path = '/estimate/' + id + '/send'
  callback = _.isFunction(sendTo) ? sendTo : callback
  if (sendTo && ! _.isFunction(sendTo)) {
    path += '?sendTo=' + sendTo
  }
  module.request(this, 'post', {url: path}, null, module.unwrap(callback, 'Estimate'))
}

/**
 * Retrieves the Invoice from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Invoice
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
QuickBooks.prototype.getInvoice = function(id, callback) {
  module.read(this, 'invoice', id, callback)
}

/**
 * Retrieves the Invoice PDF from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Invoice
 * @param  {function} callback - Callback function which is called with any error and the Invoice PDF
 */
QuickBooks.prototype.getInvoicePdf = function(id, callback) {
  module.read(this, 'Invoice', id + '/pdf', callback)
}

/**
 * Emails the Invoice PDF from QuickBooks to the address supplied in Invoice.BillEmail.EmailAddress
 * or the specified 'sendTo' address
 *
 * @param  {string} Id - The Id of persistent Invoice
 * @param  {string} sendTo - optional email address to send the PDF to. If not provided, address supplied in Invoice.BillEmail.EmailAddress will be used
 * @param  {function} callback - Callback function which is called with any error and the Invoice PDF
 */
QuickBooks.prototype.sendInvoicePdf = function(id, sendTo, callback) {
  var path = '/invoice/' + id + '/send'
  callback = _.isFunction(sendTo) ? sendTo : callback
  if (sendTo && ! _.isFunction(sendTo)) {
    path += '?sendTo=' + sendTo
  }
  module.request(this, 'post', {url: path}, null, module.unwrap(callback, 'Invoice'))
}

/**
 * Retrieves the Item from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Item
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
QuickBooks.prototype.getItem = function(id, callback) {
  module.read(this, 'item', id, callback)
}

/**
 * Retrieves the JournalCode from QuickBooks
 *
 * @param  {string} Id - The Id of persistent JournalCode
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalCode
 */
QuickBooks.prototype.getJournalCode = function(id, callback) {
  module.read(this, 'journalCode', id, callback)
}

/**
 * Retrieves the JournalEntry from QuickBooks
 *
 * @param  {string} Id - The Id of persistent JournalEntry
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
QuickBooks.prototype.getJournalEntry = function(id, callback) {
  module.read(this, 'journalEntry', id, callback)
}

/**
 * Retrieves the Payment from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Payment
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
QuickBooks.prototype.getPayment = function(id, callback) {
  module.read(this, 'payment', id, callback)
}

/**
 * Retrieves the PaymentMethod from QuickBooks
 *
 * @param  {string} Id - The Id of persistent PaymentMethod
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
QuickBooks.prototype.getPaymentMethod = function(id, callback) {
  module.read(this, 'paymentMethod', id, callback)
}

/**
 * Retrieves the Preferences from QuickBooks
 *
 * @param  {function} callback - Callback function which is called with any error and the persistent Preferences
 */
QuickBooks.prototype.getPreferences = function(callback) {
  module.read(this, 'preferences', null, callback)
}

/**
 * Retrieves the Purchase from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Purchase
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
QuickBooks.prototype.getPurchase = function(id, callback) {
  module.read(this, 'purchase', id, callback)
}

/**
 * Retrieves the PurchaseOrder from QuickBooks
 *
 * @param  {string} Id - The Id of persistent PurchaseOrder
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
QuickBooks.prototype.getPurchaseOrder = function(id, callback) {
  module.read(this, 'purchaseOrder', id, callback)
}

/**
 * Retrieves the RefundReceipt from QuickBooks
 *
 * @param  {string} Id - The Id of persistent RefundReceipt
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
QuickBooks.prototype.getRefundReceipt = function(id, callback) {
  module.read(this, 'refundReceipt', id, callback)
}

/**
 * Retrieves the Reports from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Reports
 * @param  {function} callback - Callback function which is called with any error and the persistent Reports
 */
QuickBooks.prototype.getReports = function(id, callback) {
  module.read(this, 'reports', id, callback)
}

/**
 * Retrieves the SalesReceipt from QuickBooks
 *
 * @param  {string} Id - The Id of persistent SalesReceipt
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
QuickBooks.prototype.getSalesReceipt = function(id, callback) {
  module.read(this, 'salesReceipt', id, callback)
}

/**
 * Retrieves the SalesReceipt PDF from QuickBooks
 *
 * @param  {string} Id - The Id of persistent SalesReceipt
 * @param  {function} callback - Callback function which is called with any error and the SalesReceipt PDF
 */
QuickBooks.prototype.getSalesReceiptPdf = function(id, callback) {
  module.read(this, 'salesReceipt', id + '/pdf', callback)
}

/**
 * Emails the SalesReceipt PDF from QuickBooks to the address supplied in SalesReceipt.BillEmail.EmailAddress
 * or the specified 'sendTo' address
 *
 * @param  {string} Id - The Id of persistent SalesReceipt
 * @param  {string} sendTo - optional email address to send the PDF to. If not provided, address supplied in SalesReceipt.BillEmail.EmailAddress will be used
 * @param  {function} callback - Callback function which is called with any error and the SalesReceipt PDF
 */
QuickBooks.prototype.sendSalesReceiptPdf = function(id, sendTo, callback) {
  var path = '/salesreceipt/' + id + '/send'
  callback = _.isFunction(sendTo) ? sendTo : callback
  if (sendTo && ! _.isFunction(sendTo)) {
    path += '?sendTo=' + sendTo
  }
  module.request(this, 'post', {url: path}, null, module.unwrap(callback, 'SalesReceipt'))
}

/**
 * Retrieves the TaxAgency from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TaxAgency
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
QuickBooks.prototype.getTaxAgency = function(id, callback) {
  module.read(this, 'taxAgency', id, callback)
}

/**
 * Retrieves the TaxCode from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TaxCode
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxCode
 */
QuickBooks.prototype.getTaxCode = function(id, callback) {
  module.read(this, 'taxCode', id, callback)
}

/**
 * Retrieves the TaxRate from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TaxRate
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxRate
 */
QuickBooks.prototype.getTaxRate = function(id, callback) {
  module.read(this, 'taxRate', id, callback)
}

/**
 * Retrieves the Term from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Term
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
QuickBooks.prototype.getTerm = function(id, callback) {
  module.read(this, 'term', id, callback)
}

/**
 * Retrieves the TimeActivity from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TimeActivity
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
QuickBooks.prototype.getTimeActivity = function(id, callback) {
  module.read(this, 'timeActivity', id, callback)
}

/**
 * Retrieves the Transfer from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Term
 * @param  {function} callback - Callback function which is called with any error and the persistent Transfer
 */
QuickBooks.prototype.getTransfer = function(id, callback) {
  module.read(this, 'transfer', id, callback)
}

/**
 * Retrieves the Vendor from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Vendor
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
QuickBooks.prototype.getVendor = function(id, callback) {
  module.read(this, 'vendor', id, callback)
}

/**
 * Retrieves the VendorCredit from QuickBooks
 *
 * @param  {string} Id - The Id of persistent VendorCredit
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
QuickBooks.prototype.getVendorCredit = function(id, callback) {
  module.read(this, 'vendorCredit', id, callback)
}



/**
 * Updates QuickBooks version of Account
 *
 * @param  {object} account - The persistent Account, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
QuickBooks.prototype.updateAccount = function(account, callback) {
  module.update(this, 'account', account, callback)
}

/**
 * Updates QuickBooks version of Attachable
 *
 * @param  {object} attachable - The persistent Attachable, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
QuickBooks.prototype.updateAttachable = function(attachable, callback) {
  module.update(this, 'attachable', attachable, callback)
}

/**
 * Updates QuickBooks version of Bill
 *
 * @param  {object} bill - The persistent Bill, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
QuickBooks.prototype.updateBill = function(bill, callback) {
  module.update(this, 'bill', bill, callback)
}

/**
 * Updates QuickBooks version of BillPayment
 *
 * @param  {object} billPayment - The persistent BillPayment, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
QuickBooks.prototype.updateBillPayment = function(billPayment, callback) {
  module.update(this, 'billPayment', billPayment, callback)
}

/**
 * Updates QuickBooks version of Class
 *
 * @param  {object} class - The persistent Class, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
QuickBooks.prototype.updateClass = function(klass, callback) {
  module.update(this, 'class', klass, callback)
}

/**
 * Updates QuickBooks version of CompanyInfo
 *
 * @param  {object} companyInfo - The persistent CompanyInfo, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent CompanyInfo
 */
QuickBooks.prototype.updateCompanyInfo = function(companyInfo, callback) {
  module.update(this, 'companyInfo', companyInfo, callback)
}

/**
 * Updates QuickBooks version of CreditMemo
 *
 * @param  {object} creditMemo - The persistent CreditMemo, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
QuickBooks.prototype.updateCreditMemo = function(creditMemo, callback) {
  module.update(this, 'creditMemo', creditMemo, callback)
}

/**
 * Updates QuickBooks version of Customer
 *
 * @param  {object} customer - The persistent Customer, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
QuickBooks.prototype.updateCustomer = function(customer, callback) {
  module.update(this, 'customer', customer, callback)
}

/**
 * Updates QuickBooks version of Department
 *
 * @param  {object} department - The persistent Department, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
QuickBooks.prototype.updateDepartment = function(department, callback) {
  module.update(this, 'department', department, callback)
}

/**
 * Updates QuickBooks version of Deposit
 *
 * @param  {object} deposit - The persistent Deposit, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Deposit
 */
QuickBooks.prototype.updateDeposit = function(deposit, callback) {
  module.update(this, 'deposit', deposit, callback)
}

/**
 * Updates QuickBooks version of Employee
 *
 * @param  {object} employee - The persistent Employee, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
QuickBooks.prototype.updateEmployee = function(employee, callback) {
  module.update(this, 'employee', employee, callback)
}

/**
 * Updates QuickBooks version of Estimate
 *
 * @param  {object} estimate - The persistent Estimate, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
QuickBooks.prototype.updateEstimate = function(estimate, callback) {
  module.update(this, 'estimate', estimate, callback)
}

/**
 * Updates QuickBooks version of Invoice
 *
 * @param  {object} invoice - The persistent Invoice, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
QuickBooks.prototype.updateInvoice = function(invoice, callback) {
  module.update(this, 'invoice', invoice, callback)
}

/**
 * Updates QuickBooks version of Item
 *
 * @param  {object} item - The persistent Item, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
QuickBooks.prototype.updateItem = function(item, callback) {
  module.update(this, 'item', item, callback)
}

/**
 * Updates QuickBooks version of JournalCode
 *
 * @param  {object} journalCode - The persistent JournalCode, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalCode
 */
QuickBooks.prototype.updateJournalCode = function(journalCode, callback) {
  module.update(this, 'journalCode', journalCode, callback)
}

/**
 * Updates QuickBooks version of JournalEntry
 *
 * @param  {object} journalEntry - The persistent JournalEntry, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
QuickBooks.prototype.updateJournalEntry = function(journalEntry, callback) {
  module.update(this, 'journalEntry', journalEntry, callback)
}

/**
 * Updates QuickBooks version of Payment
 *
 * @param  {object} payment - The persistent Payment, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
QuickBooks.prototype.updatePayment = function(payment, callback) {
  module.update(this, 'payment', payment, callback)
}

/**
 * Updates QuickBooks version of PaymentMethod
 *
 * @param  {object} paymentMethod - The persistent PaymentMethod, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
QuickBooks.prototype.updatePaymentMethod = function(paymentMethod, callback) {
  module.update(this, 'paymentMethod', paymentMethod, callback)
}

/**
 * Updates QuickBooks version of Preferences
 *
 * @param  {object} preferences - The persistent Preferences, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Preferences
 */
QuickBooks.prototype.updatePreferences = function(preferences, callback) {
  module.update(this, 'preferences', preferences, callback)
}

/**
 * Updates QuickBooks version of Purchase
 *
 * @param  {object} purchase - The persistent Purchase, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
QuickBooks.prototype.updatePurchase = function(purchase, callback) {
  module.update(this, 'purchase', purchase, callback)
}

/**
 * Updates QuickBooks version of PurchaseOrder
 *
 * @param  {object} purchaseOrder - The persistent PurchaseOrder, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
QuickBooks.prototype.updatePurchaseOrder = function(purchaseOrder, callback) {
  module.update(this, 'purchaseOrder', purchaseOrder, callback)
}

/**
 * Updates QuickBooks version of RefundReceipt
 *
 * @param  {object} refundReceipt - The persistent RefundReceipt, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
QuickBooks.prototype.updateRefundReceipt = function(refundReceipt, callback) {
  module.update(this, 'refundReceipt', refundReceipt, callback)
}

/**
 * Updates QuickBooks version of SalesReceipt
 *
 * @param  {object} salesReceipt - The persistent SalesReceipt, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
QuickBooks.prototype.updateSalesReceipt = function(salesReceipt, callback) {
  module.update(this, 'salesReceipt', salesReceipt, callback)
}

/**
 * Updates QuickBooks version of TaxAgency
 *
 * @param  {object} taxAgency - The persistent TaxAgency, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
QuickBooks.prototype.updateTaxAgency = function(taxAgency, callback) {
  module.update(this, 'taxAgency', taxAgency, callback)
}

/**
 * Updates QuickBooks version of TaxCode
 *
 * @param  {object} taxCode - The persistent TaxCode, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxCode
 */
QuickBooks.prototype.updateTaxCode = function(taxCode, callback) {
  module.update(this, 'taxCode', taxCode, callback)
}

/**
 * Updates QuickBooks version of TaxRate
 *
 * @param  {object} taxRate - The persistent TaxRate, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxRate
 */
QuickBooks.prototype.updateTaxRate = function(taxRate, callback) {
  module.update(this, 'taxRate', taxRate, callback)
}

/**
 * Updates QuickBooks version of Term
 *
 * @param  {object} term - The persistent Term, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
QuickBooks.prototype.updateTerm = function(term, callback) {
  module.update(this, 'term', term, callback)
}

/**
 * Updates QuickBooks version of TimeActivity
 *
 * @param  {object} timeActivity - The persistent TimeActivity, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
QuickBooks.prototype.updateTimeActivity = function(timeActivity, callback) {
  module.update(this, 'timeActivity', timeActivity, callback)
}

/**
 * Updates QuickBooks version of Transfer
 *
 * @param  {object} Transfer - The persistent Transfer, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Transfer
 */
QuickBooks.prototype.updateTransfer = function(transfer, callback) {
  module.update(this, 'transfer', transfer, callback)
}

/**
 * Updates QuickBooks version of Vendor
 *
 * @param  {object} vendor - The persistent Vendor, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
QuickBooks.prototype.updateVendor = function(vendor, callback) {
  module.update(this, 'vendor', vendor, callback)
}

/**
 * Updates QuickBooks version of VendorCredit
 *
 * @param  {object} vendorCredit - The persistent VendorCredit, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
QuickBooks.prototype.updateVendorCredit = function(vendorCredit, callback) {
  module.update(this, 'vendorCredit', vendorCredit, callback)
}

/**
 * Updates QuickBooks version of ExchangeRate
 *
 * @param  {object} exchangeRate - The persistent ExchangeRate, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent ExchangeRate
 */
QuickBooks.prototype.updateExchangeRate = function(exchangeRate, callback) {
  module.update(this, 'exchangerate', exchangeRate, callback)
}


/**
 * Deletes the Attachable from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Attachable to be deleted, or the Id of the Attachable, in which case an extra GET request will be issued to first retrieve the Attachable
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Attachable
 */
QuickBooks.prototype.deleteAttachable = function(idOrEntity, callback) {
  module.delete(this, 'attachable', idOrEntity, callback)
}

/**
 * Deletes the Bill from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Bill to be deleted, or the Id of the Bill, in which case an extra GET request will be issued to first retrieve the Bill
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Bill
 */
QuickBooks.prototype.deleteBill = function(idOrEntity, callback) {
  module.delete(this, 'bill', idOrEntity, callback)
}

/**
 * Deletes the BillPayment from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent BillPayment to be deleted, or the Id of the BillPayment, in which case an extra GET request will be issued to first retrieve the BillPayment
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent BillPayment
 */
QuickBooks.prototype.deleteBillPayment = function(idOrEntity, callback) {
  module.delete(this, 'billPayment', idOrEntity, callback)
}

/**
 * Deletes the CreditMemo from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent CreditMemo to be deleted, or the Id of the CreditMemo, in which case an extra GET request will be issued to first retrieve the CreditMemo
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent CreditMemo
 */
QuickBooks.prototype.deleteCreditMemo = function(idOrEntity, callback) {
  module.delete(this, 'creditMemo', idOrEntity, callback)
}

/**
 * Deletes the Deposit from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Deposit to be deleted, or the Id of the Deposit, in which case an extra GET request will be issued to first retrieve the Deposit
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Deposit
 */
QuickBooks.prototype.deleteDeposit = function(idOrEntity, callback) {
  module.delete(this, 'deposit', idOrEntity, callback)
}

/**
 * Deletes the Estimate from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Estimate to be deleted, or the Id of the Estimate, in which case an extra GET request will be issued to first retrieve the Estimate
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Estimate
 */
QuickBooks.prototype.deleteEstimate = function(idOrEntity, callback) {
  module.delete(this, 'estimate', idOrEntity, callback)
}

/**
 * Deletes the Invoice from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Invoice to be deleted, or the Id of the Invoice, in which case an extra GET request will be issued to first retrieve the Invoice
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Invoice
 */
QuickBooks.prototype.deleteInvoice = function(idOrEntity, callback) {
  module.delete(this, 'invoice', idOrEntity, callback)
}

/**
 * Deletes the JournalCode from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent JournalCode to be deleted, or the Id of the JournalCode, in which case an extra GET request will be issued to first retrieve the JournalCode
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent JournalCode
 */
QuickBooks.prototype.deleteJournalCode = function(idOrEntity, callback) {
  module.delete(this, 'journalCode', idOrEntity, callback)
}

/**
 * Deletes the JournalEntry from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent JournalEntry to be deleted, or the Id of the JournalEntry, in which case an extra GET request will be issued to first retrieve the JournalEntry
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent JournalEntry
 */
QuickBooks.prototype.deleteJournalEntry = function(idOrEntity, callback) {
  module.delete(this, 'journalEntry', idOrEntity, callback)
}

/**
 * Deletes the Payment from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Payment to be deleted, or the Id of the Payment, in which case an extra GET request will be issued to first retrieve the Payment
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Payment
 */
QuickBooks.prototype.deletePayment = function(idOrEntity, callback) {
  module.delete(this, 'payment', idOrEntity, callback)
}

/**
 * Deletes the Purchase from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Purchase to be deleted, or the Id of the Purchase, in which case an extra GET request will be issued to first retrieve the Purchase
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Purchase
 */
QuickBooks.prototype.deletePurchase = function(idOrEntity, callback) {
  module.delete(this, 'purchase', idOrEntity, callback)
}

/**
 * Deletes the PurchaseOrder from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent PurchaseOrder to be deleted, or the Id of the PurchaseOrder, in which case an extra GET request will be issued to first retrieve the PurchaseOrder
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent PurchaseOrder
 */
QuickBooks.prototype.deletePurchaseOrder = function(idOrEntity, callback) {
  module.delete(this, 'purchaseOrder', idOrEntity, callback)
}

/**
 * Deletes the RefundReceipt from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent RefundReceipt to be deleted, or the Id of the RefundReceipt, in which case an extra GET request will be issued to first retrieve the RefundReceipt
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent RefundReceipt
 */
QuickBooks.prototype.deleteRefundReceipt = function(idOrEntity, callback) {
  module.delete(this, 'refundReceipt', idOrEntity, callback)
}

/**
 * Deletes the SalesReceipt from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent SalesReceipt to be deleted, or the Id of the SalesReceipt, in which case an extra GET request will be issued to first retrieve the SalesReceipt
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent SalesReceipt
 */
QuickBooks.prototype.deleteSalesReceipt = function(idOrEntity, callback) {
  module.delete(this, 'salesReceipt', idOrEntity, callback)
}

/**
 * Deletes the TimeActivity from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent TimeActivity to be deleted, or the Id of the TimeActivity, in which case an extra GET request will be issued to first retrieve the TimeActivity
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent TimeActivity
 */
QuickBooks.prototype.deleteTimeActivity = function(idOrEntity, callback) {
  module.delete(this, 'timeActivity', idOrEntity, callback)
}

/**
 * Deletes the Transfer from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Transfer to be deleted, or the Id of the Transfer, in which case an extra GET request will be issued to first retrieve the Transfer
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Transfer
 */
QuickBooks.prototype.deleteTransfer = function(idOrEntity, callback) {
  module.delete(this, 'transfer', idOrEntity, callback)
}

/**
 * Deletes the VendorCredit from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent VendorCredit to be deleted, or the Id of the VendorCredit, in which case an extra GET request will be issued to first retrieve the VendorCredit
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent VendorCredit
 */
QuickBooks.prototype.deleteVendorCredit = function(idOrEntity, callback) {
  module.delete(this, 'vendorCredit', idOrEntity, callback)
}



/**
 * Voids the Invoice from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Invoice to be voided, or the Id of the Invoice, in which case an extra GET request will be issued to first retrieve the Invoice
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
QuickBooks.prototype.voidInvoice = function (idOrEntity, callback) {
    module.void(this, 'invoice', idOrEntity, callback)
}

/**
 * Voids QuickBooks version of Payment
 *
 * @param  {object} payment - The persistent Payment, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
QuickBooks.prototype.voidPayment = function (payment, callback) {
    payment.void = true;
    payment.sparse = true;
    module.update(this, 'payment', payment, callback)
}


/**
 * Finds all Accounts in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Account
 */
QuickBooks.prototype.findAccounts = function(criteria, callback) {
  module.query(this, 'account', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Attachables in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Attachable
 */
QuickBooks.prototype.findAttachables = function(criteria, callback) {
  module.query(this, 'attachable', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Bills in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Bill
 */
QuickBooks.prototype.findBills = function(criteria, callback) {
  module.query(this, 'bill', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all BillPayments in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of BillPayment
 */
QuickBooks.prototype.findBillPayments = function(criteria, callback) {
  module.query(this, 'billPayment', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Budgets in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Budget
 */
QuickBooks.prototype.findBudgets = function(criteria, callback) {
  module.query(this, 'budget', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Classs in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Class
 */
QuickBooks.prototype.findClasses = function(criteria, callback) {
  module.query(this, 'class', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all CompanyInfos in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of CompanyInfo
 */
QuickBooks.prototype.findCompanyInfos = function(criteria, callback) {
  module.query(this, 'companyInfo', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all CreditMemos in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of CreditMemo
 */
QuickBooks.prototype.findCreditMemos = function(criteria, callback) {
  module.query(this, 'creditMemo', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Customers in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Customer
 */
QuickBooks.prototype.findCustomers = function(criteria, callback) {
  module.query(this, 'customer', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Departments in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Department
 */
QuickBooks.prototype.findDepartments = function(criteria, callback) {
  module.query(this, 'department', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Deposits in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Deposit
 */
QuickBooks.prototype.findDeposits = function(criteria, callback) {
  module.query(this, 'deposit', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Employees in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Employee
 */
QuickBooks.prototype.findEmployees = function(criteria, callback) {
  module.query(this, 'employee', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Estimates in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Estimate
 */
QuickBooks.prototype.findEstimates = function(criteria, callback) {
  module.query(this, 'estimate', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Invoices in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Invoice
 */
QuickBooks.prototype.findInvoices = function(criteria, callback) {
  module.query(this, 'invoice', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Items in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Item
 */
QuickBooks.prototype.findItems = function(criteria, callback) {
  module.query(this, 'item', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all JournalCodes in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of JournalCode
 */
QuickBooks.prototype.findJournalCodes = function(criteria, callback) {
  module.query(this, 'journalCode', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all JournalEntrys in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of JournalEntry
 */
QuickBooks.prototype.findJournalEntries = function(criteria, callback) {
  module.query(this, 'journalEntry', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Payments in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Payment
 */
QuickBooks.prototype.findPayments = function(criteria, callback) {
  module.query(this, 'payment', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all PaymentMethods in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of PaymentMethod
 */
QuickBooks.prototype.findPaymentMethods = function(criteria, callback) {
  module.query(this, 'paymentMethod', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Preferencess in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Preferences
 */
QuickBooks.prototype.findPreferenceses = function(criteria, callback) {
  module.query(this, 'preferences', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Purchases in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Purchase
 */
QuickBooks.prototype.findPurchases = function(criteria, callback) {
  module.query(this, 'purchase', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all PurchaseOrders in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of PurchaseOrder
 */
QuickBooks.prototype.findPurchaseOrders = function(criteria, callback) {
  module.query(this, 'purchaseOrder', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all RefundReceipts in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of RefundReceipt
 */
QuickBooks.prototype.findRefundReceipts = function(criteria, callback) {
  module.query(this, 'refundReceipt', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all SalesReceipts in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of SalesReceipt
 */
QuickBooks.prototype.findSalesReceipts = function(criteria, callback) {
  module.query(this, 'salesReceipt', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all TaxAgencys in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxAgency
 */
QuickBooks.prototype.findTaxAgencies = function(criteria, callback) {
  module.query(this, 'taxAgency', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all TaxCodes in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxCode
 */
QuickBooks.prototype.findTaxCodes = function(criteria, callback) {
  module.query(this, 'taxCode', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all TaxRates in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxRate
 */
QuickBooks.prototype.findTaxRates = function(criteria, callback) {
  module.query(this, 'taxRate', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Terms in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Term
 */
QuickBooks.prototype.findTerms = function(criteria, callback) {
  module.query(this, 'term', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all TimeActivitys in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TimeActivity
 */
QuickBooks.prototype.findTimeActivities = function(criteria, callback) {
  module.query(this, 'timeActivity', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Transfers in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Transfer
 */
QuickBooks.prototype.findTransfers = function(criteria, callback) {
  module.query(this, 'transfer', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all Vendors in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Vendor
 */
QuickBooks.prototype.findVendors = function(criteria, callback) {
  module.query(this, 'vendor', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all VendorCredits in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of VendorCredit
 */
QuickBooks.prototype.findVendorCredits = function(criteria, callback) {
  module.query(this, 'vendorCredit', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}

/**
 * Finds all ExchangeRates in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of ExchangeRates
 */
QuickBooks.prototype.findExchangeRates = function(criteria, callback) {
  module.query(this, 'exchangerate', criteria).then(function(data) {
    (callback || criteria)(null, data)
  }).catch(function(err) {
    (callback || criteria)(err, err)
  })
}


/**
 * Retrieves the BalanceSheet Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the BalanceSheet Report
 */
QuickBooks.prototype.reportBalanceSheet = function(options, callback) {
  module.report(this, 'BalanceSheet', options, callback)
}

/**
 * Retrieves the ProfitAndLoss Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ProfitAndLoss Report
 */
QuickBooks.prototype.reportProfitAndLoss = function(options, callback) {
  module.report(this, 'ProfitAndLoss', options, callback)
}

/**
 * Retrieves the ProfitAndLossDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ProfitAndLossDetail Report
 */
QuickBooks.prototype.reportProfitAndLossDetail = function(options, callback) {
  module.report(this, 'ProfitAndLossDetail', options, callback)
}

/**
 * Retrieves the TrialBalance Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the TrialBalance Report
 */
QuickBooks.prototype.reportTrialBalance = function(options, callback) {
  module.report(this, 'TrialBalance', options, callback)
}

/**
 * Retrieves the CashFlow Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CashFlow Report
 */
QuickBooks.prototype.reportCashFlow = function(options, callback) {
  module.report(this, 'CashFlow', options, callback)
}

/**
 * Retrieves the InventoryValuationSummary Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the InventoryValuationSummary Report
 */
QuickBooks.prototype.reportInventoryValuationSummary = function(options, callback) {
  module.report(this, 'InventoryValuationSummary', options, callback)
}

/**
 * Retrieves the CustomerSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerSales Report
 */
QuickBooks.prototype.reportCustomerSales = function(options, callback) {
  module.report(this, 'CustomerSales', options, callback)
}

/**
 * Retrieves the ItemSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ItemSales Report
 */
QuickBooks.prototype.reportItemSales = function(options, callback) {
  module.report(this, 'ItemSales', options, callback)
}

/**
 * Retrieves the CustomerIncome Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerIncome Report
 */
QuickBooks.prototype.reportCustomerIncome = function(options, callback) {
  module.report(this, 'CustomerIncome', options, callback)
}

/**
 * Retrieves the CustomerBalance Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerBalance Report
 */
QuickBooks.prototype.reportCustomerBalance = function(options, callback) {
  module.report(this, 'CustomerBalance', options, callback)
}

/**
 * Retrieves the CustomerBalanceDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerBalanceDetail Report
 */
QuickBooks.prototype.reportCustomerBalanceDetail = function(options, callback) {
  module.report(this, 'CustomerBalanceDetail', options, callback)
}

/**
 * Retrieves the AgedReceivables Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedReceivables Report
 */
QuickBooks.prototype.reportAgedReceivables = function(options, callback) {
  module.report(this, 'AgedReceivables', options, callback)
}

/**
 * Retrieves the AgedReceivableDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedReceivableDetail Report
 */
QuickBooks.prototype.reportAgedReceivableDetail = function(options, callback) {
  module.report(this, 'AgedReceivableDetail', options, callback)
}

/**
 * Retrieves the VendorBalance Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorBalance Report
 */
QuickBooks.prototype.reportVendorBalance = function(options, callback) {
  module.report(this, 'VendorBalance', options, callback)
}

/**
 * Retrieves the VendorBalanceDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorBalanceDetail Report
 */
QuickBooks.prototype.reportVendorBalanceDetail = function(options, callback) {
  module.report(this, 'VendorBalanceDetail', options, callback)
}

/**
 * Retrieves the AgedPayables Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedPayables Report
 */
QuickBooks.prototype.reportAgedPayables = function(options, callback) {
  module.report(this, 'AgedPayables', options, callback)
}

/**
 * Retrieves the AgedPayableDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedPayableDetail Report
 */
QuickBooks.prototype.reportAgedPayableDetail = function(options, callback) {
  module.report(this, 'AgedPayableDetail', options, callback)
}

/**
 * Retrieves the VendorExpenses Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorExpenses Report
 */
QuickBooks.prototype.reportVendorExpenses = function(options, callback) {
  module.report(this, 'VendorExpenses', options, callback)
}

/**
 * Retrieves the TransactionList Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the TransactionList Report
 */
QuickBooks.prototype.reportTransactionList = function(options, callback) {
  module.report(this, 'TransactionList', options, callback)
}

/**
 * Retrieves the GeneralLedgerDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the GeneralLedgerDetail Report
 */
QuickBooks.prototype.reportGeneralLedgerDetail = function(options, callback) {
  module.report(this, 'GeneralLedger', options, callback)
}

/**
 * Retrieves the TaxSummary Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the TaxSummary Report
 */
QuickBooks.prototype.reportTaxSummary = function(options, callback) {
  module.report(this, 'TaxSummary', options, callback)
}

/**
 * Retrieves the DepartmentSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the DepartmentSales Report
 */
QuickBooks.prototype.reportDepartmentSales = function(options, callback) {
  module.report(this, 'DepartmentSales', options, callback)
}

/**
 * Retrieves the ClassSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ClassSales Report
 */
QuickBooks.prototype.reportClassSales = function(options, callback) {
  module.report(this, 'ClassSales', options, callback)
}

/**
 * Retrieves the AccountListDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AccountListDetail Report
 */
QuickBooks.prototype.reportAccountListDetail = function(options, callback) {
  module.report(this, 'AccountList', options, callback)
}

module.request = function(context, verb, options, entity, callback) {
  var url = context.endpoint + context.realmId + options.url
  if (options.url === QuickBooks.RECONNECT_URL || options.url == QuickBooks.DISCONNECT_URL || options.url === QuickBooks.REVOKE_URL || options.url === QuickBooks.USER_INFO_URL) {
    url = options.url
  }
  var opts = {
    url:     url,
    qs:      options.qs || {},
    headers: options.headers || {},
    json:    true
  }

  if (entity && entity.allowDuplicateDocNum) {
    delete entity.allowDuplicateDocNum;
    opts.qs.include = 'allowduplicatedocnum';
  }

  if (entity && entity.requestId) {
    opts.qs.requestid = entity.requestId;
    delete entity.requestId;
  } 

  opts.qs.minorversion = opts.qs.minorversion || context.minorversion;
  opts.headers['User-Agent'] = 'node-quickbooks: version ' + version
  opts.headers['Request-Id'] = uuid.v1()
  opts.qs.format = 'json';
  if (context.oauthversion == '2.0'){
      opts.headers['Authorization'] =  'Bearer ' + context.token
  } else {
        opts.oauth = module.oauth(context);
  };
  if (options.url.match(/pdf$/)) {
    opts.headers['accept'] = 'application/pdf'
    opts.encoding = null
  }
  if (entity !== null) {
    opts.body = entity
  }
  if (options.formData) {
    opts.formData = options.formData
  }
  if ('production' !== process.env.NODE_ENV && context.debug) {
    debug(request)
  }
  request[verb].call(context, opts, function (err, res, body) {
    if ('production' !== process.env.NODE_ENV && context.debug) {
      console.log('invoking endpoint: ' + url)
      console.log(entity || '')
      console.log(JSON.stringify(body, null, 2));
    }
    if (callback) {
      if (err ||
          res.statusCode >= 300 ||
          (_.isObject(body) && body.Fault && body.Fault.Error && body.Fault.Error.length) ||
          (_.isString(body) && !_.isEmpty(body) && body.indexOf('<') === 0)) {
        callback(err || body, body)
      } else {
        callback(null, body)
      }
    }
  })
}

module.xmlRequest = function(context, url, rootTag, callback) {
  module.request(context, 'get', {url:url}, null, (err, body) => {
    var json =
        body.constructor === {}.constructor ? body :
            (body.constructor === "".constructor ?
                (body.indexOf('<') === 0 ? jxon.stringToJs(body)[rootTag] : body) : body);
    callback(json.ErrorCode === 0 ? null : json, json);
  })
}



QuickBooks.prototype.reconnect = function(callback) {
  module.xmlRequest(this, QuickBooks.RECONNECT_URL, 'ReconnectResponse', callback);
}

QuickBooks.prototype.disconnect = function(callback) {
  module.xmlRequest(this, QuickBooks.DISCONNECT_URL, 'PlatformResponse', callback);
}

// **********************  CRUD Api **********************
module.create = function(context, entityName, entity, callback) {
  var url = '/' + entityName.toLowerCase()
  module.request(context, 'post', {url: url}, entity, module.unwrap(callback, entityName))
}

module.read = function(context, entityName, id, callback) {
  var url = '/' + entityName.toLowerCase()
  if (id) url = url + '/' + id
  module.request(context, 'get', {url: url}, null, module.unwrap(callback, entityName))
}

module.update = function(context, entityName, entity, callback) {
  if (_.isUndefined(entity.Id) ||
      _.isEmpty(entity.Id + '') ||
      _.isUndefined(entity.SyncToken) ||
      _.isEmpty(entity.SyncToken + '')) {
    if (entityName !== 'exchangerate') {
      throw new Error(entityName + ' must contain Id and SyncToken fields: ' +
          util.inspect(entity, {showHidden: false, depth: null}))
    }
  }
  if (! entity.hasOwnProperty('sparse')) {
    entity.sparse = true
  }
  var url = '/' + entityName.toLowerCase() + '?operation=update'
  var opts = {url: url}
  if (entity.void && entity.void.toString() === 'true') {
    opts.qs = { include: 'void' }
    delete entity.void
  }
  module.request(context, 'post', opts, entity, module.unwrap(callback, entityName))
}

module.delete = function(context, entityName, idOrEntity, callback) {
  var url = '/' + entityName.toLowerCase() + '?operation=delete'
  callback = callback || function() {}
  if (_.isObject(idOrEntity)) {
    module.request(context, 'post', {url: url}, idOrEntity, callback)
  } else {
    module.read(context, entityName, idOrEntity, function(err, entity) {
      if (err) {
        callback(err)
      } else {
        module.request(context, 'post', {url: url}, entity, callback)
      }
    })
  }
}

module.void = function (context, entityName, idOrEntity, callback) {
  var url = '/' + entityName.toLowerCase() + '?operation=void'
  callback = callback || function () { }
  if (_.isObject(idOrEntity)) {
    module.request(context, 'post', { url: url }, idOrEntity, callback)
  } else {
    module.read(context, entityName, idOrEntity, function (err, entity) {
      if (err) {
        callback(err)
      } else {
        module.request(context, 'post', { url: url }, entity, callback)
      }
    })
  }
}

// **********************  Query Api **********************
module.requestPromise = Promise.promisify(module.request)

module.query = function(context, entity, criteria) {
  var url = '/query?query@@select * from ' + entity
  var count = function(obj) {
    for (var p in obj) {
      if (obj[p] && p.toLowerCase() === 'count') {
        url = url.replace('select \* from', 'select count(*) from')
        delete obj[p]
      }
    }
  }
  count(criteria)
  if (_.isArray(criteria)) {
    for (var i = 0; i < criteria.length; i++) {
      if (_.isObject(criteria[i])) {
        var j = Object.keys(criteria[i]).length
        count(criteria[i])
        if (j !== Object.keys(criteria[i]).length) {
          criteria.splice(i, i + 1)
        }
      }
    }
  }

  var fetchAll = false, limit = 1000, offset = 1
  if (_.isArray(criteria)) {
    var lmt = _.find(criteria, function(obj) {
      return obj.field && obj.field === 'limit'
    })
    if (lmt) limit = lmt.value
    var ofs = _.find(criteria, function(obj) {
      return obj.field && obj.field === 'offset'
    })
    if (! ofs) {
      criteria.push({field: 'offset', value: 1})
    } else {
      offset = ofs.value
    }
    var fa = _.find(criteria, function(obj) {
      return obj.field && obj.field === 'fetchAll'
    })
    if (fa && fa.value) fetchAll = true
  } else if (_.isObject(criteria)) {
    limit = criteria.limit = criteria.limit || 1000
    offset = criteria.offset = criteria.offset || 1
    if (criteria.fetchAll) fetchAll = true
  }

  if (criteria && !_.isFunction(criteria)) {
    url += module.criteriaToString(criteria) || ''
    url = url.replace(/%/g, '%25')
             .replace(/'/g, '%27')
             .replace(/=/g, '%3D')
             .replace(/</g, '%3C')
             .replace(/>/g, '%3E')
             .replace(/&/g, '%26')
             .replace(/#/g, '%23')
             .replace(/\\/g, '%5C')
             .replace(/\+/g, '%2B')
  }
  url = url.replace('@@', '=')

  return new Promise(function(resolve, reject) {
    module.requestPromise(context, 'get', {url: url}, null).then(function(data) {
      var fields = Object.keys(data.QueryResponse)
      var key = _.find(fields, function(k) { return k.toLowerCase() === entity.toLowerCase()})
      if (fetchAll) {
        if (data && data.QueryResponse && data.QueryResponse.maxResults === limit) {
          if (_.isArray(criteria)) {
            _.each(criteria, function(e) {
              if (e.field === 'offset') e.value = e.value + limit
            })
          } else if (_.isObject(criteria)) {
            criteria.offset = criteria.offset + limit
          }
          return module.query(context, entity, criteria).then(function(more) {
            data.QueryResponse[key] = data.QueryResponse[key].concat(more.QueryResponse[key] || [])
            data.QueryResponse.maxResults = data.QueryResponse.maxResults + (more.QueryResponse.maxResults || 0)
            data.time = more.time || data.time
            resolve(data)
          })
        } else {
          resolve(data)
        }
      } else {
        resolve(data)
      }
    }).catch(function(err) {
      reject(err)
    })
  })
}


// **********************  Report Api **********************
module.report = function(context, reportType, criteria, callback) {
  var url = '/reports/' + reportType
  if (criteria && typeof criteria !== 'function') {
    url += module.reportCriteria(criteria) || ''
  }
  module.request(context, 'get', {url: url}, null, typeof criteria === 'function' ? criteria : callback)
}


module.oauth = function(context) {
  return {
    consumer_key:    context.consumerKey,
    consumer_secret: context.consumerSecret,
    token:           context.token,
    token_secret:    context.tokenSecret
  }
}

module.isNumeric = function(n) {
  return ! isNaN(parseFloat(n)) && isFinite(n);
}

module.checkProperty = function(field, name) {
  return (field && field.toLowerCase() === name)
}

module.toCriterion = function(c) {
  var fields = _.keys(c)
  if (_.intersection(fields, ['field', 'value']).length === 2) {
    return {
      field: c.field,
      value: c.value,
      operator: c.operator || '='
    }
  } else {
    return fields.map(function(k) {
      return {
        field: k,
        value: c[k],
        operator: _.isArray(c[k]) ? 'IN' : '='
      }
    })
  }
}

module.criteriaToString = function(criteria) {
  if (_.isString(criteria)) return criteria.indexOf(' ') === 0 ? criteria : " " + criteria
  var cs = _.isArray(criteria) ? criteria.map(module.toCriterion) : module.toCriterion(criteria)
  var flattened = _.flatten(cs)
  var sql = '', limit, offset, desc, asc
  for (var i=0, l=flattened.length; i<l; i++) {
    var criterion = flattened[i];
    if (module.checkProperty(criterion.field, 'fetchall')) {
      continue
    }
    if (module.checkProperty(criterion.field, 'limit')) {
      limit = criterion.value
      continue
    }
    if (module.checkProperty(criterion.field, 'offset')) {
      offset = criterion.value
      continue
    }
    if (module.checkProperty(criterion.field, 'desc')) {
      desc = criterion.value
      continue
    }
    if (module.checkProperty(criterion.field, 'asc')) {
      asc = criterion.value
      continue
    }
    if (sql != '') {
      sql += ' and '
    }
    sql += criterion.field + ' ' + criterion.operator + ' '
    var quote = function(x) {
      return _.isString(x) ? "'" + x.replace(/'/g, "\\'") + "'" : x
    }
    if (_.isArray(criterion.value)) {
      sql += '(' + criterion.value.map(quote).join(',') + ')'
    } else {
      sql += quote(criterion.value)
    }
  }
  if (sql != '') {
    sql = ' where ' + sql
  }
  if (asc)  sql += ' orderby ' + asc + ' asc'
  if (desc) sql += ' orderby ' + desc + ' desc'
  sql += ' startposition ' + (offset || 1)
  sql += ' maxresults ' + (limit || 1000)
  return sql
}

module.reportCriteria = function(criteria) {
  var s = '?'
  for (var p in criteria) {
    s += p + '=' + criteria[p] + '&'
  }
  return s
}

module.capitalize = function(s) {
  return s.substring(0, 1).toUpperCase() + s.substring(1)
}

QuickBooks.prototype.capitalize = module.capitalize

module.pluralize = function(s) {
  var last = s.substring(s.length - 1)
  if (last === 's') {
    return s + "es"
  } else if (last === 'y') {
    return s.substring(0, s.length - 1) + "ies"
  } else {
    return s + 's'
  }
}

QuickBooks.prototype.pluralize = module.pluralize

module.unwrap = function(callback, entityName) {
  if (! callback) return function(err, data) {}
  return function(err, data) {
    if (err) {
      if (callback) callback(err)
    } else {
      var name = module.capitalize(entityName)
      if (callback) callback(err, (data || {})[name] || data)
    }
  }
}
