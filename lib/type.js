(function() {
  'use strict';
  var DECLARATIONS, E, GUY, H, HEDGES, ITYP, debug, deep_copy, equals, help, nameit, rpr, to_width, types, urge, warn;

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

  nameit = function(name, f) {
    return Object.defineProperty(f, 'name', {
      value: name
    });
  };

  //===========================================================================================================
  this.Type = class Type extends Intertype_abc {
    //---------------------------------------------------------------------------------------------------------
    constructor(hub) {
      super();
      this.hub = hub;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    create_type_cfg(cfg) {
      var R, k, name, v;
      types.validate.Type_cfg_constructor_cfg_NG(cfg = {...ITYP.defaults.Type_cfg_constructor_cfg_NG, ...cfg});
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

}).call(this);

//# sourceMappingURL=type.js.map