

'use strict'

#-----------------------------------------------------------------------------------------------------------
{ inspect, }  = require 'util'
@assign       = Object.assign
# @jr           = JSON.stringify
LOUPE         = require '../deps/loupe.js'
@rpr          = rpr = ( x ) => LOUPE.inspect x, { customInspect: false, }
@xrpr         = ( x ) -> ( rpr x )[ .. 1024 ]
GUY           = require 'guy'


#===========================================================================================================
# TYPE_OF FLAVORS
#-----------------------------------------------------------------------------------------------------------
@domenic_denicola_device  = ( x ) => x?.constructor?.name ? './.'
@mark_miller_device       = ( x ) => ( Object::toString.call x ).slice 8, -1
@mark_miller_device_2     = ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
@js_type_of               = ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@get_rprs_of_tprs = ( tprs ) ->
  ### `tprs: test parameters, i.e. additional arguments to type tester, as in `multiple_of x, 4` ###
  rpr_of_tprs = switch tprs.length
    when 0 then ''
    when 1 then "#{rpr tprs[ 0 ]}"
    else "#{rpr tprs}"
  srpr_of_tprs = switch rpr_of_tprs.length
    when 0 then ''
    else ' ' + rpr_of_tprs
  return { rpr_of_tprs, srpr_of_tprs, }

#-----------------------------------------------------------------------------------------------------------
@intersection_of = ( a, b ) ->
  a = [ a..., ].sort()
  b = [ b..., ].sort()
  return ( x for x in a when x in b ).sort()

#---------------------------------------------------------------------------------------------------------
@size_of = ( x, fallback = misfit ) ->
  unless x?
    return fallback unless fallback is misfit
  try
    return R if ( R = x.length  )?
  catch error then null
  try
    return R if ( R = x.size    )?
  catch error then null
  return fallback unless fallback is misfit
  throw new E.Intertype_ETEMPTBD '^intertype.size_of@1^', \
    "expected an object with `x.length` or `x.size`, got a #{@type_of x}"

# #---------------------------------------------------------------------------------------------------------
# _is_empty:    ( type_cfg, x ) -> ( @_size_of type_cfg, x ) is 0
# _is_nonempty: ( type_cfg, x ) -> ( @_size_of type_cfg, x ) > 0

#---------------------------------------------------------------------------------------------------------
@signals = GUY.lft.freeze new GUY.props.Strict_owner target:
  true_and_break:         Symbol 'true_and_break'
  false_and_break:        Symbol 'false_and_break'
  process_list_elements:  Symbol 'process_list_elements'
  process_set_elements:   Symbol 'process_set_elements'

