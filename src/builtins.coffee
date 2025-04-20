
'use strict'



#-----------------------------------------------------------------------------------------------------------
primitive_types     = Object.freeze [ 'null', 'undefined', 'infinity', 'boolean', 'nan', 'float', 'anyfloat', 'text', ]
# declaration_$kinds  = Object.freeze [ '$independent', '$dependent', '$enumeration', '$record', '$variant', ]
declaration_$kinds  = Object.freeze [ '$unspecified', '$enumeration', '$record', '$variant', ]

#-----------------------------------------------------------------------------------------------------------
isa =
  text:               ( x ) -> ( typeof x is 'string' )
  nonempty_text:      ( x ) -> ( typeof x is 'string' ) and ( x.length > 0 )
  function:           ( x ) -> ( Object::toString.call x ) is '[object Function]'
  pod:                ( x ) -> x? and x.constructor in [ Object, undefined, ]
  list:               ( x ) -> Array.isArray  x
  primitive:          ( x ) -> primitive_types.includes type_of x
  object:             ( x ) -> x? and x instanceof Object
  type:               ( x ) -> x instanceof Type
  typespace:          ( x ) -> x instanceof Typespace
  intertype:          ( x ) -> x instanceof Intertype
  declaration_$kind:  ( x ) -> x in declaration_$kinds
  # nan:                    ( x ) => Number.isNaN         x

#-----------------------------------------------------------------------------------------------------------
type_of = ( x ) ->
  #.........................................................................................................
  ### Primitives: ###
  return 'null'         if x is null
  return 'undefined'    if x is undefined
  return 'infinity'     if ( x is +Infinity ) or ( x is -Infinity )
  return 'boolean'      if ( x is true ) or ( x is false )
  return 'nan'          if Number.isNaN     x
  return 'float'        if Number.isFinite  x
  # return 'pod'          if B.isa.pod x
  #.........................................................................................................
  switch jstypeof = typeof x
    when 'string'                       then return 'text'
  #.........................................................................................................
  return 'list'         if Array.isArray  x
  ### TAINT consider to return x.constructor.name ###
  millertype = Object::toString.call x
  return ( millertype.replace /^\[object ([^\]]+)\]$/, '$1' ).toLowerCase()
  # switch millertype = Object::toString.call x
  #   when '[object Function]'            then return 'function'
  #   when '[object AsyncFunction]'       then return 'asyncfunction'
  #   when '[object GeneratorFunction]'   then return 'generatorfunction'


#===========================================================================================================
module.exports = { isa, type_of, primitive_types, declaration_$kinds, }
