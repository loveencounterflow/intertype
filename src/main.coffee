
'use strict'


############################################################################################################
# njs_util                  = require 'util'
njs_path                  = require 'path'
# njs_fs                    = require 'fs'
#...........................................................................................................
CND                       = require 'cnd'
rpr                       = CND.rpr.bind CND
badge                     = 'INTERTYPE/main'
log                       = CND.get_logger 'plain',     badge
info                      = CND.get_logger 'info',      badge
whisper                   = CND.get_logger 'whisper',   badge
alert                     = CND.get_logger 'alert',     badge
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
praise                    = CND.get_logger 'praise',    badge
echo                      = CND.echo.bind CND
#...........................................................................................................
GUY                       = require 'guy'
E                         = require './errors'
H                         = require './helpers'
HEDGES                    = require './hedges'
ITYP                      = @
types                     = new ( require 'intertype-legacy' ).Intertype()
@defaults                 = {}

#-----------------------------------------------------------------------------------------------------------
types.declare 'Type_cfg_constructor_cfg', tests:
  "@isa.object x":                      ( x ) -> @isa.object x
  "@isa.nonempty_text x.name":          ( x ) -> @isa.nonempty_text x.name
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

#-----------------------------------------------------------------------------------------------------------
types.declare 'Intertype_constructor_cfg', tests:
  "@isa.object x":                      ( x ) -> @isa.object x
  "@isa_optional.nonempty_text x.sep":  ( x ) -> @isa_optional.nonempty_text x.sep
#...........................................................................................................
@defaults.Intertype_constructor_cfg =
  sep:              '$'

#===========================================================================================================
class Intertype_abc extends GUY.props.Strict_owner


#===========================================================================================================
class @Type_cfg extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( hub, cfg ) ->
    ### TAINT ensure type_cfg does not contain `type`, `name` ###
    super()
    GUY.props.hide @, 'hub', hub
    cfg         = { ITYP.defaults.Type_cfg_constructor_cfg..., cfg..., }
    cfg.groups  = @_compile_groups cfg.groups
    types.validate.Type_cfg_constructor_cfg cfg
    if types.isa.list cfg.test
      _test       = ( f.bind hub for f in cfg.test )
      cfg.test    = ( x ) => _test.every ( f ) -> f x
    else
      cfg.test    = cfg.test.bind hub
    cfg.size    = 'length' if cfg.isa_collection and not cfg.size?
    cfg.size   ?= null
    @[ k ]      = v for k, v of cfg
    return GUY.lft.freeze @

  #---------------------------------------------------------------------------------------------------------
  _compile_groups: ( groups ) ->
    R = if ( types.isa.text groups ) then groups.split /\s*,\s*/ else groups
    for group in R
      continue if GUY.props.has @hub._hedges.hedgepaths, group
      throw new E.Intertype_ETEMPTBD '^intertype/Type_cfg^', "unknown hedge group #{rpr group}"
    return R


