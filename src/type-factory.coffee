
'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  warn
  urge
  help }                  = GUY.trm.get_loggers 'INTERTYPE'
{ rpr }                   = GUY.trm
#...........................................................................................................
E                         = require './errors'
H                         = require './helpers'




#===========================================================================================================
class Type_factory extends H.Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( hub ) ->
    super()
    @hub = hub
    @cfg = GUY.lft.freeze { rename: [ 'isa', '', ], }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _validate_name: ( name ) ->
    return name if H.types.isa.nonempty_text name
    throw new E.Intertype_ETEMPTBD '^tf@1^', \
      "expected a nonempty text for new type name, got #{rpr name}"

  #---------------------------------------------------------------------------------------------------------
  _validate_dsc: ( dsc ) ->
    return dsc            if H.types.isa.object         dsc
    return { isa: dsc, }  if H.types.isa.function       dsc
    return { isa: dsc, }  if H.types.isa.nonempty_text  dsc
    throw new E.Intertype_ETEMPTBD '^tf@2^', \
      "expected an object, a function or a nonempty text for type description, got #{rpr dsc}"

  #---------------------------------------------------------------------------------------------------------
  _validate_isa: ( isa ) ->
    return isa  if H.types.isa.function       isa
    return isa  if H.types.isa.nonempty_text  isa
    throw new E.Intertype_ETEMPTBD '^tf@3^', \
      "expected a function or a nonempty text for `isa`, got #{rpr isa}"

  #---------------------------------------------------------------------------------------------------------
  _normalize_type_cfg: ( P... ) ->
    name  = null
    dsc   = {}   ### short for type DeSCription ###
    isa   = null
    #.......................................................................................................
    switch arity = P.length
      when 1
        if H.types.isa.text P[ 0 ] then name  = @_validate_name P[ 0 ]
        else                            dsc   = @_validate_dsc  P[ 0 ]
      when 2
        name    = @_validate_name P[ 0 ]
        dsc     = @_validate_dsc  P[ 1 ]
      when 3
        name    = @_validate_name P[ 0 ]
        dsc     = @_validate_dsc  P[ 1 ]
        isa     = @_validate_isa  P[ 2 ]
      else
        throw new E.Intertype_ETEMPTBD '^tf@4^', "expected between 1 and 3 arguments, got #{arity}"
    #.......................................................................................................
    if isa?
      if GUY.props.has dsc, 'isa'
        throw new E.Intertype_ETEMPTBD '^tf@5^', "got two conflicting values for `isa`"
      dsc.isa   = isa
    #.......................................................................................................
    if name?
      if GUY.props.has dsc, 'name'
        throw new E.Intertype_ETEMPTBD '^tf@6^', "got two conflicting values for `name`"
      dsc.name  = name
    #.......................................................................................................
    ### Re-assemble fields in `fields` property, delete `$`-prefixed keys ###
    ### TAINT should validate values of `$`-prefixed keys are either function or non-empty strings ###
    fields = dsc.fields ? null
    for key, value of dsc
      continue unless key.startsWith '$'
      if key is '$'
        throw new E.Intertype_ETEMPTBD '^tf@7^', "found illegal key '$'"
      nkey    = key[ 1 .. ]
      fields ?= {}
      if fields[ key ]?
        throw new E.Intertype_ETEMPTBD '^tf@8^', "found duplicate key #{rpr key}"
      delete dsc[ key ]
      fields[ nkey ] = value
    #.......................................................................................................
    if fields?
      dsc.fields  = fields
      dsc.isa    ?= 'object'
    #.......................................................................................................
    if dsc.isa?
      if H.types.isa.text dsc.isa
        dsc.isa     = @_test_from_hedgepath dsc.isa
      name_of_isa = if dsc.isa.name in @cfg.rename then '#0' else dsc.isa.name
      dsc.isa     = H.nameit "#{dsc.name}:#{name_of_isa}", dsc.isa.bind @hub
    #.......................................................................................................
    dsc = { H.defaults.Type_factory_type_dsc..., dsc..., }
    H.types.validate.Type_factory_type_dsc  dsc
    #.......................................................................................................
    return dsc

  #---------------------------------------------------------------------------------------------------------
  create_type: ( P... ) ->
    dsc     = @_normalize_type_cfg P...
    #.......................................................................................................
    cfg.tests  ?= [] ### TAINT move this to normalization ###
    R           = R.bind @
    ### NOTE `hide()` uses `Object.defineProperty()`, so takes care of `name`: ###
    GUY.props.hide R, k, v for k, v of cfg # when not GUY.props.has R, k
    R = new GUY.props.Strict_owner { target: R, oneshot: true, }
    return R

  #---------------------------------------------------------------------------------------------------------
  _test_from_hedgepath: ( hedgepath ) ->
    hedges = hedgepath.split @hub.cfg.sep
    H.nameit hedgepath, ( x ) -> @_isa hedges..., x

  #---------------------------------------------------------------------------------------------------------
  _create_test_walker: ( tests ) -> ( x ) =>
    for f in tests
      return false if ( R = f x ) is false
      return R unless R is true
    return true


############################################################################################################
@Type_factory = Type_factory

