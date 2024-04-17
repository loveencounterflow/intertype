(function() {
  'use strict';
  var Intertype, WG, debug, declarations, hide, nameit, rpr, types;

  //===========================================================================================================
  WG = require('webguy');

  ({rpr} = WG.trm);

  ({hide, nameit} = WG.props);

  ({debug} = console);

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
      return (x != null) && ((x.length === 0) || (x.size === 0));
    },
    unary: function(x) {
      return (x != null) && ((x.length === 1) || (x.size === 1));
    },
    binary: function(x) {
      return (x != null) && ((x.length === 2) || (x.size === 2));
    },
    trinary: function(x) {
      return (x != null) && ((x.length === 3) || (x.size === 3));
    },
    //.........................................................................................................
    IT_listener: function(x) {
      return (this.isa.function(x)) || (this.isa.asyncfunction(x));
    },
    IT_note_$key: function(x) {
      return (this.isa.text(x)) || (this.isa.symbol(x));
    },
    unary_or_binary: function(x) {
      return (this.isa.unary(x)) || (this.isa.binary(x));
    },
    binary_or_trinary: function(x) {
      return (this.isa.binary(x)) || (this.isa.trinary(x));
    },
    $freeze: function(x) {
      return this.isa.boolean(x);
    }
  };

  //===========================================================================================================
  Intertype = class Intertype {
    //---------------------------------------------------------------------------------------------------------
    constructor(declarations) {
      var test, type;
      hide(this, 'isa', {
        optional: {}
      });
      hide(this, 'validate', {
        optional: {}
      });
//.......................................................................................................
/* TAINT prevent accidental overwrites */
      for (type in declarations) {
        test = declarations[type];
        ((type, test) => {
          this.isa[type] = this.get_isa(type, test);
          this.isa.optional[type] = this.get_isa_optional(type, test);
          this.validate[type] = this.get_validate(type, test);
          return this.validate.optional[type] = this.get_validate_optional(type, test);
        })(type, test);
      }
      //.......................................................................................................
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
    get_isa(type, test) {
      return (x) => {
        return test.call(this, x);
      };
    }

    get_isa_optional(type, test) {
      return (x) => {
        if (x != null) {
          return test.call(this, x);
        } else {
          return true;
        }
      };
    }

    get_validate_optional(type, test) {
      return (x) => {
        if (x != null) {
          return this.validate[type].call(this, x);
        } else {
          return x;
        }
      };
    }

    get_validate(type, test) {
      return function(x) {
        if (test.call(this, x)) {
          return x;
        }
        /* TAINT `typeof` will give some strange results */
        throw new Error(`expected a ${type}, got a ${typeof x}`);
      };
    }

  };

  //===========================================================================================================
  types = new Intertype(declarations);

  //===========================================================================================================
  module.exports = {Intertype, types, declarations};

}).call(this);

//# sourceMappingURL=main.js.map