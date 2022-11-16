(function() {
  'use strict';
  var DECLARATIONS, E, GUY, H, HEDGES, Intertype, Type_factory, debug, help, info, rpr, to_width, urge, warn,
    splice = [].splice,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, warn, urge, help} = GUY.trm.get_loggers('INTERTYPE'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  HEDGES = require('./hedges');

  DECLARATIONS = require('./declarations');

  ({Type_factory} = require('./type-factory'));

  ({to_width} = require('to-width'));

  Intertype = (function() {
    //===========================================================================================================
    class Intertype extends H.Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var clone, dsc, other, ref1, type;
        super();
        this.type_of = this.type_of.bind(this);
        this.data = {};
        //.......................................................................................................
        clone = false;
        if (cfg instanceof this.constructor) {
          clone = true;
          [cfg, other] = [{...cfg.cfg}, cfg];
        }
        GUY.props.hide(this, 'cfg', {...H.defaults.Intertype_constructor_cfg, ...cfg});
        H.types.validate.Intertype_constructor_cfg(this.cfg);
        //.......................................................................................................
        GUY.props.hide(this, '_hedges', new HEDGES.Intertype_hedges());
        GUY.props.hide(this, '_collections', new Set());
        GUY.props.hide(this, '_signals', H.signals);
        // GUY.props.hide @, 'isa',      new GUY.props.Strict_owner { reset: false, }
        GUY.props.hide(this, 'isa', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_isa')));
        GUY.props.hide(this, 'cast', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_cast')));
        GUY.props.hide(this, 'validate', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_validate')));
        GUY.props.hide(this, 'create', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_create')));
        GUY.props.hide(this, 'type_factory', new Type_factory(this));
        GUY.props.hide(this, 'overrides', []);
        //.......................................................................................................
        /* TAINT squeezing this in here for the moment, pending reformulation of `isa` &c to make them callable: */
        GUY.props.hide(this, 'declare', new Proxy(this._declare.bind(this), {
          get: (_, name) => {
            return (...P) => {
              return this._declare(name, ...P);
            };
          }
        }));
        GUY.props.hide(this, 'remove', new Proxy(this._remove.bind(this), {
          get: (_, name) => {
            return (...P) => {
              return this._remove(name, ...P);
            };
          }
        }));
        //.......................................................................................................
        GUY.props.hide(this, 'registry', GUY.props.Strict_owner.create());
        // GUY.props.hide @, 'types',        H.types
        this._initialize_state();
        //.......................................................................................................
        this._register_hedges();
        //.......................................................................................................
        if (clone) {
          ref1 = other.registry;
          for (type in ref1) {
            dsc = ref1[type];
            if (GUY.props.has(this.registry, type)) {
              continue;
            }
            /* TAINT this is a kludge */
            this.declare[type]({
              isa: dsc,
              name: GUY.props.get(dsc, 'name', H.defaults.Type_factory_type_dsc.name),
              typename: GUY.props.get(dsc, 'typename', H.defaults.Type_factory_type_dsc.typename),
              fields: GUY.props.get(dsc, 'fields', H.defaults.Type_factory_type_dsc.fields),
              collection: GUY.props.get(dsc, 'collection', H.defaults.Type_factory_type_dsc.collection),
              create: GUY.props.get(dsc, 'create', H.defaults.Type_factory_type_dsc.create),
              freeze: GUY.props.get(dsc, 'freeze', H.defaults.Type_factory_type_dsc.freeze),
              extras: GUY.props.get(dsc, 'extras', H.defaults.Type_factory_type_dsc.extras),
              default: GUY.props.get(dsc, 'default', H.defaults.Type_factory_type_dsc.default),
              override: GUY.props.get(dsc, 'override', H.defaults.Type_factory_type_dsc.override)
            });
          }
        } else {
          DECLARATIONS._provisional_declare_basic_types(this);
        }
        //.......................................................................................................
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _initialize_state(cfg) {
        /* TAINT should use deep copy of default object */
        return this.state = {
          ...H.defaults.Intertype_state,
          hedgeresults: [],
          ...cfg
        };
      }

      //---------------------------------------------------------------------------------------------------------
      _register_hedges() {
        var hedge, isa, ref1;
        ref1 = this._hedges._hedgemethods;
        for (hedge in ref1) {
          isa = ref1[hedge];
          ((hedge, isa) => {
            return this.declare(hedge, {isa});
          })(hedge, isa);
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
            //...................................................................................................
            self._initialize_state();
            self.state.method = method_name;
            self.state.verb = method_name.slice(1);
            self.state.hedges = [key];
            self.state.hedgerow = key;
            //...................................................................................................
            if (key === 'of' || key === 'or') {
              throw new E.Intertype_ETEMPTBD('^intertype.base_proxy@2^', `hedgerow cannot start with \`${key}\`, must be preceeded by hedge`);
            }
            if ((GUY.props.get(this.registry, key, null)) == null) {
              throw new E.Intertype_ETEMPTBD('^intertype.base_proxy@3^', `unknown hedge or type ${rpr(key)}`);
            }
            if ((R = GUY.props.get(target, key, H.signals.nothing)) !== H.signals.nothing) {
              //...................................................................................................
              return R;
            }
            //...................................................................................................
            /* TAINT code below never used? */
            if (method_name === '_create') {
              f = H.nameit(key, function(cfg = null) {
                return self[self.state.method](key, cfg);
              });
            } else if (method_name === '_cast') {
              f = H.nameit(key, function(...P) {
                return self[self.state.method](key, ...P);
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
            var R, f, type_dsc;
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
            self.state.hedgerow = self.state.hedges.join(self.cfg.sep);
            if ((R = GUY.props.get(target, key, H.signals.nothing)) !== H.signals.nothing) {
              return R;
            }
            //...................................................................................................
            if ((type_dsc = GUY.props.get(this.registry, key, null)) == null) {
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
      _remove(typename) {
        var dsc;
        if ((dsc = GUY.props.get(this.registry, typename, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype.remove@5^', `unable to remove unknown type ${rpr(typename)}`);
        }
        delete this.registry[typename];
        if (dsc.override) {
          this._remove_override(dsc);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _declare(...P) {
        /* TAINT handling of arguments here shimmed while we have not yet nailed down the exact calling
           convention for this method. */
        var dsc, dscv, old_dsc;
        dsc = this.type_factory.create_type(...P);
        //.......................................................................................................
        if ((old_dsc = GUY.props.get(this.registry, dsc.typename, null)) != null) {
          if (!dsc.replace) {
            throw new E.Intertype_ETEMPTBD('^intertype.declare@5^', `unable to re-declare ${rpr(dsc.typename)} (set \`replace: true\` to allow this)`);
          }
        }
        //.......................................................................................................
        this.registry[dsc.typename] = dsc;
        /* TAINT need not call _get_hedge_sub_proxy_cfg() twice? */
        this.isa[dsc.typename] = new Proxy(dsc, this._get_hedge_sub_proxy_cfg(this));
        dscv = H.nameit(dsc.typename, (x) => {
          return this._validate(dsc.typename, x);
        });
        this.validate[dsc.typename] = new Proxy(dscv, this._get_hedge_sub_proxy_cfg(this));
        if (dsc.collection) {
          this._collections.add(dsc.typename);
        }
        if (old_dsc != null ? old_dsc.override : void 0) {
          if (dsc.override) {
            this._replace_override(dsc);
          } else {
            this._remove_override(dsc);
          }
        } else {
          if (dsc.override) {
            this._add_override(dsc);
          }
        }
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _add_override(dsc) {
        this.overrides.unshift([dsc.typename, dsc]);
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _remove_override(dsc) {
        var i, idx, ref1;
        for (idx = i = ref1 = this.overrides.length - 1; i >= 0; idx = i += -1) {
          if (this.overrides[idx][0] !== dsc.typename) {
            continue;
          }
          this.overrides.splice(idx, 1);
          break;
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _replace_override(dsc) {
        var i, idx, ref1;
        for (idx = i = ref1 = this.overrides.length - 1; i >= 0; idx = i += -1) {
          if (this.overrides[idx][0] !== dsc.typename) {
            continue;
          }
          this.overrides[idx][1] = dsc;
          break;
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _validate_hedgerow(hedgerow) {
        var ref1, ref2, xr;
        if (((ref1 = hedgerow[0]) === 'of' || ref1 === 'or') || ((ref2 = hedgerow[hedgerow.length - 1]) === 'of' || ref2 === 'or')) {
          xr = rpr(hedgerow.join(this.cfg.sep));
          throw new E.Intertype_ETEMPTBD('^intertype.validate_hedgerow@6^', `hedgerow cannot begin or end with \`of\` or \`or\`, must be surrounded by hedges, got ${xr}`);
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _isa(...hedges) {
        var R, error, ref1, x;
        ref1 = hedges, [...hedges] = ref1, [x] = splice.call(hedges, -1);
        this.state.isa_depth++;
        R = false;
        try {
          R = this.state.result = this._inner_isa(...hedges, x);
        } catch (error1) {
          error = error1;
          if (this.cfg.errors || error instanceof E.Intertype_error) {
            throw error;
          }
          this.state.error = error;
        }
        this.state.isa_depth--;
        return this.state.result = R;
      }

      //---------------------------------------------------------------------------------------------------------
      _inner_isa(...hedges) {
        var R, advance, element, error, hedge, hedge_idx, is_terminal, last_hedge_idx, ref1, result, tail_hedges, type_dsc, x;
        ref1 = hedges, [...hedges] = ref1, [x] = splice.call(hedges, -1);
        this._validate_hedgerow(hedges);
        hedge_idx = -1;
        last_hedge_idx = hedges.length - 1;
        advance = false;
        is_terminal = false;
        R = true;
        while (true) {
          //.......................................................................................................
          hedge_idx++;
          if (hedge_idx > last_hedge_idx) {
            return R; // exit point
          }
          hedge = hedges[hedge_idx];
          is_terminal = (hedges[hedge_idx + 1] === 'or') || (hedge_idx === last_hedge_idx);
          //.....................................................................................................
          if (advance) {
            if (is_terminal) { // exit point
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
              this.push_hedgeresult(['▲ii1', this.state.isa_depth, 'of', x, true]);
              tail_hedges = hedges.slice(hedge_idx + 1);
              try {
                for (element of x) {
                  if ((this._isa(...tail_hedges, element)) === false) { // exit point
                    // return ( false ) if ( @_inner_isa tail_hedges..., element ) is false  # exit point
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
              return true; // exit point
            //...................................................................................................
            case 'or':
              this.push_hedgeresult(['▲ii2', this.state.isa_depth, 'or', x, true]);
              R = true;
              continue;
          }
          //.....................................................................................................
          if ((type_dsc = GUY.props.get(this.registry, hedge, null)) == null) {
            throw new E.Intertype_ETEMPTBD('^intertype.isa@8^', `unknown hedge or type ${rpr(hedge)}`);
          }
          //.....................................................................................................
          // @push_hedgeresult hedgeresult = [ '▲ii3', @state.isa_depth, type_dsc.name, x, ]
          result = type_dsc.call(this, x);
          // hedgeresult.push result
          switch (result) {
            case H.signals.return_true:
              return true;
            case false:
              advance = true;
              R = false;
              continue;
            case true:
              if (is_terminal) {
                return true;
              }
              continue;
          }
          //.....................................................................................................
          throw new E.Intertype_internal_error('^intertype.isa@9^', `unexpected return value from hedgemethod for hedge ${rpr(hedge)}: ${rpr(result)}`);
        }
        //.......................................................................................................
        return R; // exit point
      }

      
        //---------------------------------------------------------------------------------------------------------
      _validate(...hedges) {
        var ref1, state_report, x;
        ref1 = hedges, [...hedges] = ref1, [x] = splice.call(hedges, -1);
        if (this._isa(...hedges, x)) {
          return x;
        }
        state_report = this.get_state_report({
          format: 'short',
          colors: false,
          width: 500
        });
        state_report += '\n';
        state_report += GUY.trm.reverse(GUY.trm.red("\n Validation Failure "));
        state_report += '\n';
        state_report += (this.get_state_report({
          format: 'failing'
        })).trim();
        state_report += '\n';
        state_report += GUY.trm.reverse(GUY.trm.red(" Validation Failure \n"));
        throw new E.Intertype_validation_error('^intertype.validate@3^', this.state, state_report);
      }

      //---------------------------------------------------------------------------------------------------------
      _create(type, cfg) {
        var R, create, t, type_dsc;
        create = null;
        //.......................................................................................................
        if ((type_dsc = GUY.props.get(this.registry, type, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype.create@11^', `unknown type ${rpr(type)}`);
        }
        //.......................................................................................................
        /* Try to get `create` method, or, should that fail, the `default` value. Throw error when neither
           `create` nor `default` are given: */
        if ((create = GUY.props.get(type_dsc, 'create', null)) === null) {
          if ((R = GUY.props.get(type_dsc, 'default', H.signals.nothing)) === H.signals.nothing) {
            throw new E.Intertype_ETEMPTBD('^intertype.create@12^', `type ${rpr(type)} does not have a \`default\` value or a \`create()\` method`);
          }
        } else {
          /* If `create` is given, call it to obtain default value: */
          //.......................................................................................................
          R = create.call(this, cfg);
        }
        //.......................................................................................................
        if (create == null) {
          if (cfg != null) {
            if ((t = H.js_type_of(R)) === '[object Object]' || t === '[object Array]') {
              R = Object.assign(H.deep_copy(R), cfg);
            } else {
              R = cfg;
            }
          } else {
            R = H.deep_copy(R);
          }
        }
        //.......................................................................................................
        if (type_dsc.freeze === true) {
          R = Object.freeze(R);
        } else if (type_dsc.freeze === 'deep') {
          R = GUY.lft.freeze(H.deep_copy(R));
        }
        //.......................................................................................................
        return this._validate(type, R);
      }

      //---------------------------------------------------------------------------------------------------------
      _cast(type, ...P) {
        var cast, type_dsc;
        cast = null;
        //.......................................................................................................
        if ((type_dsc = GUY.props.get(this.registry, type, null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype.cast@11^', `unknown type ${rpr(type)}`);
        }
        if ((cast = GUY.props.get(type_dsc, 'cast', null)) == null) {
          throw new E.Intertype_ETEMPTBD('^intertype.cast@11^', `type ${rpr(type)} does not have a \`cast\` method`);
        }
        //.......................................................................................................
        /* NOTE we *could* call `create`, `validate`, but should we? */
        // return ( @create[ type ] cast.call @, P... ) if GUY.props.has type.dsc, 'create'
        return this.validate[type](cast.call(this, ...P));
      }

      type_of(x) {
        boundMethodCheck(this, Intertype);
        return H.type_of(x, this.overrides);
      }

      _split_hedgerow_text(hedgerow) {
        return hedgerow.split(this.cfg.sep);
      }

      //---------------------------------------------------------------------------------------------------------
      get_state_report(cfg) {
        return H.get_state_report(this, cfg);
      }

      //---------------------------------------------------------------------------------------------------------
      push_hedgeresult(hedgeresult) {
        /* [ ref, level, hedge, value, r, ] = hedgeresult */
        var hedge, level, r, ref, value;
        [ref, level, hedge, value, r] = hedgeresult;
        H.types.validate.nonempty_text(ref);
        // H.types.validate.cardinal       level
        H.types.validate.nonempty_text(hedge);
        // H.types.validate.boolean        r
        this.state.hedgeresults.push(hedgeresult);
        return hedgeresult.at(-1);
      }

    };

    // return cast.call @, P...

    //---------------------------------------------------------------------------------------------------------
    Intertype.prototype.equals = H.equals;

    Intertype.prototype.deep_copy = H.deep_copy;

    Intertype.prototype.size_of = H.size_of.bind(H);

    Intertype.prototype._normalize_type = H._normalize_type.bind(H);

    return Intertype;

  }).call(this);

  // #-----------------------------------------------------------------------------------------------------------
  // _walk_hedgepaths: ( cfg ) ->
  //   throw new Error "^intertype._walk_hedgepaths@9^ not implemented"
  //   # cfg = { H.defaults.Intertype_walk_hedgepaths_cfg..., cfg..., }
  //   # yield from GUY.props.walk_tree @isa, cfg
  //   # return null

  //###########################################################################################################
  this.Type_factory = Type_factory;

  this.Intertype = Intertype;

  this.Intertype_user_error = E.Intertype_user_error;

  this.equals = H.equals;

  this.deep_copy = H.deep_copy;

}).call(this);

//# sourceMappingURL=main.js.map