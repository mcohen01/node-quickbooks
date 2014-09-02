var expect     = require('expect'),
    async      = require('async'),
    config     = require('../config'),
    QuickBooks = require('../index'),
    qbo        = new QuickBooks(config);


describe('Batch Api', function() {

  this.timeout(30000);

  it('should create 25 Attachables in one batch', function(done) {
    async.series([function(cb) {
      var items = []
      for (var i = 0; i < 25; i++) {
        items.push({
          Attachable: {
            Note: 'Test Attachable ' + i,
            Tag: 'Testing'
          }
        })
      }
      qbo.batch(items, function(err, batchResponse) {
        expect(err).toBe(null)
        expect(batchResponse.BatchItemResponse.length).toBe(25)
        batchResponse.BatchItemResponse.forEach(function(att) {
          expect(att.Fault).toBe(undefined)
          expect(att.Attachable.Tag).toBe('Testing')
        })
        cb()
      })
    }, function(cb) {
      qbo.findAttachables({Tag: 'Testing'}, function(err, attachables) {
        expect(err).toBe(null)
        expect(attachables.Fault).toBe(undefined)
        expect(attachables.QueryResponse.Attachable.length).toBe(25)
        async.each(attachables.QueryResponse.Attachable, function(attached, callback) {
          qbo.deleteAttachable(attached, function(e, d) {
            callback()
          })
        }, function() {
          cb()
        })
      })
    }], function(e, r) {
      done()
    })
  })

})