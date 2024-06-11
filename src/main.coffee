

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
basetypes =
  anything:               ( x ) -> true
  nothing:                ( x ) -> not x?
  something:              ( x ) -> x?
  null:                   ( x ) -> x is null
  undefined:              ( x ) -> x is undefined
  unknown:                ( x ) -> ( @type_of x ) is 'unknown'

_TMP_basetype_names          = new Set Object.keys basetypes
_TMP_basetype_names_matcher  = /// \b ( #{[ _TMP_basetype_names..., ].join '|'} ) \b ///

#-----------------------------------------------------------------------------------------------------------
_isa =
  basetype:               ( x ) -> _TMP_basetype_names.has x
  boolean:                ( x ) -> ( x is true ) or ( x is false )
  asyncfunction:          ( x ) -> ( Object::toString.call x ) is '[object AsyncFunction]'
  generatorfunction:      ( x ) => ( Object::toString.call x ) is '[object GeneratorFunction]'
  generator:              ( x ) => ( Object::toString.call x ) is '[object Generator]'
  asyncgeneratorfunction: ( x ) => ( Object::toString.call x ) is '[object AsyncGeneratorFunction]'
  asyncgenerator:         ( x ) => ( Object::toString.call x ) is '[object AsyncGenerator]'
  function:               ( x ) -> ( Object::toString.call x ) is '[object Function]'
  symbol:                 ( x ) -> ( typeof x ) is 'symbol'
  object:                 ( x ) -> x? and ( typeof x is 'object' ) and ( ( Object::toString.call x ) is '[object Object]' )
  float:                  ( x ) -> Number.isFinite x
  infinity:               ( x ) -> ( x is +Infinity ) or ( x is -Infinity )
  text:                   ( x ) -> ( typeof x ) is 'string'
  list:                   ( x ) -> Array.isArray x
  regex:                  ( x ) -> x instanceof RegExp
  set:                    ( x ) -> x instanceof Set
  map:                    ( x ) -> x instanceof Map
  nan:                    ( x ) => Number.isNaN         x
  finite:                 ( x ) => Number.isFinite      x ### TAINT make sure no non-numbers slip through ###
  integer:                ( x ) => Number.isInteger     x ### TAINT make sure no non-numbers slip through ###
  safeinteger:            ( x ) => Number.isSafeInteger x ### TAINT make sure no non-numbers slip through ###

  # text:                   { template: '', test: ( ( x ) -> ( typeof x ) is 'string' ), }
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

