
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
ITYP                      = @


#===========================================================================================================
class Intertype_abc extends GUY.props.Strict_owner

  # #---------------------------------------------------------------------------------------------------------
  # constructor: ->
  #   super()
  #   return undefined

#===========================================================================================================
class Empty     extends Intertype_abc
class Nonempty  extends Intertype_abc
class List_of   extends Intertype_abc
class Defaults  extends Intertype_abc

#===========================================================================================================
class Isa_list_of extends Intertype_abc

#===========================================================================================================
class Validate_list_of extends Intertype_abc

#===========================================================================================================
class Isa_empty extends Intertype_abc
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate_empty extends Intertype_abc
  list_of:    new Validate_list_of()

#===========================================================================================================
class Isa_nonempty extends Intertype_abc
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate_nonempty extends Intertype_abc
  list_of:    new Validate_list_of()

#===========================================================================================================
class Isa_optional extends Intertype_abc
  empty:      new Isa_empty()
  nonempty:   new Isa_nonempty()
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate_optional extends Intertype_abc
  empty:      new Validate_empty()
  nonempty:   new Validate_nonempty()
  list_of:    new Validate_list_of()


#===========================================================================================================
class Isa extends Intertype_abc
  optional:   new Isa_optional()
  empty:      new Isa_empty()
  nonempty:   new Isa_nonempty()
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate extends Intertype_abc
  optional:   new Validate_optional()
  empty:      new Validate_empty()
  nonempty:   new Validate_nonempty()
  list_of:    new Validate_list_of()


#===========================================================================================================
class @Type_cfg extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  @defaults: GUY.lft.freeze
    #.......................................................................................................
    constructor_cfg:
      isa_numeric:      false
      isa_collection:   false
      size:             null  # defaults to `'length'` where `isa_collection` is `true`
      test:             null

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    ### TAINT ensure type_cfg does not contain `type`, `name` ###
    super()
    cfg         = { @constructor.defaults.constructor_cfg..., cfg..., }
    cfg.size    = 'length' if cfg.isa_collection and not cfg.size?
    cfg.size   ?= null
    @[ k ]      = v for k, v of cfg
    return GUY.lft.freeze @

