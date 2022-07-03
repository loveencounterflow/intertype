(function() {
  'use strict';
  var E, GUY, LOUPE, inspect, misfit, rpr,
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

  misfit = Symbol('misfit');

  E = require('./errors');

  /*
  _normalize_type =            ( type ) -> type.toLowerCase().replace /\s+/g, ''
  js_type_of               = ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
  */
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
  this.size_of = function(x, fallback = misfit) {
    var R, error;
    if (x == null) {
      if (fallback !== misfit) {
        return fallback;
      }
    } else {
      try {
        if ((R = x.length) != null) {
          return R;
        }
      } catch (error1) {
        error = error1;
        null;
      }
      try {
        if ((R = x.size) != null) {
          return R;
        }
      } catch (error1) {
        error = error1;
        null;
      }
      if (fallback !== misfit) {
        return fallback;
      }
    }
    throw new E.Intertype_ETEMPTBD('^intertype.size_of@1^', `expected an object with \`x.length\` or \`x.size\`, got a ${this.type_of(x)}`);
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

  //-----------------------------------------------------------------------------------------------------------
  this.type_of = function(x) {
    var R, arity, c, tagname;
    if ((arity = arguments.length) !== 1) {
      throw new Error(`^7746^ expected 1 argument, got ${arity}`);
    }
    if (x === null) {
      return 'null';
    }
    if (x === void 0) {
      return 'undefined';
    }
    if ((x === 2e308) || (x === -2e308)) {
      return 'infinity';
    }
    if ((x === true) || (x === false)) {
      return 'boolean';
    }
    if (Number.isNaN(x)) {
      return 'nan';
    }
    if (Number.isFinite(x)) {
      return 'float';
    }
    if (Buffer.isBuffer(x)) {
      return 'buffer';
    }
    if (Array.isArray(x)) {
      return 'list';
    }
    //.........................................................................................................
    /* TAINT Not needed (?) b/c `@js_type_of x` does work with these values, too */
    /* this catches `Array Iterator`, `String Iterator`, `Map Iterator`, `Set Iterator`: */
    if (((tagname = x[Symbol.toStringTag]) != null) && (typeof tagname) === 'string') {
      return this._normalize_type(tagname);
    }
    if ((c = x.constructor) === void 0) {
      //.........................................................................................................
      /* Domenic Denicola Device, see https://stackoverflow.com/a/30560581 */
      return 'nullobject';
    }
    if ((typeof c) !== 'function') {
      return 'object';
    }
    if ((R = c.name.toLowerCase()) === '') {
      if (x.constructor === this.constructor_of_generators) {
        return 'generator';
      }
      /* NOTE: throw error since this should never happen */
      return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase();
    }
    if ((typeof x === 'object') && (R === 'boolean' || R === 'number' || R === 'string')) {
//.........................................................................................................
/* Mark Miller Device */      return 'wrapper';
    }
    if (R === 'regexp') {
      return 'regex';
    }
    if (R === 'string') {
      return 'text';
    }
    if (R === 'function' && x.toString().startsWith('class ')) {
      /* thx to https://stackoverflow.com/a/29094209 */
      /* TAINT may produce an arbitrarily long throwaway string */
      return 'class';
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.constructor_of_generators = ((function*() {
    return (yield 42);
  })()).constructor;

}).call(this);

//# sourceMappingURL=helpers.js.map