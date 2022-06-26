(function() {
  'use strict';
  var CND, Defaults, E, Empty, GUY, H, HEDGES, ITYP, Intertype_abc, Isa, Isa_empty, Isa_list_of, Isa_nonempty, Isa_optional, List_of, Nonempty, Validate, Validate_empty, Validate_list_of, Validate_nonempty, Validate_optional, alert, badge, debug, echo, empty, error, help, info, js_type_of, length_of, list_of, log, njs_path, nonempty, praise, ref, rpr, urge, warn, whisper, x,
    splice = [].splice,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  //###########################################################################################################
  // njs_util                  = require 'util'
  njs_path = require('path');

  // njs_fs                    = require 'fs'
  //...........................................................................................................
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'INTERTYPE/main';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  praise = CND.get_logger('praise', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  GUY = require('guy');

  E = require('./errors');

  H = require('./helpers');

  HEDGES = require('./hedges');

  ITYP = this;

  //===========================================================================================================
  Intertype_abc = class Intertype_abc extends GUY.props.Strict_owner {};

  // #---------------------------------------------------------------------------------------------------------
  // constructor: ->
  //   super()
  //   return undefined

    //===========================================================================================================
  Empty = class Empty extends Intertype_abc {};

  Nonempty = class Nonempty extends Intertype_abc {};

  List_of = class List_of extends Intertype_abc {};

  Defaults = class Defaults extends Intertype_abc {};

  //===========================================================================================================
  Isa_list_of = class Isa_list_of extends Intertype_abc {};

  //===========================================================================================================
  Validate_list_of = class Validate_list_of extends Intertype_abc {};

  Isa_empty = (function() {
    //===========================================================================================================
    class Isa_empty extends Intertype_abc {};

    Isa_empty.prototype.list_of = new Isa_list_of();

    return Isa_empty;

  }).call(this);

  Validate_empty = (function() {
    //===========================================================================================================
    class Validate_empty extends Intertype_abc {};

    Validate_empty.prototype.list_of = new Validate_list_of();

    return Validate_empty;

  }).call(this);

  Isa_nonempty = (function() {
    //===========================================================================================================
    class Isa_nonempty extends Intertype_abc {};

    Isa_nonempty.prototype.list_of = new Isa_list_of();

    return Isa_nonempty;

  }).call(this);

  Validate_nonempty = (function() {
    //===========================================================================================================
    class Validate_nonempty extends Intertype_abc {};

    Validate_nonempty.prototype.list_of = new Validate_list_of();

    return Validate_nonempty;

  }).call(this);

  Isa_optional = (function() {
    //===========================================================================================================
    class Isa_optional extends Intertype_abc {};

    Isa_optional.prototype.empty = new Isa_empty();

    Isa_optional.prototype.nonempty = new Isa_nonempty();

    Isa_optional.prototype.list_of = new Isa_list_of();

    return Isa_optional;

  }).call(this);

  Validate_optional = (function() {
    //===========================================================================================================
    class Validate_optional extends Intertype_abc {};

    Validate_optional.prototype.empty = new Validate_empty();

    Validate_optional.prototype.nonempty = new Validate_nonempty();

    Validate_optional.prototype.list_of = new Validate_list_of();

    return Validate_optional;

  }).call(this);

  Isa = (function() {
    //===========================================================================================================
    class Isa extends Intertype_abc {};

    Isa.prototype.optional = new Isa_optional();

    Isa.prototype.empty = new Isa_empty();

    Isa.prototype.nonempty = new Isa_nonempty();

    Isa.prototype.list_of = new Isa_list_of();

    return Isa;

  }).call(this);

  Validate = (function() {
    //===========================================================================================================
    class Validate extends Intertype_abc {};

    Validate.prototype.optional = new Validate_optional();

    Validate.prototype.empty = new Validate_empty();

    Validate.prototype.nonempty = new Validate_nonempty();

    Validate.prototype.list_of = new Validate_list_of();

    return Validate;

  }).call(this);

  //===========================================================================================================
  this.Type_cfg = (function() {
    class Type_cfg extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var k, v;
        /* TAINT ensure type_cfg does not contain `type`, `name` */
        super();
        cfg = {...this.constructor.defaults.constructor_cfg, ...cfg};
        if (cfg.isa_collection && (cfg.size == null)) {
          cfg.size = 'length';
        }
        if (cfg.size == null) {
          cfg.size = null;
        }
        for (k in cfg) {
          v = cfg[k];
          this[k] = v;
        }
        return GUY.lft.freeze(this);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Type_cfg.defaults = GUY.lft.freeze({
      //.......................................................................................................
      constructor_cfg: {
        isa_numeric: false,
        isa_collection: false,
        size: null, // defaults to `'length'` where `isa_collection` is `true`
        test: null
      }
    });

    return Type_cfg;

  }).call(this);

  //===========================================================================================================
  ref = this.Intertype = (function() {
    class Intertype extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        super();
        //---------------------------------------------------------------------------------------------------------
        this.declare = this.declare.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._declare_hedgepath = this._declare_hedgepath.bind(this);
        // #---------------------------------------------------------------------------------------------------------
        // _is_empty:    ( type_cfg, x ) -> ( @_size_of type_cfg, x ) is 0
        // _is_nonempty: ( type_cfg, x ) -> ( @_size_of type_cfg, x ) > 0

        //---------------------------------------------------------------------------------------------------------
        this.js_type_of = this.js_type_of.bind(this);
        // @defaults           = new Defaults()
        // @isa                = new Isa()
        // @validate           = new Validate()
        this.cfg = {...this.constructor.defaults.constructor_cfg, ...cfg};
        this._types = {};
        this._hedges = new HEDGES.Intertype_hedge_combinator();
        //.......................................................................................................
        this.isa = new GUY.props.Strict_owner({
          target: (...hedges) => {
            var name, ref1, ref2, test, type, x;
            ref1 = hedges, [...hedges] = ref1, [type, x] = splice.call(hedges, -2);
            /* TAINT code duplication */
            hedges.push(type);
            name = hedges.join(this.cfg.sep);
            // throw new Error '^534-1^' if hedges.length isnt 1
            if ((test = (ref2 = this._types[name]) != null ? ref2.test : void 0) == null) {
              throw new E.Intertype_ETEMPTBD('^intertype@2^', `no such type ${rpr(hedges)}`);
            }
            return test(x);
          }
        });
        //.......................................................................................................
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _match_hedge_and_type_cfg(hedge, type_cfg) {
        var property, ref1, value;
        ref1 = hedge.match;
        for (property in ref1) {
          value = ref1[property];
          if (property === 'all') {
            return true;
          }
          if (!type_cfg[property]) {
            return false;
          }
        }
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      * _walk_hedgepaths(type_cfg, hedge_idx = 0, current_path = []) {
        var hedge, i, j, l, len, len1, len2, len3, m, next_path, next_path_base, ref1, ref2, ref3, ref4, term, term1, term_idx;
        /* thx to https://itecnote.com/tecnote/java-generate-all-combinations-from-multiple-lists/ */
        if (hedge_idx === this._hedges.length) {
          yield current_path;
          return null;
        }
        hedge = this._hedges[hedge_idx];
        yield* this._walk_hedgepaths(type_cfg, hedge_idx + 1, current_path);
        if (!this._match_hedge_and_type(hedge, type_cfg)) {
          return null;
        }
        if (Array.isArray(hedge.x[0])) {
          if (hedge.x.length !== 2) {
            throw new E.Intertype_ETEMPTBD('^intertype@1^', `expected hedge declaration to have exactly two sublists, got ${rpr(hedge)}`);
          }
          ref1 = hedge.x[1];
          for (i = 0, len = ref1.length; i < len; i++) {
            term = ref1[i];
            next_path = [...current_path, term];
            yield* this._walk_hedgepaths(type_cfg, hedge_idx + 1, next_path);
          }
          ref2 = hedge.x[0];
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            term1 = ref2[j];
            next_path_base = [...current_path, term1];
            ref3 = hedge.x[1];
            for (l = 0, len2 = ref3.length; l < len2; l++) {
              term = ref3[l];
              next_path = [...next_path_base, term];
              yield* this._walk_hedgepaths(type_cfg, hedge_idx + 1, next_path);
            }
          }
        } else {
          ref4 = hedge.x;
          for (term_idx = m = 0, len3 = ref4.length; m < len3; term_idx = ++m) {
            term = ref4[term_idx];
            next_path = [...current_path, term];
            yield* this._walk_hedgepaths(type_cfg, hedge_idx + 1, next_path);
          }
        }
        return null;
      }

      declare(type, type_cfg) {
        /* TAINT must include test for hedges */
        var hedgepath, name, ref1, test;
        boundMethodCheck(this, ref);
        type_cfg = new ITYP.Type_cfg(type_cfg);
        ref1 = this._walk_hedgepaths(type_cfg);
        for (hedgepath of ref1) {
          name = [...hedgepath, type].join(this.cfg.sep);
          test = type_cfg.test.bind(this);
          this._types[name] = {...type_cfg, name, type, test};
          this._declare_hedgepath({
            method: this.isa,
            test,
            type,
            type_cfg,
            name,
            hedgepath
          });
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _protocol_isa(term, result, verdict) {
        debug('^_protocol_isa@1^', {term, result, verdict});
        return verdict;
      }

      _declare_hedgepath({method, test, type, type_cfg, name, hedgepath}) {
        var hedgemethods, parent, typetest;
        boundMethodCheck(this, ref);
        typetest = test;
        parent = method;
        hedgemethods = [];
        parent = (() => {
          var i, len, term;
          for (i = 0, len = hedgepath.length; i < len; i++) {
            term = hedgepath[i];
            hedgemethods.push([term, this._hedgemethods[term]]);
            if (!parent.has(term)) {
              /* TAINT consider to make functions out of these (re-use `method`?) */
              GUY.props.hide(parent, term, new GUY.props.Strict_owner());
            }
            parent = parent[term];
          }
          return parent;
        })();
        //.......................................................................................................
        if (!parent.has(type)) {
          //.....................................................................................................
          test = (x) => {
            var R, e, hedge_idx, hedgemethod, i, idx, j, len, len1, tail, term;
            for (hedge_idx = i = 0, len = hedgemethods.length; i < len; hedge_idx = ++i) {
              [term, hedgemethod] = hedgemethods[hedge_idx];
              // debug '^_declare_hedgepath.test@1^', { term, R: ( hedgemethod.call @, x ), }
              switch (R = hedgemethod.call(this, x)) {
                case this._signals.true_and_break:
                  return this._protocol_isa(term, R, true);
                case this._signals.false_and_break:
                  return this._protocol_isa(term, R, false);
                case false:
                  return this._protocol_isa(term, R, false);
                case true:
                  this._protocol_isa(term, R, true);
                  break;
                case this._signals.process_list_elements:
                  tail = (function() {
                    var j, ref1, ref2, results;
                    results = [];
                    for (idx = j = ref1 = hedge_idx + 1, ref2 = hedgemethods.length; (ref1 <= ref2 ? j < ref2 : j > ref2); idx = ref1 <= ref2 ? ++j : --j) {
                      results.push(hedgemethods[idx][1]);
                    }
                    return results;
                  })();
                  tail.push(type);
                  debug('^4534^', tail);
                  for (j = 0, len1 = x.length; j < len1; j++) {
                    e = x[j];
                    if (!this.isa(...tail, e)) {
                      return this._protocol_isa(term, R, false);
                    }
                  }
                  return this._protocol_isa(term, R, true);
                default:
                  throw new E.Intertype_internal_error('^intertype@1^', `unexpected return value from hedgemethod for term ${rpr(term)}: ${rpr(R)}`);
              }
            }
            return this._protocol_isa(type, null, typetest.call(this, x));
          };
          //.....................................................................................................
          GUY.props.hide(parent, type, test);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _size_of(x) {
        var R;
        if ((R = x.length) != null) {
          /* TAINT this will break with `Strict_owner` instances */
          return R;
        }
        if ((R = x.size) != null) {
          return R;
        }
        return (Object.keys(x)).length;
      }

      js_type_of(x) {
        boundMethodCheck(this, ref);
        return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase().replace(/\s+/g, '');
      }

      _normalize_type(type) {
        return type.toLowerCase().replace(/\s+/g, '');
      }

      //---------------------------------------------------------------------------------------------------------
      type_of(x) {
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
          if (x.constructor === this._constructor_of_generators) {
            return 'generator';
          }
          /* NOTE: throw error since this should never happen */
          return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase();
        }
        if ((typeof x === 'object') && (R === 'boolean' || R === 'number' || R === 'string')) {
//.........................................................................................................
/* Mark Miller Device */          return 'wrapper';
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
      }

    };

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype.prototype._hedges = GUY.lft.freeze([
      {
        x: ['optional'],
        match: {
          all: true
        }
      },
      {
        x: [['empty',
      'nonempty'],
      ['list_of',
      'set_of'],
      ['optional']],
        match: {
          all: true
        }
      },
      {
        x: ['empty',
      'nonempty'],
        match: {
          isa_collection: true
        }
      },
      {
        x: ['positive0',
      'positive1',
      'negative0',
      'negative1'],
        match: {
          isa_numeric: true
        }
      }
    ]);

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype.prototype._signals = GUY.lft.freeze(new GUY.props.Strict_owner({
      target: {
        true_and_break: Symbol('true_and_break'),
        false_and_break: Symbol('false_and_break'),
        process_list_elements: Symbol('process_list_elements'),
        processd_set_elements: Symbol('processd_set_elements')
      }
    }));

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype.prototype._hedgemethods = GUY.lft.freeze(new GUY.props.Strict_owner({
      target: {
        optional: function(x) {
          if (x == null) {
            return this._signals.true_and_break;
          }
          return true;
        },
        //.......................................................................................................
        /* TAINT use `length` or `size` or custom method */
        empty: function(x) {
          return (this._size_of(x)) === 0;
        },
        nonempty: function(x) {
          return (this._size_of(x)) !== 0;
        },
        //.......................................................................................................
        /* TAINT this is wrong, must test ensuing arguments against each element in collection */
        list_of: function(x) {
          if (!Array.isArray(x)) {
            return this._signals.false_and_break;
          }
          return this._signals.process_list_elements;
        },
        set_of: function(x) {
          if (!(x instanceof Set)) {
            return this._signals.false_and_break;
          }
          return this._signals.processd_set_elements;
        },
        //.......................................................................................................
        positive0: function(x) {
          return x >= 0;
        },
        positive1: function(x) {
          return x > 0;
        },
        negative0: function(x) {
          return x <= 0;
        },
        negative1: function(x) {
          return x < 0;
        }
      }
    }));

    //---------------------------------------------------------------------------------------------------------
    Intertype.defaults = GUY.lft.freeze({
      //.......................................................................................................
      constructor_cfg: {
        sep: '$'
      }
    });

    Intertype.prototype._constructor_of_generators = ((function*() {
      return (yield 42);
    })()).constructor;

    return Intertype;

  }).call(this);

  //===========================================================================================================
  x = new this.Intertype();

  try {
    // urge x.foo = 42
    // urge x.foo
    // urge x.has
    // urge x.has.foo
    // urge x.has.bar
    urge(x.bar);
  } catch (error1) {
    error = error1;
    warn(CND.reverse(error.message));
  }

  js_type_of = (x) => {
    return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase().replace(/\s+/g, '');
  };

  length_of = function(x) {
    if (x == null) {
      throw new Error("^1^");
    }
    if (Object.hasOwnProperty(x, length)) {
      return x.length;
    }
    if (Object.hasOwnProperty(x, size)) {
      return x.size;
    }
    if ((js_type_of(x)) === 'object') {
      return (Object.keys(x)).length;
    }
    throw new Error("^2^");
  };

  nonempty = function(x) {
    return (length_of(x)) > 0;
  };

  empty = function(x) {
    return (length_of(x)) === 0;
  };

  list_of = function(type, x) {
    if ((js_type_of(x)) !== 'array') {
      return false;
    }
    if (x.length === 0) {
      return true;
    }
    // return x.every ( e ) -> isa type, e
    return x.every(function(e) {
      return (js_type_of(e)) === type/* TAINT should use `isa` */;
    });
  };

  /*

types.isa.integer                                           42
types.isa.even.integer                                      -42
types.isa.odd.integer                                       41
types.isa.negative1.integer                                 -42
types.isa.negative0.integer                                 0
types.isa.positive1.integer                                 42
types.isa.positive0.integer                                 0
types.isa.list_of.integer                                   [ 42, ]
types.isa.nonempty.list_of.negative1.integer                [ -42, ]
types.isa.nonempty.list_of.negative0.integer                [ 0, ]
types.isa.nonempty.list_of.positive1.integer                [ 42, ]
types.isa.nonempty.list_of.positive0.integer                [ 0, ]
types.isa.empty.list_of.integer                             []
types.isa.nonempty.list_of.integer                          [ 42, ]
types.isa.optional.integer                                  42
types.isa.optional.list_of.integer                          [ 42, ]
types.isa.optional.empty.list_of.integer                    []
types.isa.optional.nonempty.list_of.integer                 [ 42, ]
types.isa.optional.negative1.integer                        -42
types.isa.optional.negative0.integer                        0
types.isa.optional.positive1.integer                        42
types.isa.optional.positive0.integer                        0
types.isa.optional.nonempty.list_of.negative1.integer       [ -42, ]
types.isa.optional.nonempty.list_of.negative0.integer       [ 0, ]
types.isa.optional.nonempty.list_of.positive1.integer       [ 42, ]
types.isa.optional.nonempty.list_of.positive0.integer       [ 0, ]
types.isa.optional.empty.list_of.negative1.integer          -42
types.isa.optional.empty.list_of.negative0.integer          0
types.isa.optional.empty.list_of.positive1.integer          42
types.isa.optional.empty.list_of.positive0.integer          0

[all]     [all]     [isa_collection]  [isa_collection]  [isa_numeric]   [isa_numeric]   [mandatory]
————————————————————————————————————————————————————————————————————————————————————————————————————
isa       optional  empty             list_of           even            negative0       <type>
validate            nonempty                            odd             negative1
                                                                        positive0
                                                                        positive1
*/

}).call(this);

//# sourceMappingURL=main.js.map