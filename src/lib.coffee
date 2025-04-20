
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
B                         = require './builtins'
H                         = require './helpers'


#===========================================================================================================
class Intertype

  # #---------------------------------------------------------------------------------------------------------
  # @primitive_types = B.primitive_types

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
      throw new Error "Ω___1 expected an instance of `Type`, got a #{B.type_of R}"
    #.......................................................................................................
    if @_recording
      @_stack.push type.$typename
      @_journal.push entry = {}
    #.......................................................................................................
    unless ( R = type.isa.call type, x, @ ) in [ true, false, ]
      throw new Error "Ω___2 expected `true` or `false`, got a #{B.type_of R}"
    #.......................................................................................................
    if @_recording
      stack = @_stack.join '/'
      @_stack.pop()
      Object.assign entry, { type: type.$typename, stack, value: x, verdict: R, }
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  @type_of: B.type_of
  type_of:  B.type_of

  #---------------------------------------------------------------------------------------------------------
  types_of: ( typespace, x ) ->
    unless typespace instanceof Typespace
      throw new Error "Ω___3 expected an instance of Typespace, got a #{B.type_of x}"
    return ( typename for typename, type of typespace when @isa type, x )

  #---------------------------------------------------------------------------------------------------------
  validate: ( type, x ) ->
    return x if @isa type, x
    throw new Error "Ω___4 expected a #{type.$typename}, got a #{B.type_of x}"

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
      throw new Error "Ω___6 expected an instance of Type, got a #{B.type_of type}"
    return type.create.call type, P, @

  # #---------------------------------------------------------------------------------------------------------
  # copy_template: ( type ) ->
  #   return x if B.isa.primitive x
  #   return x.call


