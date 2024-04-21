
'use strict'


#===========================================================================================================
WG                        = require 'webguy'
{ rpr }                   = WG.trm
{ debug }                 = console


#-----------------------------------------------------------------------------------------------------------
class @Intertype_error extends Error
  constructor: ( ref, message ) ->
    super()
    if ref is null
      @message  = message
      return undefined
    @message  = "#{ref} (#{@constructor.name}) #{message}"
    @ref      = ref
    return undefined

#-----------------------------------------------------------------------------------------------------------
# class @Intertype_cfg_error                 extends @Intertype_error
#   constructor: ( ref, message )     -> super ref, message
# class @Intertype_internal_error            extends @Intertype_error
#   constructor: ( ref, message )     -> super ref, message
# class @Intertype_not_implemented           extends @Intertype_error
#   constructor: ( ref, what )        -> super ref, "#{what} isn't implemented (yet)"
# class @Intertype_deprecated                extends @Intertype_error
#   constructor: ( ref, what )        -> super ref, "#{what} has been deprecated"
# class @Intertype_argument_not_allowed      extends @Intertype_error
#   constructor: ( ref, name, value ) -> super ref, "argument #{name} not allowed, got #{rpr value}"
# class @Intertype_argument_missing          extends @Intertype_error
#   constructor: ( ref, name )        -> super ref, "expected value for #{name}, got nothing"
class @Intertype_wrong_type                extends @Intertype_error
  constructor: ( ref, types, type ) -> super ref, "expected #{types}, got a #{type}"
# class @Intertype_user_error                extends @Intertype_error
#   constructor: ( message )          -> super null, message
class @Intertype_unknown_type              extends @Intertype_error
  constructor: ( ref, type ) -> super ref, "unknown type #{rpr type}"
class @Intertype_wrong_arity               extends @Intertype_error
  constructor: ( ref, need_arity, is_arity ) -> super ref, "expected #{need_arity} arguments, got #{is_arity}"
class @Intertype_wrong_arity_range         extends @Intertype_wrong_arity
  constructor: ( ref, min, max, is_arity ) -> super ref, "between #{min} and #{max}", is_arity
class @Intertype_function_with_wrong_arity extends @Intertype_error
  constructor: ( ref, need_arity, is_arity ) -> super ref, "expected function with #{need_arity} parameters, got one with #{is_arity}"
class @Intertype_validation_error          extends @Intertype_error
  constructor: ( ref, need_type, is_type ) -> super ref, "expected a #{need_type}, got a #{is_type}"
class @Intertype_optional_validation_error extends @Intertype_error
  constructor: ( ref, need_type, is_type ) -> super ref, "expected an optional #{need_type}, got a #{is_type}"
class @Intertype_create_not_available      extends @Intertype_error
  constructor: ( ref, type ) -> super ref, "type declaration of #{rpr type} has no `create` and no `template` entries, cannot be created"
class @Intertype_create_must_be_function   extends @Intertype_error
  constructor: ( ref, type, type_of_create ) -> super ref, "expected a function for `create` entry of type #{rpr type}, got a #{type_of_create}"
class @Intertype_wrong_arguments_for_create extends @Intertype_error
  constructor: ( ref, need_type, is_type ) -> super ref, "expected `create.#{need_type}()` to return a #{need_type} but it returned a #{is_type}"
class @Intertype_declaration_override_forbidden extends @Intertype_error
  constructor: ( ref, type ) -> super ref, "type #{rpr type} has already been declared and may not be overridden"
#-----------------------------------------------------------------------------------------------------------
class @Intertype_ETEMPTBD extends @Intertype_error
