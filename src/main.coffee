
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
types                     = new ( require 'intertype' ).Intertype()
@defaults                 = {}

#-----------------------------------------------------------------------------------------------------------
types.declare 'Type_cfg_constructor_cfg', tests:
  "@isa.object x":                      ( x ) -> @isa.object x
  "@isa_optional.nonempty_text x.size": ( x ) -> @isa_optional.nonempty_text x.size
  "@isa.function x.test":               ( x ) -> @isa.function x.test
  "x.groups is a nonempty text or a nonempty list of nonempty texts": ( x ) ->
    return true if @isa.nonempty_text x.groups
    return false unless @isa.list x.groups
    return x.groups.every ( e ) => ( @isa.nonempty_text e ) and not ( /[\s,]/ ).test e
#...........................................................................................................
@defaults.Type_cfg_constructor_cfg =
  groups:           'other'
  size:             null  # defaults to `'length'` where `isa_collection` is `true`
  test:             null

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
    cfg.test    = cfg.test.bind hub
    cfg.size    = 'length' if cfg.isa_collection and not cfg.size?
    cfg.size   ?= null
    @[ k ]      = v for k, v of cfg
    return GUY.lft.freeze @

  #---------------------------------------------------------------------------------------------------------
  _compile_groups: ( groups ) ->
    R = if ( types.isa.text groups ) then groups.split /\s*,\s*/ else groups
    for group in R
      continue if @hub._hedges.hedgepaths.has group
      throw new E.Intertype_ETEMPTBD '^intertype/Type_cfg^', "unknown hedge group #{rpr group}"
    return R