#-----------------------------------------------------------------------------------------------------------
default_declarations =
  basetype:
    test:         _isa.basetype
  boolean:
    test:         _isa.boolean
    template:     false
  asyncfunction:
    test:         _isa.asyncfunction
    template:     -> await undefined
  generatorfunction:
    test:         _isa.generatorfunction
  asyncgeneratorfunction:
    test:         _isa.asyncgeneratorfunction
  asyncgenerator:
    test:         _isa.asyncgenerator
  generator:
    test:         _isa.generator
  function:
    test:         _isa.function
    template:     -> ->
  symbol:
    test:         _isa.symbol
    template:     -> Symbol ''
  object:
    test:         _isa.object
    template:     -> {}
  float:
    test:         _isa.float
    create: ( x ) ->
      return 0 if x in [ false, null, undefined, 0, '0', ]
      return 1 if x in [ true,  '1', ]
      return x if Number.isFinite x
      return parseFloat x if @isa.text
      return x
  infinity:
    test:         _isa.infinity
    template:     Infinity
  text:
    test:         _isa.text
    create: ( x ) ->
      return '' unless x?
      return x if @isa.text x
      return rpr x
  list:
    test:         _isa.list
    template:     -> []
  regex:
    test:         _isa.regex
    template:     -> new RegExp()
  set:
    test:         _isa.set
    template:     -> new Set()
  map:
    test:         _isa.map
    template:     -> new Map()
  nan:
    test:         _isa.nan
    template:     NaN
  finite:
    test:         _isa.finite
    template:     0
  integer:
    test:         _isa.integer
    kind:         'float'
    create: ( x ) ->
      return 0 if x in [ false, null, undefined, 0, '0', ]
      return 1 if x in [ true,  '1', ]
      return x if Number.isInteger x
      return parseInt x, 10 if @isa.text
      return x
  safeinteger:
    test:         _isa.safeinteger
    template:     0
  #.........................................................................................................
  'empty':            { role: 'qualifier', }
  'nonempty':         { role: 'qualifier', }
  'empty.list':       ( x ) -> ( @isa.list    x ) and ( x.length                  is  0 )
  'empty.text':       ( x ) -> ( @isa.text    x ) and ( x.length                  is  0 )
  'empty.set':        ( x ) -> ( @isa.set     x ) and ( x.size                    is  0 )
  'empty.map':        ( x ) -> ( @isa.map     x ) and ( x.size                    is  0 )
  'empty.object':     ( x ) -> ( @isa.object  x ) and ( ( Object.keys x ).length  is  0 )
  'nonempty.list':    ( x ) -> ( @isa.list    x ) and ( x.length                  >   0 )
  'nonempty.text':    ( x ) -> ( @isa.text    x ) and ( x.length                  >   0 )
  'nonempty.set':     ( x ) -> ( @isa.set     x ) and ( x.size                    >   0 )
  'nonempty.map':     ( x ) -> ( @isa.map     x ) and ( x.size                    >   0 )
  'nonempty.object':  ( x ) -> ( @isa.object  x ) and ( ( Object.keys x ).length  >   0 )
  #.........................................................................................................
  'positive':           { role: 'qualifier', }
  'negative':           { role: 'qualifier', }
  'posnaught':          { role: 'qualifier', }
  'negnaught':          { role: 'qualifier', }
  'positive.float':     ( x ) -> ( @isa.float     x ) and ( x >  0 )
  'positive.integer':   ( x ) -> ( @isa.integer   x ) and ( x >  0 )
  'positive.infinity':  ( x ) -> ( @isa.infinity  x ) and ( x >  0 )
  'negative.float':     ( x ) -> ( @isa.float     x ) and ( x <  0 )
  'negative.integer':   ( x ) -> ( @isa.integer   x ) and ( x <  0 )
  'negative.infinity':  ( x ) -> ( @isa.infinity  x ) and ( x <  0 )
  'posnaught.float':    ( x ) -> ( @isa.float     x ) and ( x >= 0 )
  'posnaught.integer':  ( x ) -> ( @isa.integer   x ) and ( x >= 0 )
  'posnaught.infinity': ( x ) -> ( @isa.infinity  x ) and ( x >= 0 )
  'negnaught.float':    ( x ) -> ( @isa.float     x ) and ( x <= 0 )
  'negnaught.integer':  ( x ) -> ( @isa.integer   x ) and ( x <= 0 )
  'negnaught.infinity': ( x ) -> ( @isa.infinity  x ) and ( x <= 0 )
  #.........................................................................................................
  cardinal:
    test:         'posnaught.integer'
    create: ( x ) ->
      return 0 if x in [ false, null, undefined, 0, '0', ]
      return 1 if x in [ true,  '1', ]
      return x if Number.isInteger x
      return parseInt x, 10 if @isa.text
      return x
  #.........................................................................................................
  'frozen':             { role: 'qualifier', }
  'sealed':             { role: 'qualifier', }
  'extensible':         { role: 'qualifier', }
  'frozen.list':        ( x ) -> ( @isa.list    x ) and ( Object.isFrozen     x )
  'sealed.list':        ( x ) -> ( @isa.list    x ) and ( Object.isSealed     x )
  'extensible.list':    ( x ) -> ( @isa.list    x ) and ( Object.isExtensible x )
  'frozen.object':      ( x ) -> ( @isa.object  x ) and ( Object.isFrozen     x )
  'sealed.object':      ( x ) -> ( @isa.object  x ) and ( Object.isSealed     x )
  'extensible.object':  ( x ) -> ( @isa.object  x ) and ( Object.isExtensible x )
  #.........................................................................................................
  'odd':                    { role: 'qualifier', }
  'even':                   { role: 'qualifier', }
  'odd.positive':           { role: 'qualifier', }
  'odd.negative':           { role: 'qualifier', }
  'odd.posnaught':          { role: 'qualifier', }
  'odd.negnaught':          { role: 'qualifier', }
  'even.positive':          { role: 'qualifier', }
  'even.negative':          { role: 'qualifier', }
  'even.posnaught':         { role: 'qualifier', }
  'even.negnaught':         { role: 'qualifier', }
  'odd.integer':            ( x ) -> ( @isa.integer x ) and ( x %% 2 ) is 1
  'even.integer':           ( x ) -> ( @isa.integer x ) and ( x %% 2 ) is 0
  'odd.positive.integer':   ( x ) -> ( @isa.positive.integer x ) and ( @isa.odd.integer  x )
  'even.positive.integer':  ( x ) -> ( @isa.positive.integer x ) and ( @isa.even.integer x )
  'odd.negative.integer':   ( x ) -> ( @isa.negative.integer x ) and ( @isa.odd.integer  x )
  'even.negative.integer':  ( x ) -> ( @isa.negative.integer x ) and ( @isa.even.integer x )
  'odd.posnaught.integer':  ( x ) -> ( @isa.posnaught.integer x ) and ( @isa.odd.integer  x )
  'even.posnaught.integer': ( x ) -> ( @isa.posnaught.integer x ) and ( @isa.even.integer x )
  'odd.negnaught.integer':  ( x ) -> ( @isa.negnaught.integer x ) and ( @isa.odd.integer  x )
  'even.negnaught.integer': ( x ) -> ( @isa.negnaught.integer x ) and ( @isa.even.integer x )

