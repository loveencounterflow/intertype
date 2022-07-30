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
  types.declare('Intertype_iterable', function(x) {
    return (x != null) && (x[Symbol.iterator] != null);
  });

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
      var f, k, keys, no_extras, test, tests;
      /* TAINT integrate the below */
      if (!cfg.extras) {
        if (!types.isa.list(cfg.test)) {
          cfg.test = [cfg.test];
        }
        keys = ((function() {
          var results;
          results = [];
          for (k in cfg.default) {
            results.push(k);
          }
          return results;
        })()).sort();
        cfg.test.unshift(no_extras = (x) => {
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

  };

  //===========================================================================================================
  this.Intertype = (function() {
    class Intertype extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var declare_getter;
        super();
        //.......................................................................................................
        GUY.props.hide(this, 'cfg', {...ITYP.defaults.Intertype_constructor_cfg, ...cfg});
        GUY.props.hide(this, '_hedges', new HEDGES.Intertype_hedges());
        GUY.props.hide(this, '_collections', new Set());
        GUY.props.hide(this, '_signals', H.signals);
        // GUY.props.hide @, 'isa',      new GUY.props.Strict_owner { reset: false, }
        GUY.props.hide(this, 'isa', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_isa')));
        GUY.props.hide(this, 'validate', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_validate')));
        GUY.props.hide(this, 'create', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_create')));
        //.......................................................................................................
        /* TAINT squeezing this in here for the moment, pending reformulation of `isa` &c to make them callable: */
        declare_getter = (_, type) => {
          return (cfg, test = null) => {
            if (types.isa.function(cfg)) {
              cfg = {
                test: cfg
              };
            }
            if (test != null) {
              if ((cfg != null ? cfg.test : void 0) != null) {
                throw new E.Intertype_ETEMPTBD('^intertype.declare@1^', "cannot give both positional and named argument test");
              }
              cfg = {...cfg, test};
            }
            return this._declare.call(this, type, cfg);
          };
        };
        GUY.props.hide(this, 'declare', new Proxy(this._declare.bind(this), {
          get: declare_getter
        }));
        //.......................................................................................................
        GUY.props.hide(this, 'registry', new GUY.props.Strict_owner({
          reset: false
        }));
        GUY.props.hide(this, 'types', types);
        this.state = {
          data: null,
          method: null,
          hedges: []
        };
        //.......................................................................................................
        this._register_hedges();
        DECLARATIONS._provisional_declare_basic_types(this);
        return void 0;
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
          // _method_name  = method_name
          // _method_name  = "_#{method_name}" unless _method_name.startsWith '_'
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
            if (key === 'of' || key === 'or') {
              throw new E.Intertype_ETEMPTBD('^intertype.base_proxy@2^', `hedgerow cannot start with \`${key}\`, must be preceeded by hedge`);
            }
            if ((GUY.props.get(this.registry, key, null)) == null) {
              throw new E.Intertype_ETEMPTBD('^intertype.base_proxy@3^', `unknown hedge or type ${rpr(key)}`);
            }
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
      _get_hedge_sub_proxy_cfg(self) {
        return {
          get: (target, key) => {
            var R, f, type_cfg;
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
            //...................................................................................................
            if ((type_cfg = GUY.props.get(this.registry, key, null)) == null) {
              throw new E.Intertype_ETEMPTBD('^intertype.base_proxy@4^', `unknown hedge or type ${rpr(key)}`);
            }
            //...................................................................................................
            /* check for preceding type being iterable when building hedgerow with `of`: */
            if ((key === 'of') && (!this._collections.has(target.name))) {
              throw new E.Intertype_ETEMPTBD('^intertype.sub_proxy@5^', `expected type before \`of\` to be a collection, got ${rpr(target.name)}`);
            }
            //...................................................................................................
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
        if (type_cfg.collection) {
          this._collections.add(type);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _validate_hedgerow(hedgerow) {
        var ref, ref1, xr;
        if (((ref = hedgerow[0]) === 'of' || ref === 'or') || ((ref1 = hedgerow[hedgerow.length - 1]) === 'of' || ref1 === 'or')) {
          xr = rpr(hedgerow.join(this.cfg.sep));
          throw new E.Intertype_ETEMPTBD('^intertype.validate_hedgerow@6^', `hedgerow cannot begin or end with \`of\` or \`or\`, must be surrounded by hedges, got ${xr}`);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _isa(...hedges) {
        var R, advance, element, error, hedge, hedge_idx, is_terminal, last_hedge_idx, ref, result, tail_hedges, type_cfg, x;
        ref = hedges, [...hedges] = ref, [x] = splice.call(hedges, -1);
        this._validate_hedgerow(hedges);
        hedge_idx = -1;
        last_hedge_idx = hedges.length - 1;
        advance = false;
        is_terminal = false;
        R = true;
        while (true) {
          // element_mode    = false
          //.......................................................................................................
          hedge_idx++;
          if (hedge_idx > last_hedge_idx) {
            return R;
          }
          hedge = hedges[hedge_idx];
          is_terminal = (hedges[hedge_idx + 1] === 'or') || (hedge_idx === last_hedge_idx);
          //.....................................................................................................
          if (advance) {
            if (is_terminal) {
              return false;
            }
            if (hedge !== 'or') {
              continue;
            }
          }
          advance = false;
          //.....................................................................................................
          switch (hedge) {
            //...................................................................................................
            case 'of':
              // element_mode = true
              tail_hedges = hedges.slice(hedge_idx + 1);
              try {
                for (element of x) {
                  if ((this._isa(...tail_hedges, element)) === false) {
                    return false;
                  }
                }
              } catch (error1) {
                error = error1;
                if (!((error.name === 'TypeError') && (error.message === 'x is not iterable'))) {
                  throw error;
                }
                throw new E.Intertype_ETEMPTBD('^intertype.isa@7^', `\`of\` must be preceded by collection name, got ${rpr(hedges[hedge_idx - 1])}`);
              }
              return true;
            //...................................................................................................
            case 'or':
              R = true;
              continue;
          }
          //.....................................................................................................
          if ((type_cfg = GUY.props.get(this.registry, hedge, null)) == null) {
            throw new E.Intertype_ETEMPTBD('^intertype.isa@8^', `unknown hedge or type ${rpr(hedge)}`);
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
          throw new E.Intertype_internal_error('^intertype.isa@9^', `unexpected return value from hedgemethod for hedge ${rpr(hedge)}: ${rpr(R)}`);
        }
        //.......................................................................................................
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _protocol_isa({term, x, value, verdict}) {
        var src, test, type_cfg;
        if ((type_cfg = GUY.props.get(this.registry, term, null)) != null) {
          if ((test = GUY.props.get(type_cfg, 'test', null)) != null) {
            src = GUY.src.slug_from_simple_function({
              function: test,
              fallback: '???'
            });
          } else {
            src = null;
          }
        } else {
          src = null;
        }
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
        throw new E.Intertype_ETEMPTBD('^intertype.validate@10^', `not a valid ${qtype}: ${xr}`);
      }

      //---------------------------------------------------------------------------------------------------------
      _create(type, cfg) {
        var R, create, t, type_cfg;
        create = null;
        //.......................................................................................................
        if ((type_cfg = GUY.props.get(this.registry, type, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype.create@11^', `unknown type ${rpr(type)}`);
        }
        //.......................................................................................................
        /* Try to get `create` method, or, should that fail, the `default` value. Throw error when neither
           `create` nor `default` are given: */
        if ((create = GUY.props.get(type_cfg, 'create', null)) === null) {
          if ((R = GUY.props.get(type_cfg, 'default', H.signals.nothing)) === H.signals.nothing) {
            throw new E.Intertype_ETEMPTBD('^intertype.create@12^', `type ${rpr(type)} does not have a \`default\` value or a \`create()\` method`);
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
        throw new Error("^intertype._walk_hedgepaths@9^ not implemented");
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