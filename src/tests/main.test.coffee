
'use strict'


############################################################################################################
# njs_util                  = require 'util'
njs_path                  = require 'path'
# njs_fs                    = require 'fs'
#...........................................................................................................
CND                       = require 'cnd'
rpr                       = CND.rpr.bind CND
badge                     = 'INTERTYPE/tests/main'
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
  jr
  flatten
  xrpr
  js_type_of }            = require '../helpers'



#-----------------------------------------------------------------------------------------------------------
@[ "_prototype keys" ] = ( T ) ->
  isa = @

  x =
    foo: 42
    bar: 108
  y = Object.create x
  y.bar = 'something'
  y.baz = 'other thing'

  ```
  const person = {
    isHuman: false,
    printIntroduction: function () {
      console.log(`My name is ${this.name}. Am I human? ${this.isHuman}`);
    }
  };

  const me = Object.create(person);
  me.name = "Matthew"; // "name" is a property set on "me", but not on "person"
  me.isHuman = true; // inherited properties can be overwritten

  me.printIntroduction();

  ```
  # urge me.prototype?
  # urge me.__proto__?

  info 'µ1', jr isa.generator_function isa.all_own_keys_of
  info 'µ2', jr isa.values_of isa.all_own_keys_of 'abc'
  info 'µ3', jr isa.values_of isa.all_keys_of 'abc'
  info 'µ4', jr isa.values_of isa.all_keys_of x
  info 'µ5', jr isa.values_of isa.all_keys_of y
  info 'µ5', jr isa.values_of isa.all_keys_of y, true
  info 'µ6', jr isa.values_of isa.all_keys_of me
  info 'µ7', jr isa.values_of isa.all_keys_of {}
  info 'µ8', jr isa.values_of isa.all_keys_of Object.create null
  info 'µ9', isa.keys_of me
  info 'µ9', jr isa.values_of isa.keys_of me
  # info 'µ10', jr ( k for k of me )
  # info 'µ11', jr Object.keys me
  # info 'µ12', isa.values_of isa.all_own_keys_of true
  # info 'µ13', isa.values_of isa.all_own_keys_of undefined
  # info 'µ14', isa.values_of isa.all_own_keys_of null

  # debug '' + rpr Object.create null
  # debug isa.values_of isa.all_keys_of Object::


