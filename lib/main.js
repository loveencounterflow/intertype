(function() {
  'use strict';
  var E, Intertype, Intertype_minimal, WG, _isa, built_ins, debug, default_declarations, hide, nameit, rpr, set, types;

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
  default_declarations = _isa = {
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
    infinity: function(x) {
      return (x === +2e308) || (x === -2e308);
    },
    text: function(x) {
      return (typeof x) === 'string';
    },
    list: function(x) {
      return Array.isArray(x);
    },
    // text:                   { template: '', test: ( ( x ) -> ( typeof x ) is 'string' ), }
    regex: function(x) {
      return x instanceof RegExp;
    }
  };

  // nullary:                ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 0 )
  // unary:                  ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 1 )
  // binary:                 ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 2 )
  // trinary:                ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 3 )
  //.........................................................................................................
  // IT_listener:            ( x ) -> ( @isa.function x ) or ( @isa.asyncfunction x )
  // IT_note_$key:           ( x ) -> ( @isa.text x ) or ( @isa.symbol x )
  // unary_or_binary:        ( x ) -> ( @isa.unary   x ) or ( @isa.binary  x )
  // binary_or_trinary:      ( x ) -> ( @isa.binary  x ) or ( @isa.trinary x )
  // $freeze:                ( x ) -> @isa.boolean x

    //-----------------------------------------------------------------------------------------------------------
  // internal_declarations = { default_declarations..., }
  // internal_declarations = {
  //   default_declarations...
  //   # foo: ( x ) -> x is 'foo'
  //   # bar: ( x ) -> x is 'bar'
  //   }

    //===========================================================================================================
  Intertype = class Intertype {
    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
    constructor(...declarations) {
      if (!(this instanceof Intertype_minimal)) {
        declarations.unshift(default_declarations);
      }
      //.......................................................................................................
      hide(this, 'isa', this._new_strict_proxy('isa'));
      hide(this, 'validate', this._new_strict_proxy('validate'));
      hide(this, 'create', this._new_strict_proxy('create'));
      hide(this, 'declarations', this._new_strict_proxy('declarations'));
      hide(this, '_tests_for_type_of', {});
      /* NOTE redirected to prevent 'JavaScript rip-off' effect */
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
        if (!_isa.object(collection)) {
          throw new E.Intertype_validation_error('^declare@1^', 'object', this.__type_of(_isa, collection));
        }
        for (type in collection) {
          test = collection[type];
          ((type, test) => {
            var declaration, sub_type, target_type, targets;
            //...................................................................................................
            ({target_type, targets, sub_type} = this._resolve_dotted_type(type));
            declaration = this._compile_declaration_object(type, test);
            //...................................................................................................
            if (Reflect.has(this.declarations, type)) {
              if (_isa.basetype(type)) {
                throw new E.Intertype_basetype_redeclaration_forbidden('^declare@2^', type);
              }
              throw new E.Intertype_declaration_redeclaration_forbidden('^declare@3^', type);
            }
            //...................................................................................................
            this.declarations[type] = declaration;
            /* TAINT pass `declaration` as sole argument, as for `create.type()` */
            this.isa[type] = this._get_isa(declaration);
            this.isa.optional[type] = this._get_isa_optional(declaration);
            this.validate[type] = this._get_validate(declaration);
            this.validate.optional[type] = this._get_validate_optional(declaration);
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
//.....................................................................................................
        for (idx = i = 0, ref1 = sub_types.length - 1; (0 <= ref1 ? i < ref1 : i > ref1); idx = 0 <= ref1 ? ++i : --i) {
          partial_type = sub_types.slice(0, +idx + 1 || 9e9).join('.');
          /* NOTE using `Reflect.has()` to avoid triggering Unknown Type Error: */
          if (!Reflect.has(this.declarations, partial_type)) {
            throw new E.Intertype_unknown_partial_type('^constructor@6^', type, partial_type);
          }
        }
        //.....................................................................................................
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
      /* TODO: call recursively for each entry in `declaration.fields` */
      var R, template;
      template = {
        type,
        test: void 0,
        sub_tests: {}
      };
      R = {...template};
      if (_isa.object(declaration)) {
        Object.assign(R, declaration);
      } else {
        R.test = declaration;
      }
      //.......................................................................................................
      switch (true) {
        //.....................................................................................................
        case _isa.text(R.test):
          ((ref_type) => {
            var is_optional, ref_declaration, test;
            ({is_optional, ref_type} = this._parse_ref_type(type, ref_type));
            debug('^324-1^', {type, is_optional, ref_type});
            ref_declaration = this.declarations[ref_type];
            if (ref_declaration == null) {
              throw new E.Intertype_unknown_type('^constructor@7^', ref_type);
            }
            test = ref_declaration.test;
            R.test = nameit(type, function(x) {
              return test.call(this, x);
            });
            return Object.assign(R.sub_tests, ref_declaration.sub_tests);
          })(R.test);
          break;
        //.....................................................................................................
        case _isa.function(R.test):
          ((test) => {
            this._validate_test_method(type, test);
            return R.test = nameit(type, function(x) {
              return test.call(this, x);
            });
          })(R.test);
          break;
        default:
          //.....................................................................................................
          throw new E.Intertype_wrong_type('^constructor@8^', "type name, test method, or object", this.__type_of(_isa, R.test));
      }
      //.......................................................................................................
      /* TAINT should ideally check entire object? */
      this._validate_test_method(type, R.test);
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _parse_ref_type(type, ref_type) {
      var is_optional, ref_type_parts;
      is_optional = false;
      if ((ref_type_parts = ref_type.split('.')).length === 1) {
        if (ref_type_parts[0] === 'optional') {
          throw new E.Intertype_optional_used_alone('^_parse_ref_type@1^', type);
        }
      } else if (ref_type_parts[0] === 'optional') {
        ref_type_parts.shift();
        is_optional = true;
        ref_type = ref_type_parts.join('.');
      }
      return {is_optional, ref_type};
    }

    //---------------------------------------------------------------------------------------------------------
    _validate_test_method(type, x) {
      if (!_isa.function(x)) {
        throw new E.Intertype_test_must_be_function('^constructor@9^', type, this.__type_of(_isa, x));
      }
      if (x.length !== 1) {
        throw new E.Intertype_function_with_wrong_arity('^constructor@10^', 1, x.length);
      }
      return x;
    }

    //---------------------------------------------------------------------------------------------------------
    _new_strict_proxy(name) {
      var get_cfg, optional, optional_from_name;
      /* Create a proxy for a new object that will throw an `Intertype_unknown_type` error when
         a non-existing property is accessed */
      //.......................................................................................................
      optional_from_name = function() {
        switch (name) {
          case 'isa':
            return function(x) {
              throw new E.Intertype_illegal_isa_optional('^constructor@1^');
            };
          case 'validate':
            return function(x) {
              throw new E.Intertype_illegal_validate_optional('^constructor@2^');
            };
          case 'create':
            return function(x) {
              throw new E.Intertype_illegal_create_optional('^constructor@3^');
            };
          case 'declarations':
            return {};
          default:
            throw new E.Intertype_internal_error('^constructor@4^', `unknown name ${rpr(name)}`);
        }
      };
      //.......................................................................................................
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
      //.......................................................................................................
      optional = new Proxy(optional_from_name(), get_cfg(`^proxy_for_${name}_optional@1^`));
      return new Proxy({optional}, get_cfg(`^proxy_for_${name}@1^`));
    }

    //---------------------------------------------------------------------------------------------------------
    _get_isa(declaration) {
      var me, sub_tests, test, type;
      ({type, test, sub_tests} = declaration);
      me = this;
      //.......................................................................................................
      return nameit(`isa.${type}`, function(x) {
        var field_name, sub_test;
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity(`^isa_${type}@1^`, 1, arguments.length);
        }
        if (!test.call(me, x)) {
          return false;
        }
        for (field_name in sub_tests) {
          sub_test = sub_tests[field_name];
          if (!sub_test.call(me, x[field_name])) {
            return false;
          }
        }
        return true;
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _get_isa_optional(declaration) {
      var me, sub_tests, test, type;
      ({type, test, sub_tests} = declaration);
      me = this;
      //.......................................................................................................
      return nameit(`isa.optional.${type}`, function(x) {
        var field_name, sub_test;
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity(`^isa_optional_${type}@1^`, 1, arguments.length);
        }
        if (x == null) {
          return true;
        }
        if (!test.call(me, x)) {
          return false;
        }
        for (field_name in sub_tests) {
          sub_test = sub_tests[field_name];
          if (!sub_test.call(me, x[field_name])) {
            return false;
          }
        }
        return true;
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _get_validate(declaration) {
      var me, test, type;
      ({type, test} = declaration);
      me = this;
      //.......................................................................................................
      return nameit(`validate.${type}`, function(x) {
        if (arguments.length !== 1) {
          throw new E.Intertype_wrong_arity(`^validate_${type}@1^`, 1, arguments.length);
        }
        if (test.call(me, x)) {
          return x;
        }
        throw new E.Intertype_validation_error(`^validate_${type}@1^`, type, me.__type_of(_isa, x));
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _get_validate_optional(declaration) {
      var me, test, type;
      ({type, test} = declaration);
      me = this;
      //.......................................................................................................
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
        throw new E.Intertype_optional_validation_error(`^validate_optional_${type}@1^`, type, me.__type_of(_isa, x));
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _type_of(x) {
      if (arguments.length !== 1) {
        throw new E.Intertype_wrong_arity("^type_of@1^", 1, arguments.length);
      }
      return this.__type_of(this._tests_for_type_of, x);
    }

    //---------------------------------------------------------------------------------------------------------
    __type_of(test_method_map, x) {
      var test, type;
      if (x === null) {
        return 'null';
      }
      if (x === void 0) {
        return 'undefined';
      }
      for (type in test_method_map) {
        test = test_method_map[type];
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

  //===========================================================================================================
  Intertype_minimal = class Intertype_minimal extends Intertype {};

  //===========================================================================================================
  types = new Intertype();

  (() => {
    var create, isa, type_of, validate;
    ({isa, validate, create, type_of} = types);
    return module.exports = {
      Intertype,
      Intertype_minimal,
      types,
      isa,
      validate,
      create,
      type_of,
      declarations: default_declarations
    };
  })();

}).call(this);

//# sourceMappingURL=main.js.map