var express = require('express');
var log = require('../lib/logging').getLogger('routes/index');
var router = express.Router();
var passport = require('passport');
var config = require('../lib/config');
var validator = require('../lib/validate');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: config.title, username: validator.getUsername(req) });
});

router.get('/login', function(req, res, next) {
  log.info('Call to GET /login');
  res.render('login', { title: config.title });
});

// Authenticate using the 'local' strategy
router.post('/login', function(req, res, next) {
  log.info('Call to POST /login');
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

    // TODO set an expiry time on the jwt token.
    res.cookie('jwt', token, { httpOnly: true, secure: true });
    res.redirect('/');

    // TODO req.login() ?
  })(req, res, next);

  // passport.authenticate('local', {
  //   successRedirect: '/',
  //   failureRedirect: '/login',
  // })
});

router.get('/logout', function(req, res) {
  log.info('Call to GET /logout');

  if (validator.isJwtPresent(req)) {
    try {
      var token = validator.validateToken(req.cookies.jwt);
      log.info('User <' + token.username + '> logged out');
      res.clearCookie('jwt');
    } catch (err) {
      log.error('Invalid JWT token');
    }
  } else {
    log.info('logout called, but user doesn\'t appear to be logged in');
  }

  res.redirect('/');
});

module.exports = router;
