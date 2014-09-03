var expect     = require('expect'),
    async      = require('async'),
    moment     = require('moment'),
    config     = require('../config'),
    QuickBooks = require('../index'),
    qbo        = new QuickBooks(config);


describe('Change Data Capture', function() {

  this.timeout(15000);

  it('should create an Attachable and capture the change', function(done) {

    async.series([function(cb) {
      qbo.createAttachable({Note: 'CDC Attachable', Tag: 'Testing'}, function(err, attachable) {
        expect(err).toBe(null)
        expect(attachable.Fault).toBe(undefined)
        expect(attachable.Note).toBe('CDC Attachable')
        cb()
      })
    }, function(cb) {
      qbo.changeDataCapture(['Attachable'], moment().subtract(1, 'm'), function(err, data) {
        expect(err).toBe(null)
        expect(data.Fault).toBe(undefined)
        expect(data.CDCResponse[0].QueryResponse[0].Attachable[0].Tag).toBe('Testing')
        var att = data.CDCResponse[0].QueryResponse[0].Attachable[0]
        qbo.deleteAttachable(att, function(e, d) {
          expect(e).toBe(null)
          expect(d.Fault).toBe(undefined)
          cb()
        })
      })
    }], function(e, r) {
      done()
    })

  })

})