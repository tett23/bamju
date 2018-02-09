/* eslint global-require: 0, flowtype-errors/show-errors: 0 */
// @flow

import path from 'path';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

require('./main/app');
require('./main/window');
require('./main/repository');
