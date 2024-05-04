(function() {
  'use strict';
  var E, Intertype, Intertype_minimal, WG, _Intertype, built_ins, create, debug, default_declarations, hide, internal_declarations, internal_types, isa, nameit, rpr, set, type_of, types, validate;

  //===========================================================================================================
  WG = require('webguy');

  ({rpr} = WG.trm);

  ({hide, nameit} = WG.props);

  ({debug} = console);

  E = require('./errors');

  set = function(t, k, v) {
    return Object.defineProperty(t, k, {
      value: v,
      enumerable: true
    });
  };

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
    basetype: function(x) {
      return ((typeof x) === 'string') && (x === 'optional' || Reflect.has(built_ins, x));
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
    float: function(x) {
      return Number.isFinite(x);
    },
    text: {
      template: '',
      test: (function(x) {
        return (typeof x) === 'string';
      })
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

  _Intertype = (function() {
    //===========================================================================================================
    // foo: ( x ) -> x is 'foo'
    // bar: ( x ) -> x is 'bar'
    class _Intertype {
      //---------------------------------------------------------------------------------------------------------
      /* TAINT may want to check type, arities */
      constructor(...declarations) {
        if (!this.constructor._minimal) {
          declarations.unshift(default_declarations);
        }
        //.......................................................................................................
        hide(this, 'isa', this._new_strict_proxy('isa'));
        hide(this, 'validate', this._new_strict_proxy('validate'));
        hide(this, 'create', this._new_strict_proxy('create'));
        hide(this, 'declarations', this._new_strict_proxy('declarations'));
        hide(this, '_tests_for_type_of', {});
        hide(this, 'type_of', (...P) => {
          return this._type_of(...P);
        });
        hide(this, 'declare', (...P) => {
          return this._declare(...P);
        });
        //.......................................................................................................
        this._declare(built_ins, ...declarations);
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _declare(...declarations) {
        var collection, i, len, test, type;
        for (i = 0, len = declarations.length; i < len; i++) {
          collection = declarations[i];
          for (type in collection) {
            test = collection[type];
            ((type, test) => {
              var declaration, ref1, sub_type, target_type, targets;
              //...................................................................................................
              ({target_type, targets, sub_type} = this._resolve_dotted_type(type));
              declaration = this._compile_declaration_object(type, test);
              //...................................................................................................
              if (Reflect.has(this.declarations, type)) {
                if ((ref1 = typeof internal_types !== "undefined" && internal_types !== null ? internal_types.isa.basetype(type) : void 0) != null ? ref1 : false) {
                  throw new E.Intertype_basetype_redeclaration_forbidden('^constructor@1^', type);
                }
                throw new E.Intertype_declaration_redeclaration_forbidden('^constructor@2^', type);
              }
              //...................................................................................................
              this.declarations[type] = declaration;
              /* TAINT pass `declaration` as sole argument, as for `create.type()` */
              this.isa[type] = this.get_isa(declaration);
              this.isa.optional[type] = this.get_isa_optional(type, declaration.test);
              this.validate[type] = this.get_validate(type, declaration.test);
              this.validate.optional[type] = this.get_validate_optional(type, declaration.test);
              this.create[type] = this.get_create(declaration);
              if (collection !== built_ins) {
                this._tests_for_type_of[type] = declaration.test;
              }
              //...................................................................................................
              if (targets != null) {
                set(targets['isa'], sub_type, this.isa[type]);
                set(targets['isa.optional'], sub_type, this.isa.optional[type]);
                set(targets['validate'], sub_type, this.validate[type]);
                set(targets['validate.optional'], sub_type, this.validate.optional[type]);
                return this.declarations[target_type].sub_tests[sub_type] = this.isa[type];
              }
            })(type, test);
          }
        }
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _resolve_dotted_type(type) {
        /* analyze flat type declarations with dot notation */
        var i, idx, partial_type, ref1, sub_type, sub_types, target_type, targets;
        target_type = null;
        targets = null;
        sub_type = null;
        //.......................................................................................................
        if ((sub_types = type.split('.')).length > 1) {
          for (idx = i = 0, ref1 = sub_types.length - 1; (0 <= ref1 ? i < ref1 : i > ref1); idx = 0 <= ref1 ? ++i : --i) {
            partial_type = sub_types.slice(0, +idx + 1 || 9e9).join('.');
            /* NOTE using `Reflect.has()` to avoid triggering Unknown Type Error: */
            if (!Reflect.has(this.declarations, partial_type)) {
              throw new E.Intertype_unknown_partial_type('^constructor@1^', type, partial_type);
            }
          }
          target_type = partial_type;
          sub_type = sub_types.at(-1);
          targets = {
            'isa': this.isa[target_type],
            'isa.optional': this.isa.optional[target_type],
            'validate': this.validate[target_type],
            'validate.optional': this.validate.optional[target_type]
          };
        }
        //.......................................................................................................
        return {type, target_type, targets, sub_type};
      }

      //---------------------------------------------------------------------------------------------------------
      _compile_declaration_object(type, declaration) {
        /*

        _compile_declaration_object: ( type, declaration ) ->

        * handle internal usage
        * set `R` to object with defaults
        * if `declaration` is text:
          * ensure it's a known type
          * construct test method (Q: if ref type should change later, will this test use the old or the new
            meaning? A: you can't change type declarations)
        * if declaration is function:
          * validate arity
          * wrap for use as `R.test`
        * call recursively for each entry in `declaration.fields`
        * return `R`

         */
        var N, R, template, test;
        template = {
          type,
          test: null,
          sub_tests: {}
        };
        if (this.constructor === _Intertype) {
          if (default_declarations.function(declaration)) {
            return {
              ...template,
              test: declaration
            };
          }
          return {...template, ...declaration};
        }
        //.......................................................................................................
        R = {...template};
        //.......................................................................................................
        switch (true) {
          //.....................................................................................................
          case internal_types.isa.text(declaration):
            ((ref_type) => {
              var ref1, test;
              if ((test = (ref1 = this.declarations[ref_type]) != null ? ref1.test : void 0) == null) {
                throw new E.Intertype_unknown_type('^constructor@1^', ref_type);
              }
              return R.test = nameit(type, function(x) {
                return test.call(this, x);
              });
            })(declaration);
            break;
          //.....................................................................................................
          case internal_types.isa.function(declaration):
            ((test) => {
              return R.test = nameit(type, function(x) {
                return test.call(this, x);
              });
            })(declaration);
            break;
          //.....................................................................................................
          case internal_types.isa.object(declaration):
            Object.assign(R, declaration);
            break;
          default:
            //.....................................................................................................
            throw new E.Intertype_wrong_type('^constructor@1^', "type name, test method, or object", internal_types.type_of(declaration));
        }
        //.......................................................................................................
        // validate R
        //.......................................................................................................
        return R;
        //.......................................................................................................
        //.......................................................................................................
        //.......................................................................................................
        //.......................................................................................................
        //.......................................................................................................
        if (internal_types.isa.text(test)) {
          if ((declaration = this.declarations[test]) == null) {
            throw new E.Intertype_unknown_type('^constructor@1^', type);
          }
          //#####################################################################################################
          N = (() => {
            var source;
            source = `N.f = function(x) { return this.isa.${test}(x); }`;
            N = {};
            eval(source, {N});
            return N;
          })();
          test = {
            ...template,
            test: nameit(type, N.f)
          };
          //#####################################################################################################
          // test      = { template..., declaration..., }
          test.type = type;
        }
        //.......................................................................................................
        switch (true) {
          //.....................................................................................................
          case internal_types.isa.function(test):
            R = {...template, type, test};
            break;
          //.....................................................................................................
          case /* TAINT assign template */internal_types.isa.object(test):
            R = {...template, type, ...test};
            break;
          default:
            //.....................................................................................................
            throw new E.Intertype_wrong_type('^constructor@1^', "type name, function or object", internal_types.type_of(test));
        }
        //.......................................................................................................
        if (internal_types.isa.text(R.test)) {
          if ((declaration = this.declarations[R.test]) == null) {
            throw new E.Intertype_unknown_type('^constructor@1^', type);
          }
          R = {...declaration};
          R.type = type;
        }
        //.......................................................................................................
        /* TAINT should ideally check entire object? */
        if (!internal_types.isa.function(R.test)) {
          throw new E.Intertype_test_must_be_function('^constructor@2^', 'function', internal_types.type_of(test));
        }
        if (!internal_types.isa.unary(R.test)) {
          throw new E.Intertype_function_with_wrong_arity('^constructor@2^', 1, R.test.length);
        }
        R.sub_tests = {};
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _new_strict_proxy(name) {
        /* Create a proxy for a new object that will throw an `Intertype_unknown_type` error when
           a non-existing property is accessed */
        var get_cfg, optional;
        get_cfg = (ref) => {
          return {
            get: (target, key) => {
              var R;
              if (key === Symbol.toStringTag) {
                return void 0;
              }
              if (key === 'constructor') {
                return target.constructor;
              }
              if (key === 'toString') {
                return target.toString;
              }
              if ((R = Reflect.get(target, key)) != null) {
                // return target.call        if key is 'call'
                // return target.apply       if key is 'apply'
                return R;
              }
              throw new E.Intertype_unknown_type(ref, key);
            }
          };
        };
        optional = new Proxy({}, get_cfg(`^proxy_for_${name}_optional@1^`));
        return new Proxy({optional}, get_cfg(`^proxy_for_${name}@1^`));
      }

      //---------------------------------------------------------------------------------------------------------
      get_isa(declaration) {
        var me;
        me = this;
        return nameit(`isa.${declaration.type}`, function(x) {
          var field_name, ref1, sub_test;
          if (arguments.length !== 1) {
            throw new E.Intertype_wrong_arity(`^isa_${declaration.type}@1^`, 1, arguments.length);
          }
          if (!declaration.test.call(me, x)) {
            return false;
          }
          ref1 = declaration.sub_tests;
          for (field_name in ref1) {
            sub_test = ref1[field_name];
            if (!sub_test.call(me, x[field_name])) {
              return false;
            }
          }
          return true;
        });
      }

      //---------------------------------------------------------------------------------------------------------
      get_isa_optional(type, test) {
        var me;
        me = this;
        return nameit(`isa.optional.${type}`, function(x) {
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
      get_validate(type, test) {
        var me;
        me = this;
        return nameit(`validate.${type}`, function(x) {
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
      /* TAINT `typeof` will give some strange results */      get_validate_optional(type, test) {
        var me;
        me = this;
        return nameit(`validate.optional.${type}`, function(x) {
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
      /* TAINT `typeof` will give some strange results */      _type_of(x) {
        var ref1, test, type;
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity("^type_of@1^", 1, arguments.length);
        }
        if (x === null) {
          return 'null';
        }
        if (x === void 0) {
          return 'undefined';
        }
        ref1 = this._tests_for_type_of;
        for (type in ref1) {
          test = ref1[type];
          if (test(x)) {
            return type;
          }
        }
        return 'unknown';
      }

      //---------------------------------------------------------------------------------------------------------
      get_create(declaration) {
        var create, me, template, type;
        ({type, create, template} = declaration);
        me = this;
        switch (true) {
          case create != null:
            if (!me.isa.function(create)) {
              throw new E.Intertype_create_must_be_function("^get_create@1^", type, me.type_of(create));
            }
            return nameit(`create_${type}`, function(...P) {
              var R;
              if (!me.isa[type]((R = create.call(me, ...P)))) {
                throw new E.Intertype_wrong_arguments_for_create(`^create_${type}@1^`, type, me.type_of(R));
              }
              return R;
            });
          case template != null:
            return this._get_create_from_template(declaration);
        }
        return nameit(`create_${type}`, function(...P) {
          throw new E.Intertype_create_not_available(`^create_${type}@2^`, type);
        });
      }

      //---------------------------------------------------------------------------------------------------------
      _get_create_from_template(declaration) {
        /* TAINT must distinguish whether value is object or not, use assign */
        var me, template, type;
        ({type, template} = declaration);
        me = this;
        //.......................................................................................................
        if (default_declarations.function(template)) {
          if (template.length !== 0) {
            throw new E.Intertype_wrong_template_arity("^get_create@2^", type, template.length);
          }
          return nameit(`create_${type}`, function() {
            var R;
            if (arguments.length !== 0) {
              throw new E.Intertype_wrong_arity(`^create_${type}@3^`, 0, arguments.length);
            }
            if (!me.isa[type]((R = template.call(me)))) {
              throw new E.Intertype_wrong_arguments_for_create(`^create_${type}@4^`, type, me.type_of(R));
            }
            return R;
          });
        }
        //.......................................................................................................
        /* TAINT case of constant template could be handled when validating the declaration */
        return nameit(`create_${type}`, function() {
          var R;
          if (arguments.length !== 0) {
            throw new E.Intertype_wrong_arity(`^create_${type}@6^`, 0, arguments.length);
          }
          if (!me.isa[type]((R = template))) {
            throw new E.Intertype_wrong_arguments_for_create(`^create_${type}@7^`, type, me.type_of(R));
          }
          return R;
        });
      }

    };

    //---------------------------------------------------------------------------------------------------------
    /* if set to `true`, insertion of default_declarations is blocked */
    _Intertype._minimal = true;

    return _Intertype;

  }).call(this);

  //===========================================================================================================
  Intertype_minimal = class Intertype_minimal extends _Intertype {};

  Intertype = (function() {
    class Intertype extends _Intertype {};

    Intertype._minimal = false;

    return Intertype;

  }).call(this);

  //===========================================================================================================
  internal_types = new _Intertype(internal_declarations);

  types = new Intertype();

  ({isa, validate, create, type_of} = types);

  //===========================================================================================================
  module.exports = {
    Intertype,
    Intertype_minimal,
    types,
    isa,
    validate,
    create,
    type_of,
    declarations: default_declarations
  };

}).call(this);

//# sourceMappingURL=main.js.map