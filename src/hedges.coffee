

'use strict'


############################################################################################################
# njs_util                  = require 'util'
njs_path                  = require 'path'
# njs_fs                    = require 'fs'
#...........................................................................................................
CND                       = require 'cnd'
rpr                       = CND.rpr.bind CND
badge                     = 'INTERTYPE/combinator'
debug                     = CND.get_logger 'debug',     badge
echo                      = CND.echo.bind CND
#...........................................................................................................
GUY                       = require 'guy'
E                         = require './errors'
H                         = require './helpers'
combinate                 = ( require "combinate" ).default


#===========================================================================================================
class @Combinator extends GUY.props.Strict_owner

  #---------------------------------------------------------------------------------------------------------
  @catchall_group: 'other'
  @hedges: GUY.lft.freeze []

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    super()
    @hedgepaths = new GUY.props.Strict_owner()
    for groupname from @_get_groupnames()
      compiled_hedges           = @_compile_hedges groupname, @constructor.hedges
      hedgepaths                = @get_hedgepaths compiled_hedges
      @hedgepaths[ groupname ]  = @_reduce_hedgepaths hedgepaths
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _combine: ( terms ) => ( ( v for _, v of x ) for x in combinate terms )

  #---------------------------------------------------------------------------------------------------------
  _compile_hedges: ( groupname, hedges ) ->
    R               = []
    catchall_group  = @constructor.catchall_group
    for hedge in hedges
      unless catchall_group in hedge.groups
        continue unless groupname in hedge.groups
      target = []
      R.push target
      for termgroup in hedge.terms
        # continue if termgroup? and @_has_conflicting_hedge_matchers
        if Array.isArray termgroup
          target.splice target.length - 1, 0, ( @get_hedgepaths termgroup )...
        else
          target.push termgroup
    return R

  #---------------------------------------------------------------------------------------------------------
  get_hedgepaths: ( compiled_hedges ) ->
    R = ( x.flat() for x in @_combine compiled_hedges )
    R.sort()
    return R

  #---------------------------------------------------------------------------------------------------------
  _reduce_hedgepaths: ( combinations ) -> ( ( e for e in hp when e? ) for hp in combinations )

  #---------------------------------------------------------------------------------------------------------
  _get_groupnames: -> GUY.lft.freeze new Set ( h.groups for h in @constructor.hedges ).flat()



#===========================================================================================================
class @Intertype_hedge_combinator extends @Combinator

  #---------------------------------------------------------------------------------------------------------
  @hedges: GUY.lft.freeze [
    { terms: [ null, 'optional', ],                                         groups: [ 'other',        ], }
    { terms: [
      null,
      [ [ null, 'empty', 'nonempty', ]
        [ 'list_of', 'set_of', ]
        [ null, 'optional', ]
        ], ],                                                               groups: [ 'other',        ], }
    { terms: [ null, 'empty', 'nonempty', ],                                groups: [ 'collection',   ], }
    { terms: [ null, 'positive0', 'positive1', 'negative0', 'negative1', ], groups: [ 'number',       ], }
    ]

  #---------------------------------------------------------------------------------------------------------
  ### TAINT tack onto prototype as hidden ###
  _hedgemethods: GUY.lft.freeze new GUY.props.Strict_owner target:
    optional:   ( x ) =>
      # debug CND.reverse CND.yellow '^optional@453^', rpr x
      return H.signals.true_and_break unless x?
      return true
    #.......................................................................................................
    ### TAINT use `length` or `size` or custom method ###
    empty:      ( x ) => return ( H.size_of x, null ) is 0
    nonempty:   ( x ) => return ( H.size_of x, null ) isnt 0
    #.......................................................................................................
    ### TAINT this is wrong, must test ensuing arguments against each element in collection ###
    list_of:    ( x ) =>
      return H.signals.false_and_break unless Array.isArray x
      return H.signals.process_list_elements
    set_of:     ( x ) =>
      return H.signals.false_and_break unless x instanceof Set
      return H.signals.process_set_elements
    #.......................................................................................................
    positive0:  ( x ) =>
      # debug CND.reverse CND.yellow '^positive0@453^', rpr x
      x >= 0
    positive1:  ( x ) => x >  0
    negative0:  ( x ) => x <= 0
    negative1:  ( x ) => x <  0

  # #---------------------------------------------------------------------------------------------------------
  # _match_hedge_and_type_cfg: ( hedge, type_cfg ) ->
  #   unless @constructor.hedges_matchers_are_orthogonal
  #     name = @constructor.name
  #     throw new E.Intertype_not_implemented '^intertype.hedges@1^', \
  #       "non-orthogonal hedge matchers not implemented, got #{name}.hedges_matchers_are_orthogonal == false"
  #   return true unless property?
  #   for property of hedge.match
  #     return false unless type_cfg[ property ]
  #   return true

