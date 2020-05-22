
'use strict'


############################################################################################################
# njs_util                  = require 'util'
njs_path                  = require 'path'
# njs_fs                    = require 'fs'
#...........................................................................................................
CND                       = require 'cnd'
rpr                       = CND.rpr.bind CND
badge                     = 'INTERTYPE/tests/es6classes'
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
test                      = require 'guy-test'
INTERTYPE                 = require '../..'
{ Intertype, }            = INTERTYPE
{ assign
  flatten
  js_type_of }            = require '../helpers'


# #-----------------------------------------------------------------------------------------------------------
# @[ "es6classes type detection devices" ] = ( T, done ) ->
#   #.........................................................................................................
#   intertype = new Intertype()
#   { isa
#     validate
#     type_of
#     types_of
#     size_of
#     declare
#     all_keys_of } = intertype.export()
#   #.........................................................................................................
#   probes_and_matchers = [
#     [[ [ 1, 2, 3, 4, ]                                 ], 4,                                          null, ]
#     ]
#   #.........................................................................................................
#   for [ probe, matcher, error, ] in probes_and_matchers
#     await T.perform probe, matcher, error, -> return new Promise ( resolve, reject ) ->
#       resolve result
#       return null
#   done()
#   return null

#-----------------------------------------------------------------------------------------------------------
get_probes_and_matchers = ->
  #.........................................................................................................
  # class Array
  class MyBareClass
  class MyObjectClass extends Object
  class MyArrayClass  extends Array
  SomeConstructor = ->
  OtherConstructor = -> 42
  #.........................................................................................................
  # thx to https://www.reddit.com/r/javascript/comments/gnbqoy/askjs_is_objectprototypetostringcall_the_best/fra7fg9?utm_source=share&utm_medium=web2x
  # toString  = Function.prototype.call.bind Object.prototype.toString
  FooObject                       = {}
  FooObject[ Symbol.toStringTag ] = 'Foo'
  # console.log(toString(FooObject)) // [object Foo]
  #.........................................................................................................
  probes_and_matchers = [
    [ ( Object.create null                    ), 'nullobject',              ]
    [ ( { constructor: 'Bob', }               ), 'object',                  ]
    [ ( { CONSTRUCTOR: 'Bob', }               ), 'object',                  ]
    [ ( MyBareClass                           ), 'class',                   ]
    [ ( MyObjectClass                         ), 'class',                   ]
    [ ( MyArrayClass                          ), 'class',                   ]
    [ ( Array                                 ), 'function',                ]
    [ ( SomeConstructor                       ), 'function',                ]
    [ ( new MyBareClass()                     ), 'mybareclass',             ]
    [ ( new MyObjectClass()                   ), 'myobjectclass',           ]
    [ ( new MyArrayClass()                    ), 'myarrayclass',            ]
    [ ( new SomeConstructor()                 ), 'someconstructor',         ]
    [ ( new OtherConstructor()                ), 'otherconstructor',        ]
    [ ( null                                  ), 'null',                    ]
    [ ( undefined                             ), 'undefined',               ]
    [ ( Object                                ), 'function',                ]
    [ ( Array                                 ), 'function',                ]
    [ ( {}                                    ), 'object',                  ]
    [ ( []                                    ), 'array',                   ]
    [ ( '42'                                  ), 'string',                  ]
    [ ( 42                                    ), 'float',                   ]
    [ ( NaN                                   ), 'nan',                     ]
    [ ( Infinity                              ), 'infinity',                ]
    [ ( -> await f()                          ), 'asyncfunction',           ]
    [ ( -> yield from await f()               ), 'asyncgeneratorfunction',  ]
    [ ( -> yield 42                           ), 'generatorfunction',       ]
    [ ( ( -> yield 42 )()                     ), 'generator',               ]
    [ ( /x/                                   ), 'regex',                   ]
    [ ( new Date()                            ), 'date',                    ]
    [ ( Set                                   ), 'function',                ]
    [ ( new Set()                             ), 'set',                     ]
    [ ( Symbol                                ), 'function',                ]
    [ ( Symbol 'abc'                          ), 'symbol',                  ]
    [ ( Symbol.for 'abc'                      ), 'symbol',                  ]
    [ ( new Uint8Array [ 42, ]                ), 'uint8array',              ]
    [ ( Buffer.from [ 42, ]                   ), 'buffer',                  ]
    [ ( 12345678912345678912345n              ), 'bigint',                  ]
    [ ( FooObject                             ), 'foo',                     ]
    [ ( new Promise ( resolve ) ->            ), 'promise',                 ]
    [ ( new Number 42                         ), 'wrapper',                 ]
    [ ( new String '42'                       ), 'wrapper',                 ]
    [ ( new Boolean true                      ), 'wrapper',                 ]
    [ ( new RegExp 'x*'                       ), 'regex',                   ] ### NOTE not functionally different ###
    [ ( new Function 'a', 'b', 'return a + b' ), 'function',                ] ### NOTE not functionally different ###
    [ ( [].keys()                             ), 'arrayiterator',           ]
    [ ( ( new Set [] ).keys()                 ), 'setiterator',             ]
    [ ( ( new Map [] ).keys()                 ), 'mapiterator',             ]
    [ ( new Array()                           ), 'array',                   ]
    [ ( ( 'x' )[ Symbol.iterator ]()          ), 'stringiterator',          ]
    ]