#===========================================================================================================
class @Intertype extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg      = { ITYP.defaults.Intertype_constructor_cfg..., cfg..., }
    GUY.props.hide @, '_hedges', new HEDGES.Intertype_hedge_combinator()
    @isa      = new GUY.props.Strict_owner { reset: false, }
    @groups   = {}
    GUY.props.hide @, 'declare',  new Proxy @_declare, get: ( _, type ) => ( cfg ) => @_declare type, cfg
    #.......................................................................................................
    for group from @_hedges._get_groupnames()
      @groups[ group ] = new Set()
      do ( group ) =>
      #   @isa[ group ] = ( x ) =>
      #     R = @groups[ group ].has @type_of x
      #     return @_protocol_isa group, R, R
        @declare group, groups: group, test: ( x ) =>
          R = @groups[ group ].has @type_of x
          return @_protocol_isa group, R, R
    GUY.lft.freeze @groups
    #.......................................................................................................
    ### TAINT to get the demo off the ground we here shim a few types; this part will definitily
    change in future versions ###
    # @declare 'object',  test: ( x ) -> ( H.type_of x ) is 'object'
    # @declare 'float',   groups: 'number',     test: ( x ) -> ( H.type_of x ) is 'float'
    # @declare 'text',    groups: 'collection', test: ( x ) -> ( H.type_of x ) is 'text'
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _declare: ( type, type_cfg ) ->
    ### TAINT handling of arguments here shimmed while we have not yet nailed down the exact calling
    convention for this method. ###
    type_cfg      = { type_cfg..., name: type, }
    type_cfg      = new ITYP.Type_cfg @, type_cfg
    @isa[ type ]  = type_cfg.test
    for group in type_cfg.groups
      #.....................................................................................................
      ### register type with group ###
      @_add_type_to_group group, type
      #.....................................................................................................
      for hedgepath from @_hedges.hedgepaths[ group ]
        continue if hedgepath.length is 0
        self = @isa
        for hedge in hedgepath
          unless GUY.props.has self, hedge
            self[ hedge ] = new GUY.props.Strict_owner()
            # self[ hedge ] = new GUY.props.Strict_owner()
          self = self[ hedge ]
        #...................................................................................................
        do ( hedgepath ) =>
          self[ type ] = ( x ) => @_isa hedgepath..., type, x
    return null

  #---------------------------------------------------------------------------------------------------------
  _add_type_to_group: ( group, type ) =>
    @groups[ group ].add type
    return null

  #---------------------------------------------------------------------------------------------------------
  _isa: ( hedges..., type, x ) =>
    for hedge, hedge_idx in hedges
      switch R = @_test_hedge hedge, x
        when true                       then null
        when H.signals.true_and_break   then return @_protocol_isa hedge, R, true
        when H.signals.false_and_break  then return @_protocol_isa hedge, R, false
        when false                      then return false
        when H.signals.process_list_elements, H.signals.process_set_elements
          tail_hedges = hedges[ hedge_idx + 1 .. ]
          # debug '^3324^', { tail_hedges, }
          for e from x
            unless @_isa tail_hedges..., type, e
              return @_protocol_isa hedge, R, false
          return true
        else
          throw new E.Intertype_ETEMPTBD '^intertype@1^', "illegal return value from `_test_hedge()`: #{rpr type}"
    # urge '^345^', { hedge, hedges, type, x, }
    #.......................................................................................................
    unless ( typetest = GUY.props.get @isa, type, null )?
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "unknown type #{rpr type}"
    # debug '^3435^', { hedges, type, x, }
    verdict = typetest x
    return @_protocol_isa type, verdict, verdict

  #---------------------------------------------------------------------------------------------------------
  _test_hedge: ( hedge, x ) =>
    unless ( hedgetest = GUY.props.get @_hedges._hedgemethods, hedge, null )?
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "unknown hedge #{rpr hedge}"
    #.......................................................................................................
    switch R = hedgetest x
      when H.signals.true_and_break         then return @_protocol_isa hedge, R, R
      when H.signals.false_and_break        then return @_protocol_isa hedge, R, R
      when false                            then return @_protocol_isa hedge, R, false
      when true                             then return @_protocol_isa hedge, R, true
      when H.signals.process_list_elements  then return @_protocol_isa hedge, R, R
      when H.signals.process_set_elements   then return @_protocol_isa hedge, R, R
    #.......................................................................................................
    throw new E.Intertype_internal_error '^intertype@1^', \
      "unexpected return value from hedgemethod for hedge #{rpr hedge}: #{rpr R}"

  #---------------------------------------------------------------------------------------------------------
  _protocol_isa: ( term, result, verdict ) ->
    urge '^_protocol_isa@1^', { term, result, verdict, }
    return verdict

  #---------------------------------------------------------------------------------------------------------
  type_of:                    H.type_of
  size_of:                    H.size_of


############################################################################################################
@defaults = GUY.lft.freeze @defaults

#===========================================================================================================
x = new @Intertype()
# urge x.foo = 42
# urge x.foo
# urge x.has
# urge x.has.foo
# urge x.has.bar
# try urge x.bar catch error then warn CND.reverse error.message


###

types.isa.integer                                           42
types.isa.even.integer                                      -42
types.isa.odd.integer                                       41
types.isa.negative1.integer                                 -42
types.isa.negative0.integer                                 0
types.isa.positive1.integer                                 42
types.isa.positive0.integer                                 0
types.isa.list_of.integer                                   [ 42, ]
types.isa.nonempty.list_of.negative1.integer                [ -42, ]
types.isa.nonempty.list_of.negative0.integer                [ 0, ]
types.isa.nonempty.list_of.positive1.integer                [ 42, ]
types.isa.nonempty.list_of.positive0.integer                [ 0, ]
types.isa.empty.list_of.integer                             []
types.isa.nonempty.list_of.integer                          [ 42, ]
types.isa.optional.integer                                  42
types.isa.optional.list_of.integer                          [ 42, ]
types.isa.optional.empty.list_of.integer                    []
types.isa.optional.nonempty.list_of.integer                 [ 42, ]
types.isa.optional.negative1.integer                        -42
types.isa.optional.negative0.integer                        0
types.isa.optional.positive1.integer                        42
types.isa.optional.positive0.integer                        0
types.isa.optional.nonempty.list_of.negative1.integer       [ -42, ]
types.isa.optional.nonempty.list_of.negative0.integer       [ 0, ]
types.isa.optional.nonempty.list_of.positive1.integer       [ 42, ]
types.isa.optional.nonempty.list_of.positive0.integer       [ 0, ]
types.isa.optional.empty.list_of.negative1.integer          -42
types.isa.optional.empty.list_of.negative0.integer          0
types.isa.optional.empty.list_of.positive1.integer          42
types.isa.optional.empty.list_of.positive0.integer          0

[all]     [all]     [isa_collection]  [isa_collection]  [isa_numeric]   [isa_numeric]   [mandatory]
————————————————————————————————————————————————————————————————————————————————————————————————————
isa       optional  empty             list_of           even            negative0       <type>
validate            nonempty                            odd             negative1
                                                                        positive0
                                                                        positive1
###



