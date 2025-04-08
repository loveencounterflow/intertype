
'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ debug
  info
  warn }                  = GUY.trm.get_loggers 'demo-execa'
{ rpr }                   = GUY.trm
{ hide }                  = GUY.props
{ props: {
    nameit } }            = require 'webguy'


#===========================================================================================================
$isa =
  text:             ( x ) -> ( typeof x is 'string' )
  nonempty_text:    ( x ) -> ( typeof x is 'string' ) and ( x.length > 0 )
  function:         ( x ) -> ( Object::toString.call x ) is '[object Function]'
  pod:              ( x ) -> x? and x.constructor in [ Object, undefined, ]
  primitive:        ( x ) -> $primitive_types.includes $type_of x
  object:           ( x ) -> x? and x instanceof Object
  type:             ( x ) -> x instanceof Type
  typespace:        ( x ) -> x instanceof Typespace
  intertype:        ( x ) -> x instanceof Intertype
  # nan:                    ( x ) => Number.isNaN         x

#-----------------------------------------------------------------------------------------------------------
$primitive_types = Object.freeze [
  'null', 'undefined', 'infinity', 'boolean', 'nan', 'float', 'anyfloat', 'text', ]

#-----------------------------------------------------------------------------------------------------------
$type_of = ( x ) ->
  #.........................................................................................................
  ### Primitives: ###
  return 'null'         if x is null
  return 'undefined'    if x is undefined
  return 'infinity'     if ( x is +Infinity ) or ( x is -Infinity )
  return 'boolean'      if ( x is true ) or ( x is false )
  return 'nan'          if Number.isNaN     x
  return 'float'        if Number.isFinite  x
  # return 'pod'          if $isa.pod x
  #.........................................................................................................
  switch jstypeof = typeof x
    when 'string'                       then return 'text'
  #.........................................................................................................
  return 'list'         if Array.isArray  x
  ### TAINT consider to return x.constructor.name ###
  millertype = Object::toString.call x
  return ( millertype.replace /^\[object ([^\]]+)\]$/, '$1' ).toLowerCase()
  # switch millertype = Object::toString.call x
  #   when '[object Function]'            then return 'function'
  #   when '[object AsyncFunction]'       then return 'asyncfunction'
  #   when '[object GeneratorFunction]'   then return 'generatorfunction'


#===========================================================================================================
class Intertype

  #---------------------------------------------------------------------------------------------------------
  @primitive_types = $primitive_types

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    hide @, 'isa',        @isa.bind       @
    hide @, 'validate',   @validate.bind  @
    hide @, 'create',     @create.bind    @
    hide @, 'type_of',    @type_of.bind   @
    hide @, 'types_of',   @types_of.bind  @
    hide @, 'memo',       new Map()
    hide @, '_recording', false
    hide @, '_journal',   null
    hide @, '_stack',     null
    return undefined

  #---------------------------------------------------------------------------------------------------------
  isa: ( type, x ) ->
    ### TAINT use proper validation ###
    unless type instanceof Type
      throw new Error "Ω___1 expected an instance of `Type`, got a #{$type_of R}"
    #.......................................................................................................
    if @_recording
      @_stack.push type.$typename
      @_journal.push entry = {}
    #.......................................................................................................
    unless ( R = type.isa.call type, x, @ ) in [ true, false, ]
      throw new Error "Ω___2 expected `true` or `false`, got a #{$type_of R}"
    #.......................................................................................................
    if @_recording
      stack = @_stack.join '/'
      @_stack.pop()
      Object.assign entry, { type: type.$typename, stack, value: x, verdict: R, }
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  @type_of: $type_of
  type_of:  $type_of

  #---------------------------------------------------------------------------------------------------------
  types_of: ( typespace, x ) ->
    unless typespace instanceof Typespace
      throw new Error "Ω___3 expected an instance of Typespace, got a #{$type_of x}"
    return ( typename for typename, type of typespace when @isa type, x )

  #---------------------------------------------------------------------------------------------------------
  validate: ( type, x ) ->
    return x if @isa type, x
    throw new Error "Ω___4 expected a #{type.$typename}, got a #{$type_of x}"

  #---------------------------------------------------------------------------------------------------------
  evaluate: ( type, x ) ->
    @_recording = true
    @_journal   = []
    @_stack     = []
    #.......................................................................................................
    @isa type, x
    #.......................................................................................................
    R           = @_journal
    @_recording = false
    @_journal   = null
    @_stack     = null
    return R

  #---------------------------------------------------------------------------------------------------------
  equals: ( a, b ) ->
    throw new Error "Ω___5 not yet implemented"

  #---------------------------------------------------------------------------------------------------------
  create: ( type, P... ) ->
    unless type instanceof Type
      throw new Error "Ω___6 expected an instance of Type, got a #{$type_of type}"
    return type.create.call type, P, @

  # #---------------------------------------------------------------------------------------------------------
  # copy_template: ( type ) ->
  #   return x if $isa.primitive x
  #   return x.call


