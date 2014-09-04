var util       = require('util'),
    expect     = require('expect'),
    async      = require('async'),
    config     = require('../config'),
    QuickBooks = require('../index'),
    qbo        = new QuickBooks(config);

describe('Charge Api', function() {

  this.timeout(15000);

  it('should create a Charge, get a charge, capture, and refund', function(done) {

    var charge = {
      capture: false,
      currency: 'USD',
      amount: '42.21',
      card: {
        exp_year: '2016',
        exp_month: '02',
        address: {
          region: 'CA',
          postal_code: '94062',
          street_address: '131 Fairy Lane',
          country: 'US',
          city: 'Sunnyvale'
        },
        name: 'Brad Smith',
        cvc: '123',
        number: '4111111111111111'
      }
    }

    var chargeId, refundId
    async.series([function(cb) {
      qbo.charge(charge, function(err, charged) {
        expect(err).toBe(null)
        expect(charged.errors).toBe(undefined)
        expect(charged.amount).toBe(42.21)
        expect(charged.card.number).toBe('xxxxxxxxxxxx1111')
        expect(charged.card.name).toBe('Brad Smith')
        expect(charged.card.address.street_address).toBe('131 Fairy Lane')
        chargeId = charged.id
        cb()
      })
    }, function(cb) {
      qbo.getCharge(chargeId, function(err, charge) {
        expect(err).toBe(null)
        expect(charge.errors).toBe(undefined)
        expect(charge.status).toBe('authorized')
        expect(charge.amount).toBe(42.21)
        expect(charge.card.number).toBe('xxxxxxxxxxxx1111')
        expect(charge.card.name).toBe('Brad Smith')
        expect(charge.card.address.street_address).toBe('131 Fairy Lane')
        cb()
      })
    }, function(cb) {
      qbo.capture(chargeId, {
        amount: 42.21
      }, function(err, capture) {
        expect(err).toBe(null)
        expect(capture.errors).toBe(undefined)
        expect(capture.amount).toBe(42.21)
        cb()
      })
    }, function(cb) {
      charge.capture = true
      qbo.charge(charge, function(err, charged) {
        expect(err).toBe(null)
        expect(charged.errors).toBe(undefined)
        expect(charged.amount).toBe(42.21)
        expect(charged.card.number).toBe('xxxxxxxxxxxx1111')
        expect(charged.card.name).toBe('Brad Smith')
        expect(charged.card.address.street_address).toBe('131 Fairy Lane')
        chargeId = charged.id
        cb()
      })
    },function(cb) {
      qbo.refund(chargeId, {amount: 42.21}, function(err, refund) {
        expect(err).toBe(null)
        expect(refund.errors).toBe(undefined)
        expect(refund.amount).toBe(42.21)
        refundId = refund.id
        cb()
      })
    },function(cb) {
      qbo.getRefund(chargeId, refundId, function(err, refund) {
        expect(err).toBe(null)
        expect(refund.errors).toBe(undefined)
        expect(refund.id).toBe(refundId)
        expect(refund.amount).toBe(42.21)
        expect(refund.context).toBeA(Object)
        cb()
      })
    }], function(e, r) {
      done()
    })

  })

})