

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
  @_hedges: GUY.lft.freeze []

  #---------------------------------------------------------------------------------------------------------
  _combine: ( terms ) => ( ( v for _, v of x ) for x in combinate terms )

  #---------------------------------------------------------------------------------------------------------
  _compile_hedges: ( hedges, type_cfg ) ->
    R = []
    for hedge in hedges
      continue unless @_match_hedge_and_type_cfg hedge, type_cfg
      # termses = [ hedge.terms..., ]
      target = []
      R.push target
      for termgroup in hedge.terms
        if Array.isArray termgroup
          target.splice target.length - 1, 0, ( @get_hedgepaths termgroup )...
        else
          target.push termgroup
    return R

  #---------------------------------------------------------------------------------------------------------
  get_hedgepaths: ( compiled_hedges ) ->
    R = ( x.flat() for x in @_combine compiled_hedges )
    return R

  #---------------------------------------------------------------------------------------------------------
  _reduce_hedgepaths: ( combinations ) -> ( ( e for e in hp when e? ) for hp in combinations )


#===========================================================================================================
class @Intertype_hedge_combinator extends @Combinator

  #---------------------------------------------------------------------------------------------------------
  @hedges: GUY.lft.freeze [
    { terms: [ null, 'optional', ],                                         match: { all: true, }, }
    { terms: [
      null,
      [ [ null, 'empty', 'nonempty', ]
        [ 'list_of', 'set_of', ]
        [ null, 'optional', ]
        ], ],                                                               match: { all: true, }, }
    { terms: [ null, 'empty', 'nonempty', ],                                match: { isa_collection: true, }, }
    { terms: [ null, 'positive0', 'positive1', 'negative0', 'negative1', ], match: { isa_numeric: true, }, }
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
  _match_hedge_and_type_cfg: ( hedge, type_cfg ) ->
    for property, value of hedge.match
      return true if property is 'all'
      return false unless type_cfg[ property ]
    return true

