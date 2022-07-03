(function() {
  'use strict';
  var CND, E, GUY, H, HEDGES, ITYP, Intertype_abc, alert, badge, debug, echo, empty, help, info, js_type_of, length_of, list_of, log, njs_path, nonempty, praise, ref, rpr, types, urge, warn, whisper, x,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } },
    splice = [].splice;

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

  types = new (require('intertype')).Intertype();

  this.defaults = {};

  //-----------------------------------------------------------------------------------------------------------
  types.declare('Type_cfg_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa_optional.nonempty_text x.size": function(x) {
        return this.isa_optional.nonempty_text(x.size);
      },
      "@isa.function x.test": function(x) {
        return this.isa.function(x.test);
      },
      "x.groups is a nonempty text or a nonempty list of nonempty texts": function(x) {
        if (this.isa.nonempty_text(x.groups)) {
          return true;
        }
        if (!this.isa.list(x.groups)) {
          return false;
        }
        return x.groups.every((e) => {
          return (this.isa.nonempty_text(e)) && !/[\s,]/.test(e);
        });
      }
    }
  });

  //...........................................................................................................
  this.defaults.Type_cfg_constructor_cfg = {
    groups: 'other',
    size: null, // defaults to `'length'` where `isa_collection` is `true`
    test: null
  };

  //-----------------------------------------------------------------------------------------------------------
  types.declare('Intertype_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa_optional.nonempty_text x.sep": function(x) {
        return this.isa_optional.nonempty_text(x.sep);
      }
    }
  });

  //...........................................................................................................
  this.defaults.Intertype_constructor_cfg = {
    sep: '$'
  };

  //===========================================================================================================
  Intertype_abc = class Intertype_abc extends GUY.props.Strict_owner {};

  //===========================================================================================================
  this.Type_cfg = class Type_cfg extends Intertype_abc {
    //---------------------------------------------------------------------------------------------------------
    constructor(hub, cfg) {
      var k, v;
      /* TAINT ensure type_cfg does not contain `type`, `name` */
      super();
      GUY.props.hide(this, 'hub', hub);
      cfg = {...ITYP.defaults.Type_cfg_constructor_cfg, ...cfg};
      cfg.groups = this._compile_groups(cfg.groups);
      types.validate.Type_cfg_constructor_cfg(cfg);
      cfg.test = cfg.test.bind(hub);
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

    //---------------------------------------------------------------------------------------------------------
    _compile_groups(groups) {
      var R, group, i, len;
      R = (types.isa.text(groups)) ? groups.split(/\s*,\s*/) : groups;
      for (i = 0, len = R.length; i < len; i++) {
        group = R[i];
        if (this.hub._hedges.hedgepaths.has(group)) {
          continue;
        }
        throw new E.Intertype_ETEMPTBD('^intertype/Type_cfg^', `unknown hedge group ${rpr(group)}`);
      }
      return R;
    }

  };

  //===========================================================================================================
  ref = this.Intertype = (function() {
    class Intertype extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var group, ref1;
        super();
        //---------------------------------------------------------------------------------------------------------
        this.declare = this.declare.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._add_type_to_group = this._add_type_to_group.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._isa = this._isa.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._test_hedge = this._test_hedge.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.js_type_of = this.js_type_of.bind(this);
        this.cfg = {...ITYP.defaults.Intertype_constructor_cfg, ...cfg};
        GUY.props.hide(this, '_hedges', new HEDGES.Intertype_hedge_combinator());
        this.isa = new GUY.props.Strict_owner();
        this.groups = {};
        ref1 = this._hedges._get_groupnames();
        //.......................................................................................................
        for (group of ref1) {
          this.groups[group] = new Set();
          GUY.props.hide(this.isa, group, (x) => {
            return this.groups[group].has(this.type_of(x));
          });
        }
        GUY.lft.freeze(this.groups);
        //.......................................................................................................
        return void 0;
      }

      declare(type, type_cfg) {
        var group, hedge, hedgepath, i, j, len, len1, ref1, ref2, self;
        boundMethodCheck(this, ref);
        type_cfg = new ITYP.Type_cfg(this, type_cfg);
        GUY.props.hide(this.isa, type, type_cfg.test);
        ref1 = type_cfg.groups;
        for (i = 0, len = ref1.length; i < len; i++) {
          group = ref1[i];
          //.....................................................................................................
          /* register type with group */
          this._add_type_to_group(group, type);
          ref2 = this._hedges.hedgepaths[group];
          //.....................................................................................................
          for (hedgepath of ref2) {
            if (hedgepath.length === 0) {
              continue;
            }
            self = this.isa;
            for (j = 0, len1 = hedgepath.length; j < len1; j++) {
              hedge = hedgepath[j];
              if (!self.has(hedge)) {
                // GUY.props.hide self, hedge, new GUY.props.Strict_owner()
                self[hedge] = new GUY.props.Strict_owner();
              }
              self = self[hedge];
            }
            GUY.props.hide(self, type, (x) => {
              info('^443^', {hedgepath, type, x});
              return this._isa(...hedgepath, type, x);
            });
          }
        }
        return null;
      }

      _add_type_to_group(group, type) {
        boundMethodCheck(this, ref);
        this.groups = GUY.lft.lets(this.groups, function(d) {
          return d[group].add(type);
        });
        return null;
      }

      _isa(...hedges) {
        var hedge, i, len, ref1, type, typetest, verdict, x;
        boundMethodCheck(this, ref);
        ref1 = hedges, [...hedges] = ref1, [type, x] = splice.call(hedges, -2);
        for (i = 0, len = hedges.length; i < len; i++) {
          hedge = hedges[i];
          if (!this._test_hedge(hedge, x)) {
            return false;
          }
        }
        // urge '^345^', { hedge, hedges, type, x, }
        //.......................................................................................................
        if ((typetest = this.isa.get(type, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype@1^', `unknown type ${rpr(type)}`);
        }
        // debug '^3435^', { hedges, type, x, }
        verdict = typetest(x);
        return this._protocol_isa(type, verdict, verdict);
      }

      _test_hedge(hedge, x) {
        var R, e, hedgetest;
        boundMethodCheck(this, ref);
        if ((hedgetest = this._hedges._hedgemethods.get(hedge, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype@1^', `unknown hedge ${rpr(hedge)}`);
        }
        //.......................................................................................................
        switch (R = hedgetest(x)) {
          case H.signals.true_and_break:
            return this._protocol_isa(hedge, R, true);
          case H.signals.false_and_break:
            return this._protocol_isa(hedge, R, false);
          case false:
            return this._protocol_isa(hedge, R, false);
          case true:
            return this._protocol_isa(hedge, R, true);
          //.....................................................................................................
          case H.signals.process_list_elements:
          case H.signals.process_set_elements:
            for (e of x) {
              if (!this._isa(...hedges, type, e)) {
                return this._protocol_isa(hedge, R, false);
              }
            }
            return this._protocol_isa(hedge, R, true);
        }
        //.......................................................................................................
        throw new E.Intertype_internal_error('^intertype@1^', `unexpected return value from hedgemethod for hedge ${rpr(hedge)}: ${rpr(R)}`);
      }

      //---------------------------------------------------------------------------------------------------------
      _protocol_isa(term, result, verdict) {
        // urge '^_protocol_isa@1^', { term, result, verdict, }
        return verdict;
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

    Intertype.prototype._constructor_of_generators = ((function*() {
      return (yield 42);
    })()).constructor;

    return Intertype;

  }).call(this);

  //###########################################################################################################
  this.defaults = GUY.lft.freeze(this.defaults);

  //===========================================================================================================
  x = new this.Intertype();

  // urge x.foo = 42
  // urge x.foo
  // urge x.has
  // urge x.has.foo
  // urge x.has.bar
  // try urge x.bar catch error then warn CND.reverse error.message
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