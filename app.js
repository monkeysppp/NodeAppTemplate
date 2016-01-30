var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log = require('./lib/logging').getLogger('app');
var userDb = require('./lib/userDb');
var config = require('./lib/config');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var routes = require('./routes/index');

var dbName = process.env.DATABASE_NAME || config.dbName;
var dbUser = process.env.DATABASE_USER || config.dbUser;
var dbPass = process.env.DATABASE_PASS || config.dbPass;
var dbConnection;
try {
  dbConnection = userDb.createDBConnection(dbName, dbUser, dbPass);
} catch (ex) {
  log.fatal('Failed to connect to database:' + ex.message);
  process.exit(1);
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Define the 'local' strategy in passport
passport.use('local', new LocalStrategy(
  function(username, password, done) {
    // Here, the done() function is the callback function we passed to passport.authenticate
    log.debug('About to check for user <' + username + '> in the userDb');
    userDb.checkPassword(dbConnection, username, password, function(err, user) {
      if (err) {
        log.error(err);
        return done(err);
      }

      if (!user) {
        log.error('No such user <' + username + '>');
        return done(null, false, 'Incorrect username.');
      }

      log.info('User <' + username + '> validated');
      return done(null, user);
    });
  }
));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

// Catch a shutdown and run cleanup
process.on('exit', cleanup.bind(null, true));
process.on('SIGINT', cleanup.bind(null, false));
process.on('uncaughtException', cleanup.bind(null, false));

function cleanup(clean) {
  dbConnection.destroy();

  if (clean) {
    process.exit(0);
  }

  process.exit(1);
}

module.exports = app;
