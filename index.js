/**
 * @file Node.js client for QuickBooks V3 API
 * @name node-quickbooks
 * @author Michael Cohen <michael_cohen@intuit.com>
 * @license ISC
 * @copyright 2014 Michael Cohen
 */

var request = require('request'),
    util    = require('util'),
    _       = require('underscore')

module.exports = QuickBooks

QuickBooks.REQUEST_TOKEN_URL    = 'https://oauth.intuit.com/oauth/v1/get_request_token'
QuickBooks.ACCESS_TOKEN_URL     = 'https://oauth.intuit.com/oauth/v1/get_access_token'
QuickBooks.APP_CENTER_URL       = 'https://appcenter.intuit.com/Connect/Begin?oauth_token='
QuickBooks.V3_ENDPOINT_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company/'

/**
 * Node.js client encapsulating access to the QuickBooks V3 Rest API. An instance
 * of this class should be instantiated on behalf of each user accessing the api.
 *
 * @param consumerKey - application key
 * @param consumerSecret  - application password
 * @param token - the OAuth generated user-specific key
 * @param tokenSecret - the OAuth generated user-specific password
 * @param realmId - QuickBooks companyId, returned as a request parameter when the user is redirected to the provided callback URL following authentication
 * @param debug - boolean flag to turn on logging of HTTP requests, including headers and body
 * @constructor
 */
function QuickBooks(consumerKey, consumerSecret, token, tokenSecret, realmId, debug) {
  var prefix          = _.isObject(consumerKey) ? 'consumerKey.' : ''
  this.consumerKey    = eval(prefix + 'consumerKey')
  this.consumerSecret = eval(prefix + 'consumerSecret')
  this.token          = eval(prefix + 'token')
  this.tokenSecret    = eval(prefix + 'tokenSecret')
  this.realmId        = eval(prefix + 'realmId')
  this.debug          = eval(prefix + 'debug')
}

QuickBooks.prototype.oauth = function() {
  return {
    consumer_key:    this.consumerKey,
    consumer_secret: this.consumerSecret,
    token:           this.token,
    token_secret:    this.tokenSecret
  }
}

QuickBooks.prototype.isNumeric = function(n) {
  return ! isNaN(parseFloat(n)) && isFinite(n);
}

