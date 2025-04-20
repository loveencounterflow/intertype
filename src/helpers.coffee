
'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ debug
  info
  warn }                  = GUY.trm.get_loggers 'demo-execa'
{ rpr }                   = GUY.trm


#===========================================================================================================
module.exports = # class Helpers

  #---------------------------------------------------------------------------------------------------------
  get_own_keys: ( d ) ->
    return [] unless d?
    return ( Object.getOwnPropertyNames d ).concat Object.getOwnPropertySymbols d

  #---------------------------------------------------------------------------------------------------------
  get_own_user_keys: ( d ) ->
    return [] unless d?
    system_keys = new Set @get_own_system_keys d
    return ( k for k in ( @get_own_keys d ) \
      when ( typeof k is 'symbol' ) or ( not system_keys.has k ) )

  #---------------------------------------------------------------------------------------------------------
  get_own_system_keys: ( d ) ->
    return [] unless d?
    return ( k for k in ( Object.getOwnPropertyNames d ) when ( k.startsWith '$' ) )


