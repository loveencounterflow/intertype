(function() {
  'use strict';
  var GUY, Typespace, debug, help, info, rpr, std,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  //===========================================================================================================
  GUY = require('guy');

  ({debug, help, info} = GUY.trm.get_loggers('demo-execa'));

  ({rpr} = GUY.trm);

  ({Typespace} = require('./lib'));

  //===========================================================================================================
  std = new Typespace({
    //.........................................................................................................
    integer: {
      isa: function(x, t) {
        return Number.isInteger(x);
      },
      foo: 4
    },
    odd: {
      isa: function(x, t) {
        return (t.isa(this.$typespace.integer, x)) && (modulo(x, 2) !== 0);
      }
    },
    // short form just assigns either a test method or a type name:
    even: function(x, t) {
      return (t.isa(this.$typespace.integer, x)) && (modulo(x, 2) === 0);
    },
    float: function(x, t) {
      return Number.isFinite(x);
    },
    bigint: function(x, t) {
      return typeof x === 'bigint';
    },
    text: function(x, t) {
      return typeof x === 'string';
    },
    nonempty_text: function(x, t) {
      return (t.isa(this.$typespace.text, x)) && (x.length > 0);
    }
  });

  //.........................................................................................................
  // numerical:      ( x, t ) -> ( t.isa @$typespace.float, x   ) or ( t.isa @$typespace.bigint, x )
  // positive0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +0  )
  // positive1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +1  )
  // negative0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <=  0  )
  // negative1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <= -1  )
  // cardinal:       ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( t.isa @$typespace.positive0, x )
  //.........................................................................................................
  // cardinalbigint: ( x, t ) -> ( t.isa @$typespace.bigint, x    ) and ( x >= +0 )

  //===========================================================================================================
  module.exports = {std};

}).call(this);

//# sourceMappingURL=declarations.js.map