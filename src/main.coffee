
'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  info
  warn
  urge
  help }                  = GUY.trm.get_loggers 'INTERTYPE'
{ rpr }                   = GUY.trm
#...........................................................................................................
E                         = require './errors'
H                         = require './helpers'
HEDGES                    = require './hedges'
DECLARATIONS              = require './declarations'
{ Type_factory }          = require './type-factory'
{ to_width }              = require 'to-width'



#===========================================================================================================
class Intertype extends H.Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @data = {}
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
    GUY.props.hide @, 'registry',     GUY.props.Strict_owner.create { oneshot: true, }
    # GUY.props.hide @, 'types',        H.types
    @_initialize_state()
    #.......................................................................................................
    @_register_hedges()
    DECLARATIONS._provisional_declare_basic_types @
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _initialize_state: ( cfg ) ->
    ### TAINT should use deep copy of default object ###
    return @state = { H.defaults.Intertype_state..., hedgeresults: [], cfg..., }

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
        self.state.method       = method_name
        self.state.verb         = method_name[ 1... ]
        self.state.hedges       = [ key, ]
        self.state.hedgerow     = key
        #...................................................................................................
        if key in [ 'of', 'or', ]
          throw new E.Intertype_ETEMPTBD '^intertype.base_proxy@2^', \
            "hedgerow cannot start with `#{key}`, must be preceeded by hedge"
        unless ( GUY.props.get @registry, key, null )?
          throw new E.Intertype_ETEMPTBD '^intertype.base_proxy@3^', "unknown hedge or type #{rpr key}"
        #...................................................................................................
        return R if ( R = GUY.props.get target, key, H.signals.nothing ) isnt H.signals.nothing
        #...................................................................................................
        ### TAINT code below never used? ###
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
        self.state.hedgerow = self.state.hedges.join self.cfg.sep
        return R if ( R = GUY.props.get target, key, H.signals.nothing ) isnt H.signals.nothing
        #...................................................................................................
        unless ( type_dsc = GUY.props.get @registry, key, null )?
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
    @isa[      dsc.typename ] = new Proxy dsc, @_get_hedge_sub_proxy_cfg @
    dscv                      = H.nameit dsc.typename, ( x ) => @_validate dsc.typename, x
    @validate[ dsc.typename ] = new Proxy dscv, @_get_hedge_sub_proxy_cfg @
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
    @state.isa_depth++
    R = false
    try
      R = @state.result = @_inner_isa hedges..., x
    catch error
      throw error if @cfg.errors or error instanceof E.Intertype_error
      @state.error = error
    @state.isa_depth--
    return @state.result = R

  #---------------------------------------------------------------------------------------------------------
  _inner_isa: ( hedges..., x ) ->
    @_validate_hedgerow hedges
    hedge_idx       = -1
    last_hedge_idx  = hedges.length - 1
    advance         = false
    is_terminal     = false
    R               = true
    #.......................................................................................................
    loop
      hedge_idx++
      if hedge_idx > last_hedge_idx
        return ( R )                                                                # exit point
      hedge       = hedges[ hedge_idx ]
      is_terminal = ( hedges[ hedge_idx + 1 ] is 'or' ) or ( hedge_idx is last_hedge_idx )
      #.....................................................................................................
      if advance
        return ( false ) if is_terminal                                             # exit point
        continue unless hedge is 'or'
      advance = false
      #.....................................................................................................
      switch hedge
        #...................................................................................................
        when 'of'
          @push_hedgeresult [ '▲ii1', @state.isa_depth, 'of', x, true, ]
          tail_hedges = hedges[ hedge_idx + 1 .. ]
          try
            for element from x
              # return ( false ) if ( @_inner_isa tail_hedges..., element ) is false  # exit point
              return ( false ) if ( @_isa tail_hedges..., element ) is false  # exit point
          catch error
            throw error unless ( error.name is 'TypeError' ) and ( error.message is 'x is not iterable' )
            throw new E.Intertype_ETEMPTBD '^intertype.isa@7^', \
              "`of` must be preceded by collection name, got #{rpr hedges[ hedge_idx - 1 ]}"
          return ( true )                                                           # exit point
        #...................................................................................................
        when 'or'
          @push_hedgeresult [ '▲ii2', @state.isa_depth, 'or', x, true, ]
          R = true
          continue
      #.....................................................................................................
      unless ( type_dsc = GUY.props.get @registry, hedge, null )?
        throw new E.Intertype_ETEMPTBD '^intertype.isa@8^', "unknown hedge or type #{rpr hedge}"
      #.....................................................................................................
      # @push_hedgeresult hedgeresult = [ '▲ii3', @state.isa_depth, type_dsc.name, x, ]
      result = type_dsc.call @, x
      # hedgeresult.push result
      switch result
        when H.signals.return_true
          return true
        when false
          advance = true
          R       = false
          continue
        when true
          return true if is_terminal
          continue
      #.....................................................................................................
      throw new E.Intertype_internal_error '^intertype.isa@9^', \
        "unexpected return value from hedgemethod for hedge #{rpr hedge}: #{rpr result}"
    #.......................................................................................................
    return ( R )                                                                    # exit point

  #---------------------------------------------------------------------------------------------------------
  _validate: ( hedges..., x ) ->
    return x if @_isa hedges..., x
    state_report  = @get_state_report { format: 'short', colors: false, width: 500, }
    state_report += '\n'
    state_report += GUY.trm.reverse GUY.trm.red "\n Validation Failure "
    state_report += '\n'
    state_report += ( @get_state_report { format: 'failing', } ).trim()
    state_report += '\n'
    state_report += GUY.trm.reverse GUY.trm.red " Validation Failure \n"
    throw new E.Intertype_validation_error '^intertype.validate@3^', @state, state_report

  #---------------------------------------------------------------------------------------------------------
  _create: ( type, cfg ) ->
    create = null
    #.......................................................................................................
    unless ( type_dsc = GUY.props.get @registry, type, null )?
      throw new E.Intertype_ETEMPTBD '^intertype.create@11^', "unknown type #{rpr type}"
    #.......................................................................................................
    ### Try to get `create` method, or, should that fail, the `default` value. Throw error when neither
    `create` nor `default` are given: ###
    if ( create = GUY.props.get type_dsc, 'create', null ) is null
      if ( R = GUY.props.get type_dsc, 'default', H.signals.nothing ) is H.signals.nothing
        throw new E.Intertype_ETEMPTBD '^intertype.create@12^', \
          "type #{rpr type} does not have a `default` value or a `create()` method"
    #.......................................................................................................
    else
      ### If `create` is given, call it to obtain default value: ###
      R = create.call @, cfg
    #.......................................................................................................
    if ( not create? ) and cfg?
      if ( t = H.js_type_of R ) is '[object Object]' or t is '[object Array]'
        R = Object.assign ( H.deep_copy R ), cfg
      else
        R = cfg
    else
      R = H.deep_copy R
    #.......................................................................................................
    if      type_dsc.freeze is true   then R = Object.freeze R
    else if type_dsc.freeze is 'deep' then R = GUY.lft.freeze H.deep_copy R
    #.......................................................................................................
    return @_validate type, R

  #---------------------------------------------------------------------------------------------------------
  equals:                     H.equals
  type_of:                    H.type_of.bind H
  size_of:                    H.size_of.bind H
  _normalize_type:            H._normalize_type.bind H
  _split_hedgerow_text:       ( hedgerow ) -> hedgerow.split @cfg.sep

  #---------------------------------------------------------------------------------------------------------
  get_state_report: ( cfg ) -> H.get_state_report @, cfg

  #---------------------------------------------------------------------------------------------------------
  push_hedgeresult: ( hedgeresult ) ->
    ### [ ref, level, hedge, value, r, ] = hedgeresult ###
    [ ref, level, hedge, value, r, ] = hedgeresult
    H.types.validate.nonempty_text  ref
    # H.types.validate.cardinal       level
    H.types.validate.nonempty_text  hedge
    # H.types.validate.boolean        r
    @state.hedgeresults.push hedgeresult
    return hedgeresult.at -1

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


