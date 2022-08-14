(function() {
  'use strict';
  var DECLARATIONS, E, GUY, H, HEDGES, Intertype, Type_factory, debug, help, info, rpr, to_width, urge, warn,
    splice = [].splice;

  //###########################################################################################################
  GUY = require('guy');

  // GUY                       = require '../../guy'
  ({debug, info, warn, urge, help} = GUY.trm.get_loggers('INTERTYPE'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  HEDGES = require('./hedges');

  DECLARATIONS = require('./declarations');

  ({to_width} = require('to-width'));

  ({Type_factory} = require('./type-factory'));

  Intertype = (function() {
    //===========================================================================================================
    class Intertype extends H.Intertype_abc {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        super();
        GUY.props.hide(this, 'cfg', {...H.defaults.Intertype_constructor_cfg, ...cfg});
        H.types.validate.Intertype_constructor_cfg(this.cfg);
        //.......................................................................................................
        GUY.props.hide(this, '_hedges', new HEDGES.Intertype_hedges());
        GUY.props.hide(this, '_collections', new Set());
        GUY.props.hide(this, '_signals', H.signals);
        // GUY.props.hide @, 'isa',      new GUY.props.Strict_owner { reset: false, }
        GUY.props.hide(this, 'isa', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_isa')));
        GUY.props.hide(this, 'validate', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_validate')));
        GUY.props.hide(this, 'create', new Proxy({}, this._get_hedge_base_proxy_cfg(this, '_create')));
        GUY.props.hide(this, 'type_factory', new Type_factory(this));
        //.......................................................................................................
        /* TAINT squeezing this in here for the moment, pending reformulation of `isa` &c to make them callable: */
        GUY.props.hide(this, 'declare', new Proxy(this._declare.bind(this), {
          get: (_, name) => {
            return (...P) => {
              return this._declare(name, ...P);
            };
          }
        }));
        //.......................................................................................................
        GUY.props.hide(this, 'registry', GUY.props.Strict_owner.create({
          oneshot: true
        }));
        // GUY.props.hide @, 'types',        H.types
        this.state = {};
        this._initialize_state();
        //.......................................................................................................
        this._register_hedges();
        DECLARATIONS._provisional_declare_basic_types(this);
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _initialize_state(cfg) {
        /* TAINT should use deep copy of default object */
        return this.state = {
          ...H.defaults.Intertype_state,
          hedges2: [],
          hedgeresults: [],
          ...cfg
        };
      }

      //---------------------------------------------------------------------------------------------------------
      _register_hedges() {
        var hedge, isa, ref;
        ref = this._hedges._hedgemethods;
        for (hedge in ref) {
          isa = ref[hedge];
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
            self.state.hedges = [key];
            // self.state.hedgeresults = [ [ key, null, ], ]
            //...................................................................................................
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
            if ((R = GUY.props.get(target, key, H.signals.nothing)) !== H.signals.nothing) {
              // self.state.hedgeresults.push  [ key, null, ]
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
      _declare(...P) {
        /* TAINT handling of arguments here shimmed while we have not yet nailed down the exact calling
           convention for this method. */
        var dsc;
        dsc = this.type_factory.create_type(...P);
        this.registry[dsc.typename] = dsc;
        /* TAINT need not call _get_hedge_sub_proxy_cfg() twice? */
        this.isa[dsc.typename] = new Proxy(dsc, this._get_hedge_sub_proxy_cfg(this));
        this.validate[dsc.typename] = new Proxy(((x) => {
          return this._validate(dsc.typename, x);
        }), this._get_hedge_sub_proxy_cfg(this));
        if (dsc.collection) {
          this._collections.add(dsc.typename);
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
        var R, error, ref, x;
        ref = hedges, [...hedges] = ref, [x] = splice.call(hedges, -1);
        this.state.isa_depth++;
        R = false;
        try {
          R = this._inner_isa(...hedges, x);
        } catch (error1) {
          error = error1;
          if (this.cfg.errors === 'throw' || error instanceof E.Intertype_error) {
            throw error;
          }
          this.state.error = error;
        }
        this.state.isa_depth--;
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _inner_isa(...hedges) {
        var R, advance, element, error, hedge, hedge_idx, is_terminal, last_hedge_idx, ref, result, tail_hedges, type_dsc, x, xxx_push;
        ref = hedges, [...hedges] = ref, [x] = splice.call(hedges, -1);
        this.state.hedges2 = [...this.state.hedges2, ...hedges];
        debug('^34358579^', this.state.isa_depth, GUY.trm.reverse(hedges));
        // debug '^34358579^', @state
        xxx_push = (r) => {
          return r; // help '^23424^', hedge_idx, r, @state.hedgeresults, hedges; r # @state.hedgeresults[ hedge_idx ][ 1 ] = r; r
        };
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
            return xxx_push(R);
          }
          hedge = hedges[hedge_idx];
          // urge '^456^', hedge
          is_terminal = (hedges[hedge_idx + 1] === 'or') || (hedge_idx === last_hedge_idx);
          //.....................................................................................................
          if (advance) {
            if (is_terminal) {
              return xxx_push(false);
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
                  if ((this._inner_isa(...tail_hedges, element)) === false) {
                    return xxx_push(false);
                  }
                }
              } catch (error1) {
                error = error1;
                if (!((error.name === 'TypeError') && (error.message === 'x is not iterable'))) {
                  throw error;
                }
                throw new E.Intertype_ETEMPTBD('^intertype.isa@7^', `\`of\` must be preceded by collection name, got ${rpr(hedges[hedge_idx - 1])}`);
              }
              return xxx_push(true);
            //...................................................................................................
            case 'or':
              xxx_push(R = true);
              continue;
          }
          //.....................................................................................................
          if ((type_dsc = GUY.props.get(this.registry, hedge, null)) == null) {
            throw new E.Intertype_ETEMPTBD('^intertype.isa@8^', `unknown hedge or type ${rpr(hedge)}`);
          }
          //.....................................................................................................
          result = type_dsc.call(this, x);
          this.state.hedgeresults.push([this.state.isa_depth, type_dsc.name, x, result]);
          switch (result) {
            case H.signals.return_true:
              return xxx_push(true);
            // return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: true, }
            // when H.signals.advance                then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
            // when H.signals.process_list_elements  then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
            // when H.signals.process_set_elements   then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
            case false:
              xxx_push(false);
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
              xxx_push(true);
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
        return xxx_push(R);
      }

      //---------------------------------------------------------------------------------------------------------
      _protocol_isa({term, x, value, verdict}) {
        // urge '^4535^', GUY.trm.reverse { term, x, value, verdict, }
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
        if (type_dsc.freeze === true) {
          R = Object.freeze(R);
        } else if (type_dsc.freeze === 'deep') {
          R = GUY.lft.freeze(H.deep_copy(R));
        }
        //.......................................................................................................
        return this._validate(type, R);
      }

      _normalize_type(type) {
        return type.toLowerCase().replace(/\s+/g, '');
      }

      _split_hedgerow_text(hedgerow) {
        return hedgerow.split(this.cfg.sep);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Intertype.prototype.equals = H.equals;

    Intertype.prototype.type_of = H.type_of;

    Intertype.prototype.size_of = H.size_of;

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

}).call(this);

//# sourceMappingURL=main.js.map