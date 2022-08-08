(function() {
  'use strict';
  var E, GUY, Intertype_abc, misfit, notavalue,
    indexOf = [].indexOf;

  //-----------------------------------------------------------------------------------------------------------
  GUY = require('guy');

  misfit = Symbol('misfit');

  notavalue = Symbol('notavalue');

  E = require('./errors');

  //...........................................................................................................
  this.constructor_of_generators = ((function*() {
    return (yield 42);
  })()).constructor;

  this.deep_copy = structuredClone;

  this.equals = require('../deps/jkroso-equals');

  this.nameit = function(name, f) {
    return Object.defineProperty(f, 'name', {
      value: name
    });
  };

  //===========================================================================================================
  // TYPE_OF FLAVORS
  //-----------------------------------------------------------------------------------------------------------
  this.domenic_denicola_device = (x) => {
    var ref, ref1;
    return (ref = x != null ? (ref1 = x.constructor) != null ? ref1.name : void 0 : void 0) != null ? ref : './.';
  };

  this.mark_miller_device = (x) => {
    return (Object.prototype.toString.call(x)).slice(8, -1);
  };

  this.mark_miller_device_2 = (x) => {
    return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase().replace(/\s+/g, '');
  };

  this.js_type_of = (x) => {
    return Object.prototype.toString.call(x);
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.get_rprs_of_tprs = function(tprs) {
    /* `tprs: test parameters, i.e. additional arguments to type tester, as in `multiple_of x, 4` */
    var rpr_of_tprs, srpr_of_tprs;
    rpr_of_tprs = (function() {
      switch (tprs.length) {
        case 0:
          return '';
        case 1:
          return `${rpr(tprs[0])}`;
        default:
          return `${rpr(tprs)}`;
      }
    })();
    srpr_of_tprs = (function() {
      switch (rpr_of_tprs.length) {
        case 0:
          return '';
        default:
          return ' ' + rpr_of_tprs;
      }
    })();
    return {rpr_of_tprs, srpr_of_tprs};
  };

  //-----------------------------------------------------------------------------------------------------------
  this.intersection_of = function(a, b) {
    var x;
    a = [...a].sort();
    b = [...b].sort();
    return ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = a.length; i < len; i++) {
        x = a[i];
        if (indexOf.call(b, x) >= 0) {
          results.push(x);
        }
      }
      return results;
    })()).sort();
  };

  //---------------------------------------------------------------------------------------------------------
  this.size_of = function(x, fallback = misfit) {
    var R;
    if ((R = GUY.props.get(x, 'length', notavalue)) !== notavalue) {
      return R;
    }
    if ((R = GUY.props.get(x, 'size', notavalue)) !== notavalue) {
      return R;
    }
    if (fallback !== misfit) {
      return fallback;
    }
    throw new E.Intertype_ETEMPTBD('^intertype.size_of@1^', `expected an object with \`x.length\` or \`x.size\`, got a ${this.type_of(x)} with neither`);
  };

  //---------------------------------------------------------------------------------------------------------
  this.signals = GUY.lft.freeze(new GUY.props.Strict_owner({
    target: {
      return_true: Symbol('return_true'),
      advance: Symbol('advance'),
      // element_mode:           Symbol 'element_mode'
      nothing: Symbol('nothing')
    }
  }));

  //-----------------------------------------------------------------------------------------------------------
  this.type_of = function(x) {
    var R, arity, c, tagname;
    if ((arity = arguments.length) !== 1) {
      throw new Error(`^7746^ expected 1 argument, got ${arity}`);
    }
    if (x === null) {
      return 'null';
    }
    if (x === void 0) {
      return 'undefined';
    }
    if ((x === 2e308) || (x === -2e308)) {
      return 'infinity';
    }
    if ((x === true) || (x === false)) {
      return 'boolean';
    }
    if (Number.isNaN(x)) {
      return 'nan';
    }
    if (Number.isFinite(x)) {
      return 'float';
    }
    if (Buffer.isBuffer(x)) {
      return 'buffer';
    }
    if (Array.isArray(x)) {
      return 'list';
    }
    //.........................................................................................................
    /* TAINT Not needed (?) b/c `@js_type_of x` does work with these values, too */
    /* this catches `Array Iterator`, `String Iterator`, `Map Iterator`, `Set Iterator`: */
    if (((tagname = x[Symbol.toStringTag]) != null) && (typeof tagname) === 'string') {
      return this._normalize_type(tagname);
    }
    if ((c = x.constructor) === void 0) {
      //.........................................................................................................
      /* Domenic Denicola Device, see https://stackoverflow.com/a/30560581 */
      return 'nullobject';
    }
    if ((typeof c) !== 'function') {
      return 'object';
    }
    if ((R = c.name.toLowerCase()) === '') {
      if (x.constructor === this.constructor_of_generators) {
        return 'generator';
      }
      /* NOTE: throw error since this should never happen */
      return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase();
    }
    if ((typeof x === 'object') && (R === 'boolean' || R === 'number' || R === 'string')) {
//.........................................................................................................
/* Mark Miller Device */      return 'wrapper';
    }
    if (R === 'regexp') {
      return 'regex';
    }
    if (R === 'string') {
      return 'text';
    }
    if (R === 'function' && x.toString().startsWith('class ')) {
      /* thx to https://stackoverflow.com/a/29094209 */
      /* TAINT may produce an arbitrarily long throwaway string */
      return 'class';
    }
    return R;
  };

  //===========================================================================================================
  // INTERNAL TYPES
  //-----------------------------------------------------------------------------------------------------------
  this.types = new (require('intertype-legacy')).Intertype();

  this.defaults = {};

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('deep_boolean', function(x) {
    return x === 'deep' || x === false || x === true;
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('Type_cfg_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.nonempty_text x.name": function(x) {
        return this.isa.nonempty_text(x.name);
      },
      // "@isa.deep_boolean x.copy":                 ( x ) -> @isa.boolean x.copy
      // "@isa.boolean x.seal":                      ( x ) -> @isa.boolean x.seal
      "@isa.deep_boolean x.freeze": function(x) {
        return this.isa.deep_boolean(x.freeze);
      },
      "@isa.boolean x.extras": function(x) {
        return this.isa.boolean(x.extras);
      },
      "if extras is false, default must be an object": function(x) {
        return x.extras || (this.isa.object(x.default));
      },
      "@isa_optional.function x.create": function(x) {
        return this.isa_optional.function(x.create);
      },
      /* TAINT might want to check for existence of `$`-prefixed keys in case of `( not x.test? )` */
      /* TAINT should validate values of `$`-prefixed keys are either function or non-empty strings */
      "x.test is an optional function or non-empty list of functions": function(x) {
        if (x.test == null) {
          return true;
        }
        if (this.isa.function(x.test)) {
          return true;
        }
        if (!this.isa_list_of.function(x.test)) {
          return false;
        }
        if (x.test.length === 0) {
          return false;
        }
        return true;
      },
      "x.groups is deprecated": function(x) {
        return x.groups == null;
      },
      "@isa.boolean x.collection": function(x) {
        return this.isa.boolean(x.collection);
      }
    }
  });

  //...........................................................................................................
  this.defaults.Type_cfg_constructor_cfg = {
    name: null,
    test: null,
    /* `default` omitted on purpose */
    create: null,
    // copy:             false
    // seal:             false
    freeze: false,
    extras: true,
    collection: false
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('Type_factory_type_dsc', {
    tests: {
      //.........................................................................................................
      /* for later / under consideration */
      // "@isa.deep_boolean x.copy":                       ( x ) -> @isa.boolean x.copy        # refers to result of `type.create()`
      // "@isa.boolean x.seal":                            ( x ) -> @isa.boolean x.seal        # refers to result of `type.create()`
      // "@isa.boolean x.oneshot":                         ( x ) -> @isa.boolean x.oneshot        # refers to result of `type.create()`
      // "@isa.deep_boolean x.freeze":                     ( x ) -> @isa.deep_boolean x.freeze   # refers to result of `type.create()`
      //.........................................................................................................
      // "@isa.boolean x.extras":                          ( x ) -> @isa.boolean x.extras        # refers to result of `type.create()`
      // "if extras is false, default must be an object":  ( x ) -> ( x.extras ) or ( @isa.object x.default )
      // "@isa_optional.function x.create":                ( x ) -> @isa_optional.function x.create
      //.........................................................................................................
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.nonempty_text x.name": function(x) {
        return this.isa.nonempty_text(x.name);
      },
      "@isa.nonempty_text x.typename": function(x) {
        return this.isa.nonempty_text(x.typename);
      },
      "@isa.boolean x.collection": function(x) {
        return this.isa.boolean(x.collection);
      },
      "@isa.function x.isa": function(x) {
        return this.isa.function(x.isa);
      },
      "@isa optional list.of.function x.fields": function(x) {
        if (!this.isa.list(x.fields)) {
          return true;
        }
        return this.isa_list_of.function(x.fields);
      }
    }
  });

  //...........................................................................................................
  this.defaults.Type_factory_type_dsc = {
    name: null,
    typename: null,
    isa: null,
    fields: null,
    collection: false,
    /* `default` omitted on purpose */
    create: null, // refers to result of `type.create()`
    // copy:             false     # refers to result of `type.create()`
    // seal:             false     # refers to result of `type.create()`
    freeze: false, // refers to result of `type.create()`
    extras: true // refers to result of `type.create()`
  };

  
  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('Intertype_iterable', function(x) {
    return (x != null) && (x[Symbol.iterator] != null);
  });

  //-----------------------------------------------------------------------------------------------------------
  this.types.declare('Intertype_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa_optional.nonempty_text x.sep": function(x) {
        return this.isa_optional.nonempty_text(x.sep);
      },
      "x.errors in [ false, 'throw', ]": function(x) {
        var ref;
        return (ref = x.errors) === false || ref === 'throw';
      }
    }
  });

  //...........................................................................................................
  this.defaults.Intertype_constructor_cfg = {
    sep: '.',
    errors: false
  };

  // #-----------------------------------------------------------------------------------------------------------
  // @types.declare 'Intertype_walk_hedgepaths_cfg', tests:
  //   "@isa.object x":                      ( x ) -> @isa.object x
  //   "@isa_optional.nonempty_text x.sep":  ( x ) -> @isa_optional.nonempty_text x.sep
  //   "@isa_optional.function x.evaluate":  ( x ) -> @isa_optional.function x.evaluate
  //   ### TAINT omitted other settings for `GUY.props.tree()` ###
  // #...........................................................................................................
  // @defaults.Intertype_walk_hedgepaths_cfg =
  //   sep:      @defaults.Intertype_constructor_cfg.sep
  //   evaluate: ({ owner, key, value, }) ->
  //     return 'take' if ( types.type_of value ) is 'function'
  //     return 'take' unless GUY.props.has_any_keys value
  //     return 'descend'

    //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  Intertype_abc = class Intertype_abc extends GUY.props.Strict_owner {};

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.defaults = GUY.lft.freeze(this.defaults);

  this.Intertype_abc = Intertype_abc;

}).call(this);

//# sourceMappingURL=helpers.js.map