/*
 * Unit tests for lib/validate.js
 */
 'use strict';

var expect = require('chai').expect;
var validate = require('../../lib/validate.js');
var httpMock = require('node-mocks-http');
var sinon = require('sinon');
var jwt = require('jsonwebtoken');
var uuid = require('uuid4');

describe('validation', function() {
  var secret = 'ghijkl';
  before(function() {
    validate.setSecret(secret);
  });

  describe('#signToken', function() {
    it('signs a token with a given secret', function() {
      var rawToken = { key: 'abcdef' };
      var signedToken = validate.signToken(rawToken);

      expect(jwt.verify.bind(jwt, signedToken, secret)).not.to.throw(Error);
    });

    it('adds required values to the token', function() {
      var rawToken = { key: 'abcdef' };
      var signedToken = jwt.verify(validate.signToken(rawToken), secret);

      expect(typeof signedToken.exp).to.equal('number');
      expect(typeof signedToken.iat).to.equal('number');
      expect(typeof signedToken.iss).to.equal('string');
    });
  });

  describe('#validateToken', function() {
    it('rejects an invalid token', function() {
      var rawToken = { key: 'abcdef' };
      var jwtToken = 'invalid' + validate.signToken(rawToken);

      expect(validate.validateToken.bind(validate, jwtToken)).to.throw(Error);
    });

    it('rejects an expired token', function() {
      var dateNow = new Date();
      var timeThen = dateNow.getTime() - 1;
      var rawToken = {
        key: 'abcdef',
        exp: timeThen,
      };

      var jwtToken = jwt.sign(rawToken, secret);
      var tokenValidation = validate.validateToken(jwtToken);

      expect(typeof tokenValidation).to.equal('boolean');
      expect(tokenValidation).to.equal(false);
    });

    it('accepts a valid token', function() {
      var rawToken = { key: 'abcdef' };
      var jwtToken = validate.signToken(rawToken);
      var tokenValidation = validate.validateToken(jwtToken);

      expect(typeof tokenValidation).to.equal('object');
      expect(tokenValidation.key).to.equal(rawToken.key);
    });
  });

  describe('#isJwtPresent', function() {
    it('rejects a req without a JWT cookie', function() {
      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          other: 'abc',
        },
      });

      expect(validate.isJwtPresent(req)).to.equal(false);
    });

    it('accepts a req a JWT token', function() {
      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          jwt: 'jwt',
        },
      });

      expect(validate.isJwtPresent(req)).to.equal(true);
    });
  });

  describe('#getUsername', function() {

    it('returns nothing if a jwt is not present', function() {
      var req = httpMock.createRequest({
        url: '/someUrl',
      });

      expect(validate.getUsername(req)).to.equal(null);
    });

    it('returns nothing if the token is invalid', function() {
      var username = 'DrAwesome';
      var rawToken = { username: username };
      var jwtToken = 'invalid' + validate.signToken(rawToken);

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          jwt: jwtToken,
        },
      });

      expect(validate.getUsername(req)).to.equal(null);
    });

    it('extracts the username from a token', function() {
      var username = 'DrAwesome';
      var rawToken = { username: username };
      var jwtToken = validate.signToken(rawToken);

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          jwt: jwtToken,
        },
      });

      expect(validate.getUsername(req)).to.equal(username);
    });
  });

  describe('#excludeUserChecks', function() {
    var ignoreUrl = '/toIgnore';
    var middleware = validate.excludeUserChecks([ignoreUrl]);

    it('lets through an ignored URL', function() {
      var next = sinon.spy();

      var req = httpMock.createRequest({ url: ignoreUrl });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(0);
    });

    it('catches a missing JWT cookie', function() {
      var next = sinon.spy();

      var req = httpMock.createRequest({ url: '/someUrl' });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(1);
      expect(next.args[0]).to.match(/Authentication Error/);
    });

    it('catches an expired JWT cookie', function() {
      var dateNow = new Date();
      var timeThen = dateNow.getTime() - 1;
      var rawToken = {
        key: 'abcdef',
        exp: timeThen,
      };

      var jwtToken = jwt.sign(rawToken, secret);
      validate.signToken(rawToken);

      var next = sinon.spy();

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          jwt: jwtToken,
        },
      });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(1);
      expect(next.args[0]).to.match(/Authentication Error/);
    });

    it('catches an invalid JWT cookie', function() {
      var rawToken = { key: 'abcdef' };
      var jwtToken = 'invalid' + validate.signToken(rawToken);

      var next = sinon.spy();

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          jwt: jwtToken,
        },
      });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(1);
      expect(next.args[0]).to.match(/Authentication Error/);
    });

    it('allows a valid request', function() {
      var rawToken = { key: 'abcdef' };
      var jwtToken = validate.signToken(rawToken);

      var next = sinon.spy();

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          jwt: jwtToken,
        },
      });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(0);
    });

  });

  describe('#excludeRequestChecks', function() {
    var csrfToken = uuid();
    var ignoreUrl = '/toIgnore';
    var middleware = validate.excludeRequestChecks([ignoreUrl]);

    it('lets through an ignored URL', function() {
      var next = sinon.spy();

      var req = httpMock.createRequest({ url: ignoreUrl });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(0);
    });

    it('catches a missing CSRF cookie', function() {
      var next = sinon.spy();

      var req = httpMock.createRequest({
        url: '/someUrl',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(1);
      expect(next.args[0]).to.match(/Authentication Error/);
    });

    it('catches a missing CSRF header', function() {
      var next = sinon.spy();

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          'X-CSRF-Token': csrfToken,
        },
      });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(1);
      expect(next.args[0]).to.match(/Authentication Error/);
    });

    it('catches mismatching CSRF cookie and header', function() {
      var next = sinon.spy();

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          'X-CSRF-Token': csrfToken + 'a',
        },
        headers: {
          'x-csrf-token': csrfToken + 'b',
        },
      });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(1);
      expect(next.args[0]).to.match(/Authentication Error/);
    });

    it('allows a valid request', function() {
      var next = sinon.spy();

      var req = httpMock.createRequest({
        url: '/someUrl',
        cookies: {
          'X-CSRF-Token': csrfToken,
        },
        headers: {
          'x-csrf-token': csrfToken,
        },
      });
      var res = httpMock.createResponse({});
      req.res = res;

      middleware(req, res, next);
      expect(next.callCount).to.equal(1);
      expect(next.args[0].length).to.equal(0);
    });
  });

  describe('#validationErrorRedirect', function() {
    it('redirects to the login page', function() {
      var req = httpMock.createRequest({});
      var res = httpMock.createResponse({});
      req.res = res;
      var nextErr;
      var next = function(err) {
        nextErr = err;
      };

      validate.validationErrorRedirect('someError', req, res, next);
      expect(res.statusCode).to.equal(302);
      expect(res._getRedirectUrl()).to.equal('/login');
      expect(nextErr).to.equal('someError');
    });
  });

});
