var express = require('express');
var log = require('../lib/logging').getLogger('routes/index');
var router = express.Router();
var passport = require('passport');
var config = require('../lib/config');
var validator = require('../lib/validate');
var uuid = require('uuid4');
var apis = require('../api/index');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: config.title, username: validator.getUsername(req) });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: config.title });
});

// Authenticate using the 'local' strategy
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.json(401, { error: 'message' });
    }

    // User has authenticated correctly. Create a JWT token
    log.debug('User <' + user.username + '> authenticated okay');
    var token = validator.signToken({ username: user.username });
    log.info('User <' + user.username + '> logged in');

    var csrfToken = uuid();
    res.cookie('jwt', token, { httpOnly: true, secure: true });
    res.cookie('X-CSRF-Token', csrfToken);
    res.redirect('/');
  })(req, res, next);
});

router.get('/logout', function(req, res) {
  if (validator.isJwtPresent(req)) {
    try {
      var token = validator.validateToken(req.cookies.jwt);
      log.info('User <' + token.username + '> logged out');
      res.clearCookie('jwt');
      res.clearCookie('X-CSRF-Token');
    } catch (err) {
      log.error('Invalid JWT token');
    }
  } else {
    log.info('logout called, but user doesn\'t appear to be logged in');
  }

  res.redirect('/');
});

router.post('/apis/add', function(req, res, next) {
  apis.add(req, res, next);
});

router.get('/apiui', function(req, res, next) {
  res.render('api', { username: validator.getUsername(req) });
});

module.exports = router;
