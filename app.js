'use strict';

var bodyParser = require('body-parser');
var config = require('./lib/config');
var cookieParser = require('cookie-parser');
var express = require('express');
var helmet = require('helmet');
var LocalStrategy = require('passport-local').Strategy;
var log = require('./lib/logging').getLogger('app');
var passport = require('passport');
var path = require('path');
var routes = require('./routes/index');
var userDb = require('./lib/userDb');
var validator = require('./lib/validate');

var dbName = process.env.DATABASE_NAME || config.dbName;
var dbUser = process.env.DATABASE_USER || config.dbUser;
var dbPass = process.env.DATABASE_PASS || config.dbPass;
userDb.setDBParameters(dbName, dbUser, dbPass);

var jwtSecret = config.jwtSecret;
if (!jwtSecret) {
  log.error('Using an insecure secret for JWT.  You will want to change this!');
  jwtSecret = 'changeThisSecret';
}

validator.setSecret(jwtSecret);

var jwtIssuer = config.jwtIssuer;
if (!jwtIssuer) {
  log.error('Using JWT without defining an issuer.  You will want to change this!');
  jwtIssuer = 'changeThisIssuer';
}

validator.setIssuer(jwtIssuer);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(helmet.csp({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));
app.use(helmet.xssFilter());
app.use(helmet.frameguard());
app.use(helmet.hsts({ maxAge:7776000000 }));
app.use(helmet.hidePoweredBy());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.noCache());
app.use(helmet.dnsPrefetchControl());

app.use(function(req, res, next) {
  log.info('Call to ' + req.method + ' ' + req.originalUrl);

  if (req.headers) {
    log.debug('Headers: ' + JSON.stringify(req.headers));
  }

  next();
});

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
    userDb.checkPassword(username, password, function(err, user) {
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

app.use(validator.excludeUserChecks(['/', '/login', '/logout']));
app.use(validator.excludeRequestChecks(['/', '/login', '/logout', '/apiui']));
app.use(validator.validationErrorRedirect);
app.use('/', routes);

// TODO - A validation failure during login should stay on login with an error.

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  log.error('Routing to 404: ' + req.originalUrl);
  var err = new Error('Not Found: ' + req.originalUrl);
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res) {
    log.error('Internal error: ' + err.message);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
  log.error('Internal error: ' + err.message);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

// Catch a shutdown and run cleanup
process.on('exit', cleanup.bind(null, true));
process.on('SIGINT', cleanup.bind(null, false));
process.on('uncaughtException', function(err) {
  log.fatal(err);
  cleanup.bind(null, false);
});

function cleanup(clean) {
  if (clean) {
    process.exit(0);
  }

  process.exit(1);
}

module.exports = app;
