

'use strict'


#===========================================================================================================
WG                        = require 'webguy'
{ rpr }                   = WG.trm
{ hide
  nameit }                = WG.props
{ debug }                 = console
E                         = require './errors'


#===========================================================================================================
built_ins =
  anything:               ( x ) -> true
  nothing:                ( x ) -> not x?
  something:              ( x ) -> x?
  null:                   ( x ) -> x is null
  undefined:              ( x ) -> x is undefined
  unknown:                ( x ) -> ( @type_of x ) is 'unknown'

#-----------------------------------------------------------------------------------------------------------
default_declarations =
  boolean:                ( x ) -> ( x is true ) or ( x is false )
  function:               ( x ) -> ( Object::toString.call x ) is '[object Function]'
  asyncfunction:          ( x ) -> ( Object::toString.call x ) is '[object AsyncFunction]'
  symbol:                 ( x ) -> ( typeof x ) is 'symbol'
  object:                 ( x ) -> x? and ( typeof x is 'object' ) and ( ( Object::toString.call x ) is '[object Object]' )
  float:                  ( x ) -> Number.isFinite x
  text:                   ( x ) -> ( typeof x ) is 'string'
  regex:                  ( x ) -> x instanceof RegExp
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
  ### TAINT may want to check type, arities ###
  constructor: ( declarations = null ) ->
    declarations ?= default_declarations
    #.......................................................................................................
    hide @, 'isa',                { optional: {}, }
    hide @, 'validate',           { optional: {}, }
    hide @, '_tests_for_type_of', {}
    hide @, 'type_of',            ( P... ) => @_type_of P...
    #.......................................................................................................
    ### TAINT prevent accidental overwrites ###
    for collection in [ built_ins, declarations, ]
      for type, test of collection then do ( type, test ) =>
        if Reflect.has @isa, type
          throw new Error "unable to re-declare type #{rpr type}"
        @isa[               type ] = @get_isa               type, test
        @isa.optional[      type ] = @get_isa_optional      type, test
        @validate[          type ] = @get_validate          type, test
        @validate.optional[ type ] = @get_validate_optional type, test
        @_tests_for_type_of[    type ] = @isa[ type ] if collection isnt built_ins
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  get_isa: ( type, test ) -> nameit "isa_#{type}", ( x ) =>
    test.call @, x

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  get_isa_optional: ( type, test ) -> nameit "isa_optional_#{type}", ( x ) =>
    if x? then ( test.call @, x ) else true

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  get_validate: ( type, test ) -> nameit "validate_#{type}", ( x ) =>
    return x if test.call @, x
    throw new E.Intertype_validation_error "^validate_#{type}@1^", type, typeof x ### TAINT `typeof` will give some strange results ###

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  get_validate_optional: ( type, test ) -> nameit "validate_optional_#{type}", ( x ) =>
    return x unless x?
    return x if test.call @, x
    throw new E.Intertype_optional_validation_error "^validate_optional_#{type}@1^", type, typeof x ### TAINT `typeof` will give some strange results ###

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  _type_of: ( x ) ->
    return 'null'       if x is null
    return 'undefined'  if x is undefined
    for type, test of @_tests_for_type_of
      return type if test x
    return 'unknown'


#===========================================================================================================
types = new Intertype default_declarations

#===========================================================================================================
module.exports = { Intertype, types, declarations: default_declarations, }
