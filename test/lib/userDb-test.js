/*
 * Unit tests for lib/userDb.js
 */
 'use strict';

var expect = require('chai').expect;
var userDb = require('../../lib/userDb.js');
var sinon = require('sinon');
var mysql = require('mysql');

describe('userDb', function() {
  describe('#createDBConnection', function() {
    var mqsqlCreateConnectionStub;

    beforeEach(function() {
      mqsqlCreateConnectionStub = sinon.stub(mysql, 'createConnection', function() {
        return 'connection';
      });
    });

    afterEach(function() {
      mqsqlCreateConnectionStub.restore();
    });

    it('returns an error if no properties have been set', function() {
      expect(userDb.createDBConnection).to.throw('Database properties not set');
    });

    it('creates a connection', function() {
      var dbName = 'dbName';
      var dbUser = 'dbUser';
      var dbPass = 'dbPass';

      userDb.setDBParameters(dbName, dbUser, dbPass);
      var retVal = userDb.createDBConnection();

      expect(mqsqlCreateConnectionStub.callCount).to.equal(1);
      expect(retVal).to.equal('connection');
      expect(typeof mqsqlCreateConnectionStub.getCall(0)).to.equal('object');
      expect(mqsqlCreateConnectionStub.getCall(0).args[0].database).to.equal(dbName);
      expect(mqsqlCreateConnectionStub.getCall(0).args[0].user).to.equal(dbUser);
      expect(mqsqlCreateConnectionStub.getCall(0).args[0].password).to.equal(dbPass);
    });
  });

  describe('#saltHashAndStore', function() {
    var mqsqlCreateConnectionStub;
    var queryStrings;
    var queryObjects;
    var reportError;
    var destroyCalled;

    beforeEach(function() {
      var dbName = 'dbName';
      var dbUser = 'dbUser';
      var dbPass = 'dbPass';
      queryStrings = [];
      queryObjects = [];
      reportError = 0;
      destroyCalled = false;

      userDb.setDBParameters(dbName, dbUser, dbPass);

      mqsqlCreateConnectionStub = sinon.stub(mysql, 'createConnection', function() {
        return {
          query: function(queryString, arg1, arg2) {
            queryStrings.push(queryString);
            if (arg2) {
              queryObjects.push(arg1);
              if (reportError === 2) {
                arg2('error');
              } else {
                arg2();
              }
            } else {
              queryObjects.push(null);
              if (reportError === 1) {
                arg1('error');
              } else {
                arg1();
              }
            }
          },

          destroy: function() {
            destroyCalled = true;
          },
        };
      });
    });

    afterEach(function() {
      mqsqlCreateConnectionStub.restore();
    });

    it('reports an error for an empty password', function(done) {
      userDb.saltHashAndStore('', '', function(err) {
        expect(err).to.match(/Error processing password:/);
        done();
      });
    });

    it('reports a table creation problem', function(done) {
      reportError = 1;
      var username = 'someName';
      var password = 'somePassword';

      userDb.saltHashAndStore(username, password, function(err) {
        expect(queryStrings.length).to.equal(1);
        expect(err).to.match(/Failed to create table in DB/);
        expect(destroyCalled).to.equal(true);
        done();
      });
    });

    it('reports a row insert problem', function(done) {
      reportError = 2;
      var username = 'someName';
      var password = 'somePassword';

      userDb.saltHashAndStore(username, password, function(err) {
        expect(queryStrings.length).to.equal(2);
        expect(err).to.match(/Failed to add user to DB/);
        expect(destroyCalled).to.equal(true);
        done();
      });
    });

    it('hashes a password', function(done) {
      var username = 'someName';
      var password = 'somePassword';

      userDb.saltHashAndStore(username, password, function() {
        expect(queryStrings.length).to.equal(2);
        expect(queryStrings[0]).to.match(/^CREATE/);
        expect(queryObjects[0]).to.equal(null);
        expect(queryStrings[1]).to.match(/^INSERT/);
        expect(typeof queryObjects[1]).to.equal('object');
        expect(queryObjects[1].username).to.equal(username);
        expect(queryObjects[1].identity).not.to.equal(password);
        expect(destroyCalled).to.equal(true);
        done();
      });
    });
  });

  describe('#checkPassword', function() {
    var username = 'someName';
    var password = 'somePassword';
    var passwordSaltAndHash = require('password-hash-and-salt');
    var mqsqlCreateConnectionStub;
    var queryString;
    var queryObject;
    var controlQuery;
    var destroyCalled;

    beforeEach(function() {
      var dbName = 'dbName';
      var dbUser = 'dbUser';
      var dbPass = 'dbPass';
      queryString = undefined;
      queryObject = undefined;
      controlQuery = 0;
      destroyCalled = false;

      userDb.setDBParameters(dbName, dbUser, dbPass);

      mqsqlCreateConnectionStub = sinon.stub(mysql, 'createConnection', function() {
        return {
          query: function(queryStringIn, queryObjectIn, callback) {
            queryString = queryStringIn;
            queryObject = queryObjectIn;

            if (controlQuery === 1) {
              callback('err');
            } else if (controlQuery === 2) {
              callback(null, []);
            } else if (controlQuery === 3) {
              callback(null, [
                {
                  username: username,
                  identity: '$10000$5e45$5e45',
                },
              ]);
            } else if (controlQuery === 4) {
              callback(null, [
                {
                  username: username,
                  identity: '',
                },
              ]);
            } else if (controlQuery === 5) {
              passwordSaltAndHash(password).hash(function(err, hash) {
                callback(null, [
                  {
                    username: username,
                    identity: hash,
                  },
                ]);
              });
            } else {
              callback(null, []);
            }
          },

          destroy: function() {
            destroyCalled = true;
          },
        };
      });
    });

    afterEach(function() {
      mqsqlCreateConnectionStub.restore();
      delete process.env.NODE_SKIP_PASSWORD_CHECK;
    });

    it('Returns a default object when checking is disabled', function(done) {
      process.env.NODE_SKIP_PASSWORD_CHECK = '1';
      userDb.checkPassword(username, password, function(err, user) {
        expect(err).to.equal(null);
        expect(user.username).to.equal('testUser');
        done();
      });
    });

    it('Reports an error for querying the database', function(done) {
      controlQuery = 1;

      userDb.checkPassword(username, password, function(err) {
        expect(err).to.match(/Error querying userDb/);
        expect(destroyCalled).to.equal(true);
        done();
      });
    });

    it('Returns nothing if no user is found', function(done) {
      controlQuery = 2;

      userDb.checkPassword(username, password, function(err, user) {
        expect(err).to.equal(null);
        expect(user).to.equal(null);
        expect(destroyCalled).to.equal(true);
        done();
      });
    });

    it('Reports an error when a password errors during validation', function(done) {
      controlQuery = 3;

      userDb.checkPassword(username, password, function(err) {
        expect(err).to.match(/Error while validating password/);
        done();
      });
    });

    it('Reports an error when a password fails validation', function(done) {
      controlQuery = 4;

      userDb.checkPassword(username, password, function(err) {
        expect(err).to.match(/Password failed to validate/);
        done();
      });
    });

    it('Returns the user info when a password passes validation', function(done) {
      controlQuery = 5;

      userDb.checkPassword(username, password, function(err, user) {
        expect(err).to.equal(null);
        expect(user.username).to.equal(username);
        done();
      });
    });

  });

});
