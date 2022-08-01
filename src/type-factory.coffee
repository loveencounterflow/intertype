
'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  warn
  urge
  help }                  = GUY.trm.get_loggers 'INTERTYPE'
{ rpr }                   = GUY.trm
#...........................................................................................................
E                         = require './errors'
H                         = require './helpers'



#===========================================================================================================
class Type_factory extends H.Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( hub ) ->
    super()
    @hub = hub
    return undefined

  #---------------------------------------------------------------------------------------------------------
  create_type_cfg: ( cfg ) ->
    H.types.validate.Type_cfg_constructor_cfg_NG cfg = { H.defaults.Type_cfg_constructor_cfg_NG..., cfg..., }
    name      = cfg.name
    R         = ( ( x ) -> x ** 2 ).bind @
    GUY.props.hide R, k, v for k, v of cfg
    GUY.props.hide R, 'name', name
    R         = new GUY.props.Strict_owner { target: R, freeze: true, }
    return R



############################################################################################################
@Type_factory = Type_factory

