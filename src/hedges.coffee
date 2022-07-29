

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug }                 = GUY.trm.get_loggers 'INTERTYPE/hedges'
{ rpr   }                 = GUY.trm
#...........................................................................................................
E                         = require './errors'
H                         = require './helpers'
L                         = @
PMATCH                    = require 'picomatch'


#===========================================================================================================
@defaults =
  combinator_cfg:
    hedgematch:     '*'


#===========================================================================================================
class @Intertype_hedges extends GUY.props.Strict_owner

  #---------------------------------------------------------------------------------------------------------
  @catchall_group: 'other'
  @hedges: GUY.lft.freeze []

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { L.defaults.combinator_cfg..., cfg..., }
    # @hedgepaths = new GUY.props.Strict_owner()
    # for groupname from @_get_groupnames()
    #   compiled_hedges           = @_compile_hedges groupname, @constructor.hedges
    #   hedgepaths                = @get_hedgepaths compiled_hedges
    #   @hedgepaths[ groupname ]  = @_reduce_hedgepaths hedgepaths
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
    throw new E.Intertype_ETEMPTBD '^intertype.hedges@1^', "not implemented: get_hedgepaths()"
    return [] unless ( hedgematch = @cfg.hedgematch )?
    R = ( x.flat() for x in @_combine compiled_hedges )
    unless hedgematch is '*'
      for idx in [ R.length - 1 .. 0 ] by -1
        delete R[ idx ] unless @_match_hedgepath R[ idx ], hedgematch
    R.sort()
    return R

  #---------------------------------------------------------------------------------------------------------
  _match_hedgepath: ( hedgepath, globpattern ) -> PMATCH.isMatch hedgepath, globpattern
  _get_groupnames: -> GUY.lft.freeze new Set ( h.groups for h in @constructor.hedges ).flat()

  #---------------------------------------------------------------------------------------------------------
  @hedges: GUY.lft.freeze [
    # { terms: [ null, ],                                                     groups: [ 'bottom',       ], }
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

  # #---------------------------------------------------------------------------------------------------------
  # @groups_of_groups:
  #   collection:       [ ]

  #---------------------------------------------------------------------------------------------------------
  ### TAINT tack onto prototype as hidden ###
  _hedgemethods: GUY.lft.freeze new GUY.props.Strict_owner target:
    optional: ( x ) ->
      # debug GUY.trm.reverse GUY.trm.yellow '^optional@453^', (rpr x), ( not x? ), H.signals.return_true
      return H.signals.return_true unless x?
      return true
    #.......................................................................................................
    or:         ( x ) -> x is true
    #.......................................................................................................
    ### TAINT use `length` or `size` or custom method ###
    empty:      ( x ) -> ( H.size_of x, null ) is 0
    nonempty:   ( x ) -> ( H.size_of x, null ) isnt 0
    #.......................................................................................................
    #.......................................................................................................
    even:       ( x ) -> ( Number.isInteger x ) and ( x %% 2 ) is   0
    odd:        ( x ) -> ( Number.isInteger x ) and ( x %% 2 ) isnt 0
    positive0:  ( x ) -> ( x is +Infinity ) or ( ( Number.isFinite x ) and ( x >= 0 ) )
    positive1:  ( x ) -> ( x is +Infinity ) or ( ( Number.isFinite x ) and ( x >  0 ) )
    negative0:  ( x ) -> ( x is -Infinity ) or ( ( Number.isFinite x ) and ( x <= 0 ) )
    negative1:  ( x ) -> ( x is -Infinity ) or ( ( Number.isFinite x ) and ( x <  0 ) )


