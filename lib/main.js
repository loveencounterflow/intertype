(function() {
  'use strict';
  var Intertype, WG, built_ins, debug, default_declarations, hide, nameit, rpr, types;

  //===========================================================================================================
  WG = require('webguy');

  ({rpr} = WG.trm);

  ({hide, nameit} = WG.props);

  ({debug} = console);

  //===========================================================================================================
  built_ins = {
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
    undefined: function(x) {
      return x === void 0;
    },
    unknown: function(x) {
      return (this.type_of(x)) === 'unknown';
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  default_declarations = {
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
    regex: function(x) {
      return x instanceof RegExp;
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
    constructor(declarations = null) {
      var collection, i, len, ref, test, type;
      if (declarations == null) {
        declarations = default_declarations;
      }
      //.......................................................................................................
      hide(this, 'isa', {
        optional: {}
      });
      hide(this, 'validate', {
        optional: {}
      });
      hide(this, '_type_of_tests', {});
      hide(this, 'type_of', (...P) => {
        return this._type_of(...P);
      });
      ref = [built_ins, declarations];
      //.......................................................................................................
      /* TAINT prevent accidental overwrites */
      for (i = 0, len = ref.length; i < len; i++) {
        collection = ref[i];
        for (type in collection) {
          test = collection[type];
          ((type, test) => {
            if (Reflect.has(this.isa, type)) {
              throw new Error(`unable to re-declare type ${rpr(type)}`);
            }
            this.isa[type] = this.get_isa(type, test);
            this.isa.optional[type] = this.get_isa_optional(type, test);
            this.validate[type] = this.get_validate(type, test);
            this.validate.optional[type] = this.get_validate_optional(type, test);
            if (collection !== built_ins) {
              return this._type_of_tests[type] = this.isa[type];
            }
          })(type, test);
        }
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
        if (x == null) {
          return x;
        }
        if (test.call(this, x)) {
          /* TAINT code duplication */
          return x;
        }
        throw new Error(`expected an optional ${type}, got a ${typeof x}`);
      };
    }

    /* TAINT `typeof` will give some strange results */    get_validate(type, test) {
      return (x) => {
        if (test.call(this, x)) {
          /* TAINT code duplication */
          return x;
        }
        throw new Error(`expected a ${type}, got a ${typeof x}`);
      };
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT `typeof` will give some strange results */    _type_of(x) {
      var ref, test, type;
      if (x === null) {
        return 'null';
      }
      if (x === void 0) {
        return 'undefined';
      }
      ref = this._type_of_tests;
      for (type in ref) {
        test = ref[type];
        if (test(x)) {
          return type;
        }
      }
      return 'unknown';
    }

  };

  //===========================================================================================================
  types = new Intertype(default_declarations);

  //===========================================================================================================
  module.exports = {
    Intertype,
    types,
    declarations: default_declarations
  };

}).call(this);

//# sourceMappingURL=main.js.map