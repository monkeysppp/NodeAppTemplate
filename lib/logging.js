'use strict';

var bunyan = require('bunyan');

var nodeEnv = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'production';
var config = require('../config/' + nodeEnv + '.json');

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
