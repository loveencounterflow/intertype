

'use strict'


#===========================================================================================================
WG                        = require 'webguy'
{ rpr }                   = WG.trm
{ hide
  nameit }                = WG.props
{ debug }                 = console

#===========================================================================================================
declarations =

  anything:               ( x ) -> true
  nothing:                ( x ) -> not x?
  something:              ( x ) -> x?
  null:                   ( x ) -> x is null
  boolean:                ( x ) -> ( x is true ) or ( x is false )
  function:               ( x ) -> ( Object::toString.call x ) is '[object Function]'
  asyncfunction:          ( x ) -> ( Object::toString.call x ) is '[object AsyncFunction]'
  symbol:                 ( x ) -> ( typeof x ) is 'symbol'
  object:                 ( x ) -> x? and ( typeof x is 'object' ) and ( ( Object::toString.call x ) is '[object Object]' )
  text:                   ( x ) -> ( typeof x ) is 'string'
  nullary:                ( x ) -> x? and ( ( x.length is 0 ) or ( x.size is 0 ) )
  unary:                  ( x ) -> x? and ( ( x.length is 1 ) or ( x.size is 1 ) )
  binary:                 ( x ) -> x? and ( ( x.length is 2 ) or ( x.size is 2 ) )
  trinary:                ( x ) -> x? and ( ( x.length is 3 ) or ( x.size is 3 ) )
  #.........................................................................................................
  IT_listener:            ( x ) -> ( @isa.function x ) or ( @isa.asyncfunction x )
  IT_note_$key:           ( x ) -> ( @isa.text x ) or ( @isa.symbol x )
  unary_or_binary:        ( x ) -> ( @isa.unary   x ) or ( @isa.binary  x )
  binary_or_trinary:      ( x ) -> ( @isa.binary  x ) or ( @isa.trinary x )
  $freeze:                ( x ) -> @isa.boolean x

#===========================================================================================================
class Intertype

  #---------------------------------------------------------------------------------------------------------
  constructor: ( declarations ) ->
    hide @, 'isa',               { optional: {}, }
    hide @, 'validate',          { optional: {}, }
    #.......................................................................................................
    ### TAINT prevent accidental overwrites ###
    for type, test of declarations then do ( type, test ) =>
      @isa[               type ] = @get_isa               type, test
      @isa.optional[      type ] = @get_isa_optional      type, test
      @validate[          type ] = @get_validate          type, test
      @validate.optional[ type ] = @get_validate_optional type, test
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  get_isa:                ( type, test ) -> ( x ) => test.call @, x
  get_isa_optional:       ( type, test ) -> ( x ) => if x? then ( test.call @, x )               else true
  get_validate_optional:  ( type, test ) -> ( x ) => if x? then ( @validate[ type ].call @, x )  else x
  get_validate:           ( type, test ) -> ( x ) ->
    return x if test.call @, x
    ### TAINT `typeof` will give some strange results ###
    throw new Error "expected a #{type}, got a #{typeof x}"


#===========================================================================================================
types = new Intertype declarations

#===========================================================================================================
module.exports = { Intertype, types, declarations, }
