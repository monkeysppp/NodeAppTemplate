'use strict';

var bunyan = require('bunyan');
var config = require('./config');

function getLogger(name) {
  var log = bunyan.createLogger({
    name: name,
    level: config.logging.level,
    src: true,
    streams: [
      {
        stream: process.stdout,
      },
    ],
  });

  return log;
}

module.exports = {
  getLogger: getLogger,
};
