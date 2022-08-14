
'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  warn
  urge
  help }                  = GUY.trm.get_loggers 'INTERTYPE/TYPE_FACTORY'
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
        if H.types.isa.text P[ 0 ] then dsc   = { name: P[ 0 ], }
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
    if name? and ( dsc_name = GUY.props.get dsc, 'name', null )? and ( dsc_name isnt name )
      throw new E.Intertype_ETEMPTBD '^tf@6^', \
        "got two conflicting values for `name` (#{rpr name} and #{rpr dsc_name})"
    dsc.name     ?= name
    dsc.typename  = dsc.name
    #.......................................................................................................
    @_assemble_fields dsc
    #.......................................................................................................
    if dsc.isa?
      if H.types.isa.text dsc.isa
        dsc.isa     = @_test_from_hedgepath dsc.isa
      name_of_isa = if dsc.isa.name in @cfg.rename then '#0' else dsc.isa.name
      dsc.isa     = H.nameit "#{dsc.name}:#{name_of_isa}", do =>
        f = dsc.isa.bind @hub
        return ( x ) =>
          try
            return f x
          catch error
            throw error if @hub.cfg.errors is 'throw' or error instanceof E.Intertype_error
            @hub.state.error = error
          return false
    #.......................................................................................................
    dsc = { H.defaults.Type_factory_type_dsc..., dsc..., }
    H.types.validate.Type_factory_type_dsc  dsc
    #.......................................................................................................
    return dsc

  #---------------------------------------------------------------------------------------------------------
  _assemble_fields: ( dsc ) ->
    ### Re-assemble fields in `fields` property, delete `$`-prefixed keys ###
    fields = dsc.fields ? null
    for key, field_dsc of dsc
      continue unless key.startsWith '$'
      if key is '$'
        throw new E.Intertype_ETEMPTBD '^tf@7^', "found illegal key '$'"
      nkey    = key[ 1 .. ]
      fields ?= {}
      if fields[ key ]?
        throw new E.Intertype_ETEMPTBD '^tf@8^', "found duplicate key #{rpr key}"
      delete dsc[ key ]
      fields[ nkey ] = field_dsc
    #.......................................................................................................
    if fields?
      dsc.fields  = fields
      dsc.isa    ?= 'object'
    #.......................................................................................................
    if dsc.fields?
      nr = 0
      unless H.types.isa.object dsc.fields
        throw new E.Intertype_ETEMPTBD '^tf@8^', \
          "expected an object for `field` property, got a #{rpr H.types.type_of dsc.fields}"
      for fieldname, field_dsc of dsc.fields
        if ( H.types.type_of field_dsc ) is 'text'
          hedges    = @hub._split_hedgerow_text field_dsc
          field_dsc = do ( fieldname, field_dsc, hedges ) =>
            H.nameit field_dsc, ( x ) -> @_isa hedges..., x[ fieldname ]
        if ( type = H.types.type_of field_dsc ) is 'function'
          nr++
          name_of_isa = if field_dsc.name in @cfg.rename then '#{nr}' else field_dsc.name
          dsc.fields[ fieldname ] = H.nameit "#{dsc.name}.#{fieldname}:#{name_of_isa}", field_dsc.bind @hub
        else
          throw new E.Intertype_ETEMPTBD '^tf@8^', "expected a text or a function for field description, got a #{rpr type}"
    #.......................................................................................................
    return null

  #---------------------------------------------------------------------------------------------------------
  create_type: ( P... ) ->
    dsc         = @_normalize_type_cfg P...
    if dsc.fields?
      name    = dsc.isa.name
      R       = ( @_create_test_walker dsc ).bind dsc
    else
      name    = dsc.name
      R       = dsc.isa
      dsc.isa = null
    GUY.props.hide R, k, v for k, v of dsc when k isnt 'name'
    H.nameit name, R
    R = GUY.props.Strict_owner.create { target: R, oneshot: true, }
    return R

  #---------------------------------------------------------------------------------------------------------
  _test_from_hedgepath: ( hedgepath ) ->
    hedges = @hub._split_hedgerow_text hedgepath
    hedges = hedgepath.split @hub.cfg.sep
    H.nameit hedgepath, ( x ) -> @_isa hedges..., x

  #---------------------------------------------------------------------------------------------------------
  _create_test_walker: ( dsc ) ->
    has_extras = null
    if ( test_for_extras = not dsc.extras )
      has_extras = @_create_has_extras dsc
    return ( x ) ->
      return false if ( R = @isa x ) is false
      return R unless R is true
      return false if test_for_extras and has_extras x
      for _, f of @fields
        return false if ( R = f x ) is false
        return R unless R is true
      return true

  #---------------------------------------------------------------------------------------------------------
  _create_has_extras: ( dsc ) ->
    default_keys = new Set Object.keys dsc.default
    R = ( x ) ->
      x_keys = new Set Object.keys x
      if ( extra_keys = GUY.sets.subtract x_keys, default_keys ).size isnt 0
        @state.extra_keys = [ extra_keys..., ]
        return true
      return false
    return H.nameit "#{dsc.name}:has_extras", R.bind @hub


############################################################################################################
@Type_factory = Type_factory

