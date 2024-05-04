

'use strict'


#===========================================================================================================
WG                        = require 'webguy'
{ rpr }                   = WG.trm
{ hide
  nameit }                = WG.props
{ debug }                 = console
E                         = require './errors'
set                       = ( t, k, v ) -> Object.defineProperty t, k, { value: v, enumerable: true, }


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
  basetype:               ( x ) -> ( ( typeof x ) is 'string' ) and ( x is 'optional' or Reflect.has built_ins, x )
  boolean:                ( x ) -> ( x is true ) or ( x is false )
  function:               ( x ) -> ( Object::toString.call x ) is '[object Function]'
  asyncfunction:          ( x ) -> ( Object::toString.call x ) is '[object AsyncFunction]'
  symbol:                 ( x ) -> ( typeof x ) is 'symbol'
  object:                 ( x ) -> x? and ( typeof x is 'object' ) and ( ( Object::toString.call x ) is '[object Object]' )
  float:                  ( x ) -> Number.isFinite x
  text:                   { template: '', test: ( ( x ) -> ( typeof x ) is 'string' ), }
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
  ### if set to `true`, insertion of default_declarations is blocked ###
  @_minimal: true

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  constructor: ( declarations... ) ->
    declarations.unshift default_declarations unless @constructor._minimal
    #.......................................................................................................
    hide @, 'isa',                @_new_strict_proxy 'isa'
    hide @, 'validate',           @_new_strict_proxy 'validate'
    hide @, 'create',             @_new_strict_proxy 'create'
    hide @, 'declarations',       @_new_strict_proxy 'declarations'
    hide @, '_tests_for_type_of', {}
    hide @, 'type_of',            ( P... ) => @_type_of P...
    hide @, 'declare',            ( P... ) => @_declare P...
    #.......................................................................................................
    @_declare built_ins, declarations...
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declare: ( declarations... ) ->
    for collection in declarations
      for type, test of collection then do ( type, test ) =>
        #...................................................................................................
        { target_type
          targets
          sub_type    } = @_resolve_dotted_type         type
        declaration     = @_compile_declaration_object  type, test
        #...................................................................................................
        if Reflect.has @declarations, type
          if ( ( internal_types?.isa.basetype type ) ? false )
            throw new E.Intertype_basetype_redeclaration_forbidden '^constructor@1^', type
          throw new E.Intertype_declaration_redeclaration_forbidden '^constructor@2^', type
        #...................................................................................................
        @declarations[        type ] = declaration
        ### TAINT pass `declaration` as sole argument, as for `create.type()` ###
        @isa[                 type ] = @get_isa               declaration
        @isa.optional[        type ] = @get_isa_optional      type, declaration.test
        @validate[            type ] = @get_validate          type, declaration.test
        @validate.optional[   type ] = @get_validate_optional type, declaration.test
        @create[              type ] = @get_create            declaration
        @_tests_for_type_of[  type ] = declaration.test if collection isnt built_ins
        #...................................................................................................
        if targets?
          set targets[ 'isa'                ], sub_type, @isa[                type ]
          set targets[ 'isa.optional'       ], sub_type, @isa.optional[       type ]
          set targets[ 'validate'           ], sub_type, @validate[           type ]
          set targets[ 'validate.optional'  ], sub_type, @validate.optional[  type ]
          @declarations[ target_type ].sub_tests[ sub_type ] = @isa[ type ]
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  _resolve_dotted_type: ( type ) ->
    ### analyze flat type declarations with dot notation ###
    target_type = null
    targets     = null
    sub_type    = null
    #.......................................................................................................
    if ( sub_types = type.split '.' ).length > 1
      for idx in  [ 0 ... sub_types.length - 1 ]
        partial_type = sub_types[ .. idx ].join '.'
        ### NOTE using `Reflect.has()` to avoid triggering Unknown Type Error: ###
        unless Reflect.has @declarations, partial_type
          throw new E.Intertype_unknown_partial_type '^constructor@1^', type, partial_type
      target_type = partial_type
      sub_type    = sub_types.at -1
      targets     =
        'isa':                @isa[               target_type ]
        'isa.optional':       @isa.optional[      target_type ]
        'validate':           @validate[          target_type ]
        'validate.optional':  @validate.optional[ target_type ]
    #.......................................................................................................
    return { type, target_type, targets, sub_type, }

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_object: ( type, declaration ) ->
    ###

    _compile_declaration_object: ( type, declaration ) ->

    * handle internal usage
    * set `R` to object with defaults
    * if `declaration` is text:
      * ensure it's a known type
      * construct test method (Q: if ref type should change later, will this test use the old or the new
        meaning? A: you can't change type declarations)
    * if declaration is function:
      * validate arity
      * wrap for use as `R.test`
    * call recursively for each entry in `declaration.fields`
    * return `R`

    ###
    template = { type, test: null, sub_tests: {}, }
    if ( @constructor is _Intertype )
      return { template..., test: declaration,  } if default_declarations.function declaration
      return { template..., declaration...,     }
    #.......................................................................................................
    R = { template..., }
    #.......................................................................................................
    switch true
      #.....................................................................................................
      when internal_types.isa.text declaration then do ( ref_type = declaration ) =>
        unless ( test = @declarations[ ref_type ]?.test )?
          throw new E.Intertype_unknown_type '^constructor@1^', ref_type
        R.test = nameit type, ( x ) -> test.call @, x
      #.....................................................................................................
      when internal_types.isa.function declaration then do ( test = declaration ) =>
        @_validate_test_method type, test
        R.test = nameit type, ( x ) -> test.call @, x
      #.....................................................................................................
      when internal_types.isa.object declaration
        @_validate_test_method type, declaration.test
        Object.assign R, declaration
      #.....................................................................................................
      else
        throw new E.Intertype_wrong_type '^constructor@1^', "type name, test method, or object", \
          internal_types.type_of declaration
    #.......................................................................................................
    ### TAINT should ideally check entire object? ###
    #.......................................................................................................
    return R
    #.......................................................................................................
    #.......................................................................................................
    #.......................................................................................................
    #.......................................................................................................
    #.......................................................................................................
    if internal_types.isa.text test
      unless ( declaration = @declarations[ test ] )?
        throw new E.Intertype_unknown_type '^constructor@1^', type
      ######################################################################################################
      N = do =>
        source = """N.f = function(x) { return this.isa.#{test}(x); }"""
        N = {}
        eval source, { N, }
        N
      test      = { template..., test: ( nameit type, N.f ), }
      ######################################################################################################
      # test      = { template..., declaration..., }
      test.type = type
    #.......................................................................................................
    switch true
      #.....................................................................................................
      when internal_types.isa.function test
        R = { template..., type, test, } ### TAINT assign template ###
      #.....................................................................................................
      when internal_types.isa.object test
        R = { template..., type, test..., }
      #.....................................................................................................
      else
        throw new E.Intertype_wrong_type '^constructor@1^', "type name, function or object", internal_types.type_of test
    #.......................................................................................................
    if internal_types.isa.text R.test
      unless ( declaration = @declarations[ R.test ] )?
        throw new E.Intertype_unknown_type '^constructor@1^', type
      R       = { declaration..., }
      R.type  = type
    #.......................................................................................................
    ### TAINT should ideally check entire object? ###
    unless internal_types.isa.function R.test
      throw new E.Intertype_test_must_be_function '^constructor@2^', 'function', internal_types.type_of test
    unless internal_types.isa.unary R.test
      throw new E.Intertype_function_with_wrong_arity '^constructor@2^', 1, R.test.length
    R.sub_tests = {}
    return R

  #---------------------------------------------------------------------------------------------------------
  _validate_test_method: ( type, x ) ->
    unless internal_types.isa.function x
      throw new E.Intertype_test_must_be_function '^constructor@2^', type, internal_types.type_of x
    unless internal_types.isa.unary x
      throw new E.Intertype_function_with_wrong_arity '^constructor@2^', 1, x.length
    return x

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
  get_isa: ( declaration ) ->
    me = @
    return nameit "isa.#{declaration.type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^isa_#{declaration.type}@1^", 1, arguments.length
      return false unless declaration.test.call me, x
      for field_name, sub_test of declaration.sub_tests
        return false unless sub_test.call me, x[ field_name ]
      return true

  #---------------------------------------------------------------------------------------------------------
  get_isa_optional: ( type, test ) ->
    me = @
    return nameit "isa.optional.#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^isa_optional_#{type}@1^", 1, arguments.length
      if x? then ( test.call me, x ) else true

  #---------------------------------------------------------------------------------------------------------
  get_validate: ( type, test ) ->
    me = @
    return nameit "validate.#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^validate_#{type}@1^", 1, arguments.length
      return x if test.call me, x
      throw new E.Intertype_validation_error "^validate_#{type}@1^", type, typeof x ### TAINT `typeof` will give some strange results ###

  #---------------------------------------------------------------------------------------------------------
  get_validate_optional: ( type, test ) ->
    me = @
    return nameit "validate.optional.#{type}", ( x ) ->
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

  #---------------------------------------------------------------------------------------------------------
  get_create: ( declaration ) ->
    { type
      create
      template  } = declaration
    me            = @
    switch true
      when create?
        unless me.isa.function create
          throw new E.Intertype_create_must_be_function "^get_create@1^", type, me.type_of create
        return nameit "create_#{type}", ( P... ) ->
          unless me.isa[ type ] ( R = create.call me, P... )
            throw new E.Intertype_wrong_arguments_for_create "^create_#{type}@1^", type, me.type_of R
          return R
      when template?
        return @_get_create_from_template declaration
    return nameit "create_#{type}", ( P... ) ->
      throw new E.Intertype_create_not_available "^create_#{type}@2^", type

  #---------------------------------------------------------------------------------------------------------
  _get_create_from_template: ( declaration ) ->
    ### TAINT must distinguish whether value is object or not, use assign ###
    { type
      template  } = declaration
    me            = @
    #.......................................................................................................
    if default_declarations.function template
      if ( template.length isnt 0 )
        throw new E.Intertype_wrong_template_arity "^get_create@2^", type, template.length
      return nameit "create_#{type}", ->
        if ( arguments.length isnt 0 )
          throw new E.Intertype_wrong_arity "^create_#{type}@3^", 0, arguments.length
        unless me.isa[ type ] ( R = template.call me )
          throw new E.Intertype_wrong_arguments_for_create "^create_#{type}@4^", type, me.type_of R
        return R
    #.......................................................................................................
    ### TAINT case of constant template could be handled when validating the declaration ###
    return nameit "create_#{type}", ->
      if ( arguments.length isnt 0 )
        throw new E.Intertype_wrong_arity "^create_#{type}@6^", 0, arguments.length
      unless me.isa[ type ] ( R = template )
        throw new E.Intertype_wrong_arguments_for_create "^create_#{type}@7^", type, me.type_of R
      return R


#===========================================================================================================
class Intertype_minimal extends _Intertype
class Intertype         extends _Intertype
  @_minimal: false


#===========================================================================================================
internal_types  = new _Intertype internal_declarations
types           = new Intertype()
{ isa
  validate
  create
  type_of     } = types

#===========================================================================================================
module.exports = {
  Intertype, Intertype_minimal
  types, isa, validate, create, type_of,
  declarations: default_declarations, }