#===========================================================================================================
class @Intertype extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  @defaults: GUY.lft.freeze
    #.......................................................................................................
    constructor_cfg:
      sep:  '$'

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg      = { @constructor.defaults.constructor_cfg..., cfg..., }
    GUY.props.hide @, '_hedges', new HEDGES.Intertype_hedge_combinator()
    @isa      = new GUY.props.Strict_owner()
    @groups   = {}
    #.......................................................................................................
    for group from @_hedges._get_groupnames()
      @groups[ group ] = new Set()
      GUY.props.hide @isa, group, ( x ) => @groups[ group ].has @type_of x
    GUY.lft.freeze @groups
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  declare: ( type, type_cfg ) =>
    type_cfg      = new ITYP.Type_cfg @, type_cfg
    GUY.props.hide @isa, type, type_cfg.test
    for group in type_cfg.groups
      #.....................................................................................................
      ### register type with group ###
      @_add_type_to_group group, type
      #.....................................................................................................
      for hedgepath from @_hedges.hedgepaths[ group ]
        continue if hedgepath.length is 0
        self = @isa
        for hedge in hedgepath
          unless self.has hedge
            # GUY.props.hide self, hedge, new GUY.props.Strict_owner()
            self[ hedge ] = new GUY.props.Strict_owner()
          self = self[ hedge ]
        GUY.props.hide self, type, ( x ) =>
          info '^443^', { hedgepath, type, x, }
          @_isa hedgepath..., type, x
    return null

  #---------------------------------------------------------------------------------------------------------
  _add_type_to_group: ( group, type ) =>
    @groups[ group ].add type
    # @groups = GUY.lft.lets @groups, ( d ) -> d[ group ].add type
    return null

  #---------------------------------------------------------------------------------------------------------
  _isa: ( hedges..., type, x ) =>
    for hedge in hedges
      return false unless @_test_hedge hedge, x
    # urge '^345^', { hedge, hedges, type, x, }
    #.......................................................................................................
    unless ( typetest = @isa.get type, null )?
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "unknown type #{rpr type}"
    # debug '^3435^', { hedges, type, x, }
    verdict = typetest x
    return @_protocol_isa type, verdict, verdict

  #---------------------------------------------------------------------------------------------------------
  _test_hedge: ( hedge, x ) =>
    unless ( hedgetest = @_hedges._hedgemethods.get hedge, null )?
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "unknown hedge #{rpr hedge}"
    #.......................................................................................................
    switch R = hedgetest x
      when H.signals.true_and_break   then return @_protocol_isa hedge, R, true
      when H.signals.false_and_break  then return @_protocol_isa hedge, R, false
      when false                      then return @_protocol_isa hedge, R, false
      when true                       then return @_protocol_isa hedge, R, true
      #.....................................................................................................
      when H.signals.process_list_elements, H.signals.process_set_elements
        for e from x
          unless @_isa hedges..., type, e
            return @_protocol_isa hedge, R, false
        return @_protocol_isa hedge, R, true
    #.......................................................................................................
    throw new E.Intertype_internal_error '^intertype@1^', \
      "unexpected return value from hedgemethod for hedge #{rpr hedge}: #{rpr R}"

  #---------------------------------------------------------------------------------------------------------
  _protocol_isa: ( term, result, verdict ) ->
    # urge '^_protocol_isa@1^', { term, result, verdict, }
    return verdict

  #---------------------------------------------------------------------------------------------------------
  js_type_of:                 ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
  _normalize_type:            ( type ) -> type.toLowerCase().replace /\s+/g, ''
  _constructor_of_generators: ( ( -> yield 42 )() ).constructor

  #---------------------------------------------------------------------------------------------------------
  type_of: ( x ) ->
    throw new Error "^7746^ expected 1 argument, got #{arity}" unless ( arity = arguments.length ) is 1
    return 'null'       if x is null
    return 'undefined'  if x is undefined
    return 'infinity'   if ( x is Infinity  ) or  ( x is -Infinity  )
    return 'boolean'    if ( x is true      ) or  ( x is false      )
    return 'nan'        if ( Number.isNaN     x )
    return 'float'      if ( Number.isFinite  x )
    return 'buffer'     if ( Buffer.isBuffer  x )
    return 'list'       if ( Array.isArray  x )
    #.........................................................................................................
    ### TAINT Not needed (?) b/c `@js_type_of x` does work with these values, too ###
    ### this catches `Array Iterator`, `String Iterator`, `Map Iterator`, `Set Iterator`: ###
    if ( tagname = x[ Symbol.toStringTag ] )? and ( typeof tagname ) is 'string'
      return @_normalize_type tagname
    #.........................................................................................................
    ### Domenic Denicola Device, see https://stackoverflow.com/a/30560581 ###
    return 'nullobject' if ( c = x.constructor ) is undefined
    return 'object'     if ( typeof c ) isnt 'function'
    if ( R = c.name.toLowerCase() ) is ''
      return 'generator' if x.constructor is @_constructor_of_generators
      ### NOTE: throw error since this should never happen ###
      return ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase() ### Mark Miller Device ###
    #.........................................................................................................
    return 'wrapper'  if ( typeof x is 'object' ) and R in [ 'boolean', 'number', 'string', ]
    return 'regex'    if R is 'regexp'
    return 'text'     if R is 'string'
    ### thx to https://stackoverflow.com/a/29094209 ###
    ### TAINT may produce an arbitrarily long throwaway string ###
    return 'class'    if R is 'function' and x.toString().startsWith 'class '
    return R

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

js_type_of               = ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
length_of = ( x ) ->
  throw new Error "^1^" unless x?
  return x.length if Object.hasOwnProperty x, length
  return x.size   if Object.hasOwnProperty x, size
  return ( Object.keys x ).length if ( js_type_of x ) is 'object'
  throw new Error "^2^"
nonempty  = ( x ) -> ( length_of x ) > 0
empty     = ( x ) -> ( length_of x ) == 0
list_of   = ( type, x ) ->
  return false unless ( js_type_of x ) is 'array'
  return true if x.length is 0
  # return x.every ( e ) -> isa type, e
  return x.every ( e ) -> ( js_type_of e ) is type ### TAINT should use `isa` ###

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



