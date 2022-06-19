'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'INTERTYPE/ERRORS'
# debug                     = CND.get_logger 'debug',     badge
# warn                      = CND.get_logger 'warn',      badge
# info                      = CND.get_logger 'info',      badge
# urge                      = CND.get_logger 'urge',      badge
# help                      = CND.get_logger 'help',      badge
# whisper                   = CND.get_logger 'whisper',   badge
# echo                      = CND.echo.bind CND


#-----------------------------------------------------------------------------------------------------------
class @Intertype_error extends Error
  constructor: ( ref, message ) ->
    super()
    @message  = "#{ref} (#{@constructor.name}) #{message}"
    @ref      = ref
    return undefined ### always return `undefined` from constructor ###

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
