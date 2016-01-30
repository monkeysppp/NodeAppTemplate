var mysql = require('mysql');
var password = require('password-hash-and-salt');

function createDBConnection(databaseName, databaseUser, databasePassword) {
  return mysql.createConnection({
    host: 'localhost',
    user: databaseUser,
    password: databasePassword,
    database: databaseName,
  });
}

function saltHashAndStore(dbConnection, username, pwd, callback) {
  password(pwd).hash(function(err, hash) {
    if (err) {
      callback('Error processing password: ' + err);
      return;
    }

    storePassword(dbConnection, username, hash, callback);
  });
}

function checkPassword(dbConnection, username, pwd, callback) {
  user = [username];

  dbConnection.query('SELECT * FROM `users` WHERE `username` = ?', user, function(err, rows, fields) {
    if (err) {
      callback('Error querying userDb: ' + err);
      return;
    }

    if (rows.length === 0) {
      callback(null, null);
      return;
    }

    password(pwd).verifyAgainst(rows[0].identity, function(err, verified) {
      if (err) {
        callback('Error while validating password: ' + err);
        return;
      }

      if (!verified) {
        callback('Password failed to validate');
      } else {
        var user = {};
        user.username = rows[0].username;
        user.apiKey = rows[0].apiKey;
        callback(null, user);
      }
    });

  });

}

function storePassword(dbConnection, username, hash, callback) {
  dbConnection.query('CREATE TABLE IF NOT EXISTS `users` ' +
    '(`username` varchar(100) NOT NULL UNIQUE, ' +
    '`identity` varchar(280) NOT NULL, ' +
    '`apiKey` varchar(100) NOT NULL)', function(err, result) {

      if (err) {
        callback('Failed to create table in DB: ' + err);
        return;
      }

      var post  = {
        username: username,
        identity: hash,
        apiKey: uuid(),
      };

      dbConnection.query('INSERT INTO users SET ?', post, function(err, result) {
        if (err) {
          callback('Failed to add user to DB: ' + err);
          return;
        }
      });
    }
  );
}

module.exports = {
  checkPassword: checkPassword,
  createDBConnection: createDBConnection,
  saltHashAndStore: saltHashAndStore,
};
