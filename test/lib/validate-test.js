/*
 * Unit tests for lib/validate.js
 */

var expect = require('chai').expect;
var validate = require('../../lib/validate.js');
var httpMock = require('node-mocks-http');
var sinon = require('sinon');

describe('validation', function() {

  describe('#setExcludeUserChecks', function() {

    it('lets through an ignored URL', function() {
      var ignoreUrl = '/toIgnore';
      var middleware = validate.setExcludeUserChecks([ignoreUrl]);
      var next = sinon.spy();

      var req = httpMock.createRequest({ url:ignoreUrl });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(0);
    });

    it('catches a missing JWT cookie', function() {

    });

    it('catches an invalid JWT cookie', function() {

    });

    it('catches a missing CSRF cookie', function() {

    });

    it('catches a missing CSRF header', function() {

    });

    it('catches mismatching CSRF cookie and header', function() {

    });

    it('allows a valid request', function() {

    });

  });

});