QuickBooks.prototype.criteriaToString = function(criteria) {
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

QuickBooks.prototype.reportCriteria = function(criteria) {
  var s = '?'
  for (var p in criteria) {
    s += p + '=' + criteria[p] + '&'
  }
  return s
}

QuickBooks.prototype.capitalize = function(s) {
  return s.substring(0, 1).toUpperCase() + s.substring(1)
}

QuickBooks.prototype.pluralize = function(s) {
  var last = _.last(s.split(''))
  if (last === 's') {
    return s + "es"
  } else if (last === 'y') {
    return s.substring(0, s.length - 1) + "ies"
  } else {
    return s + 's'
  }
}

QuickBooks.prototype.unwrap = function(callback, entityName) {
  var that = this
  if (! callback) return function(err, data) {}
  return function(err, data) {
    if (err) {
      if (callback) callback(err)
    } else {
      var name = that.capitalize(entityName)
      if (callback) callback(err, data[name] || data)
    }
  }
}


QuickBooks.prototype.request = function(verb, url, entity, callback) {
  var that = this,
      url = QuickBooks.V3_ENDPOINT_BASE_URL + this.realmId + url,
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

QuickBooks.prototype.create = function(entityName, entity, callback) {
  var url = '/' + entityName.toLowerCase()
  this.request('post', url, entity, this.unwrap(callback, entityName))
}

QuickBooks.prototype.read = function(entityName, id, callback) {
  var url = '/' + entityName.toLowerCase() + '/' + id, that = this
  this.request('get', url, null, this.unwrap(callback, entityName))
}

QuickBooks.prototype.update = function(entityName, entity, callback) {
  if (! entity.Id || ! entity.SyncToken) {
    throw new Error(entityName + ' must contain Id and SyncToken fields: ' +
                    util.inspect(entity, {showHidden: false, depth: null}))
  }
  var url = '/' + entityName.toLowerCase() + '?operation=update'
  this.request('post', url, entity, this.unwrap(callback, entityName))
}

QuickBooks.prototype.delete = function(entityName, idOrEntity, callback) {
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

QuickBooks.prototype.query = function(entity, criteria, callback) {
  var url = '/query?query@@select * from ' + entity
  if (criteria && typeof criteria !== 'function') {
    url += this.criteriaToString(criteria) || ''
    url = url.replace(/'/g, '%27').replace(/=/, '%3D')
  }
  url = url.replace('@@', '=')
  this.request('get', url, null, typeof criteria === 'function' ? criteria : callback)
}

QuickBooks.prototype.report = function(reportType, criteria, callback) {
  var url = '/reports/' + reportType
  if (criteria && typeof criteria !== 'function') {
    url += this.reportCriteria(criteria) || ''
  }
  this.request('get', url, null, typeof criteria === 'function' ? criteria : callback)
}


/**
 * Creates the Account in QuickBooks
 *
 * @param  {object} account - The unsaved account, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
QuickBooks.prototype.createAccount = function(account, callback) {
  this.create('account', account, callback)
}

/**
 * Creates the Attachable in QuickBooks
 *
 * @param  {object} attachable - The unsaved attachable, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
QuickBooks.prototype.createAttachable = function(attachable, callback) {
  this.create('attachable', attachable, callback)
}

/**
 * Creates the Bill in QuickBooks
 *
 * @param  {object} bill - The unsaved bill, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
QuickBooks.prototype.createBill = function(bill, callback) {
  this.create('bill', bill, callback)
}

/**
 * Creates the BillPayment in QuickBooks
 *
 * @param  {object} billPayment - The unsaved billPayment, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
QuickBooks.prototype.createBillPayment = function(billPayment, callback) {
  this.create('billPayment', billPayment, callback)
}

/**
 * Creates the Class in QuickBooks
 *
 * @param  {object} class - The unsaved class, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
QuickBooks.prototype.createClass = function(klass, callback) {
  this.create('class', klass, callback)
}

/**
 * Creates the CreditMemo in QuickBooks
 *
 * @param  {object} creditMemo - The unsaved creditMemo, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
QuickBooks.prototype.createCreditMemo = function(creditMemo, callback) {
  this.create('creditMemo', creditMemo, callback)
}

/**
 * Creates the Customer in QuickBooks
 *
 * @param  {object} customer - The unsaved customer, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
QuickBooks.prototype.createCustomer = function(customer, callback) {
  this.create('customer', customer, callback)
}

/**
 * Creates the Department in QuickBooks
 *
 * @param  {object} department - The unsaved department, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
QuickBooks.prototype.createDepartment = function(department, callback) {
  this.create('department', department, callback)
}

/**
 * Creates the Employee in QuickBooks
 *
 * @param  {object} employee - The unsaved employee, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
QuickBooks.prototype.createEmployee = function(employee, callback) {
  this.create('employee', employee, callback)
}

/**
 * Creates the Estimate in QuickBooks
 *
 * @param  {object} estimate - The unsaved estimate, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
QuickBooks.prototype.createEstimate = function(estimate, callback) {
  this.create('estimate', estimate, callback)
}

/**
 * Creates the Invoice in QuickBooks
 *
 * @param  {object} invoice - The unsaved invoice, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
QuickBooks.prototype.createInvoice = function(invoice, callback) {
  this.create('invoice', invoice, callback)
}

/**
 * Creates the Item in QuickBooks
 *
 * @param  {object} item - The unsaved item, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
QuickBooks.prototype.createItem = function(item, callback) {
  this.create('item', item, callback)
}

/**
 * Creates the JournalEntry in QuickBooks
 *
 * @param  {object} journalEntry - The unsaved journalEntry, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
QuickBooks.prototype.createJournalEntry = function(journalEntry, callback) {
  this.create('journalEntry', journalEntry, callback)
}

/**
 * Creates the Payment in QuickBooks
 *
 * @param  {object} payment - The unsaved payment, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
QuickBooks.prototype.createPayment = function(payment, callback) {
  this.create('payment', payment, callback)
}

/**
 * Creates the PaymentMethod in QuickBooks
 *
 * @param  {object} paymentMethod - The unsaved paymentMethod, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
QuickBooks.prototype.createPaymentMethod = function(paymentMethod, callback) {
  this.create('paymentMethod', paymentMethod, callback)
}

/**
 * Creates the Purchase in QuickBooks
 *
 * @param  {object} purchase - The unsaved purchase, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
QuickBooks.prototype.createPurchase = function(purchase, callback) {
  this.create('purchase', purchase, callback)
}

/**
 * Creates the PurchaseOrder in QuickBooks
 *
 * @param  {object} purchaseOrder - The unsaved purchaseOrder, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
QuickBooks.prototype.createPurchaseOrder = function(purchaseOrder, callback) {
  this.create('purchaseOrder', purchaseOrder, callback)
}

/**
 * Creates the RefundReceipt in QuickBooks
 *
 * @param  {object} refundReceipt - The unsaved refundReceipt, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
QuickBooks.prototype.createRefundReceipt = function(refundReceipt, callback) {
  this.create('refundReceipt', refundReceipt, callback)
}

/**
 * Creates the SalesReceipt in QuickBooks
 *
 * @param  {object} salesReceipt - The unsaved salesReceipt, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
QuickBooks.prototype.createSalesReceipt = function(salesReceipt, callback) {
  this.create('salesReceipt', salesReceipt, callback)
}

/**
 * Creates the TaxAgency in QuickBooks
 *
 * @param  {object} taxAgency - The unsaved taxAgency, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
QuickBooks.prototype.createTaxAgency = function(taxAgency, callback) {
  this.create('taxAgency', taxAgency, callback)
}

/**
 * Creates the TaxService in QuickBooks
 *
 * @param  {object} taxService - The unsaved taxService, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxService
 */
QuickBooks.prototype.createTaxService = function(taxService, callback) {
  this.create('taxService', taxService, callback)
}

/**
 * Creates the Term in QuickBooks
 *
 * @param  {object} term - The unsaved term, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
QuickBooks.prototype.createTerm = function(term, callback) {
  this.create('term', term, callback)
}

/**
 * Creates the TimeActivity in QuickBooks
 *
 * @param  {object} timeActivity - The unsaved timeActivity, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
QuickBooks.prototype.createTimeActivity = function(timeActivity, callback) {
  this.create('timeActivity', timeActivity, callback)
}

/**
 * Creates the Vendor in QuickBooks
 *
 * @param  {object} vendor - The unsaved vendor, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
QuickBooks.prototype.createVendor = function(vendor, callback) {
  this.create('vendor', vendor, callback)
}

/**
 * Creates the VendorCredit in QuickBooks
 *
 * @param  {object} vendorCredit - The unsaved vendorCredit, to be persisted in QuickBooks
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
QuickBooks.prototype.createVendorCredit = function(vendorCredit, callback) {
  this.create('vendorCredit', vendorCredit, callback)
}



/**
 * Retrieves the Account from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Account
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
QuickBooks.prototype.getAccount = function(id, callback) {
  this.read('account', id, callback)
}

/**
 * Retrieves the Attachable from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Attachable
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
QuickBooks.prototype.getAttachable = function(id, callback) {
  this.read('attachable', id, callback)
}

/**
 * Retrieves the Bill from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Bill
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
QuickBooks.prototype.getBill = function(id, callback) {
  this.read('bill', id, callback)
}

/**
 * Retrieves the BillPayment from QuickBooks
 *
 * @param  {string} Id - The Id of persistent BillPayment
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
QuickBooks.prototype.getBillPayment = function(id, callback) {
  this.read('billPayment', id, callback)
}

/**
 * Retrieves the Class from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Class
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
QuickBooks.prototype.getClass = function(id, callback) {
  this.read('class', id, callback)
}

/**
 * Retrieves the CompanyInfo from QuickBooks
 *
 * @param  {string} Id - The Id of persistent CompanyInfo
 * @param  {function} callback - Callback function which is called with any error and the persistent CompanyInfo
 */
QuickBooks.prototype.getCompanyInfo = function(id, callback) {
  this.read('companyInfo', id, callback)
}

/**
 * Retrieves the CreditMemo from QuickBooks
 *
 * @param  {string} Id - The Id of persistent CreditMemo
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
QuickBooks.prototype.getCreditMemo = function(id, callback) {
  this.read('creditMemo', id, callback)
}

/**
 * Retrieves the Customer from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Customer
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
QuickBooks.prototype.getCustomer = function(id, callback) {
  this.read('customer', id, callback)
}

/**
 * Retrieves the Department from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Department
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
QuickBooks.prototype.getDepartment = function(id, callback) {
  this.read('department', id, callback)
}

/**
 * Retrieves the Employee from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Employee
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
QuickBooks.prototype.getEmployee = function(id, callback) {
  this.read('employee', id, callback)
}

/**
 * Retrieves the Estimate from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Estimate
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
QuickBooks.prototype.getEstimate = function(id, callback) {
  this.read('estimate', id, callback)
}

/**
 * Retrieves the Invoice from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Invoice
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
QuickBooks.prototype.getInvoice = function(id, callback) {
  this.read('invoice', id, callback)
}

/**
 * Retrieves the Item from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Item
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
QuickBooks.prototype.getItem = function(id, callback) {
  this.read('item', id, callback)
}

/**
 * Retrieves the JournalEntry from QuickBooks
 *
 * @param  {string} Id - The Id of persistent JournalEntry
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
QuickBooks.prototype.getJournalEntry = function(id, callback) {
  this.read('journalEntry', id, callback)
}

/**
 * Retrieves the Payment from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Payment
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
QuickBooks.prototype.getPayment = function(id, callback) {
  this.read('payment', id, callback)
}

/**
 * Retrieves the PaymentMethod from QuickBooks
 *
 * @param  {string} Id - The Id of persistent PaymentMethod
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
QuickBooks.prototype.getPaymentMethod = function(id, callback) {
  this.read('paymentMethod', id, callback)
}

/**
 * Retrieves the Preferences from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Preferences
 * @param  {function} callback - Callback function which is called with any error and the persistent Preferences
 */
QuickBooks.prototype.getPreferences = function(id, callback) {
  this.read('preferences', id, callback)
}

/**
 * Retrieves the Purchase from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Purchase
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
QuickBooks.prototype.getPurchase = function(id, callback) {
  this.read('purchase', id, callback)
}

/**
 * Retrieves the PurchaseOrder from QuickBooks
 *
 * @param  {string} Id - The Id of persistent PurchaseOrder
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
QuickBooks.prototype.getPurchaseOrder = function(id, callback) {
  this.read('purchaseOrder', id, callback)
}

/**
 * Retrieves the RefundReceipt from QuickBooks
 *
 * @param  {string} Id - The Id of persistent RefundReceipt
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
QuickBooks.prototype.getRefundReceipt = function(id, callback) {
  this.read('refundReceipt', id, callback)
}

/**
 * Retrieves the Reports from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Reports
 * @param  {function} callback - Callback function which is called with any error and the persistent Reports
 */
QuickBooks.prototype.getReports = function(id, callback) {
  this.read('reports', id, callback)
}

/**
 * Retrieves the SalesReceipt from QuickBooks
 *
 * @param  {string} Id - The Id of persistent SalesReceipt
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
QuickBooks.prototype.getSalesReceipt = function(id, callback) {
  this.read('salesReceipt', id, callback)
}

/**
 * Retrieves the TaxAgency from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TaxAgency
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
QuickBooks.prototype.getTaxAgency = function(id, callback) {
  this.read('taxAgency', id, callback)
}

/**
 * Retrieves the TaxCode from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TaxCode
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxCode
 */
QuickBooks.prototype.getTaxCode = function(id, callback) {
  this.read('taxCode', id, callback)
}

/**
 * Retrieves the TaxRate from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TaxRate
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxRate
 */
QuickBooks.prototype.getTaxRate = function(id, callback) {
  this.read('taxRate', id, callback)
}

/**
 * Retrieves the Term from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Term
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
QuickBooks.prototype.getTerm = function(id, callback) {
  this.read('term', id, callback)
}

/**
 * Retrieves the TimeActivity from QuickBooks
 *
 * @param  {string} Id - The Id of persistent TimeActivity
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
QuickBooks.prototype.getTimeActivity = function(id, callback) {
  this.read('timeActivity', id, callback)
}

/**
 * Retrieves the Vendor from QuickBooks
 *
 * @param  {string} Id - The Id of persistent Vendor
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
QuickBooks.prototype.getVendor = function(id, callback) {
  this.read('vendor', id, callback)
}

/**
 * Retrieves the VendorCredit from QuickBooks
 *
 * @param  {string} Id - The Id of persistent VendorCredit
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
QuickBooks.prototype.getVendorCredit = function(id, callback) {
  this.read('vendorCredit', id, callback)
}



/**
 * Updates QuickBooks version of Account
 *
 * @param  {object} account - The persistent Account, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Account
 */
QuickBooks.prototype.updateAccount = function(account, callback) {
  this.update('account', account, callback)
}

/**
 * Updates QuickBooks version of Attachable
 *
 * @param  {object} attachable - The persistent Attachable, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
 */
QuickBooks.prototype.updateAttachable = function(attachable, callback) {
  this.update('attachable', attachable, callback)
}

/**
 * Updates QuickBooks version of Bill
 *
 * @param  {object} bill - The persistent Bill, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Bill
 */
QuickBooks.prototype.updateBill = function(bill, callback) {
  this.update('bill', bill, callback)
}

/**
 * Updates QuickBooks version of BillPayment
 *
 * @param  {object} billPayment - The persistent BillPayment, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent BillPayment
 */
QuickBooks.prototype.updateBillPayment = function(billPayment, callback) {
  this.update('billPayment', billPayment, callback)
}

/**
 * Updates QuickBooks version of Class
 *
 * @param  {object} class - The persistent Class, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Class
 */
QuickBooks.prototype.updateClass = function(klass, callback) {
  this.update('class', klass, callback)
}

/**
 * Updates QuickBooks version of CompanyInfo
 *
 * @param  {object} companyInfo - The persistent CompanyInfo, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent CompanyInfo
 */
QuickBooks.prototype.updateCompanyInfo = function(companyInfo, callback) {
  this.update('companyInfo', companyInfo, callback)
}

/**
 * Updates QuickBooks version of CreditMemo
 *
 * @param  {object} creditMemo - The persistent CreditMemo, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent CreditMemo
 */
QuickBooks.prototype.updateCreditMemo = function(creditMemo, callback) {
  this.update('creditMemo', creditMemo, callback)
}

/**
 * Updates QuickBooks version of Customer
 *
 * @param  {object} customer - The persistent Customer, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Customer
 */
QuickBooks.prototype.updateCustomer = function(customer, callback) {
  this.update('customer', customer, callback)
}

/**
 * Updates QuickBooks version of Department
 *
 * @param  {object} department - The persistent Department, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Department
 */
QuickBooks.prototype.updateDepartment = function(department, callback) {
  this.update('department', department, callback)
}

/**
 * Updates QuickBooks version of Employee
 *
 * @param  {object} employee - The persistent Employee, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Employee
 */
QuickBooks.prototype.updateEmployee = function(employee, callback) {
  this.update('employee', employee, callback)
}

/**
 * Updates QuickBooks version of Estimate
 *
 * @param  {object} estimate - The persistent Estimate, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Estimate
 */
QuickBooks.prototype.updateEstimate = function(estimate, callback) {
  this.update('estimate', estimate, callback)
}

/**
 * Updates QuickBooks version of Invoice
 *
 * @param  {object} invoice - The persistent Invoice, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Invoice
 */
QuickBooks.prototype.updateInvoice = function(invoice, callback) {
  this.update('invoice', invoice, callback)
}

/**
 * Updates QuickBooks version of Item
 *
 * @param  {object} item - The persistent Item, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Item
 */
QuickBooks.prototype.updateItem = function(item, callback) {
  this.update('item', item, callback)
}

/**
 * Updates QuickBooks version of JournalEntry
 *
 * @param  {object} journalEntry - The persistent JournalEntry, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent JournalEntry
 */
QuickBooks.prototype.updateJournalEntry = function(journalEntry, callback) {
  this.update('journalEntry', journalEntry, callback)
}

/**
 * Updates QuickBooks version of Payment
 *
 * @param  {object} payment - The persistent Payment, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Payment
 */
QuickBooks.prototype.updatePayment = function(payment, callback) {
  this.update('payment', payment, callback)
}

/**
 * Updates QuickBooks version of PaymentMethod
 *
 * @param  {object} paymentMethod - The persistent PaymentMethod, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent PaymentMethod
 */
QuickBooks.prototype.updatePaymentMethod = function(paymentMethod, callback) {
  this.update('paymentMethod', paymentMethod, callback)
}

/**
 * Updates QuickBooks version of Preferences
 *
 * @param  {object} preferences - The persistent Preferences, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Preferences
 */
QuickBooks.prototype.updatePreferences = function(preferences, callback) {
  this.update('preferences', preferences, callback)
}

/**
 * Updates QuickBooks version of Purchase
 *
 * @param  {object} purchase - The persistent Purchase, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Purchase
 */
QuickBooks.prototype.updatePurchase = function(purchase, callback) {
  this.update('purchase', purchase, callback)
}

/**
 * Updates QuickBooks version of PurchaseOrder
 *
 * @param  {object} purchaseOrder - The persistent PurchaseOrder, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent PurchaseOrder
 */
QuickBooks.prototype.updatePurchaseOrder = function(purchaseOrder, callback) {
  this.update('purchaseOrder', purchaseOrder, callback)
}

/**
 * Updates QuickBooks version of RefundReceipt
 *
 * @param  {object} refundReceipt - The persistent RefundReceipt, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent RefundReceipt
 */
QuickBooks.prototype.updateRefundReceipt = function(refundReceipt, callback) {
  this.update('refundReceipt', refundReceipt, callback)
}

/**
 * Updates QuickBooks version of SalesReceipt
 *
 * @param  {object} salesReceipt - The persistent SalesReceipt, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent SalesReceipt
 */
QuickBooks.prototype.updateSalesReceipt = function(salesReceipt, callback) {
  this.update('salesReceipt', salesReceipt, callback)
}

/**
 * Updates QuickBooks version of TaxAgency
 *
 * @param  {object} taxAgency - The persistent TaxAgency, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxAgency
 */
QuickBooks.prototype.updateTaxAgency = function(taxAgency, callback) {
  this.update('taxAgency', taxAgency, callback)
}

/**
 * Updates QuickBooks version of TaxCode
 *
 * @param  {object} taxCode - The persistent TaxCode, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxCode
 */
QuickBooks.prototype.updateTaxCode = function(taxCode, callback) {
  this.update('taxCode', taxCode, callback)
}

/**
 * Updates QuickBooks version of TaxRate
 *
 * @param  {object} taxRate - The persistent TaxRate, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxRate
 */
QuickBooks.prototype.updateTaxRate = function(taxRate, callback) {
  this.update('taxRate', taxRate, callback)
}

/**
 * Updates QuickBooks version of TaxService
 *
 * @param  {object} taxService - The persistent TaxService, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TaxService
 */
QuickBooks.prototype.updateTaxService = function(taxService, callback) {
  this.update('taxService', taxService, callback)
}

/**
 * Updates QuickBooks version of Term
 *
 * @param  {object} term - The persistent Term, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Term
 */
QuickBooks.prototype.updateTerm = function(term, callback) {
  this.update('term', term, callback)
}

/**
 * Updates QuickBooks version of TimeActivity
 *
 * @param  {object} timeActivity - The persistent TimeActivity, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent TimeActivity
 */
QuickBooks.prototype.updateTimeActivity = function(timeActivity, callback) {
  this.update('timeActivity', timeActivity, callback)
}

/**
 * Updates QuickBooks version of Vendor
 *
 * @param  {object} vendor - The persistent Vendor, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent Vendor
 */
QuickBooks.prototype.updateVendor = function(vendor, callback) {
  this.update('vendor', vendor, callback)
}

/**
 * Updates QuickBooks version of VendorCredit
 *
 * @param  {object} vendorCredit - The persistent VendorCredit, including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent VendorCredit
 */
QuickBooks.prototype.updateVendorCredit = function(vendorCredit, callback) {
  this.update('vendorCredit', vendorCredit, callback)
}



/**
 * Deletes the Attachable from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Attachable to be deleted, or the Id of the Attachable, in which case an extra GET request will be issued to first retrieve the Attachable
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Attachable
 */
QuickBooks.prototype.deleteAttachable = function(idOrEntity, callback) {
  this.delete('attachable', idOrEntity, callback)
}

/**
 * Deletes the Bill from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Bill to be deleted, or the Id of the Bill, in which case an extra GET request will be issued to first retrieve the Bill
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Bill
 */
QuickBooks.prototype.deleteBill = function(idOrEntity, callback) {
  this.delete('bill', idOrEntity, callback)
}

/**
 * Deletes the BillPayment from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent BillPayment to be deleted, or the Id of the BillPayment, in which case an extra GET request will be issued to first retrieve the BillPayment
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent BillPayment
 */
QuickBooks.prototype.deleteBillPayment = function(idOrEntity, callback) {
  this.delete('billPayment', idOrEntity, callback)
}

/**
 * Deletes the CreditMemo from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent CreditMemo to be deleted, or the Id of the CreditMemo, in which case an extra GET request will be issued to first retrieve the CreditMemo
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent CreditMemo
 */
QuickBooks.prototype.deleteCreditMemo = function(idOrEntity, callback) {
  this.delete('creditMemo', idOrEntity, callback)
}

/**
 * Deletes the Estimate from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Estimate to be deleted, or the Id of the Estimate, in which case an extra GET request will be issued to first retrieve the Estimate
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Estimate
 */
QuickBooks.prototype.deleteEstimate = function(idOrEntity, callback) {
  this.delete('estimate', idOrEntity, callback)
}

/**
 * Deletes the Invoice from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Invoice to be deleted, or the Id of the Invoice, in which case an extra GET request will be issued to first retrieve the Invoice
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Invoice
 */
QuickBooks.prototype.deleteInvoice = function(idOrEntity, callback) {
  this.delete('invoice', idOrEntity, callback)
}

/**
 * Deletes the JournalEntry from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent JournalEntry to be deleted, or the Id of the JournalEntry, in which case an extra GET request will be issued to first retrieve the JournalEntry
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent JournalEntry
 */
QuickBooks.prototype.deleteJournalEntry = function(idOrEntity, callback) {
  this.delete('journalEntry', idOrEntity, callback)
}

/**
 * Deletes the Payment from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Payment to be deleted, or the Id of the Payment, in which case an extra GET request will be issued to first retrieve the Payment
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Payment
 */
QuickBooks.prototype.deletePayment = function(idOrEntity, callback) {
  this.delete('payment', idOrEntity, callback)
}

/**
 * Deletes the Purchase from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent Purchase to be deleted, or the Id of the Purchase, in which case an extra GET request will be issued to first retrieve the Purchase
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent Purchase
 */
QuickBooks.prototype.deletePurchase = function(idOrEntity, callback) {
  this.delete('purchase', idOrEntity, callback)
}

/**
 * Deletes the PurchaseOrder from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent PurchaseOrder to be deleted, or the Id of the PurchaseOrder, in which case an extra GET request will be issued to first retrieve the PurchaseOrder
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent PurchaseOrder
 */
QuickBooks.prototype.deletePurchaseOrder = function(idOrEntity, callback) {
  this.delete('purchaseOrder', idOrEntity, callback)
}

/**
 * Deletes the RefundReceipt from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent RefundReceipt to be deleted, or the Id of the RefundReceipt, in which case an extra GET request will be issued to first retrieve the RefundReceipt
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent RefundReceipt
 */
QuickBooks.prototype.deleteRefundReceipt = function(idOrEntity, callback) {
  this.delete('refundReceipt', idOrEntity, callback)
}

/**
 * Deletes the SalesReceipt from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent SalesReceipt to be deleted, or the Id of the SalesReceipt, in which case an extra GET request will be issued to first retrieve the SalesReceipt
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent SalesReceipt
 */
QuickBooks.prototype.deleteSalesReceipt = function(idOrEntity, callback) {
  this.delete('salesReceipt', idOrEntity, callback)
}

/**
 * Deletes the TimeActivity from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent TimeActivity to be deleted, or the Id of the TimeActivity, in which case an extra GET request will be issued to first retrieve the TimeActivity
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent TimeActivity
 */
QuickBooks.prototype.deleteTimeActivity = function(idOrEntity, callback) {
  this.delete('timeActivity', idOrEntity, callback)
}

/**
 * Deletes the VendorCredit from QuickBooks
 *
 * @param  {object} idOrEntity - The persistent VendorCredit to be deleted, or the Id of the VendorCredit, in which case an extra GET request will be issued to first retrieve the VendorCredit
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent VendorCredit
 */
QuickBooks.prototype.deleteVendorCredit = function(idOrEntity, callback) {
  this.delete('vendorCredit', idOrEntity, callback)
}



/**
 * Finds all Accounts in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Account
 */
QuickBooks.prototype.findAccounts = function(criteria, callback) {
  this.query('account', criteria, callback)
}

/**
 * Finds all Attachables in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Attachable
 */
QuickBooks.prototype.findAttachables = function(criteria, callback) {
  this.query('attachable', criteria, callback)
}

/**
 * Finds all Bills in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Bill
 */
QuickBooks.prototype.findBills = function(criteria, callback) {
  this.query('bill', criteria, callback)
}

/**
 * Finds all BillPayments in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of BillPayment
 */
QuickBooks.prototype.findBillPayments = function(criteria, callback) {
  this.query('billPayment', criteria, callback)
}

/**
 * Finds all Budgets in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Budget
 */
QuickBooks.prototype.findBudgets = function(criteria, callback) {
  this.query('budget', criteria, callback)
}

/**
 * Finds all Classs in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Class
 */
QuickBooks.prototype.findClasses = function(criteria, callback) {
  this.query('class', criteria, callback)
}

/**
 * Finds all CompanyInfos in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of CompanyInfo
 */
QuickBooks.prototype.findCompanyInfos = function(criteria, callback) {
  this.query('companyInfo', criteria, callback)
}

/**
 * Finds all CreditMemos in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of CreditMemo
 */
QuickBooks.prototype.findCreditMemos = function(criteria, callback) {
  this.query('creditMemo', criteria, callback)
}

/**
 * Finds all Customers in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Customer
 */
QuickBooks.prototype.findCustomers = function(criteria, callback) {
  this.query('customer', criteria, callback)
}

/**
 * Finds all Departments in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Department
 */
QuickBooks.prototype.findDepartments = function(criteria, callback) {
  this.query('department', criteria, callback)
}

/**
 * Finds all Employees in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Employee
 */
QuickBooks.prototype.findEmployees = function(criteria, callback) {
  this.query('employee', criteria, callback)
}

/**
 * Finds all Estimates in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Estimate
 */
QuickBooks.prototype.findEstimates = function(criteria, callback) {
  this.query('estimate', criteria, callback)
}

/**
 * Finds all Invoices in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Invoice
 */
QuickBooks.prototype.findInvoices = function(criteria, callback) {
  this.query('invoice', criteria, callback)
}

/**
 * Finds all Items in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Item
 */
QuickBooks.prototype.findItems = function(criteria, callback) {
  this.query('item', criteria, callback)
}

/**
 * Finds all JournalEntrys in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of JournalEntry
 */
QuickBooks.prototype.findJournalEntries = function(criteria, callback) {
  this.query('journalEntry', criteria, callback)
}

/**
 * Finds all Payments in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Payment
 */
QuickBooks.prototype.findPayments = function(criteria, callback) {
  this.query('payment', criteria, callback)
}

/**
 * Finds all PaymentMethods in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of PaymentMethod
 */
QuickBooks.prototype.findPaymentMethods = function(criteria, callback) {
  this.query('paymentMethod', criteria, callback)
}

/**
 * Finds all Preferencess in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Preferences
 */
QuickBooks.prototype.findPreferenceses = function(criteria, callback) {
  this.query('preferences', criteria, callback)
}

/**
 * Finds all Purchases in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Purchase
 */
QuickBooks.prototype.findPurchases = function(criteria, callback) {
  this.query('purchase', criteria, callback)
}

/**
 * Finds all PurchaseOrders in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of PurchaseOrder
 */
QuickBooks.prototype.findPurchaseOrders = function(criteria, callback) {
  this.query('purchaseOrder', criteria, callback)
}

/**
 * Finds all RefundReceipts in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of RefundReceipt
 */
QuickBooks.prototype.findRefundReceipts = function(criteria, callback) {
  this.query('refundReceipt', criteria, callback)
}

/**
 * Finds all SalesReceipts in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of SalesReceipt
 */
QuickBooks.prototype.findSalesReceipts = function(criteria, callback) {
  this.query('salesReceipt', criteria, callback)
}

/**
 * Finds all TaxAgencys in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxAgency
 */
QuickBooks.prototype.findTaxAgencies = function(criteria, callback) {
  this.query('taxAgency', criteria, callback)
}

/**
 * Finds all TaxCodes in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxCode
 */
QuickBooks.prototype.findTaxCodes = function(criteria, callback) {
  this.query('taxCode', criteria, callback)
}

/**
 * Finds all TaxRates in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TaxRate
 */
QuickBooks.prototype.findTaxRates = function(criteria, callback) {
  this.query('taxRate', criteria, callback)
}

/**
 * Finds all Terms in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Term
 */
QuickBooks.prototype.findTerms = function(criteria, callback) {
  this.query('term', criteria, callback)
}

/**
 * Finds all TimeActivitys in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of TimeActivity
 */
QuickBooks.prototype.findTimeActivities = function(criteria, callback) {
  this.query('timeActivity', criteria, callback)
}

/**
 * Finds all Vendors in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of Vendor
 */
QuickBooks.prototype.findVendors = function(criteria, callback) {
  this.query('vendor', criteria, callback)
}

/**
 * Finds all VendorCredits in QuickBooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
 * @param  {function} callback - Callback function which is called with any error and the list of VendorCredit
 */
QuickBooks.prototype.findVendorCredits = function(criteria, callback) {
  this.query('vendorCredit', criteria, callback)
}



/**
 * Retrieves the BalanceSheet Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the BalanceSheet Report
 */
QuickBooks.prototype.reportBalanceSheet = function(options, callback) {
  this.report('BalanceSheet', options, callback)
}

/**
 * Retrieves the ProfitAndLoss Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ProfitAndLoss Report
 */
QuickBooks.prototype.reportProfitAndLoss = function(options, callback) {
  this.report('ProfitAndLoss', options, callback)
}

/**
 * Retrieves the ProfitAndLossDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ProfitAndLossDetail Report
 */
QuickBooks.prototype.reportProfitAndLossDetail = function(options, callback) {
  this.report('ProfitAndLossDetail', options, callback)
}

/**
 * Retrieves the TrialBalance Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the TrialBalance Report
 */
QuickBooks.prototype.reportTrialBalance = function(options, callback) {
  this.report('TrialBalance', options, callback)
}

/**
 * Retrieves the CashFlow Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CashFlow Report
 */
QuickBooks.prototype.reportCashFlow = function(options, callback) {
  this.report('CashFlow', options, callback)
}

/**
 * Retrieves the InventoryValuationSummary Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the InventoryValuationSummary Report
 */
QuickBooks.prototype.reportInventoryValuationSummary = function(options, callback) {
  this.report('InventoryValuationSummary', options, callback)
}

/**
 * Retrieves the CustomerSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerSales Report
 */
QuickBooks.prototype.reportCustomerSales = function(options, callback) {
  this.report('CustomerSales', options, callback)
}

/**
 * Retrieves the ItemSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ItemSales Report
 */
QuickBooks.prototype.reportItemSales = function(options, callback) {
  this.report('ItemSales', options, callback)
}

/**
 * Retrieves the CustomerIncome Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerIncome Report
 */
QuickBooks.prototype.reportCustomerIncome = function(options, callback) {
  this.report('CustomerIncome', options, callback)
}

/**
 * Retrieves the CustomerBalance Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerBalance Report
 */
QuickBooks.prototype.reportCustomerBalance = function(options, callback) {
  this.report('CustomerBalance', options, callback)
}

/**
 * Retrieves the CustomerBalanceDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the CustomerBalanceDetail Report
 */
QuickBooks.prototype.reportCustomerBalanceDetail = function(options, callback) {
  this.report('CustomerBalanceDetail', options, callback)
}

/**
 * Retrieves the AgedReceivables Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedReceivables Report
 */
QuickBooks.prototype.reportAgedReceivables = function(options, callback) {
  this.report('AgedReceivables', options, callback)
}

/**
 * Retrieves the AgedReceivableDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedReceivableDetail Report
 */
QuickBooks.prototype.reportAgedReceivableDetail = function(options, callback) {
  this.report('AgedReceivableDetail', options, callback)
}

/**
 * Retrieves the VendorBalance Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorBalance Report
 */
QuickBooks.prototype.reportVendorBalance = function(options, callback) {
  this.report('VendorBalance', options, callback)
}

/**
 * Retrieves the VendorBalanceDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorBalanceDetail Report
 */
QuickBooks.prototype.reportVendorBalanceDetail = function(options, callback) {
  this.report('VendorBalanceDetail', options, callback)
}

/**
 * Retrieves the AgedPayables Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedPayables Report
 */
QuickBooks.prototype.reportAgedPayables = function(options, callback) {
  this.report('AgedPayables', options, callback)
}

/**
 * Retrieves the AgedPayableDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the AgedPayableDetail Report
 */
QuickBooks.prototype.reportAgedPayableDetail = function(options, callback) {
  this.report('AgedPayableDetail', options, callback)
}

/**
 * Retrieves the VendorExpenses Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the VendorExpenses Report
 */
QuickBooks.prototype.reportVendorExpenses = function(options, callback) {
  this.report('VendorExpenses', options, callback)
}

/**
 * Retrieves the GeneralLedgerDetail Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the GeneralLedgerDetail Report
 */
QuickBooks.prototype.reportGeneralLedgerDetail = function(options, callback) {
  this.report('GeneralLedgerDetail', options, callback)
}

/**
 * Retrieves the DepartmentSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the DepartmentSales Report
 */
QuickBooks.prototype.reportDepartmentSales = function(options, callback) {
  this.report('DepartmentSales', options, callback)
}

/**
 * Retrieves the ClassSales Report from QuickBooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the ClassSales Report
 */
QuickBooks.prototype.reportClassSales = function(options, callback) {
  this.report('ClassSales', options, callback)
}
