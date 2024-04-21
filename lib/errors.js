(function() {
  'use strict';
  var WG, debug, rpr;

  //===========================================================================================================
  WG = require('webguy');

  ({rpr} = WG.trm);

  ({debug} = console);

  //-----------------------------------------------------------------------------------------------------------
  this.Intertype_error = class Intertype_error extends Error {
    constructor(ref, message) {
      super();
      if (ref === null) {
        this.message = message;
        return void 0;
      }
      this.message = `${ref} (${this.constructor.name}) ${message}`;
      this.ref = ref;
      return void 0;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  // class @Intertype_cfg_error                 extends @Intertype_error
  //   constructor: ( ref, message )     -> super ref, message
  // class @Intertype_internal_error            extends @Intertype_error
  //   constructor: ( ref, message )     -> super ref, message
  // class @Intertype_not_implemented           extends @Intertype_error
  //   constructor: ( ref, what )        -> super ref, "#{what} isn't implemented (yet)"
  // class @Intertype_deprecated                extends @Intertype_error
  //   constructor: ( ref, what )        -> super ref, "#{what} has been deprecated"
  // class @Intertype_argument_not_allowed      extends @Intertype_error
  //   constructor: ( ref, name, value ) -> super ref, "argument #{name} not allowed, got #{rpr value}"
  // class @Intertype_argument_missing          extends @Intertype_error
  //   constructor: ( ref, name )        -> super ref, "expected value for #{name}, got nothing"
  this.Intertype_wrong_type = class Intertype_wrong_type extends this.Intertype_error {
    constructor(ref, types, type) {
      super(ref, `expected ${types}, got a ${type}`);
    }

  };

  // class @Intertype_user_error                extends @Intertype_error
  //   constructor: ( message )          -> super null, message
  this.Intertype_unknown_type = class Intertype_unknown_type extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `unknown type ${rpr(type)}`);
    }

  };

  this.Intertype_wrong_arity = class Intertype_wrong_arity extends this.Intertype_error {
    constructor(ref, need_arity, is_arity) {
      super(ref, `expected ${need_arity} arguments, got ${is_arity}`);
    }

  };

  this.Intertype_wrong_arity_range = class Intertype_wrong_arity_range extends this.Intertype_wrong_arity {
    constructor(ref, min, max, is_arity) {
      super(ref, `between ${min} and ${max}`, is_arity);
    }

  };

  this.Intertype_function_with_wrong_arity = class Intertype_function_with_wrong_arity extends this.Intertype_error {
    constructor(ref, need_arity, is_arity) {
      super(ref, `expected function with ${need_arity} parameters, got one with ${is_arity}`);
    }

  };

  this.Intertype_validation_error = class Intertype_validation_error extends this.Intertype_error {
    constructor(ref, need_type, is_type) {
      super(ref, `expected a ${need_type}, got a ${is_type}`);
    }

  };

  this.Intertype_optional_validation_error = class Intertype_optional_validation_error extends this.Intertype_error {
    constructor(ref, need_type, is_type) {
      super(ref, `expected an optional ${need_type}, got a ${is_type}`);
    }

  };

  this.Intertype_create_not_available = class Intertype_create_not_available extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `type declaration of ${rpr(type)} has no \`create\` and no \`template\` entries, cannot be created`);
    }

  };

  this.Intertype_create_must_be_function = class Intertype_create_must_be_function extends this.Intertype_error {
    constructor(ref, type, type_of_create) {
      super(ref, `expected a function for \`create\` entry of type ${rpr(type)}, got a ${type_of_create}`);
    }

  };

  this.Intertype_wrong_arguments_for_create = class Intertype_wrong_arguments_for_create extends this.Intertype_error {
    constructor(ref, need_type, is_type) {
      super(ref, `expected \`create.${need_type}()\` to return a ${need_type} but it returned a ${is_type}`);
    }

  };

  this.Intertype_declaration_override_forbidden = class Intertype_declaration_override_forbidden extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `type ${rpr(type)} has already been declared and may not be overridden`);
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  this.Intertype_ETEMPTBD = class Intertype_ETEMPTBD extends this.Intertype_error {};

}).call(this);

//# sourceMappingURL=errors.js.map