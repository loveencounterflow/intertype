
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
class @Intertype_cfg_error                 extends @Intertype_error
  constructor: ( ref, message )     -> super ref, message
class @Intertype_internal_error            extends @Intertype_error
  constructor: ( ref, message )     -> super ref, message
class @Intertype_not_implemented           extends @Intertype_error
  constructor: ( ref, what )        -> super ref, "#{what} isn't implemented (yet)"
class @Intertype_deprecated                extends @Intertype_error
  constructor: ( ref, what )        -> super ref, "#{what} has been deprecated"
class @Intertype_argument_not_allowed      extends @Intertype_error
  constructor: ( ref, name, value ) -> super ref, "argument #{name} not allowed, got #{rpr value}"
class @Intertype_argument_missing          extends @Intertype_error
  constructor: ( ref, name )        -> super ref, "expected value for #{name}, got nothing"
class @Intertype_wrong_type                extends @Intertype_error
  constructor: ( ref, types, type ) -> super ref, "expected #{types}, got a #{type}"
class @Intertype_wrong_arity               extends @Intertype_error
  constructor: ( ref, name, min, max, found ) -> super ref, "#{name} expected between #{min} and #{max} arguments, got #{found}"
class @Intertype_user_error                extends @Intertype_error
  constructor: ( message )          -> super null, message
class @Intertype_validation_error          extends @Intertype_error
  constructor: ( ref, need_type, is_type ) -> super ref, "expected a #{need_type}, got a #{is_type}"
class @Intertype_optional_validation_error extends @Intertype_error
  constructor: ( ref, need_type, is_type ) -> super ref, "expected an optional #{need_type}, got a #{is_type}"
#-----------------------------------------------------------------------------------------------------------
class @Intertype_ETEMPTBD extends @Intertype_error
