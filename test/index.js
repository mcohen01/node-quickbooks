var os         = require('os'), 
    fs         = require('fs'),
    util       = require('util'),
    expect     = require('expect'),
    async      = require('async'),
    _          = require('underscore'),
    config     = require('../config'),
    QuickBooks = require('../index'),
    qbo        = new QuickBooks(config);


describe('Attachable CRUDQ', function() {

  this.timeout(15000);

  it('should CRUDQ an Attachable', function(done) {
    var _attach;
    async.series([function(cb) {
      qbo.createAttachable({Note: 'My File'}, function(err, attach) {
        expect(err).toBe(null)
        expect(attach.Fault).toBe(undefined)
        expect(attach.Note).toBe('My File')
        _attach = attach
        cb()
      })
    }, function(cb) {
      qbo.getAttachable(_attach.Id, function(err, attachable) {
        expect(err).toBe(null)
        expect(attachable.Fault).toBe(undefined)
        expect(attachable.Note).toBe('My File')
        attachable.Note = 'My Updated File'
        _attach = attachable
        cb()
      })
    }, function(cb) {
      qbo.updateAttachable(_attach, function(err, updated) {
        expect(err).toBe(null)
        expect(updated.Fault).toBe(undefined)
        expect(updated.Note).toBe('My Updated File')
        cb()
      })
    }, function(cb) {
      qbo.findAttachables(function(err, list) {
        expect(err).toBe(null)
        expect(list.Fault).toBe(undefined)
        expect(list.QueryResponse.Attachable.length).toBeGreaterThan(0)
        expect(list.QueryResponse.Attachable[0].Note).toBe('My Updated File')
        cb()
      })
    }, function(cb) {
      qbo.deleteAttachable(_attach.Id, function(err, deleted) {
        expect(err).toBe(null)
        expect(deleted.Fault).toBe(undefined)
        expect(deleted.Attachable.status).toBe('Deleted')
        cb()
      })
    }, function(cb) {
      qbo.findAttachables(function(err, list) {
        expect(err).toBe(null)
        expect(list.Fault).toBe(undefined)
        expect(JSON.stringify(list.QueryResponse)).toBe('{}')
        cb()
      })
    }], function(e, r) { done() })
  })

})


describe('Query', function() {

  this.timeout(15000);

  it('should fetch Accounts', function (done) {
    qbo.findAccounts(function(err, accounts) {
      expect(err).toBe(null)
      expect(accounts.Fault).toBe(undefined)
      expect(accounts.QueryResponse.Account.length).toBeGreaterThan(20)
      done()
    })
  })

  it('should fetch Expense Accounts by AccountType', function (done) {
    qbo.findAccounts({AccountType: 'Expense'}, function(err, accounts) {
      expect(err).toBe(null)
      expect(accounts.Fault).toBe(undefined)
      expect(accounts.QueryResponse.Account.length).toBeGreaterThan(0)
      expect(accounts.QueryResponse.Account[0].AccountType).toBe('Expense')
      done()
    })
  })

  it('should fetch the Travel Account', function (done) {
    qbo.findAccounts({Name: 'Travel'}, function(err, accounts) {
      expect(err).toBe(null)
      expect(accounts.Fault).toBe(undefined)
      expect(accounts.QueryResponse.Account.length).toBe(1)
      expect(accounts.QueryResponse.Account[0].AccountType).toBe('Expense')
      done()
    })
  })

  var queries = fs.readFileSync('build/query.txt').toString('utf-8').split(os.EOL)
  queries.forEach(function(q) {
    it('should fetch ' + qbo.capitalize(q), function (done) {
      qbo['find' +  qbo.pluralize(qbo.capitalize(q))].call(qbo, function(err, data) {
        expect(err).toBe(null)
        expect(data.Fault).toBe(undefined)
        expect(_.isObject(data.QueryResponse)).toBe(true)
        done()
      })
    })
  })

})


describe('Reports', function() {

  this.timeout(30000);

  var reports = fs.readFileSync('build/report.txt').toString('utf-8').split(os.EOL)
  reports.some(function (line) {
    if (line === '') return true
    it('should fetch ' + line + ' Report', function (done) {
      qbo['report' + line].call(qbo, function(err, report) {
        expect(err).toBe(null)
        expect(report.Fault).toBe(undefined)
        done()
      })
    })
  })

})


describe('SalesReceipt', function() {

  this.timeout(30000);

  it('should create a new SalesReceipt', function (done) {
    qbo.createSalesReceipt({
      DocNumber: "1044",
      TxnDate: "2014-08-04",
      PrivateNote: "Memo for SalesReceipt",
      CustomerMemo: { value: "my message"} ,
      Line: [
        {
          Description: "Line description",
          Amount: 14,
          DetailType: "SalesItemLineDetail",
          SalesItemLineDetail: {
            ServiceDate: "2014-08-14",
            UnitPrice: 14,
            Qty: 1,
            TaxCodeRef: {value: "TAX"}
          }
        },
        {
          Amount: 0.28,
          DetailType: "DiscountLineDetail",
          DiscountLineDetail: {
            PercentBased: true,
            DiscountPercent: 2
          }
        }
      ]}, function(err, salesReceipt) {
      expect(err).toBe(null)
      expect(salesReceipt.Fault).toBe(undefined)
      async.series([function(cb) {
        qbo.sendSalesReceiptPdf(salesReceipt.Id, config.testEmail, function(err, data) {
          console.log(util.inspect(data, {showHidden: false, depth: null}));
          cb()
        })
      }, function(cb) {
        qbo.getSalesReceiptPdf(salesReceipt.Id, function(err, data) {
          fs.writeFileSync('salesReceipt_'+salesReceipt.Id+'.pdf',data);
          console.log(util.inspect(data, {showHidden: false, depth: null}));
          cb()
        })
      }],function(e, r) { done() })
    })
  })

  it('should fetch and delete all SalesReceipts', function (done) {
    qbo.findSalesReceipts(function(err, items) {
      var deletes = []
      if (items.QueryResponse.SalesReceipt) {
        items.QueryResponse.SalesReceipt.forEach(function (e) {
          deletes.push(function(cb) {
            qbo.deleteSalesReceipt(e.Id, cb)
          })
        })
      } else {
        done()
      }
      async.series(deletes, function(e, r) { done() })
    })
  })

})
