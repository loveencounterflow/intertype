(function() {
  'use strict';
  var DCLS, GUY, LIB, debug, help, info, rpr;

  //===========================================================================================================
  GUY = require('guy');

  ({debug, help, info} = GUY.trm.get_loggers('demo-execa'));

  ({rpr} = GUY.trm);

  LIB = require('./lib');

  DCLS = require('./declarations');

  //===========================================================================================================
  module.exports = {...LIB, ...DCLS};

}).call(this);

//# sourceMappingURL=main.js.map