'use strict';

var log = require('../lib/logging').getLogger('simpleAdder');

function add(req, res) {
  log.info('Adding numbers. a=<' + req.body.a + '> b=<' + req.body.b + '>');
  var total = req.body.a + req.body.b;
  res.send('{"total":' + total + '}');
}

module.exports = {
  add: add,
};