#===========================================================================================================
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, typename, declaration ) ->
    @$typename = typename
    hide @, '$typespace',     typespace
    hide @, '$members',       {}
    hide @, '$member_names',  []
    hide @, '$has_members',   false
    hide @, '$kind',          null
    #.......................................................................................................
    declaration = @_declaration_as_pod  typespace, typename, declaration
    @_compile_declaration_members       typespace, typename, declaration
    # @_compile_declaration_fields        typespace, typename, declaration
    @_compile_declaration_$kind         typespace, typename, declaration
    return undefined

    @_compile_declaration_$isa          typespace, typename, declaration
    @_compile_declaration_$freeze       typespace, typename, declaration
    @_compile_declaration_$create       typespace, typename, declaration
    #.......................................................................................................
    for key, value of declaration
      ### TAINT check for overrides ###
      hide @, key, value
    #.......................................................................................................
    ### TAINT perform validation of resulting shape here ###
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declaration_as_pod: ( typespace, typename, declaration ) ->
    return ( do ( $isa = declaration ) -> { $isa, } ) unless B.isa.pod declaration
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_members: ( typespace, typename, declaration ) ->
    # debug 'Ω___7', typename, declaration
    # debug 'Ω___8', H.get_own_user_keys declaration
    for name in H.get_own_user_keys declaration
      @$members[ name ] = declaration[ name ]
      @$member_names.push name
    @$has_members = @$member_names.length > 0
    return null

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_$kind: ( typespace, typename, declaration ) ->
    if declaration.$kind?
      if @$has_members
        unless declaration.$kind in [ '$record', '$variant', ]
          throw new Error "Ω___9 expected $kind to be '$record' or '$variant', got #{rpr declaration.$kind}"
        @$kind = declaration.$kind
      else if B.isa.list declaration.$isa
        unless declaration.$kind is '$enumeration'
          throw new Error "Ω__10 expected $kind to be '$enumeration', got #{rpr declaration.$kind}"
      @$kind = declaration.$kind
    #.......................................................................................................
    else
      if @$has_members
        @$kind = '$record'
      else if B.isa.list declaration.$isa
          @$kind = '$enumeration'
      @$kind ?= '$unspecified'
    #.......................................................................................................
    unless B.isa.declaration_$kind @$kind
      throw new Error "Ω__11 unexpected value of `$kind`: #{rpr @$kind}"
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_$freeze: ( typespace, typename, declaration ) ->
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_$isa: ( typespace, typename, declaration ) ->
    if declaration.fields? then @_compile_isa_with_record_fields     typespace, typename, declaration
    else                        @_compile_isa_without_fields  typespace, typename, declaration
    nameit typename, declaration.isa
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _compile_isa_with_variant_fields: ( typespace, typename, declaration ) ->

  #---------------------------------------------------------------------------------------------------------
  _compile_isa_with_record_fields: ( typespace, typename, declaration ) ->
    return null if B.isa.function declaration.isa
    check_fields = @_get_fields_check typespace, typename, declaration
    switch true
      #.....................................................................................................
      when B.isa.type declaration.isa
        declaration.isa = do ( type = declaration.isa ) => ( x, t ) ->
          ( t.isa type, x ) and ( check_fields.call @, x, t )
      #.....................................................................................................
      ### (see condition dB in README) ###
      when B.isa.nonempty_text declaration.isa
        declaration.isa = do ( typeref = declaration.isa ) =>
          unless B.isa.type ( type = typespace[ typeref ] )
            throw new Error "Ω__12 declaration for type #{rpr typename} contains forward reference to type #{rpr typeref}"
          return ( x, t ) -> ( t.isa type, x ) and ( check_fields.call @, x, t )
      #.....................................................................................................
      when not declaration.isa?
        declaration.isa = check_fields
      #.....................................................................................................
      else
        throw new Error "Ω__13 expected `declaration.isa` to be a function, a type or a typeref, got a #{B.type_of declaration.isa}"
    return declaration

  #---------------------------------------------------------------------------------------------------------
  _compile_isa_without_fields: ( typespace, typename, declaration ) ->
    return null if B.isa.function declaration.isa
    switch true
      #.....................................................................................................
      when B.isa.type declaration.isa
        declaration.isa = do ( type = declaration.isa ) => ( x, t ) -> t.isa type, x
      #.....................................................................................................
      when B.isa.nonempty_text declaration.isa
        declaration.isa = do ( typeref = declaration.isa ) =>
          unless B.isa.type ( type = typespace[ typeref ] )
            throw new Error "Ω__14 declaration for type #{rpr typename} contains forward reference to type #{rpr typeref}"
          return ( x, t ) -> t.isa type, x
      #.....................................................................................................
      when not declaration.isa?
        declaration.isa = ( x, t ) -> B.isa.pod x
      #.....................................................................................................
      else
        throw new Error "Ω__15 expected `declaration.isa` to be a function, a type or a typeref, got a #{B.type_of declaration.isa}"
    return null

  # #---------------------------------------------------------------------------------------------------------
  # _compile_declaration_fields: ( typespace, typename, declaration ) ->
  #   return declaration unless declaration.fields?
  #   unless B.isa.pod declaration.fields
  #     throw new Error "Ω__16 expected `fields` to be a POD, got a #{B.type_of declaration.fields}"
  #   #.......................................................................................................
  #   for field_name, field_declaration of declaration.fields
  #     ### TAINT use API method ###
  #     field_typename = "#{typename}_$#{field_name}"
  #     declaration.fields[ field_name ] = \
  #       typespace[ field_typename ] = new Type typespace, field_typename, field_declaration
  #   #.......................................................................................................
  #   declaration.isa = @_get_fields_check typespace, typename, declaration
  #   return declaration

  #---------------------------------------------------------------------------------------------------------
  _get_fields_check: ( typespace, typename, declaration ) ->
    return ( x, t ) ->
      for field_name, field_type of @fields
        return false unless x? and t.isa field_type, x[ field_name ]
      return true

  #---------------------------------------------------------------------------------------------------------
  _compile_declaration_$create: ( typespace, typename, declaration ) ->
    has_fields      = declaration.fields?
    fields_isa_pod  = B.isa.pod declaration.fields
    #.......................................................................................................
    ### condition cC ###
    if has_fields and not fields_isa_pod
      throw new Error "Ω__17 (see condition cC in README)"
    #.......................................................................................................
    if declaration.create?
      ### condition cB ###
      unless B.isa.function declaration.create
        throw new Error "Ω__18 (see condition cB in README)"
      ### condition cA: use user-defined `create()` method, nothing to do here: ###
      return null
    #.......................................................................................................
    unless has_fields
      ### condition cI ###
      unless declaration.template?
        declaration.create = ( P, t ) ->
          throw new Error "Ω__19 type #{rpr typename} does not support value creation (see condition cI in README)"
        return null
      ### condition cG ###
      if B.isa.function declaration.template
        declaration.create = do ( create = declaration.template ) => ( P, t ) -> create.call @, P, t
        return null
      ### condition cH ###
      declaration.create = do ( seed_value = declaration.template ) => ( P, t ) ->
        unless P.length is 0
          throw new Error "Ω__20 create method for #{typename} does not accept arguments, got #{P.length} (see condition cH in README)"
        return seed_value
      return null
    #.......................................................................................................
    template_isa_pod = B.isa.pod declaration.template
    if declaration.template?
      ### condition cE ###
      unless template_isa_pod
        throw new Error "Ω__21 (see condition cE in README)"
      ### condition cD ###
      # do ( fields = declaration.fields, template = declaration.template ) =>
      declaration.create = ( P, t ) ->
        unless P.length is 0
          throw new Error "Ω__22 create method for #{typename} does not accept arguments, got #{P.length} (see condition cD in README)"
        R = {}
        for field_name, type of @fields
          ### condition cDa ###
          if ( seed = @template[ field_name ] )?
            R[ field_name ] = if ( B.isa.function seed ) then ( seed.call @, P..., t ) else seed
          else
            R[ field_name ] = t.create type
        return R
      return null
    #.......................................................................................................
    ### condition cF ###
    declaration.create = ( P, t ) ->
      unless P.length is 0
        throw new Error "Ω__23 create method for #{typename} does not accept arguments, got #{P.length} (see condition cF in README)"
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


# #===========================================================================================================
# class Typespace extends Type

#   #---------------------------------------------------------------------------------------------------------
#   constructor: ( declarations ) ->
#     ### TAINT use proper validation, `create()` ###
#     unless B.isa.pod declarations
#       throw new Error "Ω__24 expected a plain object, got a #{B.type_of declarations}"
#     if declarations.$isa? or ( declarations.$isa isnt '$variant' )
#       throw new Error "Ω__25 expected declarations.$isa to be unset or set to '$variant', got `{ declarations.$isa: #{rpr declarations.$isa}, }`"
#     super { declarations..., $isa: '$variant', }
#     return undefined


#===========================================================================================================
# if module is require.main then await do =>
do =>
  types = new Intertype()
  module.exports = { Intertype, Type, Typespace, types, builtins: B, }
