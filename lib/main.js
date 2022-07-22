(function() {
  'use strict';
  var E, GUY, H, HEDGES, ITYP, Intertype_abc, debug, deep_copy, equals, rpr, to_width, types, warn,
    splice = [].splice;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, warn} = GUY.trm.get_loggers('INTERTYPE'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  HEDGES = require('./hedges');

  ITYP = this;

  types = new (require('intertype-legacy')).Intertype();

  this.defaults = {};

  ({to_width} = require('to-width'));

  deep_copy = structuredClone;

  equals = require('../deps/jkroso-equals');

  //-----------------------------------------------------------------------------------------------------------
  types.declare('deep_boolean', function(x) {
    return x === 'deep' || x === false || x === true;
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare('Type_cfg_constructor_cfg', {
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
    test: null,
    /* `default` omitted on purpose */
    create: null,
    // copy:             false
    // seal:             false
    freeze: false,
    extras: true
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
    sep: '.'
  };

  // #-----------------------------------------------------------------------------------------------------------
  // types.declare 'Intertype_walk_hedgepaths_cfg', tests:
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
  Intertype_abc = class Intertype_abc extends GUY.props.Strict_owner {};

  //===========================================================================================================
  this.Type_cfg = class Type_cfg extends Intertype_abc {
    //---------------------------------------------------------------------------------------------------------
    constructor(hub, cfg) {
      var f, k, keys, self, tests, v;
      /* TAINT ensure type_cfg does not contain `type`, `name` */
      super();
      GUY.props.hide(this, 'hub', hub);
      cfg = {...ITYP.defaults.Type_cfg_constructor_cfg, ...cfg};
      cfg.groups = this._compile_groups(cfg.groups);
      if (types.isa.list(cfg.test)) {
        tests = (function() {
          var i, len, ref, results;
          ref = cfg.test;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            f = ref[i];
            results.push(f.bind(hub));
          }
          return results;
        })();
      } else {
        tests = [cfg.test.bind(hub)];
      }
      types.validate.Type_cfg_constructor_cfg(cfg);
      //.......................................................................................................
      if (!cfg.extras) {
        keys = ((function() {
          var results;
          results = [];
          for (k in cfg.default) {
            results.push(k);
          }
          return results;
        })()).sort();
        this[H.signals.keys] = keys;
        /* TAINT should use sets not arrays */
        tests.push(function(x) {
          return equals(((function() {
            var results;
            results = [];
            for (k in x) {
              results.push(k);
            }
            return results;
          })()).sort(), keys);
        });
      }
      cfg.test = (x) => {
        return tests.every(function(f) {
          return f(x);
        });
      };
      if (cfg.isa_collection && (cfg.size == null)) {
        //.......................................................................................................
        /* TAINT not used by `size_of()` */
        cfg.size = 'length';
      }
      if (cfg.size == null) {
        cfg.size = null;
      }
      for (k in cfg) {
        v = cfg[k];
        //.......................................................................................................
        this[k] = v;
      }
      return self = GUY.lft.freeze(this);
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_groups(groups) {
      var R;
      warn(GUY.trm.reverse("^_compile_groups@1^ should validate groups"));
      R = (types.isa.text(groups)) ? groups.split(/\s*,\s*/) : groups;
      // for group in R
      //   continue if GUY.props.has @hub._hedges.hedgepaths, group
      //   throw new E.Intertype_ETEMPTBD '^intertype/Type_cfg^', "unknown hedge group #{rpr group}"
      return R;
    }

  };

  //===========================================================================================================
  this.Intertype = (function() {
    class Intertype extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var group, ref, self;
        super();
        self = this;
        //.......................................................................................................
        GUY.props.hide(this, 'cfg', {...ITYP.defaults.Intertype_constructor_cfg, ...cfg});
        GUY.props.hide(this, '_hedges', new HEDGES.Intertype_hedges());
        // GUY.props.hide @, 'isa',      new GUY.props.Strict_owner { reset: false, }
        GUY.props.hide(this, 'isa', new Proxy({}, this._get_hedge_base_proxy_cfg(self, '_isa')));
        GUY.props.hide(this, 'validate', new Proxy({}, this._get_hedge_base_proxy_cfg(self, '_validate')));
        GUY.props.hide(this, 'create', new Proxy({}, this._get_hedge_base_proxy_cfg(self, '_create')));
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
        this.state = {
          data: null,
          method: null,
          hedges: []
        };
        ref = this._hedges._get_groupnames();
        //.......................................................................................................
        for (group of ref) {
          this.groups[group] = new Set();
          ((group) => {
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
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      /* TAINT ideally would put this stuff elsewhere */
      _get_hedge_base_proxy_cfg(self, method_name) {
        return {
          //.......................................................................................................
          get: (target, key) => {
            var R, f;
            debug('^345345-1^', rpr(key));
            if (key === Symbol.toStringTag) {
              return void 0;
            }
            self.state.method = method_name;
            self.state.hedges = [key];
            if ((R = GUY.props.get(target, key, H.signals.nothing)) !== H.signals.nothing) {
              return R;
            }
            if (method_name === '_create') {
              f = {
                [`${key}`]: (function(cfg = null) {
                  return self[self.state.method](key, cfg);
                })
              }[key];
            } else {
              f = {
                [`${key}`]: (function(...P) {
                  return self[self.state.method](...P);
                })
              }[key];
            }
            return target[key] = new Proxy(f, this._get_hedge_sub_proxy_cfg(self));
          }
        };
      }

      //---------------------------------------------------------------------------------------------------------
      /* TAINT ideally would put this stuff elsewhere */
      _get_hedge_sub_proxy_cfg(self) {
        return {
          get: (target, key) => {
            var R, f;
            debug('^345345-2^', rpr(key));
            if (key === Symbol.toStringTag) {
              return void 0;
            }
            self.state.hedges.push(key);
            if ((R = GUY.props.get(target, key, H.signals.nothing)) !== H.signals.nothing) {
              return R;
            }
            f = {
              [`${key}`]: function(x) {
                return self[self.state.method](...self.state.hedges, x);
              }
            }[key];
            return target[key] = new Proxy(f, this._get_hedge_sub_proxy_cfg(self));
          }
        };
      }

      //---------------------------------------------------------------------------------------------------------
      _declare(type, type_cfg) {
        var group, i, len, ref;
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
          this._add_type_to_group(group, type);
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
        //.......................................................................................................
        if ((typetest = GUY.props.get(this.isa, type, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype@1^', `unknown type ${rpr(type)}`);
        }
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
        if (this._isa(...hedges, type, x)) {
          return x;
        }
        qtype = [...hedges, type].join(this.cfg.sep);
        xr = to_width(rpr(x), 100);
        throw new E.Intertype_ETEMPTBD('^intertype@1^', `not a valid ${qtype}: ${xr}`);
      }

      //---------------------------------------------------------------------------------------------------------
      _create(type, cfg) {
        var R, create, t, type_cfg;
        create = null;
        //.......................................................................................................
        if ((type_cfg = GUY.props.get(this.registry, type, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype@1^', `unknown type ${rpr(type)}`);
        }
        //.......................................................................................................
        /* Try to get `create` method, or, should that fail, the `default` value. Throw error when neither
           `create` nor `default` are given: */
        if ((create = GUY.props.get(type_cfg, 'create', null)) === null) {
          if ((R = GUY.props.get(type_cfg, 'default', H.signals.nothing)) === H.signals.nothing) {
            throw new E.Intertype_ETEMPTBD('^intertype@1^', `type ${rpr(type)} does not have a \`default\` value or a \`create()\` method`);
          }
        } else {
          /* If `create` is given, call it to obtain default value: */
          //.......................................................................................................
          R = create.call(this, cfg);
        }
        //.......................................................................................................
        if ((create == null) && (cfg != null)) {
          if ((t = H.js_type_of(R)) === '[object Object]' || t === '[object Array]') {
            R = Object.assign(structuredClone(R), cfg);
          } else {
            R = cfg;
          }
        } else {
          R = structuredClone(R);
        }
        //.......................................................................................................
        if (type_cfg.freeze === true) {
          R = Object.freeze(R);
        } else if (type_cfg.freeze === 'deep') {
          R = GUY.lft.freeze(GUY.lft._deep_copy(R));
        }
        //.......................................................................................................
        return this._validate(type, R);
      }

      _normalize_type(type) {
        return type.toLowerCase().replace(/\s+/g, '');
      }

      //-----------------------------------------------------------------------------------------------------------
      _walk_hedgepaths(cfg) {
        throw new Error("^_walk_hedgepaths@1^ not implemented");
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Intertype.prototype.equals = H.equals;

    Intertype.prototype.type_of = H.type_of;

    Intertype.prototype.size_of = H.size_of;

    return Intertype;

  }).call(this);

  // cfg = { ITYP.defaults.Intertype_walk_hedgepaths_cfg..., cfg..., }
  // yield from GUY.props.walk_tree @isa, cfg
  // return null

  //###########################################################################################################
  this.defaults = GUY.lft.freeze(this.defaults);

}).call(this);

//# sourceMappingURL=main.js.map