/*
 * Unit tests for lib/config.js
 */
 'use strict';

var expect = require('chai').expect;

describe('config', function() {

  beforeEach(function() {
    delete require.cache[require.resolve('../../lib/config.js')];
    delete require.cache[require.resolve('../../config/production.json')];
    delete require.cache[require.resolve('../../config/development.json')];
  });

  describe('with NODE_ENV set', function() {
    var config;

    beforeEach(function() {
      process.env.NODE_ENV = 'development';
      config = require('../../lib/config.js');
    });

    it('allows NODE_ENV to set the load file', function() {
      expect(require.cache[require.resolve('../../config/development.json')]).to.exist();
      expect(require.cache[require.resolve('../../config/production.json')]).not.to.exist();
    });
  });

  describe('whithout NODE_ENV set', function() {
    var config;

    beforeEach(function() {
      delete process.env.NODE_ENV;
      console.log('NODE_ENV is: ' + process.env.NODE_ENV);
      config = require('../../lib/config.js');
    });

    it('defaults to production mode', function() {
      expect(require.cache[require.resolve('../../config/production.json')]).to.exist();
      expect(require.cache[require.resolve('../../config/development.json')]).not.to.exist();
    });
  });
});
