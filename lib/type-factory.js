(function() {
  'use strict';
  var E, GUY, H, Type_factory, debug, help, rpr, urge, warn;

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
      var arity, dsc, fields, isa/* short for type DeSCription */, key, name, nkey, ref, value;
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
      fields = (ref = dsc.fields) != null ? ref : null;
      for (key in dsc) {
        value = dsc[key];
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
        fields[nkey] = value;
      }
      //.......................................................................................................
      if (fields != null) {
        dsc.fields = fields;
        if (dsc.isa == null) {
          dsc.isa = 'object';
        }
      }
      dsc = {...H.defaults.Type_factory_type_dsc, ...dsc};
      H.types.validate.Type_factory_type_dsc(dsc);
      //.......................................................................................................
      return dsc;
    }

    //---------------------------------------------------------------------------------------------------------
    create_type(name, isa) {
      var R/* TAINT move this to normalization */, icfg, k, v;
      icfg = this._normalize_type_cfg;
      //.......................................................................................................
      if (cfg.tests == null) {
        cfg.tests = [];
      }
      R = R.bind(this);
// when not GUY.props.has R, k
      for (k in cfg) {
        v = cfg[k];
        /* NOTE `hide()` uses `Object.defineProperty()`, so takes care of `name`: */
        GUY.props.hide(R, k, v);
      }
      R = new GUY.props.Strict_owner({
        target: R,
        oneshot: true
      });
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    _create_test_walker(name, tests) {
      return H.nameit(name, (x) => {
        var R, f, i, len;
        for (i = 0, len = tests.length; i < len; i++) {
          f = tests[i];
          if ((R = f(x)) === false) {
            return false;
          }
          if (R !== true) {
            return R;
          }
        }
        return true;
      });
    }

  };

  //###########################################################################################################
  this.Type_factory = Type_factory;

}).call(this);

//# sourceMappingURL=type-factory.js.map