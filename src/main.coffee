
'use strict'

{ Intervoke_phraser }     = require 'intervoke'
{ sample_vocabulary }     = require 'intervoke/lib/phrase-parser'
{ debug             }     = console
misfit                    = Symbol.for 'misfit'


#===========================================================================================================
defaults =
  declaration:
    fields:   null
    template: misfit

#===========================================================================================================
class Types
  isa_function: ( x ) -> typeof x is 'function'

T = new Types()

#===========================================================================================================
class Declaration_compiler

  #---------------------------------------------------------------------------------------------------------
  compile: ( name, declaration ) ->
    declaration = { isa: declaration, } if T.isa_function declaration
    R = { defaults.declaration..., declaration..., }
    return R

D = new Declaration_compiler()

#===========================================================================================================
class Isa_proto extends Intervoke_phraser

  #---------------------------------------------------------------------------------------------------------
  __get_handler: ( accessor, ast ) ->
    debug '^Isa_proto::__get_handler@1^', accessor
    debug '^Isa_proto::__get_handler@1^', ast
    return ( x ) ->
      debug '^Isa_proto::__get_handler/handler@1^', accessor, ast
      return true

  #---------------------------------------------------------------------------------------------------------
  __declare: ( accessor, handler ) ->
    ### Associate an accessor with a handler method: ###
    debug '^Isa_proto::__declare@1^', { accessor, handler, }
    debug '^Isa_proto::__declare@1^', D.compile accessor, handler
    super accessor, handler


#===========================================================================================================
class Isa extends Isa_proto

  #---------------------------------------------------------------------------------------------------------
  @declare:
    null:       ( x ) -> x is null
    undefined:  ( x ) -> x is undefined
    boolean:    ( x ) -> ( x is true ) or ( x is false )
    float:      ( x ) -> Number.isFinite x
    symbol:     ( x ) -> ( typeof x ) is 'symbol'


#===========================================================================================================
if module is require.main then do =>
  #.........................................................................................................
  isa = new Isa()
  isa.__parser.set_vocabulary sample_vocabulary
  debug '^do@1^', isa
  debug '^do@2^', isa.integer
  debug '^do@3^', isa.integer 12
  debug '^do@4^', isa.null
  debug '^do@4^', isa.null 5
  debug '^do@4^', isa.null null


