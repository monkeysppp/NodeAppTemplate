/*
 * Unit tests for lib/logging.js
 */
 'use strict';

var expect = require('chai').expect;
var logging = require('../../lib/logging.js');
var chai = require('chai');
var dirtyChai = require('dirty-chai');
chai.use(dirtyChai);

describe('logging', function() {
  describe('#getLogger', function() {
    it('throws an error when called without a name', function() {
      expect(logging.getLogger).to.throw(/options.name.*is required/);
    });

    it('returns a logger', function() {
      var name = 'myLogger';
      var logger = logging.getLogger(name);
      expect(logger.fields).to.exist();
      expect(logger.fields.name).to.equal(name);
    });
  });
});
