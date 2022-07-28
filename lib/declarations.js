(function() {
  //-----------------------------------------------------------------------------------------------------------
  this._provisional_declare_basic_types = function(hub) {
    var declare;
    ({declare} = hub);
    //.........................................................................................................
    declare.null({
      // groups:   'bottom'
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
      groups: 'collection',
      test: function(x) {
        return (typeof x) === 'string';
      },
      default: ''
    });
    //.........................................................................................................
    declare.codepoint({
      groups: 'other',
      test: function(x) {
        return /^.$/u.test(x);
      },
      default: '\x00'
    });
    //.........................................................................................................
    declare.codepointid({
      groups: 'other',
      test: function(x) {
        return this.isa.integer(x && ((0x00000 <= x && x <= 0x1ffff)));
      },
      default: '\x00'
    });
    //.........................................................................................................
    declare.list({
      groups: 'collection',
      test: function(x) {
        return Array.isArray(x);
      },
      default: ''
    });
    //.........................................................................................................
    declare.set({
      groups: 'collection',
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
      groups: 'number',
      test: function(x) {
        return Number.isInteger(x);
      },
      default: 0
    });
    //.........................................................................................................
    declare.iterable({
      groups: 'collection',
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