
'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ debug
  help
  info }                  = GUY.trm.get_loggers 'demo-execa'
{ rpr }                   = GUY.trm
{ Typespace }             = require './lib'

#===========================================================================================================
std = new Typespace
  #.........................................................................................................
  integer:
    isa:    ( x, t ) -> Number.isInteger x
    foo:    4
  odd:
    isa:    ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( x %% 2 isnt 0 )
  # short form just assigns either a test method or a type name:
  even:           ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( x %% 2 is 0 )
  float:          ( x, t ) -> Number.isFinite x
  bigint:         ( x, t ) -> typeof x is 'bigint'
  text:           ( x, t ) -> typeof x is 'string'
  nonempty_text:  ( x, t ) -> ( t.isa @$typespace.text, x ) and ( x.length > 0 )
  #.........................................................................................................
  # numerical:      ( x, t ) -> ( t.isa @$typespace.float, x   ) or ( t.isa @$typespace.bigint, x )
  # positive0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +0  )
  # positive1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +1  )
  # negative0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <=  0  )
  # negative1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <= -1  )
  # cardinal:       ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( t.isa @$typespace.positive0, x )
  #.........................................................................................................
  # cardinalbigint: ( x, t ) -> ( t.isa @$typespace.bigint, x    ) and ( x >= +0 )

#===========================================================================================================
module.exports = { std, }
