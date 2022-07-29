

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug }                 = GUY.trm.get_loggers 'INTERTYPE/hedges'
{ rpr   }                 = GUY.trm
#...........................................................................................................
E                         = require './errors'
H                         = require './helpers'
L                         = @


#===========================================================================================================
@defaults =
  combinator_cfg:
    hedgematch:     '*'


#===========================================================================================================
class @Intertype_hedges extends GUY.props.Strict_owner

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    @cfg        = { L.defaults.combinator_cfg..., cfg..., }
    return undefined

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

  #---------------------------------------------------------------------------------------------------------
  ### TAINT tack onto prototype as hidden ###
  _hedgemethods: GUY.lft.freeze new GUY.props.Strict_owner target:
    optional:   ( x ) -> if x? then true else H.signals.return_true
    #.......................................................................................................
    or:         ( x ) -> x is true
    of:         ( x ) -> H.signals.element_mode
    #.......................................................................................................
    empty:      ( x ) -> ( H.size_of x, null ) is 0
    nonempty:   ( x ) -> ( H.size_of x, null ) isnt 0
    #.......................................................................................................
    positive0:  ( x ) -> ( x is +Infinity ) or ( ( Number.isFinite x ) and ( x >= 0 ) )
    positive1:  ( x ) -> ( x is +Infinity ) or ( ( Number.isFinite x ) and ( x >  0 ) )
    negative0:  ( x ) -> ( x is -Infinity ) or ( ( Number.isFinite x ) and ( x <= 0 ) )
    negative1:  ( x ) -> ( x is -Infinity ) or ( ( Number.isFinite x ) and ( x <  0 ) )


