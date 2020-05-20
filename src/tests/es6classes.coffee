
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
  dddx = ( x ) ->
    mm_name = mark_miller_device      x
    dd_name = domenic_denicola_device x
    # https://stackoverflow.com/questions/3905144/how-to-retrieve-the-constructors-name-in-javascript#3905265
    dd_name = mm_name if ( not dd_name ) or ( dd_name is '' )
    return dd_name if dd_name isnt mm_name
    dd_name = dd_name.toLowerCase()
    if dd_name is 'number'
      return 'nan'      if Number.isNaN     x
      return 'infinity' unless Number.isFinite  x
      return 'number'
    else if dd_name is 'regexp' then dd_name = 'regex'
    else if dd_name is 'array'  then dd_name = 'list'
    return dd_name
  #.........................................................................................................
  class MyBareClass
  class MyObjectClass extends Object
  class MyArrayClass  extends Array
  SomeConstructor = ->
  #.........................................................................................................
  probes_and_matchers = [
    [ ( MyBareClass             ), 'function',              ] ### TAINT should ES6 classes get own type? ###
    [ ( MyObjectClass           ), 'function',              ] ### TAINT should ES6 classes get own type? ###
    [ ( MyArrayClass            ), 'function',              ] ### TAINT should ES6 classes get own type? ###
    [ ( SomeConstructor         ), 'function',              ]
    [ ( new MyBareClass()       ), 'MyBareClass',           ]
    [ ( new MyObjectClass()     ), 'MyObjectClass',         ]
    [ ( new MyArrayClass()      ), 'MyArrayClass',          ]
    [ ( new SomeConstructor()   ), 'SomeConstructor',       ]
    [ ( null                    ), 'null',                  ]
    [ ( undefined               ), 'undefined',             ]
    [ ( Object                  ), 'function',              ]
    [ ( Array                   ), 'function',              ]
    [ ( {}                      ), 'object',                ]
    [ ( []                      ), 'list',                  ]
    [ ( 42                      ), 'number',                ]
    [ ( NaN                     ), 'nan',                   ]
    [ ( Infinity                ), 'infinity',              ]
    [ ( -> await f()            ), 'asyncfunction',         ]
    [ ( -> yield 42             ), 'generatorfunction',     ]
    [ ( ( -> yield 42 )()       ), 'generator',             ]
    [ ( /x/                     ), 'regex',                 ]
    [ ( new Date()              ), 'date',                  ]
    [ ( Set                     ), 'function',              ]
    [ ( new Set()               ), 'set',                   ]
    [ ( Symbol                  ), 'function',              ]
    [ ( Symbol 'abc'            ), 'symbol',                ]
    [ ( Symbol.for 'abc'        ), 'symbol',                ]
    ]
  #.........................................................................................................
  debug()
  column_width  = 17
  for [ probe, matcher, ] in probes_and_matchers
    raw_results = [
      ( rpr probe )[ ... column_width ]
      mark_miller_device      probe
      ( mark_miller_device      probe ).toLowerCase()
      type_of                 probe
      domenic_denicola_device probe
      ( domenic_denicola_device probe ).toLowerCase()
      dddx                    probe
      matcher
      ]
    results   = []
    last_idx  = raw_results.length - 1
    for raw_result, idx in raw_results
      if ( idx in [ 0, last_idx, ] )
        color   = CND.cyan
      else
        if raw_result is matcher then color = CND.green
        else                          color = CND.red
      results.push color ( raw_result.padEnd column_width )
    echo results.join ' | '
  debug rpr ( ( -> yield 42 )()       ).constructor
  debug rpr ( ( -> yield 42 )()       ).constructor.name
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


############################################################################################################
unless module.parent?
  # test @
  test @[ "es6classes type detection devices" ]




