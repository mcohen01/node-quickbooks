/**
 * @file Node.js client for Quickbooks V3 API
 * @name node-quickbooks
 * @author Michael Cohen <michael_cohen@intuit.com>
 * @license ISC
 * @copyright 2014 Michael Cohen
 */

var request = require('request'),
    util    = require('util'),
    _       = require('underscore')

module.exports = Quickbooks

Quickbooks.REQUEST_TOKEN_URL    = 'https://oauth.intuit.com/oauth/v1/get_request_token'
Quickbooks.ACCESS_TOKEN_URL     = 'https://oauth.intuit.com/oauth/v1/get_access_token'
Quickbooks.APP_CENTER_URL       = 'https://appcenter.intuit.com/Connect/Begin?oauth_token='
Quickbooks.V3_ENDPOINT_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company/'

/**
 * Node.js client encapsulating access to the Quickbooks V3 Rest API. An instance
 * of this class should be instantiated on behalf of each user accessing the api.
 *
 * @param consumerKey - application key
 * @param consumerSecret  - application password
 * @param token - the OAuth generated user-specific key
 * @param tokenSecret - the OAuth generated user-specific password
 * @param realmId - Quickbooks companyId, returned as a request parameter when the user is redirected to the provided callback URL following authentication
 * @param debug - boolean flag to turn on logging of HTTP requests, including headers and body
 * @constructor
 */
function Quickbooks(consumerKey, consumerSecret, token, tokenSecret, realmId, debug) {
  if (_.isObject(consumerKey)) {
    var config = consumerKey
    this.consumerKey    = config.consumerKey
    this.consumerSecret = config.consumerSecret
    this.token          = config.token
    this.tokenSecret    = config.tokenSecret
    this.realmId        = config.realmId
    this.debug          = config.debug
  } else {
    this.consumerKey    = consumerKey
    this.consumerSecret = consumerSecret
    this.token          = token
    this.tokenSecret    = tokenSecret
    this.realmId        = realmId
    this.debug          = debug
  }
}


Quickbooks.prototype.oauth = function() {
  return {
    consumer_key:    this.consumerKey,
    consumer_secret: this.consumerSecret,
    token:           this.token,
    token_secret:    this.tokenSecret
  }
}

Quickbooks.prototype.isNumeric = function(n) {
  return ! isNaN(parseFloat(n)) && isFinite(n);
}

Quickbooks.prototype.criteriaToString = function(criteria) {
  if (_.isString(criteria)) {
    return criteria
  } else if (_.isObject(criteria)) {
    if (_.isObject(criteria)) {
      var s = ' where '
      for (var p in criteria) {
        if (s != ' where ') {
          throw new Error('Only one condition allowed in where clause')
        }
        s += p + ' = '
        if (this.isNumeric(criteria[p])) {
          s += criteria[p]
        } else {
          s += "'" + criteria[p] + "'"
        }
      }
      return s
    }
  }
}

Quickbooks.prototype.reportCriteria = function(criteria) {
  var s = '?'
  for (var p in criteria) {
    s += p + '=' + criteria[p] + '&'
  }
  return s
}

Quickbooks.prototype.capitalize = function(s) {
  return s.substring(0, 1).toUpperCase() + s.substring(1)
}

Quickbooks.prototype.pluralize = function(s) {
  var last = _.last(s.split(''))
  if (last === 's') {
    return s + "es"
  } else if (last === 'y') {
    return s.substring(0, s.length - 1) + "ies"
  } else {
    return s + 's'
  }
}

Quickbooks.prototype.unwrap = function(callback, entityName) {
  var that = this
  //if (! callback) return function(err, data) {}
  return function(err, data) {
    if (err) {
      if (callback) callback(err)
    } else {
      var name = that.capitalize(entityName)
      if (callback) callback(err, data[name] ? data[name] : data)
    }
  }
}


Quickbooks.prototype.request = function(verb, url, entity, callback) {
  var that = this,
      url = Quickbooks.V3_ENDPOINT_BASE_URL + this.realmId + url,
      options = {
        url:   url,
        oauth: that.oauth(),
        json:  true
      }
  if (entity !== null) {
    options.body = entity
  }
  request[verb].call(this, options, function (err, res, body) {
    if ('production' != process.env.NODE_ENV && that.debug) {
      var msg = 'invoking endpoint: ' + url
      if (entity !== null) {
        msg = msg + ' with: '
        console.log(msg)
        console.log(entity)
      } else {
        console.log(msg)
      }
      console.log(res.headers)
      console.log(util.inspect(body, {showHidden: false, depth: null}));
    }
    if (callback) {
      callback(err, body)
    } else {
      return
    }
  })
}

Quickbooks.prototype.create = function(entityName, entity, callback) {
  var url = '/' + entityName.toLowerCase()
  this.request('post', url, entity, this.unwrap(callback, entityName))
}

Quickbooks.prototype.read = function(entityName, id, callback) {
  var url = '/' + entityName.toLowerCase() + '/' + id, that = this
  this.request('get', url, null, this.unwrap(callback, entityName))
}

