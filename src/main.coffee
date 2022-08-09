
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
HEDGES                    = require './hedges'
DECLARATIONS              = require './declarations'
{ to_width }              = require 'to-width'
{ Type_factory }          = require './type-factory'



# #===========================================================================================================
# class Type_cfg extends H.Intertype_abc

#   #---------------------------------------------------------------------------------------------------------
#   constructor: ( hub, cfg ) ->
#     ### TAINT ensure type_cfg does not contain `type`, `name` ###
#     ### TAINT do not use `tests.every()` when only 1 test given ###
#     super()
#     GUY.props.hide @, 'hub', hub
#     cfg                   = { H.defaults.Type_cfg_constructor_cfg..., cfg..., }
#     H.types.validate.Type_cfg_constructor_cfg cfg
#     cfg.test              = new Proxy ( @_compile_test hub, cfg ), hub._get_hedge_sub_proxy_cfg hub
#     #.......................................................................................................
#     ### TAINT not used by `size_of()` ###
#     cfg.size              = 'length' if cfg.isa_collection and not cfg.size?
#     cfg.size             ?= null
#     #.......................................................................................................
#     @[ k ]                = v for k, v of cfg
#     return self = GUY.lft.freeze @

#   #---------------------------------------------------------------------------------------------------------
#   _compile_test: ( hub, cfg ) ->
#     cfg.test = @_compile_object_as_test hub, cfg unless cfg.test?
#     if not cfg.extras
#       cfg.test                    = [ cfg.test, ] unless H.types.isa.list cfg.test
#       keys                        = ( k for k of cfg.default ).sort()
#       cfg.test.unshift no_extras  = ( x ) => H.equals ( k for k of x ).sort(), keys
#     test = null
#     if H.types.isa.list cfg.test
#       unless cfg.test.length is 1
#         # fn_names  = ( f.name for f in cfg.test )
#         tests     = ( f.bind hub for f in cfg.test )
#         test      = H.nameit cfg.name, ( x ) =>
#           for test in tests
#             return false if ( R = test x ) is false
#             return R unless R is true
#           return true
#         return test
#       test = cfg.test[ 0 ]
#     test ?= cfg.test
#     return H.nameit cfg.name, ( x ) =>
#       try
#         return test.call hub, x
#       catch error
#         throw error if @hub.cfg.errors is 'throw' or error instanceof E.Intertype_error
#         @hub.state.error = error
#       return false

  # #---------------------------------------------------------------------------------------------------------
  # _compile_object_as_test: ( hub, cfg ) ->
  #   type  = cfg.name
  #   R     = []
  #   for key, test of cfg
  #     continue unless key.startsWith '$'
  #     if H.types.isa.function test
  #       R.push test
  #       continue
  #     field = key[ 1 .. ]
  #     R.push @_test_from_text hub, type, field, test
  #   return R

  # #---------------------------------------------------------------------------------------------------------
  # _test_from_text: ( hub, type, field, property_chain ) ->
  #   property_chain  = property_chain.split '.'
  #   if field is ''
  #     name = "#{type}:#{property_chain.join hub.cfg.sep}"
  #     return H.nameit name, ( x ) -> @_isa property_chain..., x
  #   name = "#{type}.#{field}:#{property_chain.join hub.cfg.sep}"
  #   return H.nameit name, ( x ) -> @_isa property_chain..., x[ name ]


