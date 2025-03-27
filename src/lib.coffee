
'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ debug
  warn }                  = GUY.trm.get_loggers 'demo-execa'
{ rpr }                   = GUY.trm
{ hide }                  = GUY.props
{ props: {
    nameit } }            = require 'webguy'


#===========================================================================================================
$isa =
  text:       ( x ) -> typeof x is 'string'
  function:   ( x ) -> ( Object::toString.call x ) is '[object Function]'
  # nan:                    ( x ) => Number.isNaN         x
  primitive:  ( x ) -> $primitive_types.includes $type_of x

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
  #.........................................................................................................
  switch jstypeof = typeof x
    when 'string'                       then return 'text'
  #.........................................................................................................
  return 'list'         if Array.isArray  x
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
      throw new Error "Ω___1 expected an instance of Typespace, got a #{$type_of x}"
    return ( typename for typename, type of typespace when @isa type, x )


  #---------------------------------------------------------------------------------------------------------
  validate: ( type, x ) ->
    return x if @isa type, x
    throw new Error "Ω___3 expected a #{type.$typename}, got a #{$type_of x}"

  #---------------------------------------------------------------------------------------------------------
  create: ( type, P... ) ->
    throw new Error "Ω___4 not yet implemented"

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
  copy: ( x ) ->

  #---------------------------------------------------------------------------------------------------------
  equals: ( a, b ) ->
    throw new Error "Ω___5 not yet implemented"


#===========================================================================================================
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, typename, declaration ) ->
    @$typename = typename # hide @, '$typename',  typename
    hide @, '$typespace', typespace
    @_compile_fields typespace, typename, declaration if declaration.fields?
    #.......................................................................................................
    switch true
      #.....................................................................................................
      when $isa.text declaration
        declaration = do ( typeref = declaration ) => { isa: ( ( x, t ) -> t.isa @$typespace[ typeref ], x ), }
      #.....................................................................................................
      when $isa.function declaration
        declaration = { isa: declaration, }
      #.....................................................................................................
      when declaration instanceof Type    then null
      when declaration instanceof Object  then null
      #.....................................................................................................
      else
        throw new Error "Ω___6 expected a typename, a function or a type as declaration, got a #{$type_of declaration}"
    #.......................................................................................................
    ### TAINT this is defective w/out proper validation ###
    for key, value of declaration
      nameit typename, value if key is 'isa' # check that value is function?
      hide @, key, value
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _compile_fields: ( typespace, typename, declaration ) ->
    #.......................................................................................................
    ### TAINT try to move this check to validation step ###
    if declaration.isa?
      throw new Error "Ω___7 must have exactly one of `isa` or `fields`, not both"
    for field_name, field_declaration of declaration.fields
      declaration.fields[ field_name ] = new Type typespace, field_name, field_declaration
    #.......................................................................................................
    declaration.isa = @_get_default_isa_for_fields typespace, typename, declaration
    return null

  #---------------------------------------------------------------------------------------------------------
  _get_default_isa_for_fields: ( typespace, typename, declaration ) -> ( x, t ) ->
    for field_name, field of @fields
      return false unless x? and t.isa field, x[ field_name ]
    return true


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
  module.exports = { Intertype, Type, Typespace, types, }