Quickbooks.prototype.update = function(entityName, entity, callback) {
  if (! entity.Id || ! entity.SyncToken) {
    throw new Error(entityName + ' must contain Id and SyncToken fields: ' +
                    util.inspect(entity, {showHidden: false, depth: null}))
  }
  var url = '/' + entityName.toLowerCase() + '?operation=update'
  this.request('post', url, entity, this.unwrap(callback, entityName))
}

Quickbooks.prototype.delete = function(entityName, idOrEntity, callback) {
  var url = '/' + entityName.toLowerCase() + '?operation=delete', that = this
  callback = callback || function(e, r) {}
  if (_.isObject(idOrEntity)) {
    this.request('post', url, idOrEntity, callback)
  } else {
    this.read(entityName, idOrEntity, function(err, entity) {
      if (err) {
        callback(err)
      } else {
        that.request('post', url, entity, callback)
      }
    })
  }
}

Quickbooks.prototype.query = function(entity, criteria, callback) {
  var url = '/query?query@@select * from ' + entity
  if (criteria && typeof criteria !== 'function') {
    url += this.criteriaToString(criteria) || ''
    url = url.replace(/'/g, '%27').replace(/=/, '%3D')
  }
  url = url.replace('@@', '=')
  this.request('get', url, null, typeof criteria === 'function' ? criteria : callback)
}

Quickbooks.prototype.report = function(reportType, criteria, callback) {
  var url = '/reports/' + reportType
  if (criteria && typeof criteria !== 'function') {
    url += this.reportCriteria(criteria) || ''
  }
  this.request('get', url, null, typeof criteria === 'function' ? criteria : callback)
}


/**
 * Creates the Account in Quickbooks
 *
 * @param  {object} account - The unsaved account, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
Quickbooks.prototype.createAccount = function(account, callback) {
  this.create('account', account, callback)
}

/**
 * Creates the Attachable in Quickbooks
 *
 * @param  {object} attachable - The unsaved attachable, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
Quickbooks.prototype.createAttachable = function(attachable, callback) {
  this.create('attachable', attachable, callback)
}

/**
 * Creates the Bill in Quickbooks
 *
 * @param  {object} bill - The unsaved bill, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
Quickbooks.prototype.createBill = function(bill, callback) {
  this.create('bill', bill, callback)
}

/**
 * Creates the BillPayment in Quickbooks
 *
 * @param  {object} billPayment - The unsaved billPayment, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
Quickbooks.prototype.createBillPayment = function(billPayment, callback) {
  this.create('billPayment', billPayment, callback)
}

/**
 * Creates the Class in Quickbooks
 *
 * @param  {object} class - The unsaved class, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
Quickbooks.prototype.createClass = function(klass, callback) {
  this.create('class', klass, callback)
}

/**
 * Creates the CreditMemo in Quickbooks
 *
 * @param  {object} creditMemo - The unsaved creditMemo, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
Quickbooks.prototype.createCreditMemo = function(creditMemo, callback) {
  this.create('creditMemo', creditMemo, callback)
}

/**
 * Creates the Customer in Quickbooks
 *
 * @param  {object} customer - The unsaved customer, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
Quickbooks.prototype.createCustomer = function(customer, callback) {
  this.create('customer', customer, callback)
}

/**
 * Creates the Department in Quickbooks
 *
 * @param  {object} department - The unsaved department, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
Quickbooks.prototype.createDepartment = function(department, callback) {
  this.create('department', department, callback)
}

/**
 * Creates the Employee in Quickbooks
 *
 * @param  {object} employee - The unsaved employee, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
Quickbooks.prototype.createEmployee = function(employee, callback) {
  this.create('employee', employee, callback)
}

/**
 * Creates the Estimate in Quickbooks
 *
 * @param  {object} estimate - The unsaved estimate, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
Quickbooks.prototype.createEstimate = function(estimate, callback) {
  this.create('estimate', estimate, callback)
}

/**
 * Creates the Invoice in Quickbooks
 *
 * @param  {object} invoice - The unsaved invoice, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
Quickbooks.prototype.createInvoice = function(invoice, callback) {
  this.create('invoice', invoice, callback)
}

/**
 * Creates the Item in Quickbooks
 *
 * @param  {object} item - The unsaved item, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
Quickbooks.prototype.createItem = function(item, callback) {
  this.create('item', item, callback)
}

/**
 * Creates the JournalEntry in Quickbooks
 *
 * @param  {object} journalEntry - The unsaved journalEntry, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
Quickbooks.prototype.createJournalEntry = function(journalEntry, callback) {
  this.create('journalEntry', journalEntry, callback)
}

/**
 * Creates the Payment in Quickbooks
 *
 * @param  {object} payment - The unsaved payment, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
Quickbooks.prototype.createPayment = function(payment, callback) {
  this.create('payment', payment, callback)
}

/**
 * Creates the PaymentMethod in Quickbooks
 *
 * @param  {object} paymentMethod - The unsaved paymentMethod, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
Quickbooks.prototype.createPaymentMethod = function(paymentMethod, callback) {
  this.create('paymentMethod', paymentMethod, callback)
}

/**
 * Creates the Purchase in Quickbooks
 *
 * @param  {object} purchase - The unsaved purchase, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
Quickbooks.prototype.createPurchase = function(purchase, callback) {
  this.create('purchase', purchase, callback)
}

/**
 * Creates the PurchaseOrder in Quickbooks
 *
 * @param  {object} purchaseOrder - The unsaved purchaseOrder, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
Quickbooks.prototype.createPurchaseOrder = function(purchaseOrder, callback) {
  this.create('purchaseOrder', purchaseOrder, callback)
}

/**
 * Creates the RefundReceipt in Quickbooks
 *
 * @param  {object} refundReceipt - The unsaved refundReceipt, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
Quickbooks.prototype.createRefundReceipt = function(refundReceipt, callback) {
  this.create('refundReceipt', refundReceipt, callback)
}

/**
 * Creates the SalesReceipt in Quickbooks
 *
 * @param  {object} salesReceipt - The unsaved salesReceipt, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
Quickbooks.prototype.createSalesReceipt = function(salesReceipt, callback) {
  this.create('salesReceipt', salesReceipt, callback)
}

/**
 * Creates the TaxAgency in Quickbooks
 *
 * @param  {object} taxAgency - The unsaved taxAgency, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
Quickbooks.prototype.createTaxAgency = function(taxAgency, callback) {
  this.create('taxAgency', taxAgency, callback)
}

/**
 * Creates the TaxService in Quickbooks
 *
 * @param  {object} taxService - The unsaved taxService, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxService
 */
Quickbooks.prototype.createTaxService = function(taxService, callback) {
  this.create('taxService', taxService, callback)
}

/**
 * Creates the Term in Quickbooks
 *
 * @param  {object} term - The unsaved term, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
Quickbooks.prototype.createTerm = function(term, callback) {
  this.create('term', term, callback)
}

/**
 * Creates the TimeActivity in Quickbooks
 *
 * @param  {object} timeActivity - The unsaved timeActivity, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
Quickbooks.prototype.createTimeActivity = function(timeActivity, callback) {
  this.create('timeActivity', timeActivity, callback)
}

/**
 * Creates the Vendor in Quickbooks
 *
 * @param  {object} vendor - The unsaved vendor, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
Quickbooks.prototype.createVendor = function(vendor, callback) {
  this.create('vendor', vendor, callback)
}

/**
 * Creates the VendorCredit in Quickbooks
 *
 * @param  {object} vendorCredit - The unsaved vendorCredit, to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
Quickbooks.prototype.createVendorCredit = function(vendorCredit, callback) {
  this.create('vendorCredit', vendorCredit, callback)
}



/**
 * Retrieves the Account from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Account
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
Quickbooks.prototype.getAccount = function(id, callback) {
  this.read('account', id, callback)
}

/**
 * Retrieves the Attachable from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Attachable
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
Quickbooks.prototype.getAttachable = function(id, callback) {
  this.read('attachable', id, callback)
}

/**
 * Retrieves the Bill from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Bill
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
Quickbooks.prototype.getBill = function(id, callback) {
  this.read('bill', id, callback)
}

/**
 * Retrieves the BillPayment from Quickbooks
 *
 * @param  {string} Id - The Id of persistent BillPayment
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
Quickbooks.prototype.getBillPayment = function(id, callback) {
  this.read('billPayment', id, callback)
}

/**
 * Retrieves the Class from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Class
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
Quickbooks.prototype.getClass = function(id, callback) {
  this.read('class', id, callback)
}

/**
 * Retrieves the CompanyInfo from Quickbooks
 *
 * @param  {string} Id - The Id of persistent CompanyInfo
 * @param  {function} callback - Callback function which is called with any error and the persistent CompanyInfo
 */
Quickbooks.prototype.getCompanyInfo = function(id, callback) {
  this.read('companyInfo', id, callback)
}

/**
 * Retrieves the CreditMemo from Quickbooks
 *
 * @param  {string} Id - The Id of persistent CreditMemo
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
Quickbooks.prototype.getCreditMemo = function(id, callback) {
  this.read('creditMemo', id, callback)
}

/**
 * Retrieves the Customer from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Customer
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
Quickbooks.prototype.getCustomer = function(id, callback) {
  this.read('customer', id, callback)
}

/**
 * Retrieves the Department from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Department
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
Quickbooks.prototype.getDepartment = function(id, callback) {
  this.read('department', id, callback)
}

/**
 * Retrieves the Employee from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Employee
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
Quickbooks.prototype.getEmployee = function(id, callback) {
  this.read('employee', id, callback)
}

/**
 * Retrieves the Estimate from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Estimate
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
Quickbooks.prototype.getEstimate = function(id, callback) {
  this.read('estimate', id, callback)
}

/**
 * Retrieves the Invoice from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Invoice
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
Quickbooks.prototype.getInvoice = function(id, callback) {
  this.read('invoice', id, callback)
}

/**
 * Retrieves the Item from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Item
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
Quickbooks.prototype.getItem = function(id, callback) {
  this.read('item', id, callback)
}

/**
 * Retrieves the JournalEntry from Quickbooks
 *
 * @param  {string} Id - The Id of persistent JournalEntry
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
Quickbooks.prototype.getJournalEntry = function(id, callback) {
  this.read('journalEntry', id, callback)
}

/**
 * Retrieves the Payment from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Payment
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
Quickbooks.prototype.getPayment = function(id, callback) {
  this.read('payment', id, callback)
}

/**
 * Retrieves the PaymentMethod from Quickbooks
 *
 * @param  {string} Id - The Id of persistent PaymentMethod
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
Quickbooks.prototype.getPaymentMethod = function(id, callback) {
  this.read('paymentMethod', id, callback)
}

/**
 * Retrieves the Preferences from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Preferences
 * @param  {function} callback - Callback function which is called with any error and the persistent Preferences
 */
Quickbooks.prototype.getPreferences = function(id, callback) {
  this.read('preferences', id, callback)
}

/**
 * Retrieves the Purchase from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Purchase
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
Quickbooks.prototype.getPurchase = function(id, callback) {
  this.read('purchase', id, callback)
}

/**
 * Retrieves the PurchaseOrder from Quickbooks
 *
 * @param  {string} Id - The Id of persistent PurchaseOrder
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
Quickbooks.prototype.getPurchaseOrder = function(id, callback) {
  this.read('purchaseOrder', id, callback)
}

/**
 * Retrieves the RefundReceipt from Quickbooks
 *
 * @param  {string} Id - The Id of persistent RefundReceipt
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
Quickbooks.prototype.getRefundReceipt = function(id, callback) {
  this.read('refundReceipt', id, callback)
}

/**
 * Retrieves the Reports from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Reports
 * @param  {function} callback - Callback function which is called with any error and the persistent Reports
 */
Quickbooks.prototype.getReports = function(id, callback) {
  this.read('reports', id, callback)
}

/**
 * Retrieves the SalesReceipt from Quickbooks
 *
 * @param  {string} Id - The Id of persistent SalesReceipt
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
Quickbooks.prototype.getSalesReceipt = function(id, callback) {
  this.read('salesReceipt', id, callback)
}

/**
 * Retrieves the TaxAgency from Quickbooks
 *
 * @param  {string} Id - The Id of persistent TaxAgency
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
Quickbooks.prototype.getTaxAgency = function(id, callback) {
  this.read('taxAgency', id, callback)
}

/**
 * Retrieves the TaxCode from Quickbooks
 *
 * @param  {string} Id - The Id of persistent TaxCode
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxCode
 */
Quickbooks.prototype.getTaxCode = function(id, callback) {
  this.read('taxCode', id, callback)
}

/**
 * Retrieves the TaxRate from Quickbooks
 *
 * @param  {string} Id - The Id of persistent TaxRate
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxRate
 */
Quickbooks.prototype.getTaxRate = function(id, callback) {
  this.read('taxRate', id, callback)
}

/**
 * Retrieves the Term from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Term
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
Quickbooks.prototype.getTerm = function(id, callback) {
  this.read('term', id, callback)
}

/**
 * Retrieves the TimeActivity from Quickbooks
 *
 * @param  {string} Id - The Id of persistent TimeActivity
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
Quickbooks.prototype.getTimeActivity = function(id, callback) {
  this.read('timeActivity', id, callback)
}

/**
 * Retrieves the Vendor from Quickbooks
 *
 * @param  {string} Id - The Id of persistent Vendor
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
Quickbooks.prototype.getVendor = function(id, callback) {
  this.read('vendor', id, callback)
}

/**
 * Retrieves the VendorCredit from Quickbooks
 *
 * @param  {string} Id - The Id of persistent VendorCredit
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
Quickbooks.prototype.getVendorCredit = function(id, callback) {
  this.read('vendorCredit', id, callback)
}



/**
 * Updates Quickbooks version of Account
 *
 * @param  {object} account - The persistent Account, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
Quickbooks.prototype.updateAccount = function(account, callback) {
  this.update('account', account, callback)
}

/**
 * Updates Quickbooks version of Attachable
 *
 * @param  {object} attachable - The persistent Attachable, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
Quickbooks.prototype.updateAttachable = function(attachable, callback) {
  this.update('attachable', attachable, callback)
}

/**
 * Updates Quickbooks version of Bill
 *
 * @param  {object} bill - The persistent Bill, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
Quickbooks.prototype.updateBill = function(bill, callback) {
  this.update('bill', bill, callback)
}

/**
 * Updates Quickbooks version of BillPayment
 *
 * @param  {object} billPayment - The persistent BillPayment, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
Quickbooks.prototype.updateBillPayment = function(billPayment, callback) {
  this.update('billPayment', billPayment, callback)
}

/**
 * Updates Quickbooks version of Class
 *
 * @param  {object} class - The persistent Class, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
Quickbooks.prototype.updateClass = function(klass, callback) {
  this.update('class', klass, callback)
}

/**
 * Updates Quickbooks version of CompanyInfo
 *
 * @param  {object} companyInfo - The persistent CompanyInfo, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent CompanyInfo
 */
Quickbooks.prototype.updateCompanyInfo = function(companyInfo, callback) {
  this.update('companyInfo', companyInfo, callback)
}

/**
 * Updates Quickbooks version of CreditMemo
 *
 * @param  {object} creditMemo - The persistent CreditMemo, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
Quickbooks.prototype.updateCreditMemo = function(creditMemo, callback) {
  this.update('creditMemo', creditMemo, callback)
}

/**
 * Updates Quickbooks version of Customer
 *
 * @param  {object} customer - The persistent Customer, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
Quickbooks.prototype.updateCustomer = function(customer, callback) {
  this.update('customer', customer, callback)
}

/**
 * Updates Quickbooks version of Department
 *
 * @param  {object} department - The persistent Department, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
Quickbooks.prototype.updateDepartment = function(department, callback) {
  this.update('department', department, callback)
}

/**
 * Updates Quickbooks version of Employee
 *
 * @param  {object} employee - The persistent Employee, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
Quickbooks.prototype.updateEmployee = function(employee, callback) {
  this.update('employee', employee, callback)
}

/**
 * Updates Quickbooks version of Estimate
 *
 * @param  {object} estimate - The persistent Estimate, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
Quickbooks.prototype.updateEstimate = function(estimate, callback) {
  this.update('estimate', estimate, callback)
}

/**
 * Updates Quickbooks version of Invoice
 *
 * @param  {object} invoice - The persistent Invoice, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
Quickbooks.prototype.updateInvoice = function(invoice, callback) {
  this.update('invoice', invoice, callback)
}

/**
 * Updates Quickbooks version of Item
 *
 * @param  {object} item - The persistent Item, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
Quickbooks.prototype.updateItem = function(item, callback) {
  this.update('item', item, callback)
}

/**
 * Updates Quickbooks version of JournalEntry
 *
 * @param  {object} journalEntry - The persistent JournalEntry, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
Quickbooks.prototype.updateJournalEntry = function(journalEntry, callback) {
  this.update('journalEntry', journalEntry, callback)
}

/**
 * Updates Quickbooks version of Payment
 *
 * @param  {object} payment - The persistent Payment, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
Quickbooks.prototype.updatePayment = function(payment, callback) {
  this.update('payment', payment, callback)
}

/**
 * Updates Quickbooks version of PaymentMethod
 *
 * @param  {object} paymentMethod - The persistent PaymentMethod, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
Quickbooks.prototype.updatePaymentMethod = function(paymentMethod, callback) {
  this.update('paymentMethod', paymentMethod, callback)
}

/**
 * Updates Quickbooks version of Preferences
 *
 * @param  {object} preferences - The persistent Preferences, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Preferences
 */
Quickbooks.prototype.updatePreferences = function(preferences, callback) {
  this.update('preferences', preferences, callback)
}

/**
 * Updates Quickbooks version of Purchase
 *
 * @param  {object} purchase - The persistent Purchase, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
Quickbooks.prototype.updatePurchase = function(purchase, callback) {
  this.update('purchase', purchase, callback)
}

/**
 * Updates Quickbooks version of PurchaseOrder
 *
 * @param  {object} purchaseOrder - The persistent PurchaseOrder, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
Quickbooks.prototype.updatePurchaseOrder = function(purchaseOrder, callback) {
  this.update('purchaseOrder', purchaseOrder, callback)
}

/**
 * Updates Quickbooks version of RefundReceipt
 *
 * @param  {object} refundReceipt - The persistent RefundReceipt, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
Quickbooks.prototype.updateRefundReceipt = function(refundReceipt, callback) {
  this.update('refundReceipt', refundReceipt, callback)
}

/**
 * Updates Quickbooks version of SalesReceipt
 *
 * @param  {object} salesReceipt - The persistent SalesReceipt, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
Quickbooks.prototype.updateSalesReceipt = function(salesReceipt, callback) {
  this.update('salesReceipt', salesReceipt, callback)
}

/**
 * Updates Quickbooks version of TaxAgency
 *
 * @param  {object} taxAgency - The persistent TaxAgency, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
Quickbooks.prototype.updateTaxAgency = function(taxAgency, callback) {
  this.update('taxAgency', taxAgency, callback)
}

/**
 * Updates Quickbooks version of TaxCode
 *
 * @param  {object} taxCode - The persistent TaxCode, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxCode
 */
Quickbooks.prototype.updateTaxCode = function(taxCode, callback) {
  this.update('taxCode', taxCode, callback)
}

/**
 * Updates Quickbooks version of TaxRate
 *
 * @param  {object} taxRate - The persistent TaxRate, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxRate
 */
Quickbooks.prototype.updateTaxRate = function(taxRate, callback) {
  this.update('taxRate', taxRate, callback)
}

/**
 * Updates Quickbooks version of TaxService
 *
 * @param  {object} taxService - The persistent TaxService, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxService
 */
Quickbooks.prototype.updateTaxService = function(taxService, callback) {
  this.update('taxService', taxService, callback)
}

/**
 * Updates Quickbooks version of Term
 *
 * @param  {object} term - The persistent Term, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
Quickbooks.prototype.updateTerm = function(term, callback) {
  this.update('term', term, callback)
}

/**
 * Updates Quickbooks version of TimeActivity
 *
 * @param  {object} timeActivity - The persistent TimeActivity, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
Quickbooks.prototype.updateTimeActivity = function(timeActivity, callback) {
  this.update('timeActivity', timeActivity, callback)
}

/**
 * Updates Quickbooks version of Vendor
 *
 * @param  {object} vendor - The persistent Vendor, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
Quickbooks.prototype.updateVendor = function(vendor, callback) {
  this.update('vendor', vendor, callback)
}

/**
 * Updates Quickbooks version of VendorCredit
 *
 * @param  {object} vendorCredit - The persistent VendorCredit, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
Quickbooks.prototype.updateVendorCredit = function(vendorCredit, callback) {
  this.update('vendorCredit', vendorCredit, callback)
}



/**
 * Deletes the Attachable from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent Attachable to be deleted, or the Id of the Attachable, in which case an extra GET request will be issued to first retrieve the Attachable
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Attachable
 */
Quickbooks.prototype.deleteAttachable = function(idOrEntity, callback) {
  this.delete('attachable', idOrEntity, callback)
}

/**
 * Deletes the Bill from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent Bill to be deleted, or the Id of the Bill, in which case an extra GET request will be issued to first retrieve the Bill
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Bill
 */
Quickbooks.prototype.deleteBill = function(idOrEntity, callback) {
  this.delete('bill', idOrEntity, callback)
}

/**
 * Deletes the BillPayment from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent BillPayment to be deleted, or the Id of the BillPayment, in which case an extra GET request will be issued to first retrieve the BillPayment
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent BillPayment
 */
Quickbooks.prototype.deleteBillPayment = function(idOrEntity, callback) {
  this.delete('billPayment', idOrEntity, callback)
}

/**
 * Deletes the CreditMemo from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent CreditMemo to be deleted, or the Id of the CreditMemo, in which case an extra GET request will be issued to first retrieve the CreditMemo
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent CreditMemo
 */
Quickbooks.prototype.deleteCreditMemo = function(idOrEntity, callback) {
  this.delete('creditMemo', idOrEntity, callback)
}

/**
 * Deletes the Estimate from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent Estimate to be deleted, or the Id of the Estimate, in which case an extra GET request will be issued to first retrieve the Estimate
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Estimate
 */
Quickbooks.prototype.deleteEstimate = function(idOrEntity, callback) {
  this.delete('estimate', idOrEntity, callback)
}

/**
 * Deletes the Invoice from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent Invoice to be deleted, or the Id of the Invoice, in which case an extra GET request will be issued to first retrieve the Invoice
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Invoice
 */
Quickbooks.prototype.deleteInvoice = function(idOrEntity, callback) {
  this.delete('invoice', idOrEntity, callback)
}

/**
 * Deletes the JournalEntry from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent JournalEntry to be deleted, or the Id of the JournalEntry, in which case an extra GET request will be issued to first retrieve the JournalEntry
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent JournalEntry
 */
Quickbooks.prototype.deleteJournalEntry = function(idOrEntity, callback) {
  this.delete('journalEntry', idOrEntity, callback)
}

/**
 * Deletes the Payment from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent Payment to be deleted, or the Id of the Payment, in which case an extra GET request will be issued to first retrieve the Payment
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Payment
 */
Quickbooks.prototype.deletePayment = function(idOrEntity, callback) {
  this.delete('payment', idOrEntity, callback)
}

/**
 * Deletes the Purchase from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent Purchase to be deleted, or the Id of the Purchase, in which case an extra GET request will be issued to first retrieve the Purchase
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Purchase
 */
Quickbooks.prototype.deletePurchase = function(idOrEntity, callback) {
  this.delete('purchase', idOrEntity, callback)
}

/**
 * Deletes the PurchaseOrder from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent PurchaseOrder to be deleted, or the Id of the PurchaseOrder, in which case an extra GET request will be issued to first retrieve the PurchaseOrder
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent PurchaseOrder
 */
Quickbooks.prototype.deletePurchaseOrder = function(idOrEntity, callback) {
  this.delete('purchaseOrder', idOrEntity, callback)
}

/**
 * Deletes the RefundReceipt from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent RefundReceipt to be deleted, or the Id of the RefundReceipt, in which case an extra GET request will be issued to first retrieve the RefundReceipt
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent RefundReceipt
 */
Quickbooks.prototype.deleteRefundReceipt = function(idOrEntity, callback) {
  this.delete('refundReceipt', idOrEntity, callback)
}

/**
 * Deletes the SalesReceipt from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent SalesReceipt to be deleted, or the Id of the SalesReceipt, in which case an extra GET request will be issued to first retrieve the SalesReceipt
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent SalesReceipt
 */
Quickbooks.prototype.deleteSalesReceipt = function(idOrEntity, callback) {
  this.delete('salesReceipt', idOrEntity, callback)
}

/**
 * Deletes the TimeActivity from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent TimeActivity to be deleted, or the Id of the TimeActivity, in which case an extra GET request will be issued to first retrieve the TimeActivity
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent TimeActivity
 */
Quickbooks.prototype.deleteTimeActivity = function(idOrEntity, callback) {
  this.delete('timeActivity', idOrEntity, callback)
}

/**
 * Deletes the VendorCredit from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent VendorCredit to be deleted, or the Id of the VendorCredit, in which case an extra GET request will be issued to first retrieve the VendorCredit
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent VendorCredit
 */
Quickbooks.prototype.deleteVendorCredit = function(idOrEntity, callback) {
  this.delete('vendorCredit', idOrEntity, callback)
}



/**
 * Finds all Accounts in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Account
 */
Quickbooks.prototype.findAccounts = function(criteria, callback) {
  this.query('account', criteria, callback)
}

/**
 * Finds all Attachables in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Attachable
 */
Quickbooks.prototype.findAttachables = function(criteria, callback) {
  this.query('attachable', criteria, callback)
}

/**
 * Finds all Bills in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Bill
 */
Quickbooks.prototype.findBills = function(criteria, callback) {
  this.query('bill', criteria, callback)
}

/**
 * Finds all BillPayments in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of BillPayment
 */
Quickbooks.prototype.findBillPayments = function(criteria, callback) {
  this.query('billPayment', criteria, callback)
}

/**
 * Finds all Budgets in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Budget
 */
Quickbooks.prototype.findBudgets = function(criteria, callback) {
  this.query('budget', criteria, callback)
}

/**
 * Finds all Classs in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Class
 */
Quickbooks.prototype.findClasses = function(criteria, callback) {
  this.query('class', criteria, callback)
}

/**
 * Finds all CompanyInfos in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of CompanyInfo
 */
Quickbooks.prototype.findCompanyInfos = function(criteria, callback) {
  this.query('companyInfo', criteria, callback)
}

/**
 * Finds all CreditMemos in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of CreditMemo
 */
Quickbooks.prototype.findCreditMemos = function(criteria, callback) {
  this.query('creditMemo', criteria, callback)
}

/**
 * Finds all Customers in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Customer
 */
Quickbooks.prototype.findCustomers = function(criteria, callback) {
  this.query('customer', criteria, callback)
}

/**
 * Finds all Departments in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Department
 */
Quickbooks.prototype.findDepartments = function(criteria, callback) {
  this.query('department', criteria, callback)
}

/**
 * Finds all Employees in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Employee
 */
Quickbooks.prototype.findEmployees = function(criteria, callback) {
  this.query('employee', criteria, callback)
}

/**
 * Finds all Estimates in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Estimate
 */
Quickbooks.prototype.findEstimates = function(criteria, callback) {
  this.query('estimate', criteria, callback)
}

/**
 * Finds all Invoices in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Invoice
 */
Quickbooks.prototype.findInvoices = function(criteria, callback) {
  this.query('invoice', criteria, callback)
}

/**
 * Finds all Items in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Item
 */
Quickbooks.prototype.findItems = function(criteria, callback) {
  this.query('item', criteria, callback)
}

/**
 * Finds all JournalEntrys in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of JournalEntry
 */
Quickbooks.prototype.findJournalEntries = function(criteria, callback) {
  this.query('journalEntry', criteria, callback)
}

/**
 * Finds all Payments in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Payment
 */
Quickbooks.prototype.findPayments = function(criteria, callback) {
  this.query('payment', criteria, callback)
}

/**
 * Finds all PaymentMethods in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of PaymentMethod
 */
Quickbooks.prototype.findPaymentMethods = function(criteria, callback) {
  this.query('paymentMethod', criteria, callback)
}

/**
 * Finds all Preferencess in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Preferences
 */
Quickbooks.prototype.findPreferenceses = function(criteria, callback) {
  this.query('preferences', criteria, callback)
}

/**
 * Finds all Purchases in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Purchase
 */
Quickbooks.prototype.findPurchases = function(criteria, callback) {
  this.query('purchase', criteria, callback)
}

/**
 * Finds all PurchaseOrders in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of PurchaseOrder
 */
Quickbooks.prototype.findPurchaseOrders = function(criteria, callback) {
  this.query('purchaseOrder', criteria, callback)
}

/**
 * Finds all RefundReceipts in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of RefundReceipt
 */
Quickbooks.prototype.findRefundReceipts = function(criteria, callback) {
  this.query('refundReceipt', criteria, callback)
}

/**
 * Finds all SalesReceipts in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of SalesReceipt
 */
Quickbooks.prototype.findSalesReceipts = function(criteria, callback) {
  this.query('salesReceipt', criteria, callback)
}

/**
 * Finds all TaxAgencys in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxAgency
 */
Quickbooks.prototype.findTaxAgencies = function(criteria, callback) {
  this.query('taxAgency', criteria, callback)
}

/**
 * Finds all TaxCodes in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxCode
 */
Quickbooks.prototype.findTaxCodes = function(criteria, callback) {
  this.query('taxCode', criteria, callback)
}

/**
 * Finds all TaxRates in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxRate
 */
Quickbooks.prototype.findTaxRates = function(criteria, callback) {
  this.query('taxRate', criteria, callback)
}

/**
 * Finds all Terms in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Term
 */
Quickbooks.prototype.findTerms = function(criteria, callback) {
  this.query('term', criteria, callback)
}

/**
 * Finds all TimeActivitys in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TimeActivity
 */
Quickbooks.prototype.findTimeActivities = function(criteria, callback) {
  this.query('timeActivity', criteria, callback)
}

/**
 * Finds all Vendors in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Vendor
 */
Quickbooks.prototype.findVendors = function(criteria, callback) {
  this.query('vendor', criteria, callback)
}

/**
 * Finds all VendorCredits in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of VendorCredit
 */
Quickbooks.prototype.findVendorCredits = function(criteria, callback) {
  this.query('vendorCredit', criteria, callback)
}



/**
 * Retrieves the BalanceSheet Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the BalanceSheet Report
 */
Quickbooks.prototype.reportBalanceSheet = function(options, callback) {
  this.report('BalanceSheet', options, callback)
}

/**
 * Retrieves the ProfitAndLoss Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ProfitAndLoss Report
 */
Quickbooks.prototype.reportProfitAndLoss = function(options, callback) {
  this.report('ProfitAndLoss', options, callback)
}

/**
 * Retrieves the ProfitAndLossDetail Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ProfitAndLossDetail Report
 */
Quickbooks.prototype.reportProfitAndLossDetail = function(options, callback) {
  this.report('ProfitAndLossDetail', options, callback)
}

/**
 * Retrieves the TrialBalance Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the TrialBalance Report
 */
Quickbooks.prototype.reportTrialBalance = function(options, callback) {
  this.report('TrialBalance', options, callback)
}

/**
 * Retrieves the CashFlow Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CashFlow Report
 */
Quickbooks.prototype.reportCashFlow = function(options, callback) {
  this.report('CashFlow', options, callback)
}

/**
 * Retrieves the InventoryValuationSummary Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the InventoryValuationSummary Report
 */
Quickbooks.prototype.reportInventoryValuationSummary = function(options, callback) {
  this.report('InventoryValuationSummary', options, callback)
}

/**
 * Retrieves the CustomerSales Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerSales Report
 */
Quickbooks.prototype.reportCustomerSales = function(options, callback) {
  this.report('CustomerSales', options, callback)
}

/**
 * Retrieves the ItemSales Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ItemSales Report
 */
Quickbooks.prototype.reportItemSales = function(options, callback) {
  this.report('ItemSales', options, callback)
}

/**
 * Retrieves the CustomerIncome Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerIncome Report
 */
Quickbooks.prototype.reportCustomerIncome = function(options, callback) {
  this.report('CustomerIncome', options, callback)
}

/**
 * Retrieves the CustomerBalance Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerBalance Report
 */
Quickbooks.prototype.reportCustomerBalance = function(options, callback) {
  this.report('CustomerBalance', options, callback)
}

/**
 * Retrieves the CustomerBalanceDetail Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerBalanceDetail Report
 */
Quickbooks.prototype.reportCustomerBalanceDetail = function(options, callback) {
  this.report('CustomerBalanceDetail', options, callback)
}

/**
 * Retrieves the AgedReceivables Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedReceivables Report
 */
Quickbooks.prototype.reportAgedReceivables = function(options, callback) {
  this.report('AgedReceivables', options, callback)
}

/**
 * Retrieves the AgedReceivableDetail Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedReceivableDetail Report
 */
Quickbooks.prototype.reportAgedReceivableDetail = function(options, callback) {
  this.report('AgedReceivableDetail', options, callback)
}

/**
 * Retrieves the VendorBalance Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorBalance Report
 */
Quickbooks.prototype.reportVendorBalance = function(options, callback) {
  this.report('VendorBalance', options, callback)
}

/**
 * Retrieves the VendorBalanceDetail Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorBalanceDetail Report
 */
Quickbooks.prototype.reportVendorBalanceDetail = function(options, callback) {
  this.report('VendorBalanceDetail', options, callback)
}

/**
 * Retrieves the AgedPayables Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedPayables Report
 */
Quickbooks.prototype.reportAgedPayables = function(options, callback) {
  this.report('AgedPayables', options, callback)
}

/**
 * Retrieves the AgedPayableDetail Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedPayableDetail Report
 */
Quickbooks.prototype.reportAgedPayableDetail = function(options, callback) {
  this.report('AgedPayableDetail', options, callback)
}

/**
 * Retrieves the VendorExpenses Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorExpenses Report
 */
Quickbooks.prototype.reportVendorExpenses = function(options, callback) {
  this.report('VendorExpenses', options, callback)
}

/**
 * Retrieves the GeneralLedgerDetail Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the GeneralLedgerDetail Report
 */
Quickbooks.prototype.reportGeneralLedgerDetail = function(options, callback) {
  this.report('GeneralLedgerDetail', options, callback)
}

/**
 * Retrieves the DepartmentSales Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the DepartmentSales Report
 */
Quickbooks.prototype.reportDepartmentSales = function(options, callback) {
  this.report('DepartmentSales', options, callback)
}

/**
 * Retrieves the ClassSales Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ClassSales Report
 */
Quickbooks.prototype.reportClassSales = function(options, callback) {
  this.report('ClassSales', options, callback)
}
