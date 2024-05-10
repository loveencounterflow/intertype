

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
default_declarations = _isa =
  basetype:               ( x ) -> ( ( typeof x ) is 'string' ) and ( x is 'optional' or Reflect.has built_ins, x )
  boolean:                ( x ) -> ( x is true ) or ( x is false )
  function:               ( x ) -> ( Object::toString.call x ) is '[object Function]'
  asyncfunction:          ( x ) -> ( Object::toString.call x ) is '[object AsyncFunction]'
  symbol:                 ( x ) -> ( typeof x ) is 'symbol'
  object:                 ( x ) -> x? and ( typeof x is 'object' ) and ( ( Object::toString.call x ) is '[object Object]' )
  float:                  ( x ) -> Number.isFinite x
  infinity:               ( x ) -> ( x is +Infinity ) or ( x is -Infinity )
  text:                   ( x ) -> ( typeof x ) is 'string'
  list:                   ( x ) -> Array.isArray x
  # text:                   { template: '', test: ( ( x ) -> ( typeof x ) is 'string' ), }
  regex:                  ( x ) -> x instanceof RegExp
  # nullary:                ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 0 )
  # unary:                  ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 1 )
  # binary:                 ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 2 )
  # trinary:                ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and ( x.length is 3 )
  #.........................................................................................................
  # IT_listener:            ( x ) -> ( @isa.function x ) or ( @isa.asyncfunction x )
  # IT_note_$key:           ( x ) -> ( @isa.text x ) or ( @isa.symbol x )
  # unary_or_binary:        ( x ) -> ( @isa.unary   x ) or ( @isa.binary  x )
  # binary_or_trinary:      ( x ) -> ( @isa.binary  x ) or ( @isa.trinary x )
  # $freeze:                ( x ) -> @isa.boolean x

#-----------------------------------------------------------------------------------------------------------
# internal_declarations = { default_declarations..., }
# internal_declarations = {
#   default_declarations...
#   # foo: ( x ) -> x is 'foo'
#   # bar: ( x ) -> x is 'bar'
#   }


#===========================================================================================================
default_types = new Set Object.keys default_declarations

