'use strict';

var mysql = require('mysql');
var password = require('password-hash-and-salt');
var uuid = require('uuid4');

var dbUser = null;
var dbPassword = null;
var dbName = null;

function createDBConnection(databaseName, databaseUser, databasePassword) {
  return mysql.createConnection({
    host: 'localhost',
    user: databaseUser,
    password: databasePassword,
    database: databaseName,
  });
}

function saltHashAndStore(username, pwd, callback) {
  password(pwd).hash(function(err, hash) {
    if (err) {
      callback('Error processing password: ' + err);
      return;
    }

    storePassword(username, hash, callback);
  });
}

function checkPassword(username, pwd, callback) {
  var user = [username];

  // callback(null, {username: 'andy'});
  // return;
  var dbConnection = createDBConnection(dbName, dbUser, dbPassword);
  dbConnection.query('SELECT * FROM `users` WHERE `username` = ?', user, function(err, rows) {
    if (err) {
      callback('Error querying userDb: ' + err);
      dbConnection.destroy();
      return;
    }

    if (rows.length === 0) {
      callback(null, null);
      dbConnection.destroy();
      return;
    }

    password(pwd).verifyAgainst(rows[0].identity, function(err, verified) {
      if (err) {
        callback('Error while validating password: ' + err);
        dbConnection.destroy();
        return;
      }

      if (!verified) {
        callback('Password failed to validate');
        dbConnection.destroy();
      } else {
        var user = {};
        user.username = rows[0].username;
        user.apiKey = rows[0].apiKey;
        callback(null, user);
        dbConnection.destroy();
      }
    });

  });

}

function storePassword(username, hash, callback) {
  var dbConnection = createDBConnection(dbName, dbUser, dbPassword);
  dbConnection.query('CREATE TABLE IF NOT EXISTS `users` ' +
    '(`username` varchar(100) NOT NULL UNIQUE, ' +
    '`identity` varchar(280) NOT NULL, ' +
    '`apiKey` varchar(100) NOT NULL)', function(err) {

      if (err) {
        callback('Failed to create table in DB: ' + err);
        return;
      }

      var post  = {
        username: username,
        identity: hash,
        apiKey: uuid(),
      };

      dbConnection.query('INSERT INTO users SET ?', post, function(err) {
        if (err) {
          callback('Failed to add user to DB: ' + err);
        }

        dbConnection.destroy();
      });
    }
  );
}

function setDBParameters(databaseName, databaseUser, databasePassword) {
  dbUser = databaseUser;
  dbPassword = databasePassword;
  dbName = databaseName;
}

module.exports = {
  setDBParameters: setDBParameters,
  checkPassword: checkPassword,
  createDBConnection: createDBConnection,
  saltHashAndStore: saltHashAndStore,
};