#-----------------------------------------------------------------------------------------------------------
@[ "multiple tests" ] = ( T, done ) ->
  intertype = new Intertype
  { isa
    validate
    type_of
    types_of
    size_of
    declare
    all_keys_of } = intertype.export_methods()
  #.........................................................................................................
  probes_and_matchers = [
    [ "isa( 'callable', 'xxx'                             )", false,                null, ]
    [ "isa( 'callable', function () {}                    )", true,                 null, ]
    [ "isa( 'callable', async function () { await 42 }    )", true,                 null, ]
    [ "isa( 'callable', function* () { yield 42 }         )", true,                 null, ]
    [ "isa( 'callable', ( function* () { yield 42 } )()   )", false,                null, ]
    [ "isa( 'date',          new Date()                   )", true,                 null, ]
    [ "isa( 'date',          true                         )", false,                null, ]
    [ "isa( 'date',          'helo'                       )", false,                null, ]
    [ "isa( 'date',          2                            )", false,                null, ]
    [ "isa( 'date',          Date.now()                   )", false,                null, ]
    [ "isa( 'finite',        123                          )", true,                 null, ]
    [ "isa( 'global',        global                       )", true,                 null, ]
    [ "isa( 'integer',       123                          )", true,                 null, ]
    [ "isa( 'integer',       42                           )", true,                 null, ]
    [ "isa( 'number',        123                          )", true,                 null, ]
    [ "isa( 'number',        42                           )", true,                 null, ]
    [ "isa( 'number',        NaN                          )", false,                null, ]
    [ "isa( 'number',        NaN                          )", false,                null, ]
    [ "isa( 'safeinteger',   123                          )", true,                 null, ]
    [ "isa( 'text',          'x'                          )", true,                 null, ]
    [ "isa( 'text',          NaN                          )", false,                null, ]
    [ "isa.even(             42                           )", true,                 null, ]
    [ "isa.finite(           123                          )", true,                 null, ]
    [ "isa.integer(          123                          )", true,                 null, ]
    [ "isa.integer(          42                           )", true,                 null, ]
    [ "isa.multiple_of(      42, 2                        )", true,                 null, ]
    [ "isa.multiple_of(      5, 2.5                       )", true,                 null, ]
    [ "isa.multiple_of(      5, 2                         )", false,                null, ]
    [ "isa.number(           123                          )", true,                 null, ]
    [ "isa.safeinteger(      123                          )", true,                 null, ]
    [ "isa[ 'multiple_of' ]( 42, 2                        )", true,                 null, ]
    [ "isa.weakmap(           new WeakMap()               )", true,                null, ]
    [ "isa.map(               new Map()                   )", true,                null, ]
    [ "isa.set(               new Set()                   )", true,                null, ]
    [ "isa.date(              new Date()                  )", true,                null, ]
    [ "isa.error(             new Error()                 )", true,                null, ]
    [ "isa.list(              []                          )", true,                null, ]
    [ "isa.boolean(           true                        )", true,                null, ]
    [ "isa.boolean(           false                       )", true,                null, ]
    [ "isa.function(          ( () => {} )                      )", true,                null, ]
    [ "isa.asyncfunction(     ( async () => { await f() } )            )", true,                null, ]
    [ "isa.null(              null                        )", true,                null, ]
    [ "isa.text(              'helo'                      )", true,                null, ]
    [ "isa.undefined(         undefined                   )", true,                null, ]
    [ "isa.global(            global                      )", true,                null, ]
    [ "isa.regex(             /^xxx$/g                    )", true,                null, ]
    [ "isa.object(            {}                          )", true,                null, ]
    [ "isa.nan(               NaN                         )", true,                null, ]
    [ "isa.infinity(          1 / 0                       )", true,                null, ]
    [ "isa.infinity(          -1 / 0                      )", true,                null, ]
    [ "isa.number(            12345                       )", true,                null, ]
    [ "isa.buffer(            new Buffer( 'xyz' )         )", true,                null, ]
    [ "isa.uint8array(        new Buffer( 'xyz' )         )", true,                null, ]
    [ "type_of( new WeakMap()                             )", 'weakmap',            null, ]
    [ "type_of( new Map()                                 )", 'map',                null, ]
    [ "type_of( new Set()                                 )", 'set',                null, ]
    [ "type_of( new Date()                                )", 'date',               null, ]
    [ "type_of( new Error()                               )", 'error',              null, ]
    [ "type_of( []                                        )", 'list',               null, ]
    [ "type_of( true                                      )", 'boolean',            null, ]
    [ "type_of( false                                     )", 'boolean',            null, ]
    [ "type_of( ( () => {} )                              )", 'function',           null, ]
    [ "type_of( ( async () => { await f() } )             )", 'asyncfunction',      null, ]
    [ "type_of( null                                      )", 'null',               null, ]
    [ "type_of( 'helo'                                    )", 'text',               null, ]
    [ "type_of( undefined                                 )", 'undefined',          null, ]
    [ "type_of( global                                    )", 'global',             null, ]
    [ "type_of( /^xxx$/g                                  )", 'regex',              null, ]
    [ "type_of( {}                                        )", 'object',             null, ]
    [ "type_of( NaN                                       )", 'nan',                null, ]
    [ "type_of( 1 / 0                                     )", 'infinity',           null, ]
    [ "type_of( -1 / 0                                    )", 'infinity',           null, ]
    [ "type_of( 12345                                     )", 'number',             null, ]
    [ "type_of( 'xxx'                                     )", 'text',               null, ]
    [ "type_of( function () {}                            )", 'function',           null, ]
    [ "type_of( async function () { await 42 }            )", 'asyncfunction',      null, ]
    [ "type_of( function* () { yield 42 }                 )", 'generatorfunction',  null, ]
    [ "type_of( ( function* () { yield 42 } )()           )", 'generator',          null, ]
    [ "type_of( 123                                       )", 'number',             null, ]
    [ "type_of( 42                                        )", 'number',             null, ]
    [ "type_of( []                                        )", 'list',               null, ]
    [ "type_of( global                                    )", 'global',             null, ]
    [ "type_of( new Date()                                )", 'date',               null, ]
    [ "type_of( {}                                        )", 'object',             null, ]
    [ "type_of( new Buffer(            'helo'  )          )", 'buffer',             null, ]
    [ "type_of( new ArrayBuffer(       42      )          )", 'arraybuffer',        null, ]
    [ "type_of( new Int8Array(         5       )          )", 'int8array',          null, ]
    [ "type_of( new Uint8Array(        5       )          )", 'uint8array',         null, ]
    [ "type_of( new Uint8ClampedArray( 5       )          )", 'uint8clampedarray',  null, ]
    [ "type_of( new Int16Array(        5       )          )", 'int16array',         null, ]
    [ "type_of( new Uint16Array(       5       )          )", 'uint16array',        null, ]
    [ "type_of( new Int32Array(        5       )          )", 'int32array',         null, ]
    [ "type_of( new Uint32Array(       5       )          )", 'uint32array',        null, ]
    [ "type_of( new Float32Array(      5       )          )", 'float32array',       null, ]
    [ "type_of( new Float64Array(      5       )          )", 'float64array',       null, ]
    ]
  #.........................................................................................................
  for [ probe, matcher, error, ] in probes_and_matchers
    await T.perform probe, matcher, error, -> return new Promise ( resolve, reject ) ->
      result = eval probe
      # log jr [ probe, result, ]
      # resolve result
      resolve result
      return null
  done()
  return null
  return done(); XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

  info 'µ01-39', xrpr types_of             123
  info 'µ01-40', xrpr types_of             124
  info 'µ01-41', xrpr types_of             0
  info 'µ01-42', xrpr types_of             true
  info 'µ01-43', xrpr types_of             null
  info 'µ01-44', xrpr types_of             undefined
  info 'µ01-45', xrpr types_of             {}
  info 'µ01-46', xrpr types_of             []
  info 'µ01-47', xrpr all_keys_of          [ null, ]
  # info 'µ01-37', xrpr type_of              Buffer.from [ 1, 2, 3, ]
  done()

  ###
  # info size_of 'xxx'
  X                 = {}
  X.x               = true
  X.spec            = {}
  X.spec.spec_of_X  = true
  Y                 = Object.create X
  Y.y               = true
  Y.spec            = Object.create X.spec
  Y.spec.spec_of_Y  = true
  debug X,        jr ( k for k of X )
  debug X.spec,   jr ( k for k of X.spec )
  debug Y,        jr ( k for k of Y )
  debug Y.spec,   jr ( k for k of Y.spec )
  Y.spec.spec_of_X  = false
  info X.spec.spec_of_X
  info X.spec.spec_of_Y
  info Y.spec.spec_of_X
  info Y.spec.spec_of_Y
  ###