#===========================================================================================================
class Intertype extends H.Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    GUY.props.hide @, 'cfg',          { H.defaults.Intertype_constructor_cfg..., cfg..., }
    H.types.validate.Intertype_constructor_cfg @cfg
    #.......................................................................................................
    GUY.props.hide @, '_hedges',      new HEDGES.Intertype_hedges()
    GUY.props.hide @, '_collections', new Set()
    GUY.props.hide @, '_signals',     H.signals
    # GUY.props.hide @, 'isa',      new GUY.props.Strict_owner { reset: false, }
    GUY.props.hide @, 'isa',          new Proxy {}, @_get_hedge_base_proxy_cfg @, '_isa'
    GUY.props.hide @, 'validate',     new Proxy {}, @_get_hedge_base_proxy_cfg @, '_validate'
    GUY.props.hide @, 'create',       new Proxy {}, @_get_hedge_base_proxy_cfg @, '_create'
    GUY.props.hide @, 'type_factory', new Type_factory @
    #.......................................................................................................
    ### TAINT squeezing this in here for the moment, pending reformulation of `isa` &c to make them callable: ###
    GUY.props.hide @, 'declare',      new Proxy ( @_declare.bind @ ), get: ( _, name ) => ( P... ) =>
      @_declare name, P...
    #.......................................................................................................
    GUY.props.hide @, 'registry',     new GUY.props.Strict_owner { oneshot: true, }
    # GUY.props.hide @, 'types',        H.types
    @state = {}
    @_initialize_state
    #.......................................................................................................
    @_register_hedges()
    DECLARATIONS._provisional_declare_basic_types @
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _initialize_state: ->
    @state.data           = null if @state.data is undefined
    @state.extra_keys     = null
    @state.method         = null
    @state.hedges        ?= []
    @state.hedges.length  = 0
    @state.error          = null
    return null

  #---------------------------------------------------------------------------------------------------------
  _register_hedges: ->
    for hedge, isa of @_hedges._hedgemethods
      do ( hedge, isa ) =>
        @declare hedge, { isa, }
    return null

  #---------------------------------------------------------------------------------------------------------
  ### TAINT ideally would put this stuff elsewhere ###
  _get_hedge_base_proxy_cfg: ( self, method_name ) ->
    # _method_name  = method_name
    # _method_name  = "_#{method_name}" unless _method_name.startsWith '_'
    #.......................................................................................................
    return
      get: ( target, key ) =>
        return undefined          if key is Symbol.toStringTag
        return target.constructor if key is 'constructor'
        return target.toString    if key is 'toString'
        return target.call        if key is 'call'
        return target.apply       if key is 'apply'
        #...................................................................................................
        self._initialize_state()
        self.state.method = method_name
        self.state.hedges.push key
        #...................................................................................................
        if key in [ 'of', 'or', ]
          throw new E.Intertype_ETEMPTBD '^intertype.base_proxy@2^', \
            "hedgerow cannot start with `#{key}`, must be preceeded by hedge"
        unless ( GUY.props.get @registry, key, null )?
          throw new E.Intertype_ETEMPTBD '^intertype.base_proxy@3^', "unknown hedge or type #{rpr key}"
        return R if ( R = GUY.props.get target, key, H.signals.nothing ) isnt H.signals.nothing
        if method_name is '_create'
          f = H.nameit key, ( cfg = null ) -> self[ self.state.method ] key, cfg
        else
          f = H.nameit key, ( P... ) -> self[ self.state.method ] P...
        GUY.props.hide target, key, R = new Proxy f, @_get_hedge_sub_proxy_cfg self
        return R

  #---------------------------------------------------------------------------------------------------------
  _get_hedge_sub_proxy_cfg: ( self ) ->
    return
      get: ( target, key ) =>
        return undefined          if key is Symbol.toStringTag
        return target.constructor if key is 'constructor'
        return target.toString    if key is 'toString'
        return target.call        if key is 'call'
        return target.apply       if key is 'apply'
        self.state.hedges.push key
        return R if ( R = GUY.props.get target, key, H.signals.nothing ) isnt H.signals.nothing
        #...................................................................................................
        unless ( type_cfg = GUY.props.get @registry, key, null )?
          throw new E.Intertype_ETEMPTBD '^intertype.base_proxy@4^', "unknown hedge or type #{rpr key}"
        #...................................................................................................
        ### check for preceding type being iterable when building hedgerow with `of`: ###
        if ( key is 'of' ) and ( not @_collections.has target.name )
          throw new E.Intertype_ETEMPTBD '^intertype.sub_proxy@5^', \
            "expected type before `of` to be a collection, got #{rpr target.name}"
        #...................................................................................................
        f = H.nameit key, ( x ) -> self[ self.state.method ] self.state.hedges..., x
        GUY.props.hide target, key, R = new Proxy f, @_get_hedge_sub_proxy_cfg self
        return R

  #---------------------------------------------------------------------------------------------------------
  _declare: ( P... ) ->
    ### TAINT handling of arguments here shimmed while we have not yet nailed down the exact calling
    convention for this method. ###
    dsc                       = @type_factory.create_type P...
    @registry[ dsc.typename ] = dsc
    ### TAINT need not call _get_hedge_sub_proxy_cfg() twice? ###
    @isa[      dsc.typename ] = new Proxy dsc,                                     @_get_hedge_sub_proxy_cfg @
    @validate[ dsc.typename ] = new Proxy ( ( x ) => @_validate dsc.typename, x ), @_get_hedge_sub_proxy_cfg @
    @_collections.add dsc.typename if dsc.collection
    return null

  #---------------------------------------------------------------------------------------------------------
  _validate_hedgerow: ( hedgerow ) ->
    if ( hedgerow[ 0 ] in [ 'of', 'or', ] ) or ( hedgerow[ hedgerow.length - 1 ] in [ 'of', 'or', ] )
      xr = rpr hedgerow.join @cfg.sep
      throw new E.Intertype_ETEMPTBD '^intertype.validate_hedgerow@6^', \
        "hedgerow cannot begin or end with `of` or `or`, must be surrounded by hedges, got #{xr}"
    return null

  #---------------------------------------------------------------------------------------------------------
  _isa: ( hedges..., x ) ->
    try
      return @_inner_isa hedges..., x
    catch error
      throw error if @cfg.errors is 'throw' or error instanceof E.Intertype_error
      @state.error = error
    return false

  #---------------------------------------------------------------------------------------------------------
  _inner_isa: ( hedges..., x ) ->
    @_validate_hedgerow hedges
    hedge_idx       = -1
    last_hedge_idx  = hedges.length - 1
    advance         = false
    is_terminal     = false
    R               = true
    # element_mode    = false
    #.......................................................................................................
    loop
      hedge_idx++
      if hedge_idx > last_hedge_idx
        return R
      hedge       = hedges[ hedge_idx ]
      is_terminal = ( hedges[ hedge_idx + 1 ] is 'or' ) or ( hedge_idx is last_hedge_idx )
      #.....................................................................................................
      if advance
        return false if is_terminal
        continue unless hedge is 'or'
      advance = false
      #.....................................................................................................
      switch hedge
        #...................................................................................................
        when 'of'
          # element_mode = true
          tail_hedges = hedges[ hedge_idx + 1 .. ]
          try
            for element from x
              return false if ( @_inner_isa tail_hedges..., element ) is false
          catch error
            throw error unless ( error.name is 'TypeError' ) and ( error.message is 'x is not iterable' )
            throw new E.Intertype_ETEMPTBD '^intertype.isa@7^', \
              "`of` must be preceded by collection name, got #{rpr hedges[ hedge_idx - 1 ]}"
          return true
        #...................................................................................................
        when 'or'
          R = true
          continue
      #.....................................................................................................
      unless ( type_cfg = GUY.props.get @registry, hedge, null )?
        throw new E.Intertype_ETEMPTBD '^intertype.isa@8^', "unknown hedge or type #{rpr hedge}"
      #.....................................................................................................
      result = type_cfg.call @, x
      switch result
        when H.signals.return_true
          return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: true, }
        # when H.signals.advance                then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
        # when H.signals.process_list_elements  then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
        # when H.signals.process_set_elements   then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
        when false
          @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: false, }
          advance = true
          R       = false
          continue
        when true
          @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: true, }
          return true if is_terminal
          continue
      #.....................................................................................................
      throw new E.Intertype_internal_error '^intertype.isa@9^', \
        "unexpected return value from hedgemethod for hedge #{rpr hedge}: #{rpr R}"
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  _protocol_isa: ({ term, x, value, verdict, }) ->
    # urge '^4535^', GUY.trm.reverse { term, x, value, verdict, }
    return verdict

  #---------------------------------------------------------------------------------------------------------
  _validate: ( hedges..., type, x ) ->
    return x if @_isa hedges..., type, x
    qtype = [ hedges..., type, ].join @cfg.sep
    xr    = to_width ( rpr x ), 100
    throw new E.Intertype_ETEMPTBD '^intertype.validate@10^', "not a valid #{qtype}: #{xr}"

  #---------------------------------------------------------------------------------------------------------
  _create: ( type, cfg ) ->
    create = null
    #.......................................................................................................
    unless ( type_cfg = GUY.props.get @registry, type, null )?
      throw new E.Intertype_ETEMPTBD '^intertype.create@11^', "unknown type #{rpr type}"
    #.......................................................................................................
    ### Try to get `create` method, or, should that fail, the `default` value. Throw error when neither
    `create` nor `default` are given: ###
    if ( create = GUY.props.get type_cfg, 'create', null ) is null
      if ( R = GUY.props.get type_cfg, 'default', H.signals.nothing ) is H.signals.nothing
        throw new E.Intertype_ETEMPTBD '^intertype.create@12^', \
          "type #{rpr type} does not have a `default` value or a `create()` method"
    #.......................................................................................................
    else
      ### If `create` is given, call it to obtain default value: ###
      R = create.call @, cfg
    #.......................................................................................................
    if ( not create? ) and cfg?
      if ( t = H.js_type_of R ) is '[object Object]' or t is '[object Array]'
        R = Object.assign ( structuredClone R ), cfg
      else
        R = cfg
    else
      R = structuredClone R
    #.......................................................................................................
    if      type_cfg.freeze is true   then R = Object.freeze R
    else if type_cfg.freeze is 'deep' then R = GUY.lft.freeze H.deep_copy R
    #.......................................................................................................
    return @_validate type, R

  #---------------------------------------------------------------------------------------------------------
  equals:                     H.equals
  type_of:                    H.type_of
  size_of:                    H.size_of
  _normalize_type:            ( type ) -> type.toLowerCase().replace /\s+/g, ''
  _split_hedgerow_text:       ( hedgerow ) -> hedgerow.split @cfg.sep

  # #-----------------------------------------------------------------------------------------------------------
  # _walk_hedgepaths: ( cfg ) ->
  #   throw new Error "^intertype._walk_hedgepaths@9^ not implemented"
  #   # cfg = { H.defaults.Intertype_walk_hedgepaths_cfg..., cfg..., }
  #   # yield from GUY.props.walk_tree @isa, cfg
  #   # return null


############################################################################################################
@Type_factory         = Type_factory
@Intertype            = Intertype
@Intertype_user_error = E.Intertype_user_error


