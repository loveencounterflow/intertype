(function() {
  //-----------------------------------------------------------------------------------------------------------
  var GUY;

  GUY = require('guy');

  //-----------------------------------------------------------------------------------------------------------
  this._provisional_declare_basic_types = function(hub) {
    var declare;
    ({declare} = hub);
    //---------------------------------------------------------------------------------------------------------
    // Bottom Types
    //.........................................................................................................
    declare.null({
      isa: function(x) {
        return x === null;
      },
      template: null
    });
    //.........................................................................................................
    declare.undefined({
      isa: function(x) {
        return x === void 0;
      },
      template: void 0
    });
    //.........................................................................................................
    declare.bottom({
      isa: function(x) {
        return (x === void 0) || (x === null);
      },
      template: void 0
    });
    //---------------------------------------------------------------------------------------------------------
    // Existential Types
    //.........................................................................................................
    declare.anything(function(x) {
      return true;
    });
    declare.something(function(x) {
      return x != null;
    });
    declare.nothing(function(x) {
      return x == null;
    });
    //---------------------------------------------------------------------------------------------------------
    // Textual Types
    //.........................................................................................................
    declare.text({
      collection: true,
      isa: function(x) {
        return (typeof x) === 'string';
      },
      template: ''
    });
    //.........................................................................................................
    declare.codepoint({
      isa: function(x) {
        return ((typeof x) === 'string') && /^.$/u.test(x);
      },
      template: '\x00'
    });
    //.........................................................................................................
    declare.codepointid({
      isa: function(x) {
        return this.isa.integer(x && ((0x00000 <= x && x <= 0x1ffff)));
      },
      template: '\x00'
    });
    //.........................................................................................................
    declare.regex({
      isa: function(x) {
        return (Object.prototype.toString.call(x)) === '[object RegExp]';
      },
      template: new RegExp('')
    });
    //.........................................................................................................
    declare.jsidentifier(function(x) {
      if (!this.isa.text(x)) {
        /* thx to https://github.com/mathiasbynens/mothereff.in/blob/master/js-variables/eff.js and
           https://mathiasbynens.be/notes/javascript-identifiers-es6 */
        return false;
      }
      return (x.match(/^(?:[$_]|\p{ID_Start})(?:[$_\u{200c}\u{200d}]|\p{ID_Continue})*$/u)) != null;
    });
    //---------------------------------------------------------------------------------------------------------
    // Container Types
    //.........................................................................................................
    declare.list({
      collection: true,
      isa: function(x) {
        return Array.isArray(x);
      },
      template: []
    });
    //.........................................................................................................
    declare.set({
      collection: true,
      isa: function(x) {
        return x instanceof Set;
      },
      create: function(cfg = []) {
        return new Set(cfg);
      }
    });
    //.........................................................................................................
    declare.map({
      isa: function(x) {
        return x instanceof Map;
      },
      template: new Map(),
      create: function(x) {
        return new Map();
      }
    });
    //.........................................................................................................
    declare.sized({
      collection: true,
      isa: function(x) {
        return (this.size_of(x, this._signals.nothing)) !== this._signals.nothing;
      },
      template: []
    });
    //.........................................................................................................
    declare.iterable({
      isa: function(x) {
        return (x != null) && (x[Symbol.iterator] != null);
      },
      template: []
    });
    //.........................................................................................................
    declare.container({
      isa: function(x) {
        return (typeof x) !== 'string' && (this.iterable(x)) && (this.sized(x));
      },
      template: []
    });
    //---------------------------------------------------------------------------------------------------------
    // Numeric Types
    //.........................................................................................................
    declare.numeric({
      isa: function(x) {
        return (Number.isFinite(x)) || (typeof x === 'bigint');
      },
      template: 0
    });
    //.........................................................................................................
    declare.float({
      isa: function(x) {
        return Number.isFinite(x);
      },
      template: 0
    });
    //.........................................................................................................
    declare.bigint({
      isa: function(x) {
        return typeof x === 'bigint';
      },
      template: 0n
    });
    //.........................................................................................................
    declare.integer({
      isa: function(x) {
        return Number.isInteger(x);
      },
      template: 0
    });
    //.........................................................................................................
    declare.cardinal({
      isa: function(x) {
        return (Number.isInteger(x)) && (x >= 0);
      },
      template: 0
    });
    //.........................................................................................................
    declare.zero({
      isa: function(x) {
        return x === 0/* NOTE true for -0 as well */;
      },
      template: 0
    });
    //.........................................................................................................
    declare.nan({
      isa: function(x) {
        return Number.isNaN(x);
      },
      template: 0/0
    });
    //.........................................................................................................
    declare.negatable({ // numeric? numeral?
      isa: function(x) {
        return (typeof x) === (typeof -x);
      },
      template: 0
    });
    //.........................................................................................................
    declare.even({
      template: 0,
      isa: function(x) {
        if (Number.isInteger(x)) {
          return (x % 2) === 0;
        } else if (typeof x === 'bigint') {
          return (x % 2n) === 0n;
        }
        return false;
      }
    });
    //.........................................................................................................
    declare.odd({
      template: 1,
      isa: function(x) {
        if (Number.isInteger(x)) {
          return (x % 2) !== 0;
        } else if (typeof x === 'bigint') {
          return (x % 2n) !== 0n;
        }
        return false;
      }
    });
    //---------------------------------------------------------------------------------------------------------
    // Other Types
    //.........................................................................................................
    declare.boolean({
      isa: function(x) {
        return (x === true) || (x === false);
      },
      template: false
    });
    //.........................................................................................................
    declare.object({
      isa: function(x) {
        return (x != null) && (typeof x === 'object') && ((Object.prototype.toString.call(x)) === '[object Object]');
      },
      template: {}
    });
    //.........................................................................................................
    declare.function({
      isa: function(x) {
        return (Object.prototype.toString.call(x)) === '[object Function]';
      },
      template: function() {}
    });
    //.........................................................................................................
    declare.class({
      isa: function(x) {
        var ref;
        return ((Object.prototype.toString.call(x)) === '[object Function]') && ((ref = Object.getOwnPropertyDescriptor(x, 'prototype')) != null ? ref.writable : void 0) === false;
      }
    });
    // template:   ->
    //.........................................................................................................
    declare.asyncfunction({
      isa: function(x) {
        return (Object.prototype.toString.call(x)) === '[object AsyncFunction]';
      },
      template: function() {}
    });
    //.........................................................................................................
    declare.symbol({
      isa: function(x) {
        return (typeof x) === 'symbol';
      },
      template: Symbol(''),
      create: function(x) {
        return Symbol(x);
      }
    });
    //.........................................................................................................
    declare.knowntype({
      isa: function(x) {
        if (!((this.isa.text(x)) && (x.length > 0))) {
          return false;
        }
        return GUY.props.has(this.registry, x);
      }
    });
    //.........................................................................................................
    return null;
  };

}).call(this);

//# sourceMappingURL=declarations.js.map