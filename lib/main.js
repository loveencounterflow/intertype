(function() {
  'use strict';
  var Intertype, SUBSIDIARY, WG, declarations, rpr, types;

  //===========================================================================================================
  ({SUBSIDIARY} = require('subsidiary'));

  WG = require('webguy');

  rpr = WG.trm.rpr;

  //===========================================================================================================
  declarations = {
    anything: function(x) {
      return true;
    },
    nothing: function(x) {
      return x == null;
    },
    something: function(x) {
      return x != null;
    },
    null: function(x) {
      return x === null;
    },
    boolean: function(x) {
      return (x === true) || (x === false);
    },
    function: function(x) {
      return (Object.prototype.toString.call(x)) === '[object Function]';
    },
    asyncfunction: function(x) {
      return (Object.prototype.toString.call(x)) === '[object AsyncFunction]';
    },
    symbol: function(x) {
      return (typeof x) === 'symbol';
    },
    object: function(x) {
      return (x != null) && (typeof x === 'object') && ((Object.prototype.toString.call(x)) === '[object Object]');
    },
    text: function(x) {
      return (typeof x) === 'string';
    },
    nullary: function(x) {
      return (x != null) && (x.length === 0);
    },
    unary: function(x) {
      return (x != null) && (x.length === 1);
    },
    binary: function(x) {
      return (x != null) && (x.length === 2);
    },
    //.........................................................................................................
    IT_listener: function(x) {
      return (this.function(x)) || (this.asyncfunction(x));
    },
    IT_note_$key: function(x) {
      return (this.text(x)) || (this.symbol(x));
    },
    unary_or_binary: function(x) {
      return (x != null) && ((x.length === 1) || (x.length === 2));
    },
    binary_or_trinary: function(x) {
      return (x != null) && ((x.length === 2) || (x.length === 3));
    },
    $freeze: function(x) {
      return this.boolean(x);
    }
  };

  //===========================================================================================================
  Intertype = class Intertype {
    //---------------------------------------------------------------------------------------------------------
    constructor(declarations) {
      var test, type;
      SUBSIDIARY.tie_one({
        host: this,
        subsidiary_key: 'isa',
        subsidiary: {},
        enumerable: false
      });
      SUBSIDIARY.tie_one({
        host: this,
        subsidiary_key: 'isa_optional',
        subsidiary: {},
        enumerable: false
      });
      SUBSIDIARY.tie_one({
        host: this,
        subsidiary_key: 'validate',
        subsidiary: {},
        enumerable: false
      });
      SUBSIDIARY.tie_one({
        host: this,
        subsidiary_key: 'validate_optional',
        subsidiary: {},
        enumerable: false
      });
//.......................................................................................................
      for (type in declarations) {
        test = declarations[type];
        ((type, test) => {
          this.isa[type] = (x) => {
            if (x != null) {
              return test.call(this, x);
            } else {
              return true;
            }
          };
          this.isa_optional[type] = (x) => {
            if (x != null) {
              return test.call(this, x);
            } else {
              return true;
            }
          };
          this.validate_optional[type] = (x) => {
            if (x != null) {
              return validate[type].call(this, x);
            } else {
              return x;
            }
          };
          return this.validate[type] = (x) => {
            if (test.call(this, x)) {
              return x;
            }
            /* TAINT `typeof` will give some strange results */
            throw new Error(`expected a ${type}, got a ${typeof x}`);
          };
        })(type, test);
      }
      //.......................................................................................................
      return void 0;
    }

  };

  //===========================================================================================================
  types = new Intertype(declarations);

  //===========================================================================================================
  module.exports = {Intertype, types, declarations};

}).call(this);

//# sourceMappingURL=main.js.map