#-----------------------------------------------------------------------------------------------------------
@[ "_test size_of" ] = ( T ) ->
  # debug ( new Buffer '𣁬', ), ( '𣁬'.codePointAt 0 ).toString 16
  # debug ( new Buffer '𡉜', ), ( '𡉜'.codePointAt 0 ).toString 16
  # debug ( new Buffer '𠑹', ), ( '𠑹'.codePointAt 0 ).toString 16
  # debug ( new Buffer '𠅁', ), ( '𠅁'.codePointAt 0 ).toString 16
  T.eq ( isa.size_of [ 1, 2, 3, 4, ]                                    ), 4
  T.eq ( isa.size_of new Buffer [ 1, 2, 3, 4, ]                         ), 4
  T.eq ( isa.size_of '𣁬𡉜𠑹𠅁'                                         ), 2 * ( Array.from '𣁬𡉜𠑹𠅁' ).length
  T.eq ( isa.size_of '𣁬𡉜𠑹𠅁', 'codepoints'                           ), ( Array.from '𣁬𡉜𠑹𠅁' ).length
  T.eq ( isa.size_of '𣁬𡉜𠑹𠅁', 'codeunits'                            ), 2 * ( Array.from '𣁬𡉜𠑹𠅁' ).length
  T.eq ( isa.size_of '𣁬𡉜𠑹𠅁', 'bytes'                                ), ( new Buffer '𣁬𡉜𠑹𠅁', 'utf-8' ).length
  T.eq ( isa.size_of 'abcdefghijklmnopqrstuvwxyz'                       ), 26
  T.eq ( isa.size_of 'abcdefghijklmnopqrstuvwxyz', 'codepoints'         ), 26
  T.eq ( isa.size_of 'abcdefghijklmnopqrstuvwxyz', 'codeunits'          ), 26
  T.eq ( isa.size_of 'abcdefghijklmnopqrstuvwxyz', 'bytes'              ), 26
  T.eq ( isa.size_of 'ä'                                                ), 1
  T.eq ( isa.size_of 'ä', 'codepoints'                                  ), 1
  T.eq ( isa.size_of 'ä', 'codeunits'                                   ), 1
  T.eq ( isa.size_of 'ä', 'bytes'                                       ), 2
  T.eq ( isa.size_of new Map [ [ 'foo', 42, ], [ 'bar', 108, ], ]       ), 2
  T.eq ( isa.size_of new Set [ 'foo', 42, 'bar', 108, ]                 ), 4
  T.eq ( isa.size_of { 'foo': 42, 'bar': 108, 'baz': 3, }                           ), 3
  ### TAINT re-implement types object, pod ###
  # T.eq ( isa.size_of { '~isa': 'XYZ/yadda', 'foo': 42, 'bar': 108, 'baz': 3, }      ), 4




############################################################################################################
unless module.parent?
  test @
  # test @[ "multiple tests" ]
  # test @[ "nasty error message, tamed" ]
  # test @[ "_demo 2" ]

  # do -> debug ( require '../helpers' ).js_type_of arguments
