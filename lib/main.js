(function() {
  'use strict';
  var E, GUY, H, HEDGES, ITYP, Intertype_abc, debug, rpr, to_width, types,
    splice = [].splice;

  //###########################################################################################################
  // GUY                       = require 'guy'
  GUY = require('../../guy');

  ({debug} = GUY.trm.get_loggers('INTERTYPE'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  HEDGES = require('./hedges');

  ITYP = this;

  types = new (require('intertype-legacy')).Intertype();

  this.defaults = {};

  ({to_width} = require('to-width'));

  //-----------------------------------------------------------------------------------------------------------
  types.declare('Type_cfg_constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.nonempty_text x.name": function(x) {
        return this.isa.nonempty_text(x.name);
      },
      "( @isa.function x.test ) or ( @isa_list_of.function x.test )": function(x) {
        return (this.isa.function(x.test)) || (this.isa_list_of.function(x.test));
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
    name: null,
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
      },
      "@isa_optional.nonempty_text x.hedgematch": function(x) {
        return this.isa_optional.nonempty_text(x.hedgematch);
      }
    }
  });

  //...........................................................................................................
  this.defaults.Intertype_constructor_cfg = {
    sep: '.',
    hedgematch: '*'
  };

  //-----------------------------------------------------------------------------------------------------------
  types.declare('Intertype_walk_hedgepaths_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa_optional.nonempty_text x.sep": function(x) {
        return this.isa_optional.nonempty_text(x.sep);
      },
      "@isa_optional.function x.evaluate": function(x) {
        return this.isa_optional.function(x.evaluate);
      }
    }
  });

  /* TAINT omitted other settings for `GUY.props.tree()` */
  //...........................................................................................................
  this.defaults.Intertype_walk_hedgepaths_cfg = {
    sep: this.defaults.Intertype_constructor_cfg.sep,
    evaluate: function({owner, key, value}) {
      if ((types.type_of(value)) === 'function') {
        return 'take';
      }
      if (!GUY.props.has_any_keys(value)) {
        return 'take';
      }
      return 'descend';
    }
  };

  //===========================================================================================================
  Intertype_abc = class Intertype_abc extends GUY.props.Strict_owner {};

  //===========================================================================================================
  this.Type_cfg = class Type_cfg extends Intertype_abc {
    //---------------------------------------------------------------------------------------------------------
    constructor(hub, cfg) {
      var _test, f, k, v;
      /* TAINT ensure type_cfg does not contain `type`, `name` */
      super();
      GUY.props.hide(this, 'hub', hub);
      cfg = {...ITYP.defaults.Type_cfg_constructor_cfg, ...cfg};
      cfg.groups = this._compile_groups(cfg.groups);
      types.validate.Type_cfg_constructor_cfg(cfg);
      if (types.isa.list(cfg.test)) {
        // for f in cfg.test
        // console.log '^443^', f.name, GUY.src.slug_from_simple_function { function: f, }
        _test = (function() {
          var i, len, ref, results;
          ref = cfg.test;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            f = ref[i];
            results.push(f.bind(hub));
          }
          return results;
        })();
        cfg.test = (x) => {
          return _test.every(function(f) {
            return f(x);
          });
        };
      } else {
        // console.log '^443^', cfg.test.name, GUY.src.slug_from_simple_function { function: cfg.test, }
        cfg.test = cfg.test.bind(hub);
      }
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
        if (GUY.props.has(this.hub._hedges.hedgepaths, group)) {
          continue;
        }
        throw new E.Intertype_ETEMPTBD('^intertype/Type_cfg^', `unknown hedge group ${rpr(group)}`);
      }
      return R;
    }

  };

  //===========================================================================================================
  this.Intertype = (function() {
    class Intertype extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var group, ref;
        super();
        GUY.props.hide(this, 'cfg', {...ITYP.defaults.Intertype_constructor_cfg, ...cfg});
        /* TAINT use defaults as key index, GUY.props.crossmatch() to build `cfg` for hedge combinator */
        GUY.props.hide(this, '_hedges', new HEDGES.Intertype_hedge_combinator({
          hedgematch: this.cfg.hedgematch
        }));
        GUY.props.hide(this, 'isa', new GUY.props.Strict_owner({
          reset: false
        }));
        // isa_proxy = new Proxy ( @_isa.bind @ ), get: ( _, type ) => ( cfg ) => @_isa.call @, type, cfg
        // GUY.props.hide @, 'isa',      new Proxy {}, { get: ( ( t, k ) => debug '^323————————————————————————————————————^', rpr k; t[ k ] ), }
        GUY.props.hide(this, 'validate', new GUY.props.Strict_owner({
          reset: false
        }));
        // GUY.props.hide @, 'validate',  new Proxy ( @_validate.bind @ ), get: ( _, type ) => ( cfg ) => @_validate.call @, type, cfg
        GUY.props.hide(this, 'declare', new Proxy(this._declare.bind(this), {
          get: (_, type) => {
            return (cfg) => {
              return this._declare.call(this, type, cfg);
            };
          }
        }));
        GUY.props.hide(this, 'registry', new GUY.props.Strict_owner({
          reset: false
        }));
        GUY.props.hide(this, 'types', types);
        GUY.props.hide(this, 'groups', {});
        ref = this._hedges._get_groupnames();
        // GUY.props.hide @, 'proxy',    new Proxy @,
        //   get: ( target, key ) =>
        //     debug '^334234234^', GUY.trm.reverse "proxy", rpr key
        //     return target[ key ]
        //.......................................................................................................
        for (group of ref) {
          this.groups[group] = new Set();
          ((group) => {
            //   @isa[ group ] = ( x ) =>
            //     R = @groups[ group ].has @type_of x
            //     return @_protocol_isa group, R, R
            return this.declare(group, {
              groups: group,
              test: (x) => {
                var R;
                R = this.groups[group].has(this.type_of(x));
                return this._protocol_isa({
                  term: group,
                  x,
                  value: H.signals.nothing,
                  verdict: R
                });
              }
            });
          })(group);
        }
        GUY.lft.freeze(this.groups);
        //.......................................................................................................
        /* TAINT to get the demo off the ground we here shim a few types; this part will definitily
           change in future versions */
        // @declare 'object',  test: ( x ) -> ( H.type_of x ) is 'object'
        // @declare 'float',   groups: 'number',     test: ( x ) -> ( H.type_of x ) is 'float'
        // @declare 'text',    groups: 'collection', test: ( x ) -> ( H.type_of x ) is 'text'
        //.......................................................................................................
        return void 0; // new Proxy @, { get: ( ( t, k ) => debug GUY.trm.reverse GUY.trm.steel '^323————————————————————————————————————^', rpr k; t[ k ] ), }
      }

      
        //---------------------------------------------------------------------------------------------------------
      _declare(type, type_cfg) {
        var group, hedge, hedgepath, i, i_target, j, len, len1, ref, ref1, v_target;
        type_cfg = {
          ...type_cfg,
          name: type
        };
        type_cfg = new ITYP.Type_cfg(this, type_cfg);
        this.registry[type] = type_cfg;
        this.isa[type] = type_cfg.test;
        this.validate[type] = (x) => {
          return this._validate(type, x);
        };
        ref = type_cfg.groups;
        for (i = 0, len = ref.length; i < len; i++) {
          group = ref[i];
          //.....................................................................................................
          /* register type with group */
          this._add_type_to_group(group, type);
          ref1 = this._hedges.hedgepaths[group];
          //.....................................................................................................
          for (hedgepath of ref1) {
            if (hedgepath.length === 0) {
              continue;
            }
            i_target = this.isa;
            v_target = this.validate;
            for (j = 0, len1 = hedgepath.length; j < len1; j++) {
              hedge = hedgepath[j];
              if (!GUY.props.has(i_target, hedge)) {
                i_target[hedge] = new GUY.props.Strict_owner();
              }
              if (!GUY.props.has(v_target, hedge)) {
                v_target[hedge] = new GUY.props.Strict_owner();
              }
              i_target = i_target[hedge];
              v_target = v_target[hedge];
            }
            //...................................................................................................
            ((hedgepath) => {
              i_target[type] = (x) => {
                return this._isa(...hedgepath, type, x);
              };
              return v_target[type] = (x) => {
                return this._validate(...hedgepath, type, x);
              };
            })(hedgepath);
          }
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _add_type_to_group(group, type) {
        this.groups[group].add(type);
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _isa(...hedges) {
        var R, e, hedge, hedge_idx, i, len, ref, tail_hedges, type, typetest, verdict, x;
        ref = hedges, [...hedges] = ref, [type, x] = splice.call(hedges, -2);
        for (hedge_idx = i = 0, len = hedges.length; i < len; hedge_idx = ++i) {
          hedge = hedges[hedge_idx];
          switch (R = this._test_hedge(hedge, x)) {
            case true:
              null;
              break;
            case H.signals.true_and_break:
              return true;
            case H.signals.false_and_break:
              return false;
            case false:
              return false;
            case H.signals.process_list_elements:
            case H.signals.process_set_elements:
              tail_hedges = hedges.slice(hedge_idx + 1);
// debug '^3324^', { tail_hedges, }
              for (e of x) {
                if (!this._isa(...tail_hedges, type, e)) {
                  return false;
                }
              }
              return true;
            default:
              throw new E.Intertype_ETEMPTBD('^intertype@1^', `illegal return value from \`_test_hedge()\`: ${rpr(type)}`);
          }
        }
        // urge '^345^', { hedge, hedges, type, x, }
        //.......................................................................................................
        if ((typetest = GUY.props.get(this.isa, type, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype@1^', `unknown type ${rpr(type)}`);
        }
        // debug '^3435^', { hedges, type, x, }
        verdict = typetest(x);
        return this._protocol_isa({
          term: type,
          x,
          value: H.signals.nothing,
          verdict
        });
      }

      //---------------------------------------------------------------------------------------------------------
      _test_hedge(hedge, x) {
        var R, hedgetest;
        if ((hedgetest = GUY.props.get(this._hedges._hedgemethods, hedge, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype@1^', `unknown hedge ${rpr(hedge)}`);
        }
        //.......................................................................................................
        switch (R = hedgetest.call(this, x)) {
          case H.signals.true_and_break:
            return this._protocol_isa({
              term: hedge,
              x,
              value: H.signals.nothing,
              verdict: R
            });
          case H.signals.false_and_break:
            return this._protocol_isa({
              term: hedge,
              x,
              value: H.signals.nothing,
              verdict: R
            });
          case false:
            return this._protocol_isa({
              term: hedge,
              x,
              value: H.signals.nothing,
              verdict: false
            });
          case true:
            return this._protocol_isa({
              term: hedge,
              x,
              value: H.signals.nothing,
              verdict: true
            });
          case H.signals.process_list_elements:
            return this._protocol_isa({
              term: hedge,
              x,
              value: H.signals.nothing,
              verdict: R
            });
          case H.signals.process_set_elements:
            return this._protocol_isa({
              term: hedge,
              x,
              value: H.signals.nothing,
              verdict: R
            });
        }
        //.......................................................................................................
        throw new E.Intertype_internal_error('^intertype@1^', `unexpected return value from hedgemethod for hedge ${rpr(hedge)}: ${rpr(R)}`);
      }

      //---------------------------------------------------------------------------------------------------------
      _protocol_isa({term, x, value, verdict}) {
        var groups, ref, src, test, type_cfg;
        if ((type_cfg = GUY.props.get(this.registry, term, null)) != null) {
          // debug GUY.trm.plum '^_protocol_isa@1^', GUY.props.get type_cfg, 'test', null
          groups = (ref = type_cfg.groups) != null ? ref : null;
          if ((test = GUY.props.get(type_cfg, 'test', null)) != null) {
            src = GUY.src.slug_from_simple_function({
              function: test,
              fallback: '???'
            });
          } else {
            src = null;
          }
        } else {
          groups = null;
          src = null;
        }
        debug(GUY.trm.gold('^_protocol_isa@1^', {term, groups, x, value, verdict, src}));
        return verdict;
      }

      //---------------------------------------------------------------------------------------------------------
      _validate(...hedges) {
        var qtype, ref, type, x, xr;
        ref = hedges, [...hedges] = ref, [type, x] = splice.call(hedges, -2);
        debug('^4534^', {hedges, type, x});
        debug('^4534^', this._isa(...hedges, type, x));
        if (this._isa(...hedges, type, x)) {
          return true;
        }
        qtype = [...hedges, type].join(this.cfg.sep);
        xr = to_width(rpr(x), 100);
        throw new E.Intertype_ETEMPTBD('^intertype@1^', `not a valid ${qtype}`);
      }

      _normalize_type(type) {
        return type.toLowerCase().replace(/\s+/g, '');
      }

      //-----------------------------------------------------------------------------------------------------------
      * _walk_hedgepaths(cfg) {
        cfg = {...ITYP.defaults.Intertype_walk_hedgepaths_cfg, ...cfg};
        yield* GUY.props.walk_tree(this.isa, cfg);
        return null;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Intertype.prototype.type_of = H.type_of;

    Intertype.prototype.size_of = H.size_of;

    return Intertype;

  }).call(this);

  //###########################################################################################################
  this.defaults = GUY.lft.freeze(this.defaults);

}).call(this);

//# sourceMappingURL=main.js.map