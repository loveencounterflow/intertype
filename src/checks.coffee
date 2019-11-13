
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'INTERTYPE/CHECKS'
debug                     = CND.get_logger 'debug',     badge
alert                     = CND.get_logger 'alert',     badge
whisper                   = CND.get_logger 'whisper',   badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
info                      = CND.get_logger 'info',      badge

# #-----------------------------------------------------------------------------------------------------------
# @provide = ->
#   debug '^3332^', ( k for k of @ )
#   @check = new Proxy {},
#     get: ( t, k ) -> ( P... ) ->
#       debug '^2221^', rpr k;
#       # return undefined if k is 'bind'
#       return fn unless isa.callable fn = t[ k ]
#       return try ( fn P... ) catch error then error
#     set: ( t, k, v ) -> t[ k ] = v
#     delete: ( t, k, v ) -> delete t[ k ]