#===========================================================================================================
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, typename, declaration ) ->
    @$typename = typename
    hide @, '$typespace', typespace
    #.......................................................................................................
    declaration = @_declaration_as_pod  typespace, typename, declaration
    @_declaration_isa_as_function       typespace, typename, declaration
    @_compile_declaration_fields        typespace, typename, declaration
    @_compile_declaration_create        typespace, typename, declaration
    #.......................................................................................................
    for key, value of declaration
      ### TAINT check for overrides ###
      hide @, key, value
    #.......................................................................................................
    ### TAINT perform validation of resulting shape here ###
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declaration_as_pod: ( typespace, typename, declaration ) ->
    return ( do ( isa = declaration ) -> { isa, } ) unless $isa.pod declaration
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _declaration_isa_as_function: ( typespace, typename, declaration ) ->
    if declaration.fields? then @_compile_isa_with_fields     typespace, typename, declaration
    else                        @_compile_isa_without_fields  typespace, typename, declaration
    nameit typename, declaration.isa
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _compile_isa_with_fields: ( typespace, typename, declaration ) ->
    return null if $isa.function declaration.isa
    check_fields = @_get_fields_check typespace, typename, declaration
    switch true
      #.....................................................................................................
      when $isa.type declaration.isa
        declaration.isa = do ( type = declaration.isa ) => ( x, t ) ->
          ( t.isa type, x ) and ( check_fields.call @, x, t )
      #.....................................................................................................
      ### (see condition dB in README) ###
      when $isa.nonempty_text declaration.isa
        declaration.isa = do ( typeref = declaration.isa ) => ( x, t ) ->
          unless $isa.type ( type = typespace[ typeref ] )
            throw new Error "Ω___7 expected typeref #{rpr typeref} to give a type, got a #{$type_of declaration.isa}"
          ( t.isa type, x ) and ( check_fields.call @, x, t )
      #.....................................................................................................
      when not declaration.isa?
        declaration.isa = check_fields
      #.....................................................................................................
      else
        throw new Error "Ω___9 expected `declaration.isa` to be a function, a type or a typeref, got a #{$type_of declaration.isa}"
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _compile_isa_without_fields: ( typespace, typename, declaration ) ->
    return null if $isa.function declaration.isa
    switch true
      #.....................................................................................................
      when $isa.type declaration.isa
        declaration.isa = do ( type = declaration.isa ) => ( x, t ) -> t.isa type, x
      #.....................................................................................................
      when $isa.nonempty_text declaration.isa
        declaration.isa = do ( typeref = declaration.isa ) => ( x, t ) ->
          unless $isa.type ( type = typespace[ typeref ] )
            throw new Error "Ω___9 expected typeref #{rpr typeref} to give a type, got a #{$type_of declaration.isa}"
          t.isa type, x
      #.....................................................................................................
      when not declaration.isa?
        declaration.isa = ( x, t ) -> $isa.pod x
      #.....................................................................................................
      else
        throw new Error "Ω__12 expected `declaration.isa` to be a function, a type or a typeref, got a #{$type_of declaration.isa}"
    return null

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_fields: ( typespace, typename, declaration ) ->
    return declaration unless declaration.fields?
    unless $isa.pod declaration.fields
      throw new Error "Ω__13 expected `fields` to be a POD, got a #{$type_of declaration.fields}"
    #.......................................................................................................
    for field_name, field_declaration of declaration.fields
      field_typename = "#{typename}_$#{field_name}"
      declaration.fields[ field_name ] = \
        typespace[ field_typename ] = new Type typespace, field_typename, field_declaration
    #.......................................................................................................
    declaration.isa = @_get_fields_check typespace, typename, declaration
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _get_fields_check: ( typespace, typename, declaration ) ->
    return ( x, t ) ->
      for field_name, field_type of @fields
        return false unless x? and t.isa field_type, x[ field_name ]
      return true

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_create: ( typespace, typename, declaration ) ->
    has_fields      = declaration.fields?
    fields_isa_pod  = $isa.pod declaration.fields
    #.......................................................................................................
    ### condition cC ###
    if has_fields and not fields_isa_pod
      throw new Error "Ω__14 (see condition cC in README)"
    #.......................................................................................................
    if declaration.create?
      ### condition cB ###
      unless $isa.function declaration.create
        throw new Error "Ω__15 (see condition cB in README)"
      ### condition cA: use user-defined `create()` method, nothing to do here: ###
      return null
    #.......................................................................................................
    unless has_fields
      ### condition cI ###
      unless declaration.template?
        declaration.create = ( P, t ) ->
          throw new Error "Ω__16 type #{rpr typename} does not support value creation (see condition cI in README)"
        return null
      ### condition cG ###
      if $isa.function declaration.template
        declaration.create = do ( create = declaration.template ) => ( P, t ) -> create.call @, P, t
        return null
      ### condition cH ###
      declaration.create = do ( seed_value = declaration.template ) => ( P, t ) ->
        unless P.length is 0
          throw new Error "Ω__17 create method for #{typename} does not accept arguments, got #{P.length} (see condition cH in README)"
        return seed_value
      return null
    #.......................................................................................................
    template_isa_pod = $isa.pod declaration.template
    if declaration.template?
      ### condition cE ###
      unless template_isa_pod
        throw new Error "Ω__18 (see condition cE in README)"
      ### condition cD ###
      # do ( fields = declaration.fields, template = declaration.template ) =>
      declaration.create = ( P, t ) ->
        unless P.length is 0
          throw new Error "Ω__19 create method for #{typename} does not accept arguments, got #{P.length} (see condition cD in README)"
        R = {}
        for field_name, type of @fields
          ### condition cDa ###
          if ( seed = @template[ field_name ] )?
            R[ field_name ] = if ( $isa.function seed ) then ( seed.call @, P..., t ) else seed
          else
            R[ field_name ] = t.create type
        return R
      return null
    #.......................................................................................................
    ### condition cF ###
    declaration.create = ( P, t ) ->
      unless P.length is 0
        throw new Error "Ω__20 create method for #{typename} does not accept arguments, got #{P.length} (see condition cF in README)"
      R               = {}
      R[ field_name ] = t.create type for field_name, type of @fields
      return R
    return null


#===========================================================================================================
class Typespace

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace_cfg ) ->
    for typename, declaration of typespace_cfg
      ### TAINT check for overrides ###
      declaration   = new Type @, typename, declaration unless declaration instanceof Type
      @[ typename ] = declaration
    return undefined


#===========================================================================================================
# if module is require.main then await do =>
do =>
  types = new Intertype()
  module.exports = { Intertype, Type, Typespace, types,  $isa, $type_of, }
