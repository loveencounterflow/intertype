
'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug, warn, }          = GUY.trm.get_loggers 'INTERTYPE'
{ rpr   }                 = GUY.trm
#...........................................................................................................
E                         = require './errors'
H                         = require './helpers'
HEDGES                    = require './hedges'
ITYP                      = @
types                     = new ( require 'intertype-legacy' ).Intertype()
@defaults                 = {}
{ to_width }              = require 'to-width'
deep_copy                 = structuredClone
equals                    = require '../deps/jkroso-equals'

#-----------------------------------------------------------------------------------------------------------
types.declare 'deep_boolean', ( x ) -> x in [ 'deep', false, true, ]

#-----------------------------------------------------------------------------------------------------------
types.declare 'Type_cfg_constructor_cfg', tests:
  "@isa.object x":                            ( x ) -> @isa.object x
  "@isa.nonempty_text x.name":                ( x ) -> @isa.nonempty_text x.name
  # "@isa.deep_boolean x.copy":                 ( x ) -> @isa.boolean x.copy
  # "@isa.boolean x.seal":                      ( x ) -> @isa.boolean x.seal
  "@isa.deep_boolean x.freeze":               ( x ) -> @isa.deep_boolean x.freeze
  "@isa.boolean x.extras":                    ( x ) -> @isa.boolean x.extras
  "if extras is false, default must be an object": \
    ( x ) -> ( x.extras ) or ( @isa.object x.default )
  "@isa_optional.function x.create":          ( x ) -> @isa_optional.function x.create
  "( @isa.function x.test ) or ( @isa_list_of.function x.test )": \
    ( x ) -> ( @isa.function x.test ) or ( @isa_list_of.function x.test )
  "x.groups is a nonempty text or a nonempty list of nonempty texts": ( x ) ->
    return true if @isa.nonempty_text x.groups
    return false unless @isa.list x.groups
    return x.groups.every ( e ) => ( @isa.nonempty_text e ) and not ( /[\s,]/ ).test e
#...........................................................................................................
@defaults.Type_cfg_constructor_cfg =
  groups:           'other'
  name:             null
  test:             null
  ### `default` omitted on purpose ###
  create:           null
  # copy:             false
  # seal:             false
  freeze:           false
  extras:           true

#-----------------------------------------------------------------------------------------------------------
types.declare 'Intertype_constructor_cfg', tests:
  "@isa.object x":                            ( x ) -> @isa.object x
  "@isa_optional.nonempty_text x.sep":        ( x ) -> @isa_optional.nonempty_text x.sep
#...........................................................................................................
@defaults.Intertype_constructor_cfg =
  sep:              '.'

# #-----------------------------------------------------------------------------------------------------------
# types.declare 'Intertype_walk_hedgepaths_cfg', tests:
#   "@isa.object x":                      ( x ) -> @isa.object x
#   "@isa_optional.nonempty_text x.sep":  ( x ) -> @isa_optional.nonempty_text x.sep
#   "@isa_optional.function x.evaluate":  ( x ) -> @isa_optional.function x.evaluate
#   ### TAINT omitted other settings for `GUY.props.tree()` ###
# #...........................................................................................................
# @defaults.Intertype_walk_hedgepaths_cfg =
#   sep:      @defaults.Intertype_constructor_cfg.sep
#   evaluate: ({ owner, key, value, }) ->
#     return 'take' if ( types.type_of value ) is 'function'
#     return 'take' unless GUY.props.has_any_keys value
#     return 'descend'

#===========================================================================================================
class Intertype_abc extends GUY.props.Strict_owner


