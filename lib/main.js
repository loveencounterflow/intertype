(function() {
  'use strict';
  var E, Intertype, Intertype_minimal, WG, _TMP_basetype_names, _TMP_basetype_names_matcher, _TMP_isa_minimal_type/* TAINT unfortunate choice of name */, _TMP_minimal_types, __type_of, _isa, basetypes, debug, deepmerge, default_declarations, default_types, hide, nameit, rpr, set, types, walk_prefixes,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

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
  basetypes = {
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

  _TMP_basetype_names = new Set(Object.keys(basetypes));

  _TMP_basetype_names_matcher = RegExp(`\\b(${[..._TMP_basetype_names].join('|')})\\b`);

  //-----------------------------------------------------------------------------------------------------------
  _isa = {
    basetype: function(x) {
      return _TMP_basetype_names.has(x);
    },
    boolean: function(x) {
      return (x === true) || (x === false);
    },
    asyncfunction: function(x) {
      return (Object.prototype.toString.call(x)) === '[object AsyncFunction]';
    },
    generatorfunction: (x) => {
      return (Object.prototype.toString.call(x)) === '[object GeneratorFunction]';
    },
    generator: (x) => {
      return (Object.prototype.toString.call(x)) === '[object Generator]';
    },
    asyncgeneratorfunction: (x) => {
      return (Object.prototype.toString.call(x)) === '[object AsyncGeneratorFunction]';
    },
    asyncgenerator: (x) => {
      return (Object.prototype.toString.call(x)) === '[object AsyncGenerator]';
    },
    function: function(x) {
      return (Object.prototype.toString.call(x)) === '[object Function]';
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
    regex: function(x) {
      return x instanceof RegExp;
    },
    set: function(x) {
      return x instanceof Set;
    },
    nan: (x) => {
      return Number.isNaN(x);
    },
    finite: (x) => {
      return Number.isFinite(x);
    },
    /* TAINT make sure no non-numbers slip through */integer: (x) => {
      return Number.isInteger(x);
    },
    /* TAINT make sure no non-numbers slip through */safeinteger: (x) => {
      return Number.isSafeInteger(x);
    }
  };

  // text:                   { template: '', test: ( ( x ) -> ( typeof x ) is 'string' ), }
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

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT make sure no non-numbers slip through */  default_declarations = {
    basetype: {
      test: _isa.basetype
    },
    boolean: {
      test: _isa.boolean,
      template: false
    },
    asyncfunction: {
      test: _isa.asyncfunction,
      template: async function() {
        return (await void 0);
      }
    },
    generatorfunction: {
      test: _isa.generatorfunction
    },
    asyncgeneratorfunction: {
      test: _isa.asyncgeneratorfunction
    },
    asyncgenerator: {
      test: _isa.asyncgenerator
    },
    generator: {
      test: _isa.generator
    },
    function: {
      test: _isa.function,
      template: function() {
        return function() {};
      }
    },
    symbol: {
      test: _isa.symbol,
      template: function() {
        return Symbol('');
      }
    },
    object: {
      test: _isa.object,
      template: function() {
        return {};
      }
    },
    float: {
      test: _isa.float,
      template: 0
    },
    infinity: {
      test: _isa.infinity,
      template: 2e308
    },
    text: {
      test: _isa.text,
      template: ''
    },
    list: {
      test: _isa.list,
      template: function() {
        return [];
      }
    },
    regex: {
      test: _isa.regex,
      template: function() {
        return new RegExp();
      }
    },
    set: {
      test: _isa.set,
      template: function() {
        return new Set();
      }
    },
    nan: {
      test: _isa.nan,
      template: 0/0
    },
    finite: {
      test: _isa.finite,
      template: 0
    },
    integer: {
      test: _isa.integer,
      template: 0
    },
    safeinteger: {
      test: _isa.safeinteger,
      template: 0
    },
    //.........................................................................................................
    'empty': {
      role: 'qualifier'
    },
    'nonempty': {
      role: 'qualifier'
    },
    'empty.list': function(x) {
      return (this.isa.list(x)) && (x.length === 0);
    },
    'empty.text': function(x) {
      return (this.isa.text(x)) && (x.length === 0);
    },
    'empty.set': function(x) {
      return (this.isa.set(x)) && (x.size === 0);
    },
    'empty.object': function(x) {
      return (this.isa.object(x)) && ((Object.keys(x)).length === 0);
    },
    'nonempty.list': function(x) {
      return (this.isa.list(x)) && (x.length > 0);
    },
    'nonempty.text': function(x) {
      return (this.isa.text(x)) && (x.length > 0);
    },
    'nonempty.set': function(x) {
      return (this.isa.set(x)) && (x.size > 0);
    },
    'nonempty.object': function(x) {
      return (this.isa.object(x)) && ((Object.keys(x)).length > 0);
    },
    //.........................................................................................................
    'positive': {
      role: 'qualifier'
    },
    'negative': {
      role: 'qualifier'
    },
    'posnaught': {
      role: 'qualifier'
    },
    'negnaught': {
      role: 'qualifier'
    },
    'positive.float': function(x) {
      return (this.isa.float(x)) && (x > 0);
    },
    'positive.integer': function(x) {
      return (this.isa.integer(x)) && (x > 0);
    },
    'positive.infinity': function(x) {
      return (this.isa.infinity(x)) && (x > 0);
    },
    'negative.float': function(x) {
      return (this.isa.float(x)) && (x < 0);
    },
    'negative.integer': function(x) {
      return (this.isa.integer(x)) && (x < 0);
    },
    'negative.infinity': function(x) {
      return (this.isa.infinity(x)) && (x < 0);
    },
    'posnaught.float': function(x) {
      return (this.isa.float(x)) && (x >= 0);
    },
    'posnaught.integer': function(x) {
      return (this.isa.integer(x)) && (x >= 0);
    },
    'posnaught.infinity': function(x) {
      return (this.isa.infinity(x)) && (x >= 0);
    },
    'negnaught.float': function(x) {
      return (this.isa.float(x)) && (x <= 0);
    },
    'negnaught.integer': function(x) {
      return (this.isa.integer(x)) && (x <= 0);
    },
    'negnaught.infinity': function(x) {
      return (this.isa.infinity(x)) && (x <= 0);
    },
    'cardinal': 'posnaught.integer',
    //.........................................................................................................
    'frozen': {
      role: 'qualifier'
    },
    'sealed': {
      role: 'qualifier'
    },
    'extensible': {
      role: 'qualifier'
    },
    'frozen.list': function(x) {
      return (this.isa.list(x)) && (Object.isFrozen(x));
    },
    'sealed.list': function(x) {
      return (this.isa.list(x)) && (Object.isSealed(x));
    },
    'extensible.list': function(x) {
      return (this.isa.list(x)) && (Object.isExtensible(x));
    },
    'frozen.object': function(x) {
      return (this.isa.object(x)) && (Object.isFrozen(x));
    },
    'sealed.object': function(x) {
      return (this.isa.object(x)) && (Object.isSealed(x));
    },
    'extensible.object': function(x) {
      return (this.isa.object(x)) && (Object.isExtensible(x));
    },
    //.........................................................................................................
    'odd': {
      role: 'qualifier'
    },
    'even': {
      role: 'qualifier'
    },
    'odd.positive': {
      role: 'qualifier'
    },
    'odd.negative': {
      role: 'qualifier'
    },
    'odd.posnaught': {
      role: 'qualifier'
    },
    'odd.negnaught': {
      role: 'qualifier'
    },
    'even.positive': {
      role: 'qualifier'
    },
    'even.negative': {
      role: 'qualifier'
    },
    'even.posnaught': {
      role: 'qualifier'
    },
    'even.negnaught': {
      role: 'qualifier'
    },
    'odd.integer': function(x) {
      return (this.isa.integer(x)) && (modulo(x, 2)) === 1;
    },
    'even.integer': function(x) {
      return (this.isa.integer(x)) && (modulo(x, 2)) === 0;
    },
    'odd.positive.integer': function(x) {
      return (this.isa.positive.integer(x)) && (this.isa.odd.integer(x));
    },
    'even.positive.integer': function(x) {
      return (this.isa.positive.integer(x)) && (this.isa.even.integer(x));
    },
    'odd.negative.integer': function(x) {
      return (this.isa.negative.integer(x)) && (this.isa.odd.integer(x));
    },
    'even.negative.integer': function(x) {
      return (this.isa.negative.integer(x)) && (this.isa.even.integer(x));
    },
    'odd.posnaught.integer': function(x) {
      return (this.isa.posnaught.integer(x)) && (this.isa.odd.integer(x));
    },
    'even.posnaught.integer': function(x) {
      return (this.isa.posnaught.integer(x)) && (this.isa.even.integer(x));
    },
    'odd.negnaught.integer': function(x) {
      return (this.isa.negnaught.integer(x)) && (this.isa.odd.integer(x));
    },
    'even.negnaught.integer': function(x) {
      return (this.isa.negnaught.integer(x)) && (this.isa.even.integer(x));
    }
  };

  //===========================================================================================================
  default_types = new Set(Object.keys(default_declarations));

  _TMP_minimal_types = (new Set(Object.keys(basetypes))).union(default_types);

  _TMP_isa_minimal_type = function(x) {
    return _TMP_minimal_types.has(x);
  };

  //===========================================================================================================
  Intertype = class Intertype {
    //---------------------------------------------------------------------------------------------------------
    /* TAINT may want to check type, arities */
    constructor(...declarations) {
      //.......................................................................................................
      hide(this, 'isa', this._new_strict_proxy('isa'));
      hide(this, 'evaluate', this._new_strict_proxy('evaluate'));
      hide(this, 'validate', this._new_strict_proxy('validate'));
      hide(this, 'create', this._new_strict_proxy('create'));
      hide(this, 'declarations', this._new_strict_proxy('declarations'));
      hide(this, '_tests_for_type_of', {});
      /* NOTE redirected to prevent 'JavaScript rip-off' effect */
      hide(this, 'type_of', nameit('type_of', (...P) => {
        return this._type_of(...P);
      }));
      hide(this, 'declare', nameit('declare', (...P) => {
        return this._declare_usertypes(...P);
      }));
      //.......................................................................................................
      this._declare_basetypes(basetypes);
      if (!(this instanceof Intertype_minimal)) {
        this._declare_usertypes(default_declarations);
      }
      this._declare_usertypes(...declarations);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _declare_basetypes(...P) {
      return this._declare({
        role: 'basetype'
      }, ...P);
    }

    _declare_usertypes(...P) {
      return this._declare({
        role: 'usertype'
      }, ...P);
    }

    //---------------------------------------------------------------------------------------------------------
    _declare(cfg, ...declarations) {
      var collection, i, len, test, type;
      for (i = 0, len = declarations.length; i < len; i++) {
        collection = declarations[i];
        if (!_isa.object(collection)) {
          throw new E.Intertype_validation_error('^declare@1^', 'object', __type_of(_isa, collection));
        }
        for (type in collection) {
          test = collection[type];
          ((type, test) => {
            var declaration, field_name, fq_type_name, prefix, ref1, ref2, results, sub_type, target_type, targets;
            //...................................................................................................
            if (Reflect.has(this.declarations, type)) {
              if (_isa.basetype(type)) {
                throw new E.Intertype_basetype_redeclaration_forbidden('^declare@2^', type);
              }
              throw new E.Intertype_declaration_redeclaration_forbidden('^declare@3^', type);
            }
            //...................................................................................................
            ({target_type, targets, sub_type} = this._resolve_dotted_type(type));
            declaration = this._compile_declaration_object(cfg, type, test);
            //...................................................................................................
            this.declarations[type] = declaration;
            this.isa[type] = this._get_isa(declaration);
            this.isa.optional[type] = this._get_isa_optional(declaration);
            this.evaluate[type] = this._get_evaluate(declaration);
            this.evaluate.optional[type] = this._get_evaluate_optional(declaration);
            this.validate[type] = this._get_validate(declaration);
            this.validate.optional[type] = this._get_validate_optional(declaration);
            this.create[type] = this._get_create(declaration);
            if (collection !== basetypes/* TAINT should better check against _TMP_basetype_names ? */) {
              this._tests_for_type_of[type] = declaration.test;
            }
            //...................................................................................................
            if (targets != null) {
              set(targets['isa'], sub_type, this.isa[type]);
              set(targets['isa.optional'], sub_type, this.isa.optional[type]);
              set(targets['evaluate'], sub_type, this.evaluate[type]);
              set(targets['evaluate.optional'], sub_type, this.evaluate.optional[type]);
              set(targets['validate'], sub_type, this.validate[type]);
              set(targets['validate.optional'], sub_type, this.validate.optional[type]);
              this.declarations[target_type].sub_tests[sub_type] = this.isa[type];
            }
            //...................................................................................................
            /* TAINT turn into method, must also look into template should fields be missing */
            if (declaration.fields != null) {
              ref1 = declaration.fields;
              for (field_name in ref1) {
                test = ref1[field_name];
                fq_type_name = `${type}.${field_name}`;
                this.declare({
                  [`${fq_type_name}`]: test
                });
              }
            }
            ref2 = walk_prefixes(type);
            //...................................................................................................
            results = [];
            for (prefix of ref2) {
              results.push(this.declarations[prefix].sub_fields.push(type));
            }
            return results;
          })(type, test);
        }
      }
      //.......................................................................................................
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _resolve_dotted_type(type) {
      /* analyze flat type declarations with dot notation */
      var basetype, i, idx, partial_type, ref1, sub_type, sub_types, target_type, targets;
      target_type = null;
      targets = null;
      sub_type = null;
      //.......................................................................................................
      sub_types = type.split('.');
      if ((basetype = sub_types[0]) === 'optional') {
        throw new E.Intertype_illegal_use_of_optional('^_resolve_dotted_type@2^', type);
      }
      if ((_isa.basetype(basetype)) && Reflect.has(this.declarations, basetype)) {
        throw new E.Intertype_illegal_use_of_basetype('^_resolve_dotted_type@3^', type, basetype);
      }
      //.......................................................................................................
      if (sub_types.length > 1) {
//.....................................................................................................
        for (idx = i = 0, ref1 = sub_types.length - 1; (0 <= ref1 ? i < ref1 : i > ref1); idx = 0 <= ref1 ? ++i : --i) {
          partial_type = sub_types.slice(0, +idx + 1 || 9e9).join('.');
          /* NOTE using `Reflect.has()` to avoid triggering Unknown Type Error: */
          if (!Reflect.has(this.declarations, partial_type)) {
            throw new E.Intertype_unknown_partial_type('^_resolve_dotted_type@1^', type, partial_type);
          }
        }
        //.....................................................................................................
        target_type = partial_type;
        sub_type = sub_types.at(-1);
        targets = {
          'isa': this.isa[target_type],
          'isa.optional': this.isa.optional[target_type],
          'evaluate': this.evaluate[target_type],
          'evaluate.optional': this.evaluate.optional[target_type],
          'validate': this.validate[target_type],
          'validate.optional': this.validate.optional[target_type]
        };
      }
      //.......................................................................................................
      return {type, target_type, targets, sub_type};
    }

    //---------------------------------------------------------------------------------------------------------
    _get_declaration_template(type, cfg = null) {
      return {
        type,
        ...cfg,
        test: void 0,
        sub_tests: {},
        sub_fields: []
      };
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_declaration_object(cfg, type, declaration) {
      /* TODO: call recursively for each entry in `declaration.fields` */
      var R;
      R = this._get_declaration_template(type, cfg);
      if (_isa.object(declaration)) {
        Object.assign(R, declaration);
      } else {
        R.test = declaration;
      }
      //.......................................................................................................
      if (R.test == null) {
        if ((R.role === 'qualifier') || (this._looks_like_an_object_declaration(declaration))) {
          R.test = 'object';
        }
      }
      //.......................................................................................................
      switch (true) {
        //.....................................................................................................
        case _isa.text(R.test):
          ((ref_type) => {
            var basetype, ref_declaration;
            if (/\boptional\b/.test(ref_type)) { // ( ref_type is 'optional' ) or ( ref_type.startsWith 'optional.' )
              throw new E.Intertype_illegal_use_of_optional('^_compile_declaration_object@1^', type);
            }
            if ((basetype = this._extract_first_basetype_name(ref_type)) != null) {
              throw new E.Intertype_illegal_use_of_basetype('^_compile_declaration_object@2^', type, basetype);
            }
            ref_declaration = this.declarations[ref_type];
            if (ref_declaration == null) {
              throw new E.Intertype_unknown_type('^_compile_declaration_object@3^', ref_type);
            }
            ((test) => {
              return R.test = nameit(type, function(x) {
                return test.call(this, x);
              });
            })(ref_declaration.test);
            // debug '^_compile_declaration_object@332^', { type, ref_type, test: R.test, }
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
          throw new E.Intertype_wrong_type_for_test_method('^_compile_declaration_object@4^', __type_of(_isa, R.test));
      }
      //.......................................................................................................
      /* TAINT should ideally check entire object? */
      this._validate_test_method(type, R.test);
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _validate_test_method(type, x) {
      if (!_isa.function(x)) {
        throw new E.Intertype_test_must_be_function('^_validate_test_method@1^', type, __type_of(_isa, x));
      }
      if (x.length !== 1) {
        throw new E.Intertype_function_with_wrong_arity('^_validate_test_method@2^', 1, x.length);
      }
      return x;
    }

    //---------------------------------------------------------------------------------------------------------
    _extract_first_basetype_name(type) {
      var match;
      if (!_isa.text(type)) {
        throw new E.Intertype_internal_error('^_extract_first_basetype_name@1^', `expected text, got a ${__type_of(_isa, type)}`);
      }
      if ((match = type.match(_TMP_basetype_names_matcher)) == null) {
        return null;
      }
      return match[0];
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
              throw new E.Intertype_illegal_isa_optional('^_new_strict_proxy@1^');
            };
          case 'evaluate':
            return function(x) {
              throw new E.Intertype_illegal_evaluate_optional('^_new_strict_proxy@2^');
            };
          case 'validate':
            return function(x) {
              throw new E.Intertype_illegal_validate_optional('^_new_strict_proxy@3^');
            };
          case 'create':
            return function(x) {
              throw new E.Intertype_illegal_create_optional('^_new_strict_proxy@4^');
            };
          default:
            throw new E.Intertype_internal_error('^_new_strict_proxy@5^', `unknown name ${rpr(name)}`);
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
      switch (name) {
        case 'declarations':
          optional = this._get_declaration_template('optional', {
            role: 'optional'
          });
          break;
        case 'optional':
          optional = new Proxy({}, get_cfg(`^proxy_for_${name}_optional@1^`));
          break;
        default:
          optional = new Proxy(optional_from_name(name), get_cfg(`^proxy_for_${name}_optional@1^`));
      }
      return new Proxy({optional}, get_cfg(`^proxy_for_${name}@1^`));
    }

    //---------------------------------------------------------------------------------------------------------
    _get_isa(declaration) {
      var me, method_name, role, sub_tests, test, type;
      ({type, role, test, sub_tests} = declaration);
      me = this;
      method_name = `isa.${type}`;
      //.......................................................................................................
      switch (true) {
        //.....................................................................................................
        /* deal with sum types (tagged unions, variants) */
        case role === 'qualifier':
          return nameit(method_name, function(x) {
            var field_name, sub_test;
            me._validate_arity_for_method(method_name, 1, arguments.length);
            for (field_name in sub_tests) {
              sub_test = sub_tests[field_name];
              if (sub_test.call(me, x)) {
                return true;
              }
            }
            return false;
          });
        //.....................................................................................................
        /* deal with product types (records) */
        case role === 'basetype' || role === 'usertype':
          return nameit(method_name, function(x) {
            var field_name, sub_test;
            me._validate_arity_for_method(method_name, 1, arguments.length);
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
        default:
          //.....................................................................................................
          throw new Error('85734982578457238457');
      }
    }

    //---------------------------------------------------------------------------------------------------------
    _get_isa_optional(declaration) {
      var me, method_name, test, type;
      ({type} = declaration);
      me = this;
      test = this.isa[type];
      method_name = `isa.optional.${type}`;
      //.......................................................................................................
      return nameit(method_name, function(x) {
        me._validate_arity_for_method(method_name, 1, arguments.length);
        if (x == null) {
          return true;
        }
        return test(x);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _get_evaluate(declaration) {
      var me, method_name, sub_fields, sub_tests, test, type;
      ({type, test, sub_tests, sub_fields} = declaration);
      me = this;
      method_name = `evaluate.${type}`;
      //.......................................................................................................
      return nameit(method_name, function(x) {
        var R, field_name, fq_name, i, len, sub_test;
        me._validate_arity_for_method(method_name, 1, arguments.length);
        R = {};
        R[type] = me.isa[type](x);
        if (x != null) {
          for (field_name in sub_tests) {
            sub_test = sub_tests[field_name];
            Object.assign(R, me.evaluate[type][field_name](x != null ? x[field_name] : void 0));
          }
        } else {
          for (i = 0, len = sub_fields.length; i < len; i++) {
            fq_name = sub_fields[i];
            R[fq_name] = false;
          }
        }
        return R;
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _get_evaluate_optional(declaration) {
      var me, method_name, sub_tests, test, type;
      ({type, test, sub_tests} = declaration);
      me = this;
      method_name = `evaluate.optional.${type}`;
      //.......................................................................................................
      return nameit(method_name, function(x) {
        me._validate_arity_for_method(method_name, 1, arguments.length);
        throw new E.Intertype_illegal_evaluate_optional(`^${method_name}@1^`);
        return R;
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _get_validate(declaration) {
      var me, method_name, test, type;
      ({type} = declaration);
      me = this;
      test = this.isa[type];
      method_name = `validate.${type}`;
      //.......................................................................................................
      return nameit(method_name, function(x) {
        me._validate_arity_for_method(method_name, 1, arguments.length);
        if (test(x)) {
          return x;
        }
        throw new E.Intertype_validation_error(`^${method_name}@1^`, type, __type_of(_isa, x));
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _get_validate_optional(declaration) {
      var me, method_name, test, type;
      ({type} = declaration);
      me = this;
      test = this.isa.optional[type];
      method_name = `validate.optional.${type}`;
      //.......................................................................................................
      return nameit(method_name, function(x) {
        me._validate_arity_for_method(method_name, 1, arguments.length);
        if (test(x)) {
          return x;
        }
        throw new E.Intertype_optional_validation_error(`^${method_name}@1^`, type, __type_of(_isa, x));
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _validate_arity_for_method(method_name, need_arity, is_arity) {
      if (need_arity === is_arity) {
        return is_arity;
      }
      throw new E.Intertype_wrong_arity_for_method("^validate_arity@1^", method_name, need_arity, is_arity);
    }

    //---------------------------------------------------------------------------------------------------------
    _type_of(x) {
      if (arguments.length !== 1) {
        throw new E.Intertype_wrong_arity("^type_of@1^", 1, arguments.length);
      }
      return __type_of(this._tests_for_type_of, x);
    }

    //---------------------------------------------------------------------------------------------------------
    _get_create(declaration) {
      var create, me, template, type;
      ({type, create, template} = declaration);
      me = this;
      switch (true) {
        case create != null:
          if (!me.isa.function(create)) {
            throw new E.Intertype_create_must_be_function("^_get_create@1^", type, me.type_of(create));
          }
          return nameit(`create_${type}`, function(...P) {
            var R, evaluation;
            if (!me.isa[type]((R = create.call(me, ...P)))) {
              evaluation = me.evaluate[type](R);
              throw new E.Intertype_wrong_arguments_for_create(`^create_${type}@1^`, type, R, evaluation, me.type_of(R));
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
      var R/* TAINT should deep-freeze */, me, method_name, template, type, use_assign;
      ({type, template} = declaration);
      me = this;
      use_assign = this._looks_like_an_object_declaration(declaration);
      method_name = `create_${type}`;
      // debug '^3234^', declaration, { use_assign, type: ( __type_of _isa, ) } if declaration.type is 'q'
      //.......................................................................................................
      if (_isa.function(template)) {
        if (template.length !== 0) {
          throw new E.Intertype_wrong_template_arity("^_get_create@1^", type, template.length);
        }
        return nameit(method_name, function() {
          var R, evaluation;
          if (arguments.length !== 0) {
            throw new E.Intertype_wrong_arity(`^create_${type}@1^`, 0, arguments.length);
          }
          if (!me.isa[type]((R = template.call(me)))) {
            evaluation = me.evaluate[type](R);
            throw new E.Intertype_wrong_arguments_for_create(`^create_${type}@2^`, type, R, evaluation, me.type_of(R));
          }
          return R;
        });
      }
      //.......................................................................................................
      /* TAINT case of constant template could be handled when validating the declaration */
      if (use_assign) {
        Object.freeze(declaration.template);
        R = nameit(method_name, function(...P) {
          var evaluation;
          // debug '^3234^', deepmerge template, P...
          if (!me.isa[type]((R = me._call_and_reassign_functions(deepmerge(template, ...P))))) {
            evaluation = me.evaluate[type](R);
            throw new E.Intertype_wrong_arguments_for_create(`^create_${type}@3^`, type, R, evaluation, me.type_of(R));
          }
          return R;
        });
      } else {
        if (!me.isa[type](template)) {
          throw new E.Intertype_wrong_template_type("^_get_create@2^", type, me.type_of(R));
        }
        R = nameit(method_name, function() {
          if (arguments.length !== 0) {
            throw new E.Intertype_wrong_arity(`^create_${type}@4^`, 0, arguments.length);
          }
          return template;
        });
      }
      //.......................................................................................................
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _call_and_reassign_functions(R) {
      var key, value;
      for (key in R) {
        value = R[key];
        if (_isa.function(value)) {
          R[key] = value.call(this);
        } else if (_isa.object(R)) {
          R[key] = this._call_and_reassign_functions(value);
        }
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _looks_like_an_object_declaration(declaration) {
      return (declaration != null) && ((_isa.object(declaration.fields)) || ((declaration.fields == null) && _isa.object(declaration.template)));
    }

  };

  //===========================================================================================================
  Intertype_minimal = class Intertype_minimal extends Intertype {};

  //===========================================================================================================
  __type_of = function(test_method_map, x) {
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
  };

  //===========================================================================================================
  deepmerge = function(...P) {
    var R, i, key, len, p, value;
    R = {};
    for (i = 0, len = P.length; i < len; i++) {
      p = P[i];
      if (p == null) {
        continue;
      }
      if (!_isa.object(p)) {
        throw new E.Intertype_wrong_type("^deepmerge@1^", 'an object', __type_of(_isa, p));
      }
      for (key in p) {
        value = p[key];
        R[key] = (_isa.object(value)) ? deepmerge(value) : value;
      }
    }
    return R;
  };

  //===========================================================================================================
  walk_prefixes = function*(fq_name) {
    var i, idx, parts, ref1;
    /* Given a fully qualified type name, walk over all the prefixes of the name, if any. This is used to
    determine the transitive sub-types of types with fields.

    Example: calling `walk_prefixes 'one.two.three.four'` will iterate over `'one'`, `'one.two'`,
    `'one.two.three'`. */
    if (!_isa.text(fq_name)) {
      throw new E.Intertype_wrong_type("^walk_prefixes@1^", 'a text', __type_of(_isa, p));
    }
    parts = fq_name.split('.');
    for (idx = i = 0, ref1 = parts.length - 1; (0 <= ref1 ? i < ref1 : i > ref1); idx = 0 <= ref1 ? ++i : --i) {
      yield (parts.slice(0, +idx + 1 || 9e9).join('.'));
    }
    return null;
  };

  //===========================================================================================================
  types = new Intertype();

  (() => {
    var create, isa, testing, type_of, validate;
    ({isa, validate, create, type_of} = types);
    testing = {_isa};
    return module.exports = {
      Intertype,
      Intertype_minimal,
      types,
      isa,
      validate,
      create,
      type_of,
      declarations: default_declarations,
      deepmerge,
      walk_prefixes,
      testing,
      __type_of
    };
  })();

}).call(this);

//# sourceMappingURL=main.js.map