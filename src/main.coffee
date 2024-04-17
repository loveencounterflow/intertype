

'use strict'


#===========================================================================================================
WG                        = require 'webguy'
{ rpr }                   = WG.trm
{ hide
  nameit }                = WG.props
{ debug }                 = console

#===========================================================================================================
declarations = default_declarations =
  anything:               ( x ) -> true
  nothing:                ( x ) -> not x?
  something:              ( x ) -> x?
  null:                   ( x ) -> x is null
  undefined:              ( x ) -> x is undefined
  boolean:                ( x ) -> ( x is true ) or ( x is false )
  function:               ( x ) -> ( Object::toString.call x ) is '[object Function]'
  asyncfunction:          ( x ) -> ( Object::toString.call x ) is '[object AsyncFunction]'
  symbol:                 ( x ) -> ( typeof x ) is 'symbol'
  object:                 ( x ) -> x? and ( typeof x is 'object' ) and ( ( Object::toString.call x ) is '[object Object]' )
  text:                   ( x ) -> ( typeof x ) is 'string'
  regex:                  ( x ) -> x instanceof RegExp
  nullary:                ( x ) -> x? and ( ( x.length is 0 ) or ( x.size is 0 ) )
  unary:                  ( x ) -> x? and ( ( x.length is 1 ) or ( x.size is 1 ) )
  binary:                 ( x ) -> x? and ( ( x.length is 2 ) or ( x.size is 2 ) )
  trinary:                ( x ) -> x? and ( ( x.length is 3 ) or ( x.size is 3 ) )
  #.........................................................................................................
  unknown:                ( x ) -> ( @type_of x ) is 'unknown'
  #.........................................................................................................
  IT_listener:            ( x ) -> ( @isa.function x ) or ( @isa.asyncfunction x )
  IT_note_$key:           ( x ) -> ( @isa.text x ) or ( @isa.symbol x )
  unary_or_binary:        ( x ) -> ( @isa.unary   x ) or ( @isa.binary  x )
  binary_or_trinary:      ( x ) -> ( @isa.binary  x ) or ( @isa.trinary x )
  $freeze:                ( x ) -> @isa.boolean x

#===========================================================================================================
### TAINT make configurable in type declaration? ###
skip_types = new Set [
  'anything'
  'nothing'
  'something'
  'null'
  'undefined'
  'unknown' ]

#===========================================================================================================
class Intertype

  #---------------------------------------------------------------------------------------------------------
  constructor: ( declarations = null ) ->
    declarations ?= default_declarations
    #.......................................................................................................
    hide @, 'isa',               { optional: {}, }
    hide @, 'validate',          { optional: {}, }
    hide @, '_type_of_tests',    {}
    #.......................................................................................................
    ### TAINT prevent accidental overwrites ###
    for type, test of declarations then do ( type, test ) =>
      @isa[               type ] = @get_isa               type, test
      @isa.optional[      type ] = @get_isa_optional      type, test
      @validate[          type ] = @get_validate          type, test
      @validate.optional[ type ] = @get_validate_optional type, test
      return if skip_types.has type
      @_type_of_tests[    type ] = @isa[ type ]
        if Reflect.has @isa, type
          throw new Error "unable to re-declare type #{rpr type}"
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  get_isa:                ( type, test ) -> ( x ) => test.call @, x
  get_isa_optional:       ( type, test ) -> ( x ) => if x? then ( test.call @, x )               else true
  get_validate_optional:  ( type, test ) -> ( x ) =>
    return x unless x?
    ### TAINT code duplication ###
    return x if test.call @, x
    throw new Error "expected an optional #{type}, got a #{typeof x}" ### TAINT `typeof` will give some strange results ###
  get_validate:           ( type, test ) -> ( x ) =>
    ### TAINT code duplication ###
    return x if test.call @, x
    throw new Error "expected a #{type}, got a #{typeof x}" ### TAINT `typeof` will give some strange results ###

  #---------------------------------------------------------------------------------------------------------
  type_of: ( x ) ->
    return 'null'       if x is null
    return 'undefined'  if x is undefined
    for type, test of @_type_of_tests
      return type if test x
    return 'unknown'


#===========================================================================================================
types = new Intertype declarations

#===========================================================================================================
module.exports = { Intertype, types, declarations, }
