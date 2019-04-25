
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'INTERTYPE/MAIN'
debug                     = CND.get_logger 'debug',     badge
alert                     = CND.get_logger 'alert',     badge
whisper                   = CND.get_logger 'whisper',   badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
info                      = CND.get_logger 'info',      badge
#...........................................................................................................
Multimix                  = require 'multimix'
#...........................................................................................................
{ assign
  jr
  flatten
  xrpr
  get_rprs_of_tprs
  js_type_of }            = require './helpers'
#...........................................................................................................
declarations              = require './declarations'


#-----------------------------------------------------------------------------------------------------------
isa = ( type, xP... ) -> @_satisfies_all_aspects type, xP...

#-----------------------------------------------------------------------------------------------------------
validate = ( type, xP... ) ->
  return true unless ( aspect = @_get_unsatisfied_aspect type, xP... )?
  [ x, P..., ] = xP
  { rpr_of_tprs, srpr_of_tprs, } = get_rprs_of_tprs P
  message = if aspect is 'main'
    "µ3093 not a valid #{type}: #{xrpr x}#{srpr_of_tprs}"
  else
    "µ3093 not a valid #{type} (violates #{rpr aspect}): #{xrpr x}#{srpr_of_tprs}"
  throw new Error message

#===========================================================================================================
class @Intertype extends Multimix
  # @extend   object_with_class_properties
  @include require './cataloguing'
  @include require './sizing'
  @include require './declaring'

  #---------------------------------------------------------------------------------------------------------
  constructor: ( @instance_name ) ->
    super()
    @specs    = {}
    @isa      = Multimix.get_keymethod_proxy @, isa
    @validate = Multimix.get_keymethod_proxy @, validate
    declarations.declare_types.apply @




