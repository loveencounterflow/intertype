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
    create_type(cfg) {
      var test;
      /* noramlization of `cfg`, i.e. reducing the different allowed shapes to a single one */
      H.types.validate.Type_cfg_constructor_cfg_NG(cfg = {...H.defaults.Type_cfg_constructor_cfg_NG, ...cfg});
      test = (GUY.props.pluck_with_fallback(cfg, null, 'test')).test;
      return this._create_type(test, cfg);
    }

    //---------------------------------------------------------------------------------------------------------
    _create_type(test, cfg) {
      var R, k, v;
      if (test != null) {
        cfg.tests = [];
      } else {
        test = this._create_test_walker(cfg.name, cfg.tests);
      }
      //.......................................................................................................
      R = test.bind(this);
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