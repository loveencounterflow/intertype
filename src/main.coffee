

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

#-----------------------------------------------------------------------------------------------------------
# internal_declarations = { default_declarations..., }
internal_declarations = {
  default_declarations...
  # foo: ( x ) -> x is 'foo'
  # bar: ( x ) -> x is 'bar'
  }


#===========================================================================================================
class _Intertype

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  constructor: ( declarations = null ) ->
    declarations ?= default_declarations
    #.......................................................................................................
    hide @, 'isa',                @_new_strict_proxy 'isa'
    hide @, 'validate',           @_new_strict_proxy 'validate'
    hide @, '_tests_for_type_of', {}
    hide @, 'type_of',            ( P... ) => @_type_of P...
    #.......................................................................................................
    for collection in [ built_ins, declarations, ]
      for type, test of collection then do ( type, test ) =>
        #...................................................................................................
        if Reflect.has @isa, type
          throw new Error "unable to re-declare type #{rpr type}"
        #...................................................................................................
        if ( @constructor isnt _Intertype )
          unless internal_types.isa.function test
            throw new E.Intertype_wrong_type '^constructor@1^', "function", internal_types.type_of test
          unless internal_types.isa.unary test
            throw new E.Intertype_function_with_wrong_arity '^constructor@2^', 1, test.length
        #...................................................................................................
        @isa[               type ] = @get_isa               type, test
        @isa.optional[      type ] = @get_isa_optional      type, test
        @validate[          type ] = @get_validate          type, test
        @validate.optional[ type ] = @get_validate_optional type, test
        @_tests_for_type_of[    type ] = @isa[ type ] if collection isnt built_ins
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _new_strict_proxy: ( name ) ->
    ### Create a proxy for a new object that will throw an `Intertype_unknown_type` error when
    a non-existing property is accessed ###
    get_cfg = ( ref ) =>
      get: ( target, key ) =>
        return undefined          if key is Symbol.toStringTag
        return target.constructor if key is 'constructor'
        return target.toString    if key is 'toString'
        # return target.call        if key is 'call'
        # return target.apply       if key is 'apply'
        return R if ( R = Reflect.get target, key )?
        throw new E.Intertype_unknown_type ref, key
    optional =  new Proxy {},             get_cfg "^proxy_for_#{name}_optional@1^"
    return      new Proxy { optional, },  get_cfg "^proxy_for_#{name}@1^"

  #---------------------------------------------------------------------------------------------------------
  get_isa: ( type, test ) ->
    me = @
    return nameit "isa_#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^isa_#{type}@1^", 1, arguments.length
      return test.call me, x

  #---------------------------------------------------------------------------------------------------------
  get_isa_optional: ( type, test ) ->
    me = @
    return nameit "isa_optional_#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^isa_optional_#{type}@1^", 1, arguments.length
      if x? then ( test.call me, x ) else true

  #---------------------------------------------------------------------------------------------------------
  get_validate: ( type, test ) ->
    me = @
    return nameit "validate_#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^validate_#{type}@1^", 1, arguments.length
      return x if test.call me, x
      throw new E.Intertype_validation_error "^validate_#{type}@1^", type, typeof x ### TAINT `typeof` will give some strange results ###

  #---------------------------------------------------------------------------------------------------------
  get_validate_optional: ( type, test ) ->
    me = @
    return nameit "validate_optional_#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^validate_optional_#{type}@1^", 1, arguments.length
      return x unless x?
      return x if test.call me, x
      throw new E.Intertype_optional_validation_error "^validate_optional_#{type}@1^", type, typeof x ### TAINT `typeof` will give some strange results ###

  #---------------------------------------------------------------------------------------------------------
  _type_of: ( x ) ->
    if ( arguments.length isnt 1 )
      throw new E.Intertype_wrong_arity "^type_of@1^", 1, arguments.length
    return 'null'       if x is null
    return 'undefined'  if x is undefined
    for type, test of @_tests_for_type_of
      return type if test x
    return 'unknown'

#===========================================================================================================
class Intertype extends _Intertype


#===========================================================================================================
internal_types  = new _Intertype internal_declarations
types           = new Intertype default_declarations

#===========================================================================================================
module.exports = { Intertype, types, declarations: default_declarations, }
