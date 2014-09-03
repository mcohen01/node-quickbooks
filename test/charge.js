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
      },
      currency: 'USD'
    }

    var chargeId
    async.series([function(cb) {
      qbo.charge(charge, function(err, charged) {
        expect(err).toBe(null)
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
        expect(charge.status).toBe('captured')
        expect(charge.amount).toBe(42.21)
        expect(charge.card.number).toBe('xxxxxxxxxxxx1111')
        expect(charge.card.name).toBe('Brad Smith')
        expect(charge.card.address.street_address).toBe('131 Fairy Lane')
        cb()
      })
    }, function(cb) {
      qbo.getCharges(function(err, charges) {
        expect(err).toBe(null)
        expect(charges.length).toBeGreaterThan(0)
        charges.forEach(function(charge) {
          expect(charge.created).toNotBe(undefined)
          expect(charge.status).toBe('captured')
          expect(charge.amount).toBeGreaterThan(0)
          expect(charge.currency).toBe('USD')
          expect(charge.card).toBeA(Object)
          expect(charge.card.address).toBeA(Object)
          expect(charge.card.number).toBe('xxxxxxxxxxxx1111')
          expect(charge.card.name).toMatch(/[a-z\s]*/i)
          expect(charge.authcode).toMatch(/[\d]*/)
        })
        cb()
      })
    }, function(cb) {
      qbo.capture(chargeId, {
        amount: 42.21,
        description: "capturing",
        context: {
          batch_id: "1234",
          tax: 0,
          recurring: false,
          sender_account_id: "",
          device_info: {
            id: "98765",
            type: "",
            longitude: "",
            latitude: "",
            phone_number: "",
            mac_address: "",
            ip_address: ""
          }
        }
      }, function(err, capture) {
        expect(err).toBe(null)
        util.inspect(capture, {showHidden: false, depth: null})
        cb()
      })
    }], function(e, r) {
      done()
    })

  })

})