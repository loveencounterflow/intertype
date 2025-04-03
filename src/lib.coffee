
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
  #.........................................................................................................
  # return millertype[ 8 ... millertype.length - 1 ].toLowerCase()
  # return 'something'


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
      stack = @_stack.join '.'
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
    return type.create.call type, P...

  #---------------------------------------------------------------------------------------------------------
  copy_template: ( type ) ->
    return x if $isa.primitive x
    return x.call


#===========================================================================================================
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, typename, declaration ) ->
    @$typename = typename # hide @, '$typename',  typename
    hide @, '$typespace', typespace
    # debug 'Ω___7', typename, rpr declaration
    #.......................................................................................................
    declaration = @_declaration_as_pod          typespace, typename, declaration
    # debug 'Ω___8', typename, rpr declaration
    @_declaration_isa_as_function typespace, typename, declaration
    @_compile_declaration_fields  typespace, typename, declaration
    # @_compile_declaration_create  typespace, typename, declaration
    #.......................................................................................................
    for key, value of declaration
      hide @, key, value
    #.......................................................................................................
    ### TAINT perform validation of resulting shape here ###
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declaration_as_pod: ( typespace, typename, declaration ) ->
    # debug 'Ω___9', ( typename.padEnd 20 ), rpr declaration
    return ( do ( isa = declaration ) -> { isa, } ) unless $isa.pod declaration
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _declaration_isa_as_function: ( typespace, typename, declaration ) ->
    if declaration.fields? then @_compile_isa_with_fields     typespace, typename, declaration
    else                        @_compile_isa_without_fields  typespace, typename, declaration
    unless $isa.function declaration.isa ### TEMP ###
      # debug 'Ω__10', declaration
      throw new Error "Ω__11 MEH"
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
      when $isa.nonempty_text declaration.isa
        declaration.isa = do ( typeref = declaration.isa ) => ( x, t ) ->
          ( t.isa typespace[ typeref ], x ) and ( check_fields.call @, x, t )
      #.....................................................................................................
      when not declaration.isa?
        declaration.isa = check_fields
      #.....................................................................................................
      else
        throw new Error "Ω__12 expected `declaration.isa` to be a function, a type or a typeref, got a #{$type_of declaration.isa}"
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
        declaration.isa = do ( typeref = declaration.isa ) => ( x, t ) -> t.isa typespace[ typeref ], x
      #.....................................................................................................
      when not declaration.isa?
        declaration.isa = ( x, t ) -> $isa.pod x
      #.....................................................................................................
      else
        throw new Error "Ω__13 expected `declaration.isa` to be a function, a type or a typeref, got a #{$type_of declaration.isa}"
    return null

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_fields: ( typespace, typename, declaration ) ->
    return declaration unless declaration.fields?
    unless $isa.pod declaration.fields
      throw new Error "Ω__14 expected `fields` to be a POD, got a #{$type_of declaration.fields}"
    #.......................................................................................................
    for field_name, field_declaration of declaration.fields
      declaration.fields[ field_name ] = new Type typespace, field_name, field_declaration
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
    switch true
      when ( ( not declaration.create? ) and ( not declaration.fields? ) )
        if declaration.template?
          throw new Error "Ω__16 MEH-create-1 unable to create value of type #{rpr typename}"
        declaration.create = -> throw new Error "Ω__17 MEH-create-1 unable to create value of type #{rpr typename}"
    return declaration


#===========================================================================================================
class Typespace

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace_cfg ) ->
    for typename, declaration of typespace_cfg
      declaration   = new Type @, typename, declaration unless declaration instanceof Type
      @[ typename ] = declaration
    return undefined


#===========================================================================================================
# if module is require.main then await do =>
do =>
  types = new Intertype()
  module.exports = { Intertype, Type, Typespace, types,  $isa, $type_of, }
