(function() {
  'use strict';
  var DECLARATIONS, E, GUY, H, HEDGES, Intertype, Intertype_abc, Type_cfg, debug, help, rpr, to_width, urge, warn,
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

  ({to_width} = require('to-width'));

  //===========================================================================================================
  Intertype_abc = class Intertype_abc extends GUY.props.Strict_owner {};

  //===========================================================================================================
  Type_cfg = class Type_cfg extends Intertype_abc {
    //---------------------------------------------------------------------------------------------------------
    constructor(hub, cfg) {
      var k, self, v;
      /* TAINT ensure type_cfg does not contain `type`, `name` */
      /* TAINT do not use `tests.every()` when only 1 test given */
      super();
      GUY.props.hide(this, 'hub', hub);
      cfg = {...H.defaults.Type_cfg_constructor_cfg, ...cfg};
      H.types.validate.Type_cfg_constructor_cfg(cfg);
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
      if (cfg.test == null) {
        cfg.test = this._compile_object_as_test(hub, cfg);
      }
      if (!cfg.extras) {
        if (!H.types.isa.list(cfg.test)) {
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
          return H.equals(((function() {
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
      if (H.types.isa.list(cfg.test)) {
        if (cfg.test.length !== 1) {
          // fn_names  = ( f.name for f in cfg.test )
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
          test = H.nameit(cfg.name, (x) => {
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
          });
          return test;
        }
        test = cfg.test[0];
      }
      if (test == null) {
        test = cfg.test;
      }
      return H.nameit(cfg.name, (x) => {
        return test.call(hub, x);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_object_as_test(hub, cfg) {
      var R, field, key, test, type;
      type = cfg.name;
      R = [];
      for (key in cfg) {
        test = cfg[key];
        if (!key.startsWith('$')) {
          continue;
        }
        if (H.types.isa.function(test)) {
          R.push(test);
          continue;
        }
        field = key.slice(1);
        R.push(this._test_from_text(hub, type, field, test));
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _test_from_text(hub, type, field, property_chain) {
      var name;
      property_chain = property_chain.split('.');
      if (field === '') {
        name = `${type}:${property_chain.join(hub.cfg.sep)}`;
        return H.nameit(name, function(x) {
          return this._isa(...property_chain, x);
        });
      }
      name = `${type}.${field}:${property_chain.join(hub.cfg.sep)}`;
      return H.nameit(name, function(x) {
        return this._isa(...property_chain, x[name]);
      });
    }

  };

  Intertype = (function() {
    //===========================================================================================================
    class Intertype extends Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var declare_getter;
        super();
        //.......................................................................................................
        GUY.props.hide(this, 'cfg', {...H.defaults.Intertype_constructor_cfg, ...cfg});
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
            if (H.types.isa.function(cfg)) {
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
          oneshot: true
        }));
        // GUY.props.hide @, 'types',        H.types
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
              f = H.nameit(key, function(cfg = null) {
                return self[self.state.method](key, cfg);
              });
            } else {
              f = H.nameit(key, function(...P) {
                return self[self.state.method](...P);
              });
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
            f = H.nameit(key, function(x) {
              return self[self.state.method](...self.state.hedges, x);
            });
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
        type_cfg = new Type_cfg(this, type_cfg);
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
        urge('^4535^', GUY.trm.reverse({term, x, value, verdict}));
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
          R = GUY.lft.freeze(H.deep_copy(R));
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

  // cfg = { H.defaults.Intertype_walk_hedgepaths_cfg..., cfg..., }
  // yield from GUY.props.walk_tree @isa, cfg
  // return null

  //###########################################################################################################
  this.Intertype_abc = Intertype_abc;

  this.Type_cfg = Type_cfg;

  this.Intertype = Intertype;

}).call(this);

//# sourceMappingURL=main.js.map