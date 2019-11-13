(function() {
  'use strict';
  var CND, alert, badge, debug, help, info, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'INTERTYPE/MAIN';

  debug = CND.get_logger('debug', badge);

  alert = CND.get_logger('alert', badge);

  whisper = CND.get_logger('whisper', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  info = CND.get_logger('info', badge);

  //-----------------------------------------------------------------------------------------------------------
  this.provide = function() {
    var k;
    debug('^3332^', (function() {
      var results;
      results = [];
      for (k in this) {
        results.push(k);
      }
      return results;
    }).call(this));
    return this.check = new Proxy({}, {
      get: function(t, k) {
        return function(...P) {
          var error, fn;
          debug('^2221^', rpr(k));
          if (!isa.callable(fn = t[k])) {
            return fn;
          }
          try {
            return fn(...P);
          } catch (error1) {
            error = error1;
            return error;
          }
        };
      },
      set: function(t, k, v) {
        return t[k] = v;
      },
      delete: function(t, k, v) {
        return delete t[k];
      }
    });
  };

}).call(this);
