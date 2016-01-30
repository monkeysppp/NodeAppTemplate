var express = require('express');
var log = require('../lib/logging').getLogger('routes/index');
var router = express.Router();
var passport = require('passport');
var config = require('../lib/config');
var jwt = require('jsonwebtoken');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: config.title });
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
    var token = jwt.sign({ username: user.username }, 'tokenSecretToBeReplaced');
    log.info('User <' + user.username + '> logged in');
    res.cookie('jwt', token, { httpOnly: true });
    res.redirect('/');
  })(req, res, next);

  // passport.authenticate('local', {
  //   successRedirect: '/',
  //   failureRedirect: '/login',
  // })
});

router.get('/logout', function(req, res) {
  log.info('User <' + req.user.username + '> logged out');
  req.logout();
  res.redirect('/');
});

module.exports = router;
