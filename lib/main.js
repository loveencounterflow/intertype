(function() {
  'use strict';
  var DECLARATIONS, E, GUY, H, HEDGES, ITYP, Intertype_abc, debug, deep_copy, equals, help, rpr, to_width, types, urge, warn,
    splice = [].splice;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, warn, urge, help} = GUY.trm.get_loggers('INTERTYPE'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  HEDGES = require('./hedges');

  DECLARATIONS = require('./declarations');

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
      "x.test is a function or non-empty list of functions": function(x) {
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
      var k, self, v;
      /* TAINT ensure type_cfg does not contain `type`, `name` */
      /* TAINT do not use `tests.every()` when only 1 test given */
      super();
      GUY.props.hide(this, 'hub', hub);
      cfg = {...ITYP.defaults.Type_cfg_constructor_cfg, ...cfg};
      types.validate.Type_cfg_constructor_cfg(cfg);
      cfg.groups = this._compile_groups(cfg);
      cfg.test = new Proxy(this._compile_test(hub, cfg), hub._get_hedge_sub_proxy_cfg(hub));
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
    _compile_test(hub, cfg) {
      var f, test, tests;
      /* TAINT integrate the below */
      // if not cfg.extras
      //   keys                = ( k for k of cfg.default ).sort()
      //   @[ H.signals.keys ] = keys
      //   ### TAINT should use sets not arrays ###
      //   tests.push ( x ) -> equals ( k for k of x ).sort(), keys
      test = null;
      if (types.isa.list(cfg.test)) {
        if (cfg.test.length !== 1) {
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
          test = {
            [`${cfg.name}`]: ((x) => {
              var R, i, len;
              for (i = 0, len = tests.length; i < len; i++) {
                test = tests[i];
                if ((R = test(x)) === false) {
                  return false;
                }
                if (R !== true) {
                  return R;
                }
              }
              return true;
            })
          }[cfg.name];
          return test;
        }
        test = cfg.test[0];
      }
      if (test == null) {
        test = cfg.test;
      }
      return {
        [`${cfg.name}`]: ((x) => {
          return test.call(hub, x);
        })
      }[cfg.name];
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_groups(cfg) {
      warn(GUY.trm.reverse("^_compile_groups@1^ should validate groups"));
      if (types.isa.text(cfg.groups)) {
        return cfg.groups.split(/\s*,\s*/);
      } else {
        return cfg.groups;
      }
    }

  };

  //===========================================================================================================
  this.Intertype = (function() {
    class Intertype extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var self;
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
        //.......................................................................................................
        this._register_groups();
        this._register_hedges();
        //.......................................................................................................
        DECLARATIONS._provisional_declare_basic_types(this);
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _register_groups() {
        var group, ref;
        ref = this._hedges._get_groupnames();
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
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _register_hedges() {
        var hedge, ref, test;
        ref = this._hedges._hedgemethods;
        for (hedge in ref) {
          test = ref[hedge];
          ((hedge, test) => {
            return this.declare(hedge, {test});
          })(hedge, test);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      /* TAINT ideally would put this stuff elsewhere */
      _get_hedge_base_proxy_cfg(self, method_name) {
        return {
          //.......................................................................................................
          get: (target, key) => {
            var R, f;
            if (key === Symbol.toStringTag) {
              return void 0;
            }
            if (key === 'constructor') {
              return target.constructor;
            }
            if (key === 'toString') {
              return target.toString;
            }
            if (key === 'call') {
              return target.call;
            }
            if (key === 'apply') {
              return target.apply;
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
            GUY.props.hide(target, key, R = new Proxy(f, this._get_hedge_sub_proxy_cfg(self)));
            return R;
          }
        };
      }

      //---------------------------------------------------------------------------------------------------------
      /* TAINT ideally would put this stuff elsewhere */
      _get_hedge_sub_proxy_cfg(self) {
        return {
          get: (target, key) => {
            var R, f;
            if (key === Symbol.toStringTag) {
              return void 0;
            }
            if (key === 'constructor') {
              return target.constructor;
            }
            if (key === 'toString') {
              return target.toString;
            }
            if (key === 'call') {
              return target.call;
            }
            if (key === 'apply') {
              return target.apply;
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
            GUY.props.hide(target, key, R = new Proxy(f, this._get_hedge_sub_proxy_cfg(self)));
            return R;
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
        this.validate[type] = new Proxy(((x) => {
          return this._validate(type, x);
        }), this._get_hedge_sub_proxy_cfg(this));
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
        var R, advance, hedge, hedge_idx, is_terminal, last_hedge_idx, ref, result, type_cfg, x;
        ref = hedges, [...hedges] = ref, [x] = splice.call(hedges, -1);
        hedge_idx = -1;
        last_hedge_idx = hedges.length - 1;
        advance = false;
        is_terminal = false;
        R = true;
        while (true) {
          //.......................................................................................................
          hedge_idx++;
          if (hedge_idx > last_hedge_idx) {
            return R;
          }
          hedge = hedges[hedge_idx];
          is_terminal = (hedges[hedge_idx + 1] === 'or') || (hedge_idx === last_hedge_idx);
          //.....................................................................................................
          if (advance) {
            if (hedge !== 'or') {
              continue;
            }
          }
          advance = false;
          //.....................................................................................................
          if (hedge === 'or') {
            R = true;
            continue;
          }
          //.....................................................................................................
          if ((type_cfg = GUY.props.get(this.registry, hedge, null)) == null) {
            throw new E.Intertype_ETEMPTBD('^intertype@1^', `unknown hedge or type ${rpr(hedge)}`);
          }
          //.....................................................................................................
          result = type_cfg.test.call(this, x);
          switch (result) {
            case H.signals.return_true:
              return this._protocol_isa({
                term: hedge,
                x,
                value: H.signals.nothing,
                verdict: true
              });
            // when H.signals.advance                then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
            // when H.signals.process_list_elements  then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
            // when H.signals.process_set_elements   then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
            case false:
              this._protocol_isa({
                term: hedge,
                x,
                value: H.signals.nothing,
                verdict: false
              });
              advance = true;
              R = false;
              continue;
            case true:
              this._protocol_isa({
                term: hedge,
                x,
                value: H.signals.nothing,
                verdict: true
              });
              if (is_terminal) {
                return true;
              }
              continue;
          }
          //.....................................................................................................
          throw new E.Intertype_internal_error('^intertype@1^', `unexpected return value from hedgemethod for hedge ${rpr(hedge)}: ${rpr(R)}`);
        }
        //.......................................................................................................
        return R;
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
        // debug GUY.trm.gold '^_protocol_isa@1^', { term, groups, x, value, verdict, src, }
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