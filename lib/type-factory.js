(function() {
  'use strict';
  var E, GUY, H, Type_factory, debug, help, rpr, urge, warn,
    indexOf = [].indexOf;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, warn, urge, help} = GUY.trm.get_loggers('INTERTYPE'));

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
      var arity, dsc, isa/* short for type DeSCription */, name, name_of_isa, ref;
      name = null;
      dsc = {};
      isa = null;
      //.......................................................................................................
      switch (arity = P.length) {
        case 1:
          if (H.types.isa.text(P[0])) {
            name = this._validate_name(P[0]);
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
      if (name != null) {
        if (GUY.props.has(dsc, 'name')) {
          throw new E.Intertype_ETEMPTBD('^tf@6^', "got two conflicting values for `name`");
        }
        dsc.name = name;
      }
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
            var error;
            try {
              f(x);
            } catch (error1) {
              error = error1;
              if (this.hub.cfg.errors === 'throw' || error instanceof E.Intertype_error) {
                throw error;
              }
              this.hub.state.error = error;
            }
            return false;
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
      var field_dsc, fieldname, fields, key, name_of_isa, nkey, nr, ref, ref1, ref2, type;
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
            field_dsc = ((fieldname, field_dsc) => {
              // H.nameit field_dsc, ( x ) -> @_isa field_dsc, GUY.props.get x, fieldname, undefined
              return H.nameit(field_dsc, function(x) {
                return this._isa(field_dsc, x[fieldname]);
              });
            })(fieldname, field_dsc);
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
      var R, dsc, k, v;
      dsc = this._normalize_type_cfg(...P);
      if (dsc.fields != null) {
        R = H.nameit(dsc.isa.name, this._create_test_walker().bind(dsc));
      } else {
        R = dsc.isa;
        dsc.isa = null;
        for (k in dsc) {
          v = dsc[k];
          GUY.props.hide(R, k, v);
        }
        H.nameit(dsc.name, R);
      }
      return new GUY.props.Strict_owner({
        target: R,
        oneshot: true
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _test_from_hedgepath(hedgepath) {
      var hedges;
      hedges = hedgepath.split(this.hub.cfg.sep);
      return H.nameit(hedgepath, function(x) {
        return this._isa(...hedges, x);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    _create_test_walker() {
      return function(x) {
        var R, _, f, ref;
        if ((R = this.isa(x)) === false) {
          // try
          //   ### TAINT use `@isa()` or `@_isa()` ? ###
          return false;
        }
        if (R !== true) {
          return R;
        }
        ref = this.fields;
        for (_ in ref) {
          f = ref[_];
          if ((R = f(x)) === false) {
            return false;
          }
          if (R !== true) {
            return R;
          }
        }
        return true;
      };
    }

  };

  // catch error
  //   throw error if @hub.cfg.errors is 'throw' or error instanceof E.Intertype_error
  //   @hub.state.error = error
  // return false

  //###########################################################################################################
  this.Type_factory = Type_factory;

}).call(this);

//# sourceMappingURL=type-factory.js.map