#===========================================================================================================
default_types         = new Set Object.keys default_declarations
_TMP_minimal_types    = ( new Set Object.keys basetypes ).union default_types   ### TAINT unfortunate choice of name ###
_TMP_isa_minimal_type = ( x ) -> _TMP_minimal_types.has x

#===========================================================================================================
class Intertype

  #---------------------------------------------------------------------------------------------------------
  ### TAINT may want to check type, arities ###
  constructor: ( declarations... ) ->
    #.......................................................................................................
    hide @, 'isa',                @_new_strict_proxy 'isa'
    hide @, 'evaluate',           @_new_strict_proxy 'evaluate'
    hide @, 'validate',           @_new_strict_proxy 'validate'
    hide @, 'create',             @_new_strict_proxy 'create'
    hide @, 'declarations',       @_new_strict_proxy 'declarations'
    hide @, '_tests_for_type_of', {}
    ### NOTE redirected to prevent 'JavaScript rip-off' effect ###
    hide @, 'type_of',            nameit 'type_of', ( P... ) => @_type_of           P...
    hide @, 'declare',            nameit 'declare', ( P... ) => @_declare_usertypes P...
    #.......................................................................................................
    @_declare_basetypes basetypes
    @_declare_usertypes default_declarations unless @ instanceof Intertype_minimal
    @_declare_usertypes declarations...
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declare_basetypes: ( P... ) -> @_declare { role: 'basetype', }, P...
  _declare_usertypes: ( P... ) -> @_declare { role: 'usertype', }, P...

  #---------------------------------------------------------------------------------------------------------
  _declare: ( cfg, declarations... ) ->
    for collection in declarations
      unless _isa.object collection
        throw new E.Intertype_validation_error '^declare@1^', 'object', __type_of @, _isa, collection
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
        declaration     = @_compile_declaration_object  cfg, type, test
        #...................................................................................................
        @declarations[        type ] = declaration
        @isa[                 type ] = @_get_isa                declaration
        @isa.optional[        type ] = @_get_isa_optional       declaration
        @evaluate[            type ] = @_get_evaluate           declaration
        @evaluate.optional[   type ] = @_get_evaluate_optional  declaration
        @validate[            type ] = @_get_validate           declaration
        @validate.optional[   type ] = @_get_validate_optional  declaration
        @create[              type ] = @_get_create             declaration
        @_tests_for_type_of[  type ] = declaration.test if collection isnt basetypes ### TAINT should better check against _TMP_basetype_names ? ###
        #...................................................................................................
        if targets?
          set targets[ 'isa'                ], sub_type, @isa[                type ]
          set targets[ 'isa.optional'       ], sub_type, @isa.optional[       type ]
          set targets[ 'evaluate'           ], sub_type, @evaluate[           type ]
          set targets[ 'evaluate.optional'  ], sub_type, @evaluate.optional[  type ]
          set targets[ 'validate'           ], sub_type, @validate[           type ]
          set targets[ 'validate.optional'  ], sub_type, @validate.optional[  type ]
          @declarations[ target_type ].sub_tests[ sub_type ] = @isa[ type ]
        #...................................................................................................
        ### TAINT turn into method, must also look into template should fields be missing ###
        if declaration.fields?
          for field_name, test of declaration.fields
            fq_type_name = "#{type}.#{field_name}"
            @declare { ["#{fq_type_name}"]: test, }
        #...................................................................................................
        for prefix from walk_prefixes type
          @declarations[ prefix ].sub_fields.push type
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
        'evaluate':           @evaluate[          target_type ]
        'evaluate.optional':  @evaluate.optional[ target_type ]
        'validate':           @validate[          target_type ]
        'validate.optional':  @validate.optional[ target_type ]
    #.......................................................................................................
    return { type, target_type, targets, sub_type, }

  #---------------------------------------------------------------------------------------------------------
  _get_declaration_template: ( type, cfg = null, kind = null ) ->
    kind = if _isa.text kind then kind else 'unknown'
    return { type, kind, cfg..., test: undefined, sub_tests: {}, sub_fields: [], }

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_object: ( cfg, type, declaration ) ->
    ### TODO: call recursively for each entry in `declaration.fields` ###
    R = @_get_declaration_template type, cfg, declaration.test ? null
    if _isa.object declaration then Object.assign R, declaration
    else                            R.test = declaration
    #.......................................................................................................
    if not R.test?
      if ( R.role is 'qualifier' ) or ( @_looks_like_an_object_declaration declaration )
        R.test = 'object'
        R.kind = 'object' if R.kind is 'unknown'
    #.......................................................................................................
    switch true
      #.....................................................................................................
      when _isa.text R.test then do ( ref_type = R.test ) =>
        if /\boptional\b/.test ref_type # ( ref_type is 'optional' ) or ( ref_type.startsWith 'optional.' )
          throw new E.Intertype_illegal_use_of_optional '^_compile_declaration_object@1^', type
        if ( basetype = @_extract_first_basetype_name ref_type )?
          throw new E.Intertype_illegal_use_of_basetype '^_compile_declaration_object@2^', type, basetype
        ref_declaration = @declarations[ ref_type ]
        unless ref_declaration?
          throw new E.Intertype_unknown_type '^_compile_declaration_object@3^', ref_type
        do ( test = ref_declaration.test ) => R.test = nameit type, ( x ) -> test.call @, x
        # debug '^_compile_declaration_object@332^', { type, ref_type, test: R.test, }
        Object.assign R.sub_tests, ref_declaration.sub_tests
      #.....................................................................................................
      when _isa.function R.test then do ( test = R.test ) =>
        @_validate_test_method type, test
        R.test = nameit type, ( x ) -> test.call @, x
      #.....................................................................................................
      else
        throw new E.Intertype_wrong_type_for_test_method '^_compile_declaration_object@4^', __type_of @, _isa, R.test
    #.......................................................................................................
    ### TAINT should ideally check entire object? ###
    @_validate_test_method type, R.test
    return R

  #---------------------------------------------------------------------------------------------------------
  _validate_test_method: ( type, x ) ->
    unless _isa.function x
      throw new E.Intertype_test_must_be_function '^_validate_test_method@1^', type, __type_of @, _isa, x
    unless x.length is 1
      throw new E.Intertype_function_with_wrong_arity '^_validate_test_method@2^', 1, x.length
    return x

  #---------------------------------------------------------------------------------------------------------
  _extract_first_basetype_name: ( type ) ->
    unless _isa.text type
      throw new E.Intertype_internal_error '^_extract_first_basetype_name@1^',
        "expected text, got a #{__type_of @, _isa, type}"
    return null unless ( match = type.match _TMP_basetype_names_matcher )?
    return match[ 0 ]

  #---------------------------------------------------------------------------------------------------------
  _new_strict_proxy: ( name ) ->
    ### Create a proxy for a new object that will throw an `Intertype_unknown_type` error when
    a non-existing property is accessed ###
    #.......................................................................................................
    optional_from_name = -> switch name
      when 'isa'          then ( x ) -> throw new E.Intertype_illegal_isa_optional       '^_new_strict_proxy@1^'
      when 'evaluate'     then ( x ) -> throw new E.Intertype_illegal_evaluate_optional  '^_new_strict_proxy@2^'
      when 'validate'     then ( x ) -> throw new E.Intertype_illegal_validate_optional  '^_new_strict_proxy@3^'
      when 'create'       then ( x ) -> throw new E.Intertype_illegal_create_optional    '^_new_strict_proxy@4^'
      else throw new E.Intertype_internal_error '^_new_strict_proxy@5^', "unknown name #{rpr name}"
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
    switch name
      when 'declarations' then  optional = @_get_declaration_template 'optional', { role: 'optional', }
      when 'optional'     then  optional = new Proxy {},                          get_cfg "^proxy_for_#{name}_optional@1^"
      else                      optional = new Proxy ( optional_from_name name ), get_cfg "^proxy_for_#{name}_optional@1^"
    return new Proxy { optional, }, get_cfg "^proxy_for_#{name}@1^"

  #---------------------------------------------------------------------------------------------------------
  _get_isa: ( declaration ) ->
    { type
      role
      test
      sub_tests } = declaration
    me            = @
    method_name   = "isa.#{type}"
    #.......................................................................................................
    return switch true
      #.....................................................................................................
      ### deal with sum types (tagged unions, variants) ###
      when role is 'qualifier' then nameit method_name, ( x ) ->
        me._validate_arity_for_method method_name, 1, arguments.length
        for field_name, sub_test of sub_tests
          return true if sub_test.call me, x
        return false
      #.....................................................................................................
      ### deal with product types (records) ###
      when role in [ 'basetype', 'usertype', ] then nameit method_name, ( x ) ->
        me._validate_arity_for_method method_name, 1, arguments.length
        return false unless test.call me, x
        for field_name, sub_test of sub_tests
          return false unless sub_test.call me, x[ field_name ]
        return true
      #.....................................................................................................
      else throw new Error '85734982578457238457'

  #---------------------------------------------------------------------------------------------------------
  _get_isa_optional: ( declaration ) ->
    { type      } = declaration
    me            = @
    test          = @isa[ type ]
    method_name   = "isa.optional.#{type}"
    #.......................................................................................................
    return nameit method_name, ( x ) ->
      me._validate_arity_for_method method_name, 1, arguments.length
      return true unless x?
      return test x

  #---------------------------------------------------------------------------------------------------------
  _get_evaluate: ( declaration ) ->
    { type
      test
      sub_tests
      sub_fields } = declaration
    me            = @
    method_name   = "evaluate.#{type}"
    #.......................................................................................................
    return nameit method_name, ( x ) ->
      me._validate_arity_for_method method_name, 1, arguments.length
      R         = {}
      R[ type ] = me.isa[ type ] x
      if x?
        for field_name, sub_test of sub_tests
          Object.assign R, me.evaluate[ type ][ field_name ] x?[ field_name ]
      else
        for fq_name in sub_fields
          R[ fq_name ] = false
      return R

  #---------------------------------------------------------------------------------------------------------
  _get_evaluate_optional: ( declaration ) ->
    { type
      test
      sub_tests } = declaration
    me            = @
    method_name   = "evaluate.optional.#{type}"
    #.......................................................................................................
    return nameit method_name, ( x ) ->
      me._validate_arity_for_method method_name, 1, arguments.length
      throw new E.Intertype_illegal_evaluate_optional "^#{method_name}@1^"
      return R

  #---------------------------------------------------------------------------------------------------------
  _get_validate: ( declaration ) ->
    { type      } = declaration
    me            = @
    test          = @isa[ type ]
    method_name   = "validate.#{type}"
    #.......................................................................................................
    return nameit method_name, ( x ) ->
      me._validate_arity_for_method method_name, 1, arguments.length
      return x if test x
      throw new E.Intertype_validation_error "^#{method_name}@1^", type, __type_of @, _isa, x

  #---------------------------------------------------------------------------------------------------------
  _get_validate_optional: ( declaration ) ->
    { type      } = declaration
    me            = @
    test          = @isa.optional[ type ]
    method_name   = "validate.optional.#{type}"
    #.......................................................................................................
    return nameit method_name, ( x ) ->
      me._validate_arity_for_method method_name, 1, arguments.length
      return x if test x
      throw new E.Intertype_optional_validation_error "^#{method_name}@1^", type, __type_of @, _isa, x

  #---------------------------------------------------------------------------------------------------------
  _validate_arity_for_method: ( method_name, need_arity, is_arity ) ->
    return is_arity if need_arity is is_arity
    throw new E.Intertype_wrong_arity_for_method "^validate_arity@1^", method_name, need_arity, is_arity

  #---------------------------------------------------------------------------------------------------------
  _type_of: ( x ) ->
    if ( arguments.length isnt 1 )
      throw new E.Intertype_wrong_arity "^type_of@1^", 1, arguments.length
    return __type_of @, @_tests_for_type_of, x

  #---------------------------------------------------------------------------------------------------------
  _get_create: ( declaration ) ->
    { type
      create
      template  } = declaration
    me            = @
    debug '^Ωit___3', declaration
    # create       ?= if
    switch true
      when create?
        unless me.isa.function create
          throw new E.Intertype_create_must_be_function "^_get_create@1^", type, me.type_of create
        return nameit "create.#{type}", ( P... ) ->
          unless me.isa[ type ] ( R = create.call me, P... )
            evaluation = me.evaluate[ type ] R
            throw new E.Intertype_wrong_arguments_for_create "^create.#{type}@1^", type, P, evaluation
          return R
      when template?
        return @_get_create_from_template declaration
    return nameit "create.#{type}", ( P... ) ->
      throw new E.Intertype_create_not_available "^create.#{type}@2^", type

  #---------------------------------------------------------------------------------------------------------
  _get_create_from_template: ( declaration ) ->
    ### TAINT must distinguish whether value is object or not, use assign ###
    { type
      template  } = declaration
    me            = @
    use_assign    = @_looks_like_an_object_declaration declaration
    method_name   = "create.#{type}"
    # debug '^3234^', declaration, { use_assign, type: ( __type_of @, _isa, ) } if declaration.type is 'q'
    #.......................................................................................................
    if _isa.function template
      if ( template.length isnt 0 )
        throw new E.Intertype_wrong_template_arity "^_get_create@1^", type, template.length
      return nameit method_name, ->
        if ( arguments.length isnt 0 )
          throw new E.Intertype_wrong_arity "^create.#{type}@1^", 0, arguments.length
        unless me.isa[ type ] ( R = template.call me )
          evaluation = me.evaluate[ type ] R
          throw new E.Intertype_wrong_arguments_for_create "^create.#{type}@1^", type, P, evaluation
        return R
    #.......................................................................................................
    ### TAINT case of constant template could be handled when validating the declaration ###
    if use_assign
      Object.freeze declaration.template ### TAINT should deep-freeze ###
      R = nameit method_name, ( P... ) ->
        # debug '^3234^', deepmerge template, P...
        unless me.isa[ type ] ( R = me._call_and_reassign_functions deepmerge template, P... )
          evaluation = me.evaluate[ type ] R
          throw new E.Intertype_wrong_arguments_for_create "^create.#{type}@1^", type, P, evaluation
        return R
    else
      unless me.isa[ type ] template
        throw new E.Intertype_wrong_template_type "^_get_create@2^", type, me.type_of R
      R = nameit method_name, ->
        if ( arguments.length isnt 0 )
          throw new E.Intertype_wrong_arity "^create.#{type}@4^", 0, arguments.length
        return template
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  _call_and_reassign_functions: ( R ) ->
    for key, value of R
      if _isa.function value  then  R[ key ] = value.call @
      else if _isa.object R   then  R[ key ] = @_call_and_reassign_functions value
    return R

  #---------------------------------------------------------------------------------------------------------
  _looks_like_an_object_declaration: ( declaration ) ->
    ( declaration? and ( \
      ( _isa.object declaration.fields ) \
        or ( not declaration.fields? and _isa.object declaration.template ) ) )