#===========================================================================================================
class Intertype

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  constructor: ( declarations... ) ->
    declarations.unshift default_declarations unless @ instanceof Intertype_minimal
    #.......................................................................................................
    hide @, 'isa',                @_new_strict_proxy 'isa'
    hide @, 'validate',           @_new_strict_proxy 'validate'
    hide @, 'create',             @_new_strict_proxy 'create'
    hide @, 'declarations',       @_new_strict_proxy 'declarations'
    hide @, '_tests_for_type_of', {}
    ### NOTE redirected to prevent 'JavaScript rip-off' effect ###
    hide @, 'type_of',            ( P... ) => @_type_of P...
    hide @, 'declare',            ( P... ) => @_declare P...
    #.......................................................................................................
    @_declare built_ins, declarations...
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declare: ( declarations... ) ->
    for collection in declarations
      unless _isa.object collection
        throw new E.Intertype_validation_error '^declare@1^', 'object', @__type_of _isa, collection
      for type, test of collection then do ( type, test ) =>
        #...................................................................................................
        if Reflect.has @declarations, type
          if _isa.basetype type
            throw new E.Intertype_basetype_redeclaration_forbidden '^declare@2^', type
          throw new E.Intertype_declaration_redeclaration_forbidden '^declare@3^', type
        #...................................................................................................
        { target_type
          targets
          sub_type    } = @_resolve_dotted_type         type
        declaration     = @_compile_declaration_object  type, test
        #...................................................................................................
        @declarations[        type ] = declaration
        ### TAINT pass `declaration` as sole argument, as for `create.type()` ###
        @isa[                 type ] = @_get_isa                declaration
        @isa.optional[        type ] = @_get_isa_optional       declaration
        @validate[            type ] = @_get_validate           declaration
        @validate.optional[   type ] = @_get_validate_optional  declaration
        @create[              type ] = @get_create              declaration
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
    sub_types = type.split '.'
    if ( basetype = sub_types[ 0 ] ) is 'optional'
      throw new E.Intertype_illegal_use_of_optional '^_resolve_dotted_type@2^', type
    if ( _isa.basetype basetype ) and Reflect.has @declarations, basetype
      throw new E.Intertype_illegal_use_of_basetype '^_resolve_dotted_type@3^', type, basetype
    #.......................................................................................................
    if sub_types.length > 1
      #.....................................................................................................
      for idx in  [ 0 ... sub_types.length - 1 ]
        partial_type = sub_types[ .. idx ].join '.'
        ### NOTE using `Reflect.has()` to avoid triggering Unknown Type Error: ###
        unless Reflect.has @declarations, partial_type
          throw new E.Intertype_unknown_partial_type '^_resolve_dotted_type@1^', type, partial_type
      #.....................................................................................................
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
    ### TODO: call recursively for each entry in `declaration.fields` ###
    template = { type, test: undefined, sub_tests: {}, }
    R = { template..., }
    if _isa.object declaration then Object.assign R, declaration
    else                            R.test = declaration
    #.......................................................................................................
    switch true
      #.....................................................................................................
      when _isa.text R.test then do ( ref_type = R.test ) =>
        ref_declaration = @declarations[ ref_type ]
        unless ref_declaration?
          throw new E.Intertype_unknown_type '^constructor@7^', ref_type
        do ( test = ref_declaration.test ) => R.test = nameit type, ( x ) -> test.call @, x
        Object.assign R.sub_tests, ref_declaration.sub_tests
      #.....................................................................................................
      when _isa.function R.test then do ( test = R.test ) =>
        @_validate_test_method type, test
        R.test = nameit type, ( x ) -> test.call @, x
      #.....................................................................................................
      else
        throw new E.Intertype_wrong_type '^constructor@8^', "type name, test method, or object", \
          @__type_of _isa, R.test
    #.......................................................................................................
    ### TAINT should ideally check entire object? ###
    @_validate_test_method type, R.test
    return R

  #---------------------------------------------------------------------------------------------------------
  _validate_test_method: ( type, x ) ->
    unless _isa.function x
      throw new E.Intertype_test_must_be_function '^constructor@9^', type, @__type_of _isa, x
    unless x.length is 1
      throw new E.Intertype_function_with_wrong_arity '^constructor@10^', 1, x.length
    return x


  #---------------------------------------------------------------------------------------------------------
  _new_strict_proxy: ( name ) ->
    ### Create a proxy for a new object that will throw an `Intertype_unknown_type` error when
    a non-existing property is accessed ###
    #.......................................................................................................
    optional_from_name = -> switch name
      when 'isa'          then ( x ) -> throw new E.Intertype_illegal_isa_optional       '^constructor@1^'
      when 'validate'     then ( x ) -> throw new E.Intertype_illegal_validate_optional  '^constructor@2^'
      when 'create'       then ( x ) -> throw new E.Intertype_illegal_create_optional    '^constructor@3^'
      when 'declarations' then {}
      else throw new E.Intertype_internal_error '^constructor@4^', "unknown name #{rpr name}"
    #.......................................................................................................
    get_cfg = ( ref ) =>
      get: ( target, key ) =>
        return undefined          if key is Symbol.toStringTag
        return target.constructor if key is 'constructor'
        return target.toString    if key is 'toString'
        # return target.call        if key is 'call'
        # return target.apply       if key is 'apply'
        return R if ( R = Reflect.get target, key )?
        throw new E.Intertype_unknown_type ref, key
    #.......................................................................................................
    optional =  new Proxy optional_from_name(), get_cfg "^proxy_for_#{name}_optional@1^"
    return      new Proxy { optional, },        get_cfg "^proxy_for_#{name}@1^"

  #---------------------------------------------------------------------------------------------------------
  _get_isa: ( declaration ) ->
    { type
      test
      sub_tests } = declaration
    me            = @
    #.......................................................................................................
    return nameit "isa.#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^isa_#{type}@1^", 1, arguments.length
      return false unless test.call me, x
      for field_name, sub_test of sub_tests
        return false unless sub_test.call me, x[ field_name ]
      return true

  #---------------------------------------------------------------------------------------------------------
  _get_isa_optional: ( declaration ) ->
    { type
      test
      sub_tests } = declaration
    me            = @
    #.......................................................................................................
    return nameit "isa.optional.#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^isa_optional_#{type}@1^", 1, arguments.length
      return true unless x?
      return false unless test.call me, x
      for field_name, sub_test of sub_tests
        return false unless sub_test.call me, x[ field_name ]
      return true

  #---------------------------------------------------------------------------------------------------------
  _get_validate: ( declaration ) ->
    { type
      test
      sub_tests } = declaration
    me            = @
    #.......................................................................................................
    return nameit "validate.#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^validate_#{type}@1^", 1, arguments.length
      #.......................................................................................................
      unless test.call me, x
        throw new E.Intertype_validation_error "^validate_#{type}@2^", type, me.__type_of _isa, x
      for field_name, sub_test of sub_tests
        unless sub_test.call me, x[ field_name ]
          throw new E.Intertype_validation_error "^validate_#{type}@3^", type, me.__type_of _isa, x
      #.......................................................................................................
      return x

  #---------------------------------------------------------------------------------------------------------
  _get_validate_optional: ( declaration ) ->
    { type
      test      } = declaration
    me            = @
    #.......................................................................................................
    return nameit "validate.optional.#{type}", ( x ) ->
      if ( arguments.length isnt 1 )
        throw new E.Intertype_wrong_arity "^validate_optional_#{type}@1^", 1, arguments.length
      return x unless x?
      return x if test.call me, x
      throw new E.Intertype_optional_validation_error "^validate_optional_#{type}@1^", type, me.__type_of _isa, x

  #---------------------------------------------------------------------------------------------------------
  _type_of: ( x ) ->
    if ( arguments.length isnt 1 )
      throw new E.Intertype_wrong_arity "^type_of@1^", 1, arguments.length
    @__type_of @_tests_for_type_of, x

  #---------------------------------------------------------------------------------------------------------
  __type_of: ( test_method_map, x ) ->
    return 'null'       if x is null
    return 'undefined'  if x is undefined
    for type, test of test_method_map
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
class Intertype_minimal extends Intertype


#===========================================================================================================
types = new Intertype()
do =>
  { isa
    validate
    create
    type_of     } = types
  module.exports = {
    Intertype, Intertype_minimal
    types, isa, validate, create, type_of,
    declarations: default_declarations, }
