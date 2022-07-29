(function() {
  //-----------------------------------------------------------------------------------------------------------
  this._provisional_declare_basic_types = function(hub) {
    var declare;
    ({declare} = hub);
    //.........................................................................................................
    declare.null({
      test: function(x) {
        return x === null;
      },
      default: null
    });
    //.........................................................................................................
    declare.boolean({
      test: function(x) {
        return (x === true) || (x === false);
      },
      default: false
    });
    //.........................................................................................................
    declare.text({
      collection: true,
      test: function(x) {
        return (typeof x) === 'string';
      },
      default: ''
    });
    //.........................................................................................................
    declare.codepoint({
      test: function(x) {
        return /^.$/u.test(x);
      },
      default: '\x00'
    });
    //.........................................................................................................
    declare.codepointid({
      test: function(x) {
        return this.isa.integer(x && ((0x00000 <= x && x <= 0x1ffff)));
      },
      default: '\x00'
    });
    //.........................................................................................................
    declare.list({
      collection: true,
      test: function(x) {
        return Array.isArray(x);
      },
      default: ''
    });
    //.........................................................................................................
    declare.set({
      collection: true,
      test: function(x) {
        return x instanceof Set;
      },
      // default:  ''
      create: function(cfg = []) {
        return new Set(cfg);
      }
    });
    //.........................................................................................................
    declare.integer({
      test: function(x) {
        return Number.isInteger(x);
      },
      default: 0
    });
    //.........................................................................................................
    declare.negatable({ // numeric? numeral?
      test: function(x) {
        return (typeof x) === (typeof -x);
      },
      default: 0
    });
    //.........................................................................................................
    declare.sized({
      collection: true,
      test: function(x) {
        return (this.size_of(x, this._signals.nothing)) !== this._signals.nothing;
      }
    });
    //.........................................................................................................
    declare.iterable({
      test: function(x) {
        return (x != null) && (x[Symbol.iterator] != null);
      }
    });
    //.........................................................................................................
    declare.object({
      test: function(x) {
        return (x != null) && (typeof x) === 'object';
      }
    });
    //.........................................................................................................
    return null;
  };

}).call(this);

//# sourceMappingURL=declarations.js.map