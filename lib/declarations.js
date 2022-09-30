(function() {
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
      default: null
    });
    //.........................................................................................................
    declare.undefined({
      isa: function(x) {
        return x === void 0;
      },
      default: void 0
    });
    //.........................................................................................................
    declare.bottom({
      isa: function(x) {
        return (x === void 0) || (x === null);
      },
      default: void 0
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
      default: ''
    });
    //.........................................................................................................
    declare.codepoint({
      isa: function(x) {
        return ((typeof x) === 'string') && /^.$/u.test(x);
      },
      default: '\x00'
    });
    //.........................................................................................................
    declare.codepointid({
      isa: function(x) {
        return this.isa.integer(x && ((0x00000 <= x && x <= 0x1ffff)));
      },
      default: '\x00'
    });
    //---------------------------------------------------------------------------------------------------------
    // Container Types
    //.........................................................................................................
    declare.list({
      collection: true,
      isa: function(x) {
        return Array.isArray(x);
      },
      default: []
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
    declare.sized({
      collection: true,
      isa: function(x) {
        return (this.size_of(x, this._signals.nothing)) !== this._signals.nothing;
      },
      default: []
    });
    //.........................................................................................................
    declare.iterable({
      isa: function(x) {
        return (x != null) && (x[Symbol.iterator] != null);
      },
      default: []
    });
    //.........................................................................................................
    declare.container({
      isa: function(x) {
        return (typeof x) !== 'string' && (this.iterable(x)) && (this.sized(x));
      },
      default: []
    });
    //---------------------------------------------------------------------------------------------------------
    // Numeric Types
    //.........................................................................................................
    declare.numeric({
      isa: function(x) {
        return (Number.isFinite(x)) || (typeof x === 'bigint');
      },
      default: 0
    });
    //.........................................................................................................
    declare.float({
      isa: function(x) {
        return Number.isFinite(x);
      },
      default: 0
    });
    //.........................................................................................................
    declare.bigint({
      isa: function(x) {
        return typeof x === 'bigint';
      },
      default: 0n
    });
    //.........................................................................................................
    declare.integer({
      isa: function(x) {
        return Number.isInteger(x);
      },
      default: 0
    });
    //.........................................................................................................
    declare.zero({
      isa: function(x) {
        return x === 0/* NOTE true for -0 as well */;
      },
      default: 0
    });
    //.........................................................................................................
    declare.nan({
      isa: function(x) {
        return Number.isNaN(x);
      },
      default: 0/0
    });
    //.........................................................................................................
    declare.negatable({ // numeric? numeral?
      isa: function(x) {
        return (typeof x) === (typeof -x);
      },
      default: 0
    });
    //.........................................................................................................
    declare.even({
      default: 0,
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
      default: 1,
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
      default: false
    });
    //.........................................................................................................
    declare.object({
      isa: function(x) {
        return (x != null) && (typeof x === 'object') && ((Object.prototype.toString.call(x)) === '[object Object]');
      },
      default: {}
    });
    //.........................................................................................................
    declare.function({
      isa: function(x) {
        return typeof x === 'function';
      },
      default: {}
    });
    //.........................................................................................................
    return null;
  };

}).call(this);

//# sourceMappingURL=declarations.js.map