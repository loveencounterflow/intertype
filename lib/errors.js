(function() {
  'use strict';
  var WG, debug, rpr, rpr_list;

  //===========================================================================================================
  WG = require('webguy');

  ({rpr} = WG.trm);

  ({debug} = console);

  //-----------------------------------------------------------------------------------------------------------
  rpr_list = function(x) {
    if (x.length === 0) {
      return "(no arguments)";
    }
    return (rpr(x)).replace(/^\[\s*(.*?)\s*\]/, '$1');
  };

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

  this.Intertype_internal_error = class Intertype_internal_error extends this.Intertype_error {
    constructor(ref, message) {
      super(ref, message);
    }

  };

  // class @Intertype_user_error                extends @Intertype_error
  //   constructor: ( message )          -> super null, message
  this.Intertype_unknown_type = class Intertype_unknown_type extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `unknown type ${rpr(type)}`);
    }

  };

  this.Intertype_unknown_partial_type = class Intertype_unknown_partial_type extends this.Intertype_error {
    constructor(ref, type, partial_type) {
      super(ref, `unknown partial type ${rpr(partial_type)} of ${rpr(type)}`);
    }

  };

  this.Intertype_wrong_arity = class Intertype_wrong_arity extends this.Intertype_error {
    constructor(ref, need_arity, is_arity) {
      super(ref, `expected ${need_arity} arguments, got ${is_arity}`);
    }

  };

  this.Intertype_wrong_arity_for_method = class Intertype_wrong_arity_for_method extends this.Intertype_error {
    constructor(ref, method_name, need_arity, is_arity) {
      super(ref, `method ${rpr(method_name)} expects ${need_arity} arguments, got ${is_arity}`);
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

  this.Intertype_test_must_be_function = class Intertype_test_must_be_function extends this.Intertype_error {
    constructor(ref, type, type_of_test) {
      super(ref, `expected a function for \`test\` entry of type ${rpr(type)}, got a ${type_of_test}`);
    }

  };

  this.Intertype_wrong_arguments_for_create = class Intertype_wrong_arguments_for_create extends this.Intertype_error {
    constructor(ref, type, args, evaluation) {
      super(ref, `these arguments are not suitable for \`create.${type}()\`: ${rpr_list(args)}\nevaluation: ${rpr(evaluation)}`);
    }

  };

  this.Intertype_basetype_redeclaration_forbidden = class Intertype_basetype_redeclaration_forbidden extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `not allowed to re-declare basetype ${rpr(type)}`);
    }

  };

  this.Intertype_declaration_redeclaration_forbidden = class Intertype_declaration_redeclaration_forbidden extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `not allowed to re-declare type ${rpr(type)}`);
    }

  };

  this.Intertype_wrong_template_arity = class Intertype_wrong_template_arity extends this.Intertype_error {
    constructor(ref, type, arity) {
      super(ref, `template method for type ${rpr(type)} has arity ${arity} but must be nullary without \`create\` method`);
    }

  };

  this.Intertype_wrong_template_type = class Intertype_wrong_template_type extends this.Intertype_error {
    constructor(ref, type, arity) {
      super(ref, `template for type ${rpr(type)} doesn't validate as a ${type}`);
    }

  };

  this.Intertype_optional_used_alone = class Intertype_optional_used_alone extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `not allowed to use \`optional\` on its own in type declaration for ${rpr(type)}`);
    }

  };

  this.Intertype_illegal_isa_optional = class Intertype_illegal_isa_optional extends this.Intertype_error {
    constructor(ref) {
      super(ref, "`optional` is not a legal type for `isa` methods");
    }

  };

  this.Intertype_illegal_evaluate_optional = class Intertype_illegal_evaluate_optional extends this.Intertype_error {
    constructor(ref) {
      super(ref, "`optional` is not a legal type for `evaluate` methods");
    }

  };

  this.Intertype_illegal_validate_optional = class Intertype_illegal_validate_optional extends this.Intertype_error {
    constructor(ref) {
      super(ref, "`optional` is not a legal type for `validate` methods");
    }

  };

  this.Intertype_illegal_create_optional = class Intertype_illegal_create_optional extends this.Intertype_error {
    constructor(ref) {
      super(ref, "`optional` is not a legal type for `create` methods");
    }

  };

  this.Intertype_illegal_use_of_optional = class Intertype_illegal_use_of_optional extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `illegal use of 'optional' in declaration of type ${rpr(type)}`);
    }

  };

  this.Intertype_illegal_use_of_basetype = class Intertype_illegal_use_of_basetype extends this.Intertype_error {
    constructor(ref, type, basetype) {
      super(ref, `illegal use of basetype ${rpr(basetype)} in declaration of type ${rpr(type)}`);
    }

  };

  this.Intertype_wrong_type_for_test_method = class Intertype_wrong_type_for_test_method extends this.Intertype_error {
    constructor(ref, type) {
      super(ref, `expected type name, method, or object to indicate test method, got a ${type}`);
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  this.Intertype_ETEMPTBD = class Intertype_ETEMPTBD extends this.Intertype_error {};

}).call(this);

//# sourceMappingURL=errors.js.map