#===========================================================================================================
class @Type_cfg extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( hub, cfg ) ->
    ### TAINT ensure type_cfg does not contain `type`, `name` ###
    super()
    GUY.props.hide @, 'hub', hub
    cfg                   = { ITYP.defaults.Type_cfg_constructor_cfg..., cfg..., }
    cfg.groups            = @_compile_groups cfg.groups
    if types.isa.list cfg.test then tests = ( f.bind hub for f in cfg.test )
    else                            tests = [ ( cfg.test.bind hub ), ]
    types.validate.Type_cfg_constructor_cfg cfg
    #.......................................................................................................
    if not cfg.extras
      keys                = ( k for k of cfg.default ).sort()
      @[ H.signals.keys ] = keys
      tests.push ( x ) -> equals ( k for k of x ).sort(), keys
    cfg.test              = ( x ) => tests.every ( f ) -> f x
    #.......................................................................................................
    ### TAINT not used by `size_of()` ###
    cfg.size              = 'length' if cfg.isa_collection and not cfg.size?
    cfg.size             ?= null
    #.......................................................................................................
    @[ k ]                = v for k, v of cfg
    return self = GUY.lft.freeze @

  #---------------------------------------------------------------------------------------------------------
  _compile_groups: ( groups ) ->
    warn GUY.trm.reverse "^_compile_groups@1^ should validate groups"
    R = if ( types.isa.text groups ) then groups.split /\s*,\s*/ else groups
    # for group in R
    #   continue if GUY.props.has @hub._hedges.hedgepaths, group
    #   throw new E.Intertype_ETEMPTBD '^intertype/Type_cfg^', "unknown hedge group #{rpr group}"
    return R

