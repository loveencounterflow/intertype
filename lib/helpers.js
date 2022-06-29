(function() {
  'use strict';
  var GUY, LOUPE, inspect, rpr,
    indexOf = [].indexOf;

  //-----------------------------------------------------------------------------------------------------------
  ({inspect} = require('util'));

  this.assign = Object.assign;

  // @jr           = JSON.stringify
  LOUPE = require('../deps/loupe.js');

  this.rpr = rpr = (x) => {
    return LOUPE.inspect(x, {
      customInspect: false
    });
  };

  this.xrpr = function(x) {
    return (rpr(x)).slice(0, 1025);
  };

  GUY = require('guy');

  //===========================================================================================================
  // TYPE_OF FLAVORS
  //-----------------------------------------------------------------------------------------------------------
  this.domenic_denicola_device = (x) => {
    var ref, ref1;
    return (ref = x != null ? (ref1 = x.constructor) != null ? ref1.name : void 0 : void 0) != null ? ref : './.';
  };

  this.mark_miller_device = (x) => {
    return (Object.prototype.toString.call(x)).slice(8, -1);
  };

  this.mark_miller_device_2 = (x) => {
    return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase().replace(/\s+/g, '');
  };

  this.js_type_of = (x) => {
    return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase().replace(/\s+/g, '');
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.get_rprs_of_tprs = function(tprs) {
    /* `tprs: test parameters, i.e. additional arguments to type tester, as in `multiple_of x, 4` */
    var rpr_of_tprs, srpr_of_tprs;
    rpr_of_tprs = (function() {
      switch (tprs.length) {
        case 0:
          return '';
        case 1:
          return `${rpr(tprs[0])}`;
        default:
          return `${rpr(tprs)}`;
      }
    })();
    srpr_of_tprs = (function() {
      switch (rpr_of_tprs.length) {
        case 0:
          return '';
        default:
          return ' ' + rpr_of_tprs;
      }
    })();
    return {rpr_of_tprs, srpr_of_tprs};
  };

  //-----------------------------------------------------------------------------------------------------------
  this.intersection_of = function(a, b) {
    var x;
    a = [...a].sort();
    b = [...b].sort();
    return ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = a.length; i < len; i++) {
        x = a[i];
        if (indexOf.call(b, x) >= 0) {
          results.push(x);
        }
      }
      return results;
    })()).sort();
  };

  //---------------------------------------------------------------------------------------------------------
  this.size_of = function(x) {
    var R;
    if (x instanceof GUY.props.Strict_owner) {
      if ((x.has('length')) && ((R = x.length) != null)) {
        return R;
      }
      if ((x.has('size')) && ((R = x.size) != null)) {
        return R;
      }
    } else {
      if ((R = x.length) != null) {
        return R;
      }
      if ((R = x.size) != null) {
        return R;
      }
    }
    return (Object.keys(x)).length;
  };

  // #---------------------------------------------------------------------------------------------------------
  // _is_empty:    ( type_cfg, x ) -> ( @_size_of type_cfg, x ) is 0
  // _is_nonempty: ( type_cfg, x ) -> ( @_size_of type_cfg, x ) > 0

  //---------------------------------------------------------------------------------------------------------
  this.signals = GUY.lft.freeze(new GUY.props.Strict_owner({
    target: {
      true_and_break: Symbol('true_and_break'),
      false_and_break: Symbol('false_and_break'),
      process_list_elements: Symbol('process_list_elements'),
      process_set_elements: Symbol('process_set_elements')
    }
  }));

}).call(this);

//# sourceMappingURL=helpers.js.map