#===========================================================================================================
class @Intertype extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  ### TAINT tack onto prototype as hidden ###
  _hedges: GUY.lft.freeze [
    { x: [ 'optional',                                                          ], match: { all: true,                }, }
    { x: [ [ 'empty', 'nonempty', ], [ 'list_of', 'set_of', ], [ 'optional', ], ], match: { all: true,                }, }
    { x: [ 'empty', 'nonempty',                                                 ], match: { isa_collection: true,     }, }
    { x: [ 'positive0', 'positive1', 'negative0', 'negative1',                  ], match: { isa_numeric: true,        }, }
    ]

  #---------------------------------------------------------------------------------------------------------
  ### TAINT tack onto prototype as hidden ###
  _signals: GUY.lft.freeze new GUY.props.Strict_owner target:
    true_and_break:         Symbol 'true_and_break'
    false_and_break:        Symbol 'false_and_break'
    process_list_elements:  Symbol 'process_list_elements'
    processd_set_elements:  Symbol 'processd_set_elements'

  #---------------------------------------------------------------------------------------------------------
  ### TAINT tack onto prototype as hidden ###
  _hedgemethods: GUY.lft.freeze new GUY.props.Strict_owner target:
    optional:   ( x ) ->
      return @_signals.true_and_break unless x?
      return true
    #.......................................................................................................
    ### TAINT use `length` or `size` or custom method ###
    empty:      ( x ) -> return ( @_size_of x ) is 0
    nonempty:   ( x ) -> return ( @_size_of x ) isnt 0
    #.......................................................................................................
    ### TAINT this is wrong, must test ensuing arguments against each element in collection ###
    list_of:    ( x ) ->
      return @_signals.false_and_break unless Array.isArray x
      return @_signals.process_list_elements
    set_of:     ( x ) ->
      return @_signals.false_and_break unless x instanceof Set
      return @_signals.processd_set_elements
    #.......................................................................................................
    positive0:  ( x ) -> x >= 0
    positive1:  ( x ) -> x >  0
    negative0:  ( x ) -> x <= 0
    negative1:  ( x ) -> x <  0

  #---------------------------------------------------------------------------------------------------------
  @defaults: GUY.lft.freeze
    #.......................................................................................................
    constructor_cfg:
      sep:  '$'

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    # @defaults           = new Defaults()
    # @isa                = new Isa()
    # @validate           = new Validate()
    @cfg      = { @constructor.defaults.constructor_cfg..., cfg..., }
    @_types   = {}
    #.......................................................................................................
    @isa = new GUY.props.Strict_owner target: ( hedges..., type, x ) =>
      ### TAINT code duplication ###
      hedges.push type
      name = ( hedges.join @cfg.sep )
      # throw new Error '^534-1^' if hedges.length isnt 1
      unless ( test = @_types[ name ]?.test )?
        throw new E.Intertype_ETEMPTBD '^intertype@2^', "no such type #{rpr hedges}"
      return test x
    #.......................................................................................................
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _match_hedge_and_type_cfg: ( hedge, type_cfg ) ->
    for property, value of hedge.match
      return true if property is 'all'
      return false unless type_cfg[ property ]
    return true

  #---------------------------------------------------------------------------------------------------------
  _walk_hedgepaths: ( type_cfg, hedge_idx = 0, current_path = [] ) ->
    ### thx to https://itecnote.com/tecnote/java-generate-all-combinations-from-multiple-lists/ ###
    if hedge_idx is @_hedges.length
      yield current_path
      return null
    hedge = @_hedges[ hedge_idx ]
    yield from @_walk_hedgepaths type_cfg, hedge_idx + 1, current_path
    return null unless @_match_hedge_and_type hedge, type_cfg
    if Array.isArray hedge.x[ 0 ]
      unless hedge.x.length is 2
        throw new E.Intertype_ETEMPTBD '^intertype@1^', \
          "expected hedge declaration to have exactly two sublists, got #{rpr hedge}"
      for term in hedge.x[ 1 ]
        next_path = [ current_path..., term, ]
        yield from @_walk_hedgepaths type_cfg, hedge_idx + 1, next_path
      for term1 in hedge.x[ 0 ]
        next_path_base = [ current_path..., term1 ]
        for term in hedge.x[ 1 ]
          next_path = [ next_path_base..., term, ]
          yield from @_walk_hedgepaths type_cfg, hedge_idx + 1, next_path
    else
      for term, term_idx in hedge.x
        next_path = [ current_path..., term, ]
        yield from @_walk_hedgepaths type_cfg, hedge_idx + 1, next_path
    return null

  #---------------------------------------------------------------------------------------------------------
  declare: ( type, type_cfg ) =>
    ### TAINT code duplication ###
    ### TAINT find better name for `name` ###
    type_cfg  = new ITYP.Type_cfg type_cfg
    for hedgepath from @_walk_hedgepaths type_cfg
      name            = [ hedgepath..., type, ].join @cfg.sep
      ### TAINT must include test for hedges ###
      test            = type_cfg.test.bind @
      @_types[ name ] = { type_cfg..., name, type, test, }
      @_declare_hedgepath { method: @isa, test, type, type_cfg, name, hedgepath, }
    return null

  #---------------------------------------------------------------------------------------------------------
  _protocol_isa: ( term, result, verdict ) ->
    debug '^_protocol_isa@1^', { term, result, verdict, }
    return verdict

  #---------------------------------------------------------------------------------------------------------
  _declare_hedgepath: ({ method, test, type, type_cfg, name, hedgepath, }) =>
    typetest      = test
    parent        = method
    hedgemethods  = []
    parent        = do =>
      for term in hedgepath
        hedgemethods.push [ term, @_hedgemethods[ term ], ]
        unless parent.has term
          ### TAINT consider to make functions out of these (re-use `method`?) ###
          GUY.props.hide parent, term, new GUY.props.Strict_owner()
        parent = parent[ term ]
      return parent
    #.......................................................................................................
    unless parent.has type
      #.....................................................................................................
      test = ( x ) =>
        for [ term, hedgemethod, ], hedge_idx in hedgemethods
          # debug '^_declare_hedgepath.test@1^', { term, R: ( hedgemethod.call @, x ), }
          switch R = hedgemethod.call @, x
            when @_signals.true_and_break   then return @_protocol_isa term, R, true
            when @_signals.false_and_break  then return @_protocol_isa term, R, false
            when false                      then return @_protocol_isa term, R, false
            when true                       then        @_protocol_isa term, R, true
            when @_signals.process_list_elements
              tail = ( hedgemethods[ idx ][ 1 ] for idx in [ hedge_idx + 1 ... hedgemethods.length ] )
              tail.push type
              debug '^4534^', tail
              for e in x
                return @_protocol_isa term, R, false unless @isa tail..., e
              return @_protocol_isa term, R, true
            else throw new E.Intertype_internal_error '^intertype@1^', \
              "unexpected return value from hedgemethod for term #{rpr term}: #{rpr R}"
        return @_protocol_isa type, null, typetest.call @, x
      #.....................................................................................................
      GUY.props.hide parent, type, test
    return null

  #---------------------------------------------------------------------------------------------------------
  _size_of:     ( x ) ->
    ### TAINT this will break with `Strict_owner` instances ###
    return R if ( R = x.length )?
    return R if ( R = x.size )?
    return ( Object.keys x ).length

  # #---------------------------------------------------------------------------------------------------------
  # _is_empty:    ( type_cfg, x ) -> ( @_size_of type_cfg, x ) is 0
  # _is_nonempty: ( type_cfg, x ) -> ( @_size_of type_cfg, x ) > 0

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



#===========================================================================================================
x = new @Intertype()
# urge x.foo = 42
# urge x.foo
# urge x.has
# urge x.has.foo
# urge x.has.bar
try urge x.bar catch error then warn CND.reverse error.message

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



