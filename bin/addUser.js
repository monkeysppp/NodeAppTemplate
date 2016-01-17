/**
 * This talks to a MySQL database and adds a new user to the user database.
 * The password is salted and hashed.
 **/

var mysql = require('mysql');
var password = require('password-hash-and-salt');
var readline = require('readline');
var prompt = require('prompt');

prompt.message = '';
prompt.delimiter = '';

function createDBConnection(databaseName, databaseUser, databasePassword) {
  return mysql.createConnection({
    host: 'localhost',
    user: databaseUser,
    password: databasePassword,
    database: databaseName,
  });
}

function saltHashAndStore(dbConnection, username, pwd) {
  password('mysecret').hash(function(err, hash) {
    if (err) {
      console.log('Error processing password...');
      console.log(err);
      process.exit(1);
    }

    storePassword(dbConnection, username, hash);
  });
}

function storePassword(dbConnection, username, hash) {
  dbConnection.connect(function(err) {
    if (err) {
      console.log('Failed to connect to DB...');
      console.log(err);
      process.exit(1);
    }
  });

  var post  = {username: username, identity: hash};

  // TODO - get table name?  Based on app name?
  // TODO - create table for the app?
  connection.query('INSERT INTO tablename SET ?', post, function(err, result) {
    if (err) {
      console.log('Failed to add user to DB...');
      console.log(err);
      process.exit(1);
    }
  });

  connection.destroy();
}

function usage() {
  console.log('');
  console.log('Usage:');
  console.log('  node addUser.js [database_name] [database_user] [username]');
  console.log('');
}

function main() {
  if (process.argv.length < 5) {
    console.log('Too few arguments...');
    usage();
    process.exit(1);
  }

  var databaseName = process.argv[2];
  var databaseUser = process.argv[3];
  var username     = process.argv[4];

  var promptSchema = {
    properties: {
      dbPwd: {
        message: 'Enter DB password: ',
        required: true,
        hidden: true,
      },
      pwd1: {
        message: 'Enter user password: ',
        required: true,
        hidden: true,
      },
      pwd2: {
        message: 'Re-enter user password: ',
        required: true,
        hidden: true,
      },
    },
  };

  prompt.start();
  prompt.get(promptSchema,
    function(err, result) {
      if (err) {
        console.log('Error reading passwords...');
        process.exit(1);
      }

      if (result.pwd1 !== result.pwd2) {
        console.log('Passwords don\'t match.');
        process.exit(1);
      }

      var databasePwd = result.dbPwd;
      var pwd = result.pwd1;

      if (pwd.length < 8) {
        console.log('Password is too short.  Password must be at least 8 characters long.');
        process.exit(1);
      }

      var dbConnection = createDBConnection(databaseName, databaseUser, databasePwd);
      saltHashAndStore(dbConnection, username, pwd);
      console.log('Password set for user ' + username);

    }
  );
}

main();
