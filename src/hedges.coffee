

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
  combine_ ( terms ) => ( ( v for _, v of x ) for x in combinate terms )

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
    R = ( x.flat() for x in combine compiled_hedges )
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
