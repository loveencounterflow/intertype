(function() {
  'use strict';
  var GUY, debug, info, rpr, warn;

  //===========================================================================================================
  GUY = require('guy');

  ({debug, info, warn} = GUY.trm.get_loggers('demo-execa'));

  ({rpr} = GUY.trm);

  //===========================================================================================================
  module.exports = { // class Helpers
    
    //---------------------------------------------------------------------------------------------------------
    get_own_keys: function(d) {
      if (d == null) {
        return [];
      }
      return (Object.getOwnPropertyNames(d)).concat(Object.getOwnPropertySymbols(d));
    },
    //---------------------------------------------------------------------------------------------------------
    get_own_user_keys: function(d) {
      var k, system_keys;
      if (d == null) {
        return [];
      }
      system_keys = new Set(this.get_own_system_keys(d));
      return (function() {
        var i, len, ref, results;
        ref = this.get_own_keys(d);
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          k = ref[i];
          if ((typeof k === 'symbol') || (!system_keys.has(k))) {
            results.push(k);
          }
        }
        return results;
      }).call(this);
    },
    //---------------------------------------------------------------------------------------------------------
    get_own_system_keys: function(d) {
      var k;
      if (d == null) {
        return [];
      }
      return (function() {
        var i, len, ref, results;
        ref = Object.getOwnPropertyNames(d);
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          k = ref[i];
          if (k.startsWith('$')) {
            results.push(k);
          }
        }
        return results;
      })();
    }
  };

}).call(this);

//# sourceMappingURL=helpers.js.map