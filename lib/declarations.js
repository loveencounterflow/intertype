(function() {
  'use strict';
  var GUY, LIB, debug, flatly_1, flatly_2, help, info, rpr, std,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  //===========================================================================================================
  GUY = require('guy');

  ({debug, help, info} = GUY.trm.get_loggers('demo-execa'));

  ({rpr} = GUY.trm);

  LIB = require('./lib');

  //===========================================================================================================
  std = new LIB.Typespace({
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
    },
    //.........................................................................................................
    // numerical:      ( x, t ) -> ( t.isa @$typespace.float, x   ) or ( t.isa @$typespace.bigint, x )
    // positive0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +0  )
    // positive1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +1  )
    // negative0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <=  0  )
    // negative1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <= -1  )
    // cardinal:       ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( t.isa @$typespace.positive0, x )
    //.........................................................................................................
    // cardinalbigint: ( x, t ) -> ( t.isa @$typespace.bigint, x    ) and ( x >= +0 )
    //.........................................................................................................
    // circle1:  'circle2'
    // circle2:  'circle3'
    // circle3:  'circle1'
    //.........................................................................................................
    weird: 'strange', // declares another name for `odd`
    strange: 'odd', // declares another name for `odd`
    abnormal: 'weird', // declares another name for `odd`
    //.........................................................................................................
    quantity: {
      fields: {
        // each field becomes a `Type` instance; strings may refer to names in the same typespace
        q: 'float',
        u: 'nonempty_text'
      },
      template: {
        q: 0,
        u: 'u'
      }
    },
    //.........................................................................................................
    address: {
      fields: {
        postcode: 'nonempty_text',
        city: 'nonempty_text'
      }
    },
    //.........................................................................................................
    employee: {
      fields: {
        address: 'address',
        name: {
          fields: {
            firstname: 'nonempty_text',
            lastname: 'nonempty_text'
          }
        }
      }
    }
  });

  //===========================================================================================================
  flatly_1 = new LIB.Typespace({
    evenly: 'flat',
    flat: function(x, t) {
      return t.isa(std.even, x);
    },
    plain: 'evenly'
  });

  // foo:          'bar'

  //-----------------------------------------------------------------------------------------------------------
  flatly_2 = new LIB.Typespace({
    evenly: 'flat',
    flat: std.even,
    plain: 'evenly'
  });

  //===========================================================================================================
  // if module is require.main then await do =>
  module.exports = {std, flatly_1, flatly_2};

}).call(this);

//# sourceMappingURL=declarations.js.map