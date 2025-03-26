
'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ debug
  help
  info }                  = GUY.trm.get_loggers 'demo-execa'
{ rpr }                   = GUY.trm
LIB                       = require './lib'
DCLS                      = require './declarations'



#===========================================================================================================
module.exports = { LIB..., DCLS..., }
