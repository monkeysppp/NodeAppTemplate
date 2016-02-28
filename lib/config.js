'use strict';

var nodeEnv = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'production';
module.exports = require('../config/' + nodeEnv + '.json');

// TODO - nconf?  Env Var overrides?
