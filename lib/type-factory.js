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
    create_type_cfg(cfg) {
      var R, k, name, v;
      H.types.validate.Type_cfg_constructor_cfg_NG(cfg = {...H.defaults.Type_cfg_constructor_cfg_NG, ...cfg});
      name = cfg.name;
      R = (function(x) {
        return x ** 2;
      }).bind(this);
      for (k in cfg) {
        v = cfg[k];
        GUY.props.hide(R, k, v);
      }
      GUY.props.hide(R, 'name', name);
      R = new GUY.props.Strict_owner({
        target: R,
        freeze: true
      });
      return R;
    }

  };

  //###########################################################################################################
  this.Type_factory = Type_factory;

}).call(this);

//# sourceMappingURL=type-factory.js.map