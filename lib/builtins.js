(function() {
  'use strict';
  var declaration_$kinds, isa, primitive_types, type_of,
    indexOf = [].indexOf;

  //-----------------------------------------------------------------------------------------------------------
  primitive_types = Object.freeze(['null', 'undefined', 'infinity', 'boolean', 'nan', 'float', 'anyfloat', 'text']);

  // declaration_$kinds  = Object.freeze [ '$independent', '$dependent', '$enumeration', '$record', '$variant', ]
  declaration_$kinds = Object.freeze(['$unspecified', '$enumeration', '$record', '$variant']);

  //-----------------------------------------------------------------------------------------------------------
  isa = {
    text: function(x) {
      return typeof x === 'string';
    },
    nonempty_text: function(x) {
      return (typeof x === 'string') && (x.length > 0);
    },
    function: function(x) {
      return (Object.prototype.toString.call(x)) === '[object Function]';
    },
    pod: function(x) {
      var ref;
      return (x != null) && ((ref = x.constructor) === Object || ref === (void 0));
    },
    list: function(x) {
      return Array.isArray(x);
    },
    primitive: function(x) {
      return primitive_types.includes(type_of(x));
    },
    object: function(x) {
      return (x != null) && x instanceof Object;
    },
    type: function(x) {
      return x instanceof Type;
    },
    typespace: function(x) {
      return x instanceof Typespace;
    },
    intertype: function(x) {
      return x instanceof Intertype;
    },
    declaration_$kind: function(x) {
      return indexOf.call(declaration_$kinds, x) >= 0;
    }
  };

  // nan:                    ( x ) => Number.isNaN         x

  //-----------------------------------------------------------------------------------------------------------
  type_of = function(x) {
    /* TAINT consider to return x.constructor.name */
    var jstypeof, millertype;
    if (x === null) {
      //.........................................................................................................
      /* Primitives: */
      return 'null';
    }
    if (x === void 0) {
      return 'undefined';
    }
    if ((x === +2e308) || (x === -2e308)) {
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
    // return 'pod'          if B.isa.pod x
    //.........................................................................................................
    switch (jstypeof = typeof x) {
      case 'string':
        return 'text';
    }
    if (Array.isArray(x)) {
      //.........................................................................................................
      return 'list';
    }
    millertype = Object.prototype.toString.call(x);
    return (millertype.replace(/^\[object ([^\]]+)\]$/, '$1')).toLowerCase();
  };

  // switch millertype = Object::toString.call x
  //   when '[object Function]'            then return 'function'
  //   when '[object AsyncFunction]'       then return 'asyncfunction'
  //   when '[object GeneratorFunction]'   then return 'generatorfunction'

  //===========================================================================================================
  module.exports = {isa, type_of, primitive_types, declaration_$kinds};

}).call(this);

//# sourceMappingURL=builtins.js.map