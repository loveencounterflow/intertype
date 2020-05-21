
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
@[ "es6classes type detection devices" ] = ( T, done ) ->
  intertype = new Intertype()
  { isa
    validate
    type_of } = intertype.export()
  { domenic_denicola_device, mark_miller_device, } = require '../helpers'
  #.........................................................................................................
  dddx_v1 = ( x ) ->
    return 'null'       if x is null
    return 'undefined'  if x is undefined
    return 'infinity'   if ( x is Infinity  ) or  ( x is -Infinity  )
    return 'boolean'    if ( x is true      ) or  ( x is false      )
    return 'nan'        if ( Number.isNaN x )
    #.......................................................................................................
    # https://stackoverflow.com/questions/3905144/how-to-retrieve-the-constructors-name-in-javascript#3905265
    dd_name = x.constructor.name                      # Domenic Denicola Device
    mm_name = ( Object::toString.call x ).slice 8, -1 # Mark Miller Device
    return 'buffer' if ( dd_name is 'Buffer' ) and ( mm_name is 'Uint8Array' )
    dd_name = mm_name if ( not dd_name ) or ( dd_name is '' )
    return "<#{dd_name}>" if dd_name isnt mm_name
    dd_name = dd_name.toLowerCase()
    #.......................................................................................................
    if      ( dd_name is 'regexp' ) then return 'regex'
    else if ( dd_name is 'array'  ) then return 'list'
    return dd_name
  #.........................................................................................................
  dddx_v2 = ( x ) ->
    return 'null'       if x is null
    return 'undefined'  if x is undefined
    return 'infinity'   if ( x is Infinity  ) or  ( x is -Infinity  )
    return 'boolean'    if ( x is true      ) or  ( x is false      )
    return 'nan'        if ( Number.isNaN x )
    #.......................................................................................................
    ### TAINT move constants to module ###
    Generator = ( ( -> yield 42 )() ).constructor
    #.......................................................................................................
    # https://stackoverflow.com/questions/3905144/how-to-retrieve-the-constructors-name-in-javascript#3905265
    dd_name = x.constructor.name.toLowerCase() ### Domenic Denicola Device ###
    if dd_name is ''
      return 'generator' if x.constructor is Generator
      return ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase() ### Mark Miller Device ###
    #.......................................................................................................
    return 'float'  if dd_name is 'number'
    return 'regex'  if dd_name is 'regexp'
    return 'list'   if dd_name is 'array'
    return dd_name
  #.........................................................................................................
  class MyBareClass
  class MyObjectClass extends Object
  class MyArrayClass  extends Array
  SomeConstructor = ->
  #.........................................................................................................
  # ths to https://www.reddit.com/r/javascript/comments/gnbqoy/askjs_is_objectprototypetostringcall_the_best/fra7fg9?utm_source=share&utm_medium=web2x
  toString  = Function.prototype.call.bind Object.prototype.toString
  obj       = {}
  obj[ Symbol.toStringTag ] = 'Foo'
  # console.log(toString(obj)) // [object Foo]
  #.........................................................................................................
  probes_and_matchers = [
    [ ( MyBareClass                   ), 'function',              ] ### TAINT should ES6 classes get own type? ###
    [ ( MyObjectClass                 ), 'function',              ] ### TAINT should ES6 classes get own type? ###
    [ ( MyArrayClass                  ), 'function',              ] ### TAINT should ES6 classes get own type? ###
    [ ( SomeConstructor               ), 'function',              ]
    [ ( new MyBareClass()             ), 'mybareclass',           ]
    [ ( new MyObjectClass()           ), 'myobjectclass',         ]
    [ ( new MyArrayClass()            ), 'myarrayclass',          ]
    [ ( new SomeConstructor()         ), 'someconstructor',       ]
    [ ( null                          ), 'null',                  ]
    [ ( undefined                     ), 'undefined',             ]
    [ ( Object                        ), 'function',              ]
    [ ( Array                         ), 'function',              ]
    [ ( {}                            ), 'object',                ]
    [ ( []                            ), 'list',                  ]
    [ ( 42                            ), 'float',                 ]
    [ ( NaN                           ), 'nan',                   ]
    [ ( Infinity                      ), 'infinity',              ]
    [ ( -> await f()                  ), 'asyncfunction',         ]
    [ ( -> yield 42                   ), 'generatorfunction',     ]
    [ ( ( -> yield 42 )()             ), 'generator',             ]
    [ ( /x/                           ), 'regex',                 ]
    [ ( new Date()                    ), 'date',                  ]
    [ ( Set                           ), 'function',              ]
    [ ( new Set()                     ), 'set',                   ]
    [ ( Symbol                        ), 'function',              ]
    [ ( Symbol 'abc'                  ), 'symbol',                ]
    [ ( Symbol.for 'abc'              ), 'symbol',                ]
    [ ( new Uint8Array [ 42, ]        ), 'uint8array',            ]
    [ ( Buffer.from [ 42, ]           ), 'buffer',                ]
    [ ( 12345678912345678912345n      ), 'bigint',                ]
    [ ( obj                           ), 'object',                ]
    [ ( new Promise ( resolve ) ->    ), 'promise',               ]
    # [ ( class X extends NaN       ), '', ]
    # [ ( class X extends null      ), '', ]
    # [ ( class X extends undefined ), '', ]
    # [ ( class X extends 1         ), '', ]
    # [ ( class X extends {}        ), '', ]
    ]
  #.........................................................................................................
  debug()
  column_width  = 25
  #.........................................................................................................
  headers = [
    'probe'
    'typeof'
    'miller'
    'old type_of'
    'denicola'
    'dddx_v1'
    'dddx_v2'
    'expected' ]
  headers = ( h[ ... column_width ].padEnd column_width for h in headers ).join '|'
  echo headers
  #.........................................................................................................
  for [ probe, matcher, ] in probes_and_matchers
    dddx_v1_type     = dddx_v1 probe
    dddx_v2_type     = dddx_v2 probe
    raw_results = [
      rpr                     probe
      typeof                  probe
      mark_miller_device      probe
      type_of                 probe
      domenic_denicola_device probe
      dddx_v1_type
      dddx_v2_type
      matcher ]
    results   = []
    last_idx  = raw_results.length - 1
    for raw_result, idx in raw_results
      if ( idx in [ 0, last_idx, ] )
        color   = CND.cyan
      else
        if      raw_result                is matcher then color = CND.green
        else if raw_result.toLowerCase()  is matcher then color = CND.lime
        else                                              color = CND.red
      results.push color ( raw_result[ ... column_width ].padEnd column_width )
    echo results.join '|'
    T.eq dddx_v2_type, matcher
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
  demo_test_for_generator()
  test @

  # debug {}.constructor
  # debug {}.constructor.name
  # test @[ "es6classes type detection devices" ]
  # intertype = new Intertype()
  # { isa
  #   validate
  #   type_of } = intertype.export()
  # debug type_of 1n



