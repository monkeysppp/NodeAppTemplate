'use strict';

var log = require('../lib/logging').getLogger('validate');
var jwt = require('jsonwebtoken');
var jwtSecret;

function setSecret(secret) {
  jwtSecret = secret;
}

function signToken(tokenData) {
  tokenData.iss = 'monkeysplayingpingpong.co.uk/TemplateApp';
  var dateNow = new Date();
  var timeNow = dateNow.getTime();
  var timeExp = timeNow + (86400000);
  tokenData.exp = timeExp;

  return jwt.sign(tokenData, jwtSecret);
}

function validateToken(token) {
  try {
    var tokenObj = jwt.verify(token, jwtSecret);
    var dateNow = new Date();
    var timeNow = dateNow.getTime();
    if (timeNow > tokenObj.exp) {
      return false;
    }

    return tokenObj;
  } catch (err) {
    throw err;
  }
}

function isJwtPresent(req) {
  return ('cookies' in req && 'jwt' in req.cookies);
}

function getUsername(req) {
  if (isJwtPresent(req)) {
    try {
      var token = validateToken(req.cookies.jwt, jwtSecret);
      return token.username;
    } catch (err) {
      return null;
    }
  } else {
    return null;
  }
}

function excludeUserChecks(excludeDirs) {
  var dirs = excludeDirs;

  function contains(arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === val) {
        return true;
      }
    }

    return false;
  }

  return function(req, res, next) {
    var url = req.originalUrl;
    var msg;

    if (contains(dirs, url)) {
      log.debug('Ignoring user validation checks for url ' + url);
      next();
      return;
    }

    if (!isJwtPresent(req)) {
      msg = Error('Authentication Error');
      log.error('No JWT present');
      next(msg);
      return;
    }

    try {
      if (!validateToken(req.cookies.jwt)) {
        msg = Error('Authentication Error');
        log.error('Expired token');
        next(msg);
        return;
      }
    } catch (err) {
      msg = Error('Authentication Error');
      log.error(err);
      next(msg);
      return;
    }

    log.debug('Request passes validation checks');
    next();
  };
}

function excludeRequestChecks(excludeDirs) {
  var dirs = excludeDirs;

  function contains(arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === val) {
        return true;
      }
    }

    return false;
  }

  return function(req, res, next) {
    var url = req.originalUrl;
    var msg;

    if (contains(dirs, url)) {
      log.debug('Ignoring csrf validation checks for url ' + url);
      next();
      return;
    }

    if (!req.cookies['X-CSRF-Token']) {
      msg = Error('Authentication Error');
      log.error('Missing CSRF token cookie');
      next(msg);
      return;
    }

    if (!req.headers['x-csrf-token']) {
      msg = Error('Authentication Error');
      log.error('Missing CSRF token header');
      next(msg);
      return;
    }

    if (req.cookies['X-CSRF-Token'] !== req.headers['x-csrf-token']) {
      msg = Error('Authentication Error');
      log.error('CSRF token cookie and header do not match');
      next(msg);
      return;
    }

    log.debug('Request passes validation checks');
    next();
  };
}

function validationErrorRedirect(err, req, res) {
  log.warn('Redirecting to login page');
  res.redirect('/login');
}

module.exports = {
  setSecret: setSecret,
  signToken: signToken,
  validateToken: validateToken,
  isJwtPresent: isJwtPresent,
  getUsername: getUsername,
  excludeUserChecks: excludeUserChecks,
  excludeRequestChecks: excludeRequestChecks,
  validationErrorRedirect: validationErrorRedirect,
};
