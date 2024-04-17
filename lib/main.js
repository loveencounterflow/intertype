(function() {
  'use strict';
  var E, Intertype, WG, _Intertype, built_ins, debug, default_declarations, hide, internal_declarations, internal_types, nameit, rpr, types;

  //===========================================================================================================
  WG = require('webguy');

  ({rpr} = WG.trm);

  ({hide, nameit} = WG.props);

  ({debug} = console);

  E = require('./errors');

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
    float: function(x) {
      return Number.isFinite(x);
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

  //-----------------------------------------------------------------------------------------------------------
  // internal_declarations = { default_declarations..., }
  internal_declarations = {...default_declarations};

  //===========================================================================================================
  // foo: ( x ) -> x is 'foo'
  // bar: ( x ) -> x is 'bar'
  _Intertype = class _Intertype {
    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
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
      hide(this, '_tests_for_type_of', {});
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
              return this._tests_for_type_of[type] = this.isa[type];
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
      var me;
      me = this;
      return nameit(`isa_${type}`, function(x) {
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity(`^isa_${type}@1^`, 1, arguments.length);
        }
        return test.call(me, x);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
    get_isa_optional(type, test) {
      var me;
      me = this;
      return nameit(`isa_optional_${type}`, function(x) {
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity(`^isa_optional_${type}@1^`, 1, arguments.length);
        }
        if (x != null) {
          return test.call(me, x);
        } else {
          return true;
        }
      });
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
    get_validate(type, test) {
      var me;
      me = this;
      return nameit(`validate_${type}`, function(x) {
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity(`^validate_${type}@1^`, 1, arguments.length);
        }
        if (test.call(me, x)) {
          return x;
        }
        throw new E.Intertype_validation_error(`^validate_${type}@1^`, type, typeof x);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
    /* TAINT `typeof` will give some strange results */    get_validate_optional(type, test) {
      var me;
      me = this;
      return nameit(`validate_optional_${type}`, function(x) {
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity(`^validate_optional_${type}@1^`, 1, arguments.length);
        }
        if (x == null) {
          return x;
        }
        if (test.call(me, x)) {
          return x;
        }
        throw new E.Intertype_optional_validation_error(`^validate_optional_${type}@1^`, type, typeof x);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
    /* TAINT `typeof` will give some strange results */    _type_of(x) {
      var ref, test, type;
      if (arguments.length !== 1) {
        throw new E.Intertype_wrong_arity("^type_of@1^", 1, arguments.length);
      }
      if (x === null) {
        return 'null';
      }
      if (x === void 0) {
        return 'undefined';
      }
      ref = this._tests_for_type_of;
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
  Intertype = class Intertype extends _Intertype {};

  //===========================================================================================================
  internal_types = new _Intertype(internal_declarations);

  types = new Intertype(default_declarations);

  //===========================================================================================================
  module.exports = {
    Intertype,
    types,
    declarations: default_declarations
  };

}).call(this);

//# sourceMappingURL=main.js.map