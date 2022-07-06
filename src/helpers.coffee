

'use strict'

#-----------------------------------------------------------------------------------------------------------
{ inspect, }  = require 'util'
@assign       = Object.assign
# @jr           = JSON.stringify
LOUPE         = require '../deps/loupe.js'
@rpr          = rpr = ( x ) => LOUPE.inspect x, { customInspect: false, }
@xrpr         = ( x ) -> ( rpr x )[ .. 1024 ]
GUY           = require 'guy'
misfit        = Symbol 'misfit'
notavalue     = Symbol 'notavalue'
E             = require './errors'

###
_normalize_type =            ( type ) -> type.toLowerCase().replace /\s+/g, ''
js_type_of               = ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
###

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
  else
    try
      return R if ( R = x.length  )?
    catch error then null
    try
      return R if ( R = x.size    )?
    catch error then null
    return fallback unless fallback is misfit
  throw new E.Intertype_ETEMPTBD '^intertype.size_of@1^', \
    "expected an object with `x.length` or `x.size`, got a #{@type_of x}"

#---------------------------------------------------------------------------------------------------------
@size_of = ( x, fallback = misfit ) ->
  return R unless ( R = GUY.props.get x, 'length',  notavalue ) is notavalue
  return R unless ( R = GUY.props.get x, 'size',    notavalue ) is notavalue
  return fallback unless fallback is misfit
  throw new E.Intertype_ETEMPTBD '^intertype.size_of@1^', \
    "expected an object with `x.length` or `x.size`, got a #{@type_of x} with neither"

# #---------------------------------------------------------------------------------------------------------
# _is_empty:    ( type_cfg, x ) -> ( @_size_of type_cfg, x ) is 0
# _is_nonempty: ( type_cfg, x ) -> ( @_size_of type_cfg, x ) > 0

#---------------------------------------------------------------------------------------------------------
@signals = GUY.lft.freeze new GUY.props.Strict_owner target:
  true_and_break:         Symbol 'true_and_break'
  false_and_break:        Symbol 'false_and_break'
  process_list_elements:  Symbol 'process_list_elements'
  process_set_elements:   Symbol 'process_set_elements'

#-----------------------------------------------------------------------------------------------------------
@type_of = ( x ) ->
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
    return 'generator' if x.constructor is @constructor_of_generators
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

#-----------------------------------------------------------------------------------------------------------
@constructor_of_generators = ( ( -> yield 42 )() ).constructor
