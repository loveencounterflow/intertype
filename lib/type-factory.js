(function() {
  'use strict';
  var E, GUY, H, Type_factory, debug, help, rpr, urge, warn,
    indexOf = [].indexOf;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, warn, urge, help} = GUY.trm.get_loggers('INTERTYPE/TYPE_FACTORY'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  //===========================================================================================================
  Type_factory = class Type_factory extends H.Intertype_abc {
    //---------------------------------------------------------------------------------------------------------
    constructor(hub) {
      super();
      this.hub = hub;
      this.cfg = GUY.lft.freeze({
        rename: ['isa', '']
      });
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _validate_name(name) {
      if (H.types.isa.nonempty_text(name)) {
        return name;
      }
      throw new E.Intertype_ETEMPTBD('^tf@1^', `expected a nonempty text for new type name, got ${rpr(name)}`);
    }

    //---------------------------------------------------------------------------------------------------------
    _validate_dsc(dsc) {
      if (H.types.isa.object(dsc)) {
        return dsc;
      }
      if (H.types.isa.function(dsc)) {
        return {
          isa: dsc
        };
      }
      if (H.types.isa.nonempty_text(dsc)) {
        return {
          isa: dsc
        };
      }
      throw new E.Intertype_ETEMPTBD('^tf@2^', `expected an object, a function or a nonempty text for type description, got ${rpr(dsc)}`);
    }

    //---------------------------------------------------------------------------------------------------------
    _validate_isa(isa) {
      if (H.types.isa.function(isa)) {
        return isa;
      }
      if (H.types.isa.nonempty_text(isa)) {
        return isa;
      }
      throw new E.Intertype_ETEMPTBD('^tf@3^', `expected a function or a nonempty text for \`isa\`, got ${rpr(isa)}`);
    }

    //---------------------------------------------------------------------------------------------------------
    _normalize_type_cfg(...P) {
      var arity, dsc, dsc_name, isa/* short for type DeSCription */, name, name_of_isa, ref;
      name = null;
      dsc = {};
      isa = null;
      //.......................................................................................................
      switch (arity = P.length) {
        case 1:
          if (H.types.isa.text(P[0])) {
            dsc = {
              name: P[0]
            };
          } else {
            dsc = this._validate_dsc(P[0]);
          }
          break;
        case 2:
          name = this._validate_name(P[0]);
          dsc = this._validate_dsc(P[1]);
          break;
        case 3:
          name = this._validate_name(P[0]);
          dsc = this._validate_dsc(P[1]);
          isa = this._validate_isa(P[2]);
          break;
        default:
          throw new E.Intertype_ETEMPTBD('^tf@4^', `expected between 1 and 3 arguments, got ${arity}`);
      }
      //.......................................................................................................
      if (isa != null) {
        if (GUY.props.has(dsc, 'isa')) {
          throw new E.Intertype_ETEMPTBD('^tf@5^', "got two conflicting values for `isa`");
        }
        dsc.isa = isa;
      }
      //.......................................................................................................
      if ((name != null) && ((dsc_name = GUY.props.get(dsc, 'name', null)) != null) && (dsc_name !== name)) {
        throw new E.Intertype_ETEMPTBD('^tf@6^', `got two conflicting values for \`name\` (${rpr(name)} and ${rpr(dsc_name)})`);
      }
      if (dsc.name == null) {
        dsc.name = name;
      }
      dsc.typename = dsc.name;
      //.......................................................................................................
      this._assemble_fields(dsc);
      //.......................................................................................................
      if (dsc.isa != null) {
        if (H.types.isa.text(dsc.isa)) {
          dsc.isa = this._test_from_hedgepath(dsc.isa);
        }
        name_of_isa = (ref = dsc.isa.name, indexOf.call(this.cfg.rename, ref) >= 0) ? '#0' : dsc.isa.name;
        dsc.isa = H.nameit(`${dsc.name}:${name_of_isa}`, (() => {
          var f;
          f = dsc.isa.bind(this.hub);
          return (x) => {
            var R, hedgeresult;
            if (this.hub.state.isa_depth < 2) {
              this.hub.state.x = x;
            }
            if (H.TMP_HEDGRES_PRE) {
              this.hub.push_hedgeresult(hedgeresult = ['▲nt1', this.hub.state.isa_depth, dsc.name, x]);
            }
            R = (() => {
              var error;
              try {
                return f(x);
              } catch (error1) {
                error = error1;
                if (this.hub.cfg.errors === 'throw' || error instanceof E.Intertype_error) {
                  throw error;
                }
                this.hub.state.error = error;
              }
              return false;
            })();
            if (!H.TMP_HEDGRES_PRE) {
              this.hub.push_hedgeresult(hedgeresult = ['▲nt1', this.hub.state.isa_depth, dsc.name, x]);
            }
            hedgeresult.push(R);
            return R;
          };
        })());
      }
      //.......................................................................................................
      dsc = {...H.defaults.Type_factory_type_dsc, ...dsc};
      H.types.validate.Type_factory_type_dsc(dsc);
      //.......................................................................................................
      return dsc;
    }

    //---------------------------------------------------------------------------------------------------------
    _assemble_fields(dsc) {
      /* Re-assemble fields in `fields` property, delete `$`-prefixed keys */
      var field_dsc, fieldname, fields, hedges, key, name_of_isa, nkey, nr, ref, ref1, ref2, type;
      fields = (ref = dsc.fields) != null ? ref : null;
      for (key in dsc) {
        field_dsc = dsc[key];
        if (!key.startsWith('$')) {
          continue;
        }
        if (key === '$') {
          throw new E.Intertype_ETEMPTBD('^tf@7^', "found illegal key '$'");
        }
        nkey = key.slice(1);
        if (fields == null) {
          fields = {};
        }
        if (fields[key] != null) {
          throw new E.Intertype_ETEMPTBD('^tf@8^', `found duplicate key ${rpr(key)}`);
        }
        delete dsc[key];
        fields[nkey] = field_dsc;
      }
      //.......................................................................................................
      if (fields != null) {
        dsc.fields = fields;
        if (dsc.isa == null) {
          dsc.isa = 'object';
        }
      }
      //.......................................................................................................
      if (dsc.fields != null) {
        nr = 0;
        if (!H.types.isa.object(dsc.fields)) {
          throw new E.Intertype_ETEMPTBD('^tf@8^', `expected an object for \`field\` property, got a ${rpr(H.types.type_of(dsc.fields))}`);
        }
        ref1 = dsc.fields;
        for (fieldname in ref1) {
          field_dsc = ref1[fieldname];
          if ((H.types.type_of(field_dsc)) === 'text') {
            hedges = this.hub._split_hedgerow_text(field_dsc);
            field_dsc = ((fieldname, field_dsc, hedges) => {
              return H.nameit(field_dsc, function(x) {
                return this._isa(...hedges, x[fieldname]);
              });
            })(fieldname, field_dsc, hedges);
          }
          if ((type = H.types.type_of(field_dsc)) === 'function') {
            nr++;
            name_of_isa = (ref2 = field_dsc.name, indexOf.call(this.cfg.rename, ref2) >= 0) ? '#{nr}' : field_dsc.name;
            dsc.fields[fieldname] = H.nameit(`${dsc.name}.${fieldname}:${name_of_isa}`, field_dsc.bind(this.hub));
          } else {
            throw new E.Intertype_ETEMPTBD('^tf@8^', `expected a text or a function for field description, got a ${rpr(type)}`);
          }
        }
      }
      //.......................................................................................................
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    create_type(...P) {
      var R, dsc, k, name, v;
      dsc = this._normalize_type_cfg(...P);
      if (dsc.fields != null) {
        name = dsc.isa.name;
        R = (this._create_test_walker(dsc)).bind(dsc);
      } else {
        name = dsc.name;
        R = dsc.isa;
        dsc.isa = null;
      }
      for (k in dsc) {
        v = dsc[k];
        if (k !== 'name') {
          GUY.props.hide(R, k, v);
        }
      }
      H.nameit(name, R);
      R = GUY.props.Strict_owner.create({
        target: R,
        oneshot: true
      });
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _test_from_hedgepath(hedgepath) {
      var hedges;
      hedges = this.hub._split_hedgerow_text(hedgepath);
      hedges = hedgepath.split(this.hub.cfg.sep);
      return H.nameit(hedgepath, function(x) {
        return this._isa(...hedges, x);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _create_test_walker(dsc) {
      var has_extras, hub, test_for_extras;
      has_extras = null;
      hub = this.hub;
      if ((test_for_extras = !dsc.extras)) {
        has_extras = this._create_has_extras(dsc);
      }
      //.......................................................................................................
      return function(x) {
        var R;
        R = (() => {
          var _, f, hedgeresult, ref;
          if (H.TMP_HEDGRES_PRE) {
            //.....................................................................................................
            hub.push_hedgeresult(hedgeresult = ['▲tw1', hub.state.isa_depth, this.isa.name, x]);
          }
          hub.state.isa_depth++;
          R = this.isa(x);
          if (!H.TMP_HEDGRES_PRE) {
            hub.push_hedgeresult(hedgeresult = ['▲tw2', hub.state.isa_depth - 1, this.isa.name, x]);
          }
          hedgeresult.push(R);
          if ((R === false) || (R !== true)) {
            hub.state.isa_depth--;
            return R;
          }
          //.....................................................................................................
          if (test_for_extras) {
            if (has_extras(x)) {
              /* TAINT return value, recorded value should both be `false` */
              hub.push_hedgeresult(['▲tw3', hub.state.isa_depth, has_extras.name, x, true]);
              hub.state.isa_depth--;
              return false;
            }
          }
          ref = this.fields;
          //.....................................................................................................
          for (_ in ref) {
            f = ref[_];
            if (H.TMP_HEDGRES_PRE) {
              hub.push_hedgeresult(hedgeresult = ['▲tw4', hub.state.isa_depth, f.name, x]);
            }
            R = f(x);
            if (!H.TMP_HEDGRES_PRE) {
              hub.push_hedgeresult(hedgeresult = ['▲tw5', hub.state.isa_depth, f.name, x]);
            }
            hedgeresult.push(R);
            if ((R === false) || (R !== true)) {
              hub.state.isa_depth--;
              return R;
            }
          }
          //.....................................................................................................
          hub.state.isa_depth--;
          return true;
        })();
        return R;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    _create_has_extras(dsc) {
      var R, default_keys;
      default_keys = new Set(Object.keys(dsc.default));
      R = function(x) {
        var extra_keys, x_keys;
        x_keys = new Set(Object.keys(x));
        if ((extra_keys = GUY.sets.subtract(x_keys, default_keys)).size !== 0) {
          this.state.extra_keys = [...extra_keys];
          return true;
        }
        return false;
      };
      return H.nameit(`${dsc.name}:has_extras`, R.bind(this.hub));
    }

  };

  //###########################################################################################################
  this.Type_factory = Type_factory;

}).call(this);

//# sourceMappingURL=type-factory.js.map