#===========================================================================================================
class @Intertype extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    self = @
    #.......................................................................................................
    ### TAINT ideally would put this stuff elsewhere ###
    get_base_proxy_cfg = ( method_name ) ->
      return
        get: ( target, key ) =>
          return undefined if key is Symbol.toStringTag
          self.state.method = method_name
          self.state.hedges = [ key, ]
          return R if ( R = GUY.props.get target, key, H.signals.nothing ) isnt H.signals.nothing
          if method_name is '_create'
            f = { "#{key}": ( ( cfg = null ) -> self[ self.state.method ] key, cfg ), }[ key ]
          else
            f = { "#{key}": ( ( P... ) -> self[ self.state.method ] P... ), }[ key ]
          return target[ key ] = new Proxy f, sub_proxy_cfg
    #.......................................................................................................
    sub_proxy_cfg =
      get: ( target, key ) =>
        return undefined if key is Symbol.toStringTag
        self.state.hedges.push key
        return R if ( R = GUY.props.get target, key, H.signals.nothing ) isnt H.signals.nothing
        f = { "#{key}": ( x ) ->
            return self[ self.state.method ] self.state.hedges..., x
            }[ key ]
        return target[ key ] = new Proxy f, sub_proxy_cfg
    #.......................................................................................................
    GUY.props.hide @, 'cfg',          { ITYP.defaults.Intertype_constructor_cfg..., cfg..., }
    GUY.props.hide @, '_hedges',      new HEDGES.Intertype_hedges()
    # GUY.props.hide @, 'isa',          new GUY.props.Strict_owner { reset: false, }
    GUY.props.hide @, 'isa',          new Proxy {}, get_base_proxy_cfg '_isa'
    GUY.props.hide @, 'validate',     new Proxy {}, get_base_proxy_cfg '_validate'
    GUY.props.hide @, 'create',       new Proxy {}, get_base_proxy_cfg '_create'
    GUY.props.hide @, 'declare',      new Proxy ( @_declare.bind @ ), get: ( _, type ) => ( cfg ) => @_declare.call @, type, cfg
    GUY.props.hide @, 'registry',     new GUY.props.Strict_owner { reset: false, }
    GUY.props.hide @, 'types',        types
    GUY.props.hide @, 'groups',       {}
    @state =
      data:     null
      method:   null
      hedges:   []
    #.......................................................................................................
    for group from @_hedges._get_groupnames()
      @groups[ group ] = new Set()
      do ( group ) =>
        @declare group, groups: group, test: ( x ) =>
          R = @groups[ group ].has @type_of x
          return @_protocol_isa { term: group, x, value: H.signals.nothing, verdict: R, }
    GUY.lft.freeze @groups
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declare: ( type, type_cfg ) ->
    ### TAINT handling of arguments here shimmed while we have not yet nailed down the exact calling
    convention for this method. ###
    type_cfg            = { type_cfg..., name: type, }
    type_cfg            = new ITYP.Type_cfg @, type_cfg
    @registry[  type ]  = type_cfg
    @isa[       type ]  = type_cfg.test
    @validate[  type ]  = ( x ) => @_validate type, x
    for group in type_cfg.groups
      @_add_type_to_group group, type
    return null

  #---------------------------------------------------------------------------------------------------------
  _add_type_to_group: ( group, type ) ->
    @groups[ group ].add type
    return null

  #---------------------------------------------------------------------------------------------------------
  _isa: ( hedges..., type, x ) ->
    for hedge, hedge_idx in hedges
      switch R = @_test_hedge hedge, x
        when true                       then null
        when H.signals.true_and_break   then return true
        when H.signals.false_and_break  then return false
        when false                      then return false
        when H.signals.process_list_elements, H.signals.process_set_elements
          tail_hedges = hedges[ hedge_idx + 1 .. ]
          for e from x
            unless @_isa tail_hedges..., type, e
              return false
          return true
        else
          throw new E.Intertype_ETEMPTBD '^intertype@1^', "illegal return value from `_test_hedge()`: #{rpr type}"
    #.......................................................................................................
    unless ( typetest = GUY.props.get @isa, type, null )?
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "unknown type #{rpr type}"
    verdict = typetest x
    return @_protocol_isa { term: type, x, value: H.signals.nothing, verdict, }

  #---------------------------------------------------------------------------------------------------------
  _test_hedge: ( hedge, x ) ->
    unless ( hedgetest = GUY.props.get @_hedges._hedgemethods, hedge, null )?
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "unknown hedge #{rpr hedge}"
    #.......................................................................................................
    switch R = hedgetest.call @, x
      when H.signals.true_and_break         then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
      when H.signals.false_and_break        then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
      when false                            then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: false, }
      when true                             then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: true, }
      when H.signals.process_list_elements  then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
      when H.signals.process_set_elements   then return @_protocol_isa { term: hedge, x, value: H.signals.nothing, verdict: R, }
    #.......................................................................................................
    throw new E.Intertype_internal_error '^intertype@1^', \
      "unexpected return value from hedgemethod for hedge #{rpr hedge}: #{rpr R}"

  #---------------------------------------------------------------------------------------------------------
  _protocol_isa: ({ term, x, value, verdict }) ->
    if ( type_cfg = GUY.props.get @registry, term, null )?
      groups  = type_cfg.groups ? null
      if ( test = GUY.props.get type_cfg, 'test', null )?
        src     = GUY.src.slug_from_simple_function { function: test, fallback: '???', }
      else
        src     = null
    else
      groups  = null
      src     = null
    debug GUY.trm.gold '^_protocol_isa@1^', { term, groups, x, value, verdict, src, }
    return verdict

  #---------------------------------------------------------------------------------------------------------
  _validate: ( hedges..., type, x ) ->
    return x if @_isa hedges..., type, x
    qtype = [ hedges..., type, ].join @cfg.sep
    xr    = to_width ( rpr x ), 100
    throw new E.Intertype_ETEMPTBD '^intertype@1^', "not a valid #{qtype}: #{xr}"

  #---------------------------------------------------------------------------------------------------------
  _create: ( type, cfg ) ->
    create = null
    #.......................................................................................................
    unless ( type_cfg = GUY.props.get @registry, type, null )?
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "unknown type #{rpr type}"
    #.......................................................................................................
    ### Try to get `create` method, or, should that fail, the `default` value. Throw error when neither
    `create` nor `default` are given: ###
    if ( create = GUY.props.get type_cfg, 'create', null ) is null
      if ( R = GUY.props.get type_cfg, 'default', H.signals.nothing ) is H.signals.nothing
        throw new E.Intertype_ETEMPTBD '^intertype@1^', \
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
    else if type_cfg.freeze is 'deep' then R = GUY.lft.freeze GUY.lft._deep_copy R
    #.......................................................................................................
    return @_validate type, R

  #---------------------------------------------------------------------------------------------------------
  equals:                     H.equals
  type_of:                    H.type_of
  size_of:                    H.size_of
  _normalize_type:            ( type ) -> type.toLowerCase().replace /\s+/g, ''

  #-----------------------------------------------------------------------------------------------------------
  _walk_hedgepaths: ( cfg ) ->
    throw new Error "^_walk_hedgepaths@1^ not implemented"
    # cfg = { ITYP.defaults.Intertype_walk_hedgepaths_cfg..., cfg..., }
    # yield from GUY.props.walk_tree @isa, cfg
    # return null


############################################################################################################
@defaults = GUY.lft.freeze @defaults



