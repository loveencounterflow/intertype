(function() {
  'use strict';
  var CND, badge, rpr;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'INTERTYPE/ERRORS';

  // debug                     = CND.get_logger 'debug',     badge
  // warn                      = CND.get_logger 'warn',      badge
  // info                      = CND.get_logger 'info',      badge
  // urge                      = CND.get_logger 'urge',      badge
  // help                      = CND.get_logger 'help',      badge
  // whisper                   = CND.get_logger 'whisper',   badge
  // echo                      = CND.echo.bind CND

  //-----------------------------------------------------------------------------------------------------------
  this.Intertype_error = class Intertype_error extends Error {
    constructor(ref, message) {
      super();
      this.message = `${ref} (${this.constructor.name}) ${message}`;
      this.ref = ref;
      return void 0/* always return `undefined` from constructor */;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  this.Intertype_cfg_error = class Intertype_cfg_error extends this.Intertype_error {
    constructor(ref, message) {
      super(ref, message);
    }

  };

  this.Intertype_internal_error = class Intertype_internal_error extends this.Intertype_error {
    constructor(ref, message) {
      super(ref, message);
    }

  };

  this.Intertype_not_implemented = class Intertype_not_implemented extends this.Intertype_error {
    constructor(ref, what) {
      super(ref, `${what} isn't implemented (yet)`);
    }

  };

  this.Intertype_deprecated = class Intertype_deprecated extends this.Intertype_error {
    constructor(ref, what) {
      super(ref, `${what} has been deprecated`);
    }

  };

  this.Intertype_argument_not_allowed = class Intertype_argument_not_allowed extends this.Intertype_error {
    constructor(ref, name, value) {
      super(ref, `argument ${name} not allowed, got ${rpr(value)}`);
    }

  };

  this.Intertype_argument_missing = class Intertype_argument_missing extends this.Intertype_error {
    constructor(ref, name) {
      super(ref, `expected value for ${name}, got nothing`);
    }

  };

  this.Intertype_wrong_type = class Intertype_wrong_type extends this.Intertype_error {
    constructor(ref, types, type) {
      super(ref, `expected ${types}, got a ${type}`);
    }

  };

  this.Intertype_wrong_arity = class Intertype_wrong_arity extends this.Intertype_error {
    constructor(ref, name, min, max, found) {
      super(ref, `${name} expected between ${min} and ${max} arguments, got ${found}`);
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  this.Intertype_ETEMPTBD = class Intertype_ETEMPTBD extends this.Intertype_error {};

}).call(this);

//# sourceMappingURL=errors.js.map