#-----------------------------------------------------------------------------------------------------------
type_of_v3 = ( xP... ) ->
  ### TAINT this should be generalized for all Intertype types that split up / rename a JS type: ###
  throw new Error "^7746^ expected 1 argumnt got #{arity}" unless xP.length is 1
  switch R = js_type_of xP...
    when 'uint8array'
      R = 'buffer' if Buffer.isBuffer xP...
    when 'number'
      [ x, ] = xP
      unless Number.isFinite x
        R = if ( Number.isNaN x ) then 'nan' else 'infinity'
    when 'regexp'         then R = 'regex'
    when 'string'         then R = 'text'
    when 'array'          then R = 'list'
    when 'arrayiterator'  then R = 'listiterator'
    when 'stringiterator' then R = 'textiterator'
  ### Refuse to answer question in case type found is not in specs: ###
  # debug 'µ33332', R, ( k for k of @specs )
  # throw new Error "µ6623 unknown type #{rpr R}" unless R of @specs
  return R

#-----------------------------------------------------------------------------------------------------------
### TAINT move constants to module ###
Generator       = ( ( -> yield 42 )() ).constructor
#-----------------------------------------------------------------------------------------------------------
type_of_v4 = ( x ) ->
  return 'null'       if x is null
  return 'undefined'  if x is undefined
  return 'infinity'   if ( x is Infinity  ) or  ( x is -Infinity  )
  return 'boolean'    if ( x is true      ) or  ( x is false      )
  return 'nan'        if ( Number.isNaN     x )
  return 'buffer'     if ( Buffer.isBuffer  x )
  #.........................................................................................................
  if ( tagname = x[ Symbol.toStringTag ] )?
    return 'arrayiterator'  if tagname is 'Array Iterator'
    return 'stringiterator' if tagname is 'String Iterator'
    return 'mapiterator'    if tagname is 'Map Iterator'
    return 'setiterator'    if tagname is 'Set Iterator'
    return tagname.toLowerCase()
  #.........................................................................................................
  ### Domenic Denicola Device, see https://stackoverflow.com/a/30560581 ###
  return 'nullobject' if ( c = x.constructor ) is undefined
  return 'object'     if ( typeof c ) isnt 'function'
  if ( R = c.name.toLowerCase() ) is ''
    return 'generator' if x.constructor is Generator
    ### NOTE: throw error since this should never happen ###
    return ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase() ### Mark Miller Device ###
  #.........................................................................................................
  return 'wrapper'  if ( typeof x is 'object' ) and R in [ 'boolean', 'number', 'string', ]
  return 'float'    if R is 'number'
  return 'regex'    if R is 'regexp'
  ### thx to https://stackoverflow.com/a/29094209 ###
  ### TAINT may produce an arbitrarily long throwaway string ###
  return 'class'    if R is 'function' and x.toString().startsWith 'class '
  return R

#-----------------------------------------------------------------------------------------------------------
@[ "es6classes type detection devices (prototype)" ] = ( T, done ) ->
  intertype = new Intertype()
  { isa
    validate }  = intertype.export()
  { domenic_denicola_device, mark_miller_device, } = require '../helpers'
  #.........................................................................................................
  debug()
  column_width  = 25
  #.........................................................................................................
  headers = [
    'probe'
    'typeof'
    # 'toString()'
    'string_tag'
    'miller'
    'type_of_v3'
    'denicola'
    'type_of_v4'
    'expected' ]
  headers = ( h[ ... column_width ].padEnd column_width for h in headers ).join '|'
  echo headers
  #.........................................................................................................
  for [ probe, matcher, ] in get_probes_and_matchers()
    type_of_v4_type = type_of_v4 probe
    string_tag      = if probe? then probe[ Symbol.toStringTag ]  else './.'
    # toString        = if probe? then probe.toString?() ? './.'    else './.'
    raw_results     = [
      rpr                     probe
      typeof                  probe
      # toString
      string_tag
      mark_miller_device      probe
      type_of_v3              probe
      domenic_denicola_device probe
      type_of_v4_type
      matcher ]
    results   = []
    last_idx  = raw_results.length - 1
    for raw_result, idx in raw_results
      if isa.text raw_result
        raw_result  = raw_result.replace /\n/g, '⏎'
        lc_result   = raw_result.toLowerCase().replace /\s/g, ''
      else
        raw_result  = ''
        lc_result   = null
      if ( idx in [ 0, last_idx, ] )
        color   = CND.cyan
      else
        if      raw_result                is matcher then color = CND.green
        else if lc_result                 is matcher then color = CND.lime
        else                                              color = CND.red
      results.push color ( raw_result[ ... column_width ].padEnd column_width )
    echo results.join '|'
    T.eq type_of_v4_type, matcher
  # debug rpr ( ( -> yield 42 )()       ).constructor
  # debug rpr ( ( -> yield 42 )()       ).constructor.name
  # debug '^338-10^', mmd MyBareClass           # Function
  # debug '^338-11^', mmd MyObjectClass         # Function
  # debug '^338-12^', mmd MyArrayClass          # Function
  # debug '^338-13^', mmd new MyBareClass()     # Object
  # debug '^338-14^', mmd new MyObjectClass()   # Object
  # debug '^338-15^', mmd new MyArrayClass()    # Array
  # debug()                                     #
  # debug '^338-16^', ddd MyBareClass           # Function
  # debug '^338-17^', ddd MyObjectClass         # Function
  # debug '^338-18^', ddd MyArrayClass          # Function
  # debug '^338-19^', ddd new MyBareClass()     # MyBareClass
  # debug '^338-20^', ddd new MyObjectClass()   # MyObjectClass
  # debug '^338-21^', ddd new MyArrayClass()    # MyArrayClass
  done()

#-----------------------------------------------------------------------------------------------------------
@[ "_es6classes equals" ] = ( T, done ) ->
  intertype = new Intertype()
  { isa
    check
    equals } = intertype.export()
  ### TAINT copy more extensive tests from CND, `js_eq`? ###
  T.eq ( equals 3, 3 ), true
  T.eq ( equals 3, 4 ), false
  done() if done?

#-----------------------------------------------------------------------------------------------------------
demo_test_for_generator = ->
  GeneratorFunction = ( -> yield 42                   ).constructor
  Generator         = ( ( -> yield 42 )()             ).constructor
  debug rpr GeneratorFunction.name  == 'GeneratorFunction'
  debug rpr Generator.name          == ''
  debug ( -> yield 42                   ).constructor is GeneratorFunction
  debug ( -> yield 42                   ).constructor is Generator
  debug ( ( -> yield 42 )()             ).constructor is GeneratorFunction
  debug ( ( -> yield 42 )()             ).constructor is Generator

############################################################################################################
if module is require.main then do =>
  # demo_test_for_generator()
  test @


  # ```
  # echo( 'helo' );
  # echo( rpr(
  #   ( function*() { yield 42; } ).constructor.name
  #   ) );
  # echo( rpr(
  #   ( function*() { yield 42; } )().constructor.name
  #   ) );
  # ```

# node -p "require('util').inspect( ( function*() { yield 42; } ).constructor )"
# node -p "require('util').inspect( ( function*() { yield 42; } ).constructor.name )"
# node -p "require('util').inspect( ( function*() { yield 42; } )().constructor )"
# node -p "require('util').inspect( ( function*() { yield 42; } )().constructor.name )"

  info rpr ( -> yield 42; ).constructor
  info rpr ( -> yield 42; ).constructor.name
  info rpr ( -> yield 42; )().constructor
  info rpr ( -> yield 42; )().constructor.name
  # info rpr NaN.constructor.name

  info arrayiterator  = [].keys().constructor
  info setiterator    = ( new Set [] ).keys().constructor
  info mapiterator    = ( new Map [] ).keys().constructor
  info stringiterator = ( 'x' )[ Symbol.iterator ]().constructor
  types = new Intertype()
  # debug types.all_keys_of Buffer.alloc 10
  # debug types.all_keys_of new Uint8Array 10

  # class X extends NaN
  # class X extends null
  # class X extends undefined
  # class X extends 1
  # class X extends {}
  myfunction = ->
  class X
  class O extends Object

  info '^87-1^', rpr ( myfunction:: )
  info '^87-2^', rpr ( myfunction:: ).constructor
  info '^87-3^', rpr ( myfunction:: ).constructor.name
  info '^87-4^', rpr ( X:: )
  info '^87-5^', rpr ( X:: ).constructor
  info '^87-6^', rpr ( X:: ).constructor.name
  info '^87-7^', rpr ( O:: )
  info '^87-8^', rpr ( O:: ).constructor
  info '^87-9^', rpr ( O:: ).constructor.name
  info Object.hasOwnProperty X, 'arguments'
  info Object.hasOwnProperty ( -> ), 'arguments'
  info Object.hasOwnProperty ( ( x ) -> ), 'arguments'
  info Object.hasOwnProperty ( ( -> ):: ), 'arguments'
  info Object.hasOwnProperty ( ( ( x ) -> ):: ), 'arguments'
  urge Object.getOwnPropertyNames X
  urge Object.getOwnPropertyNames ( -> )