#===========================================================================================================
class Intertype_minimal extends Intertype

#===========================================================================================================
_context_from_test_method_map = ( map ) ->
  null

#===========================================================================================================
__type_of = ( ctx, test_method_map, x ) ->
  return 'null'       if x is null
  return 'undefined'  if x is undefined
  ctx ?= _context_from_test_method_map test_method_map
  for type, test of test_method_map
    return type if test.call ctx, x
  return 'unknown'

#===========================================================================================================
deepmerge = ( P... ) ->
  R = {}
  for p in P
    continue unless p?
    unless _isa.object p
      throw new E.Intertype_wrong_type "^deepmerge@1^", 'an object', __type_of null, _isa, p
    for key, value of p
      R[ key ] = if ( _isa.object value ) then ( deepmerge value ) else value
  return R

#===========================================================================================================
walk_prefixes = ( fq_name ) ->
  ### Given a fully qualified type name, walk over all the prefixes of the name, if any. This is used to
  determine the transitive sub-types of types with fields.

  Example: calling `walk_prefixes 'one.two.three.four'` will iterate over `'one'`, `'one.two'`,
  `'one.two.three'`. ###
  unless _isa.text fq_name
    throw new E.Intertype_wrong_type "^walk_prefixes@1^", 'a text', __type_of null, _isa, p
  parts = fq_name.split '.'
  for idx in [ 0 ... parts.length - 1 ]
    yield ( parts[ .. idx ].join '.' )
  return null


#===========================================================================================================
types = new Intertype()
do =>
  { isa
    validate
    create
    type_of     } = types
  testing = { _isa, }
  module.exports = {
    Intertype, Intertype_minimal
    types, isa, validate, create, type_of,
    declarations: default_declarations,
    deepmerge,
    walk_prefixes,
    testing,
    __type_of   }
