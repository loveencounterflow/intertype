

'use strict'


#===========================================================================================================
{ SUBSIDIARY }            = require 'subsidiary'
WG                        = require 'webguy'
rpr                       = WG.trm.rpr


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
  nullary:                ( x ) -> x? and ( x.length is 0 )
  unary:                  ( x ) -> x? and ( x.length is 1 )
  binary:                 ( x ) -> x? and ( x.length is 2 )
  #.........................................................................................................
  IT_listener:            ( x ) -> ( @function x ) or ( @asyncfunction x )
  IT_note_$key:           ( x ) -> ( @text x ) or ( @symbol x )
  unary_or_binary:        ( x ) -> x? and ( ( x.length is 1 ) or ( x.length is 2 ) )
  binary_or_trinary:      ( x ) -> x? and ( ( x.length is 2 ) or ( x.length is 3 ) )
  $freeze:                ( x ) -> @boolean x

#===========================================================================================================
class Intertype

  #---------------------------------------------------------------------------------------------------------
  constructor: ( declarations ) ->
    SUBSIDIARY.tie_one { host: @, subsidiary_key: 'isa',               subsidiary: {}, enumerable: false, }
    SUBSIDIARY.tie_one { host: @, subsidiary_key: 'isa_optional',      subsidiary: {}, enumerable: false, }
    SUBSIDIARY.tie_one { host: @, subsidiary_key: 'validate',          subsidiary: {}, enumerable: false, }
    SUBSIDIARY.tie_one { host: @, subsidiary_key: 'validate_optional', subsidiary: {}, enumerable: false, }
    #.......................................................................................................
    for type, test of declarations then do ( type, test ) =>
      @isa[               type ] = ( x ) => if x? then ( test.call @, x )             else true
      @isa_optional[      type ] = ( x ) => if x? then ( test.call @, x )             else true
      @validate_optional[ type ] = ( x ) => if x? then ( validate[ type ].call @, x ) else x
      @validate[          type ] = ( x ) =>
        return x if test.call @, x
        ### TAINT `typeof` will give some strange results ###
        throw new Error "expected a #{type}, got a #{typeof x}"
    #.......................................................................................................
    return undefined


#===========================================================================================================
types = new Intertype declarations

#===========================================================================================================
module.exports = { Intertype, types, declarations, }
