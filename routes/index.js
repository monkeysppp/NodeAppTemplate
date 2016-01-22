var express = require('express');
var router = express.Router();

var config = require('../lib/config');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: config.title });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: config.title });
});

module.exports = router;
