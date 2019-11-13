(function() {
  'use strict';
  var CND, INTERTYPE, Intertype, alert, assign, badge, debug, demo, echo, flatten, help, info, jr, js_type_of, later, log, njs_path, praise, rpr, test, urge, warn, whisper, xrpr,
    indexOf = [].indexOf,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  //###########################################################################################################
  // njs_util                  = require 'util'
  njs_path = require('path');

  // njs_fs                    = require 'fs'
  //...........................................................................................................
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'INTERTYPE/tests/main';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  praise = CND.get_logger('praise', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  test = require('guy-test');

  INTERTYPE = require('../..');

  ({Intertype} = INTERTYPE);

  ({assign, jr, flatten, xrpr, js_type_of} = require('../helpers'));

  //-----------------------------------------------------------------------------------------------------------
  this["_prototype keys"] = function(T) {
    var isa, x, y;
    isa = this;
    x = {
      foo: 42,
      bar: 108
    };
    y = Object.create(x);
    y.bar = 'something';
    y.baz = 'other thing';
    
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

  ;
    // urge me.prototype?
    // urge me.__proto__?
    info('µ1', jr(isa.generator_function(isa.all_own_keys_of)));
    info('µ2', jr(isa.values_of(isa.all_own_keys_of('abc'))));
    info('µ3', jr(isa.values_of(isa.all_keys_of('abc'))));
    info('µ4', jr(isa.values_of(isa.all_keys_of(x))));
    info('µ5', jr(isa.values_of(isa.all_keys_of(y))));
    info('µ5', jr(isa.values_of(isa.all_keys_of(y, true))));
    info('µ6', jr(isa.values_of(isa.all_keys_of(me))));
    info('µ7', jr(isa.values_of(isa.all_keys_of({}))));
    info('µ8', jr(isa.values_of(isa.all_keys_of(Object.create(null)))));
    info('µ9', isa.keys_of(me));
    return info('µ9', jr(isa.values_of(isa.keys_of(me))));
  };

  // info 'µ10', jr ( k for k of me )
  // info 'µ11', jr Object.keys me
  // info 'µ12', isa.values_of isa.all_own_keys_of true
  // info 'µ13', isa.values_of isa.all_own_keys_of undefined
  // info 'µ14', isa.values_of isa.all_own_keys_of null

  // debug '' + rpr Object.create null
  // debug isa.values_of isa.all_keys_of Object::

  //-----------------------------------------------------------------------------------------------------------
  this["isa"] = async function(T, done) {
    var all_keys_of, declare, error, i, intertype, isa, len, matcher, probe, probes_and_matchers, size_of, type_of, types_of, validate;
    intertype = new Intertype;
    ({isa, validate, type_of, types_of, size_of, declare, all_keys_of} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [["isa( 'callable', 'xxx'                                  )", false, null], ["isa( 'callable', function () {}                         )", true, null], ["isa( 'callable', async function () { await 42 }         )", true, null], ["isa( 'callable', function* () { yield 42 }              )", true, null], ["isa( 'callable', ( function* () { yield 42 } )()        )", false, null], ["isa( 'date',          new Date()                        )", true, null], ["isa( 'date',          true                              )", false, null], ["isa( 'date',          'helo'                            )", false, null], ["isa( 'date',          2                                 )", false, null], ["isa( 'date',          Date.now()                        )", false, null], ["isa( 'finite',        123                               )", true, null], ["isa( 'global',        global                            )", true, null], ["isa( 'integer',       123                               )", true, null], ["isa( 'integer',       42                                )", true, null], ["isa( 'number',        123                               )", true, null], ["isa( 'number',        42                                )", true, null], ["isa( 'number',        NaN                               )", false, null], ["isa( 'number',        NaN                               )", false, null], ["isa( 'safeinteger',   123                               )", true, null], ["isa( 'text',          'x'                               )", true, null], ["isa( 'text',          NaN                               )", false, null], ["isa.even(             42                                )", true, null], ["isa.finite(           123                               )", true, null], ["isa.integer(          123                               )", true, null], ["isa.integer(          42                                )", true, null], ["isa.multiple_of(      42, 2                             )", true, null], ["isa.multiple_of(      5, 2.5                            )", true, null], ["isa.multiple_of(      5, 2                              )", false, null], ["isa.number(           123                               )", true, null], ["isa.safeinteger(      123                               )", true, null], ["isa[ 'multiple_of' ]( 42, 2                             )", true, null], ["isa.weakmap(           new WeakMap()                    )", true, null], ["isa.map(               new Map()                        )", true, null], ["isa.set(               new Set()                        )", true, null], ["isa.date(              new Date()                       )", true, null], ["isa.error(             new Error()                      )", true, null], ["isa.list(              []                               )", true, null], ["isa.boolean(           true                             )", true, null], ["isa.boolean(           false                            )", true, null], ["isa.function(          ( () => {} )                     )", true, null], ["isa.asyncfunction(     ( async () => { await f() } )    )", true, null], ["isa.null(              null                             )", true, null], ["isa.text(              'helo'                           )", true, null], ["isa.chr(               ' '                              )", true, null], ["isa.chr(               'x'                              )", true, null], ["isa.chr(               ''                               )", false, null], ["isa.chr(               'ab'                             )", false, null], ["isa.chr(               '𪜀'                             )", true, null], ["isa.undefined(         undefined                        )", true, null], ["isa.global(            global                           )", true, null], ["isa.regex(             /^xxx$/g                         )", true, null], ["isa.object(            {}                               )", true, null], ["isa.nan(               NaN                              )", true, null], ["isa.infinity(          1 / 0                            )", true, null], ["isa.infinity(          -1 / 0                           )", true, null], ["isa.number(            12345                            )", true, null], ["isa.buffer(            new Buffer( 'xyz' )              )", true, null], ["isa.uint8array(        new Buffer( 'xyz' )              )", true, null]];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result;
          result = eval(probe);
          // log jr [ probe, result, ]
          // resolve result
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["type_of"] = async function(T, done) {
    var all_keys_of, declare, error, i, intertype, isa, len, matcher, probe, probes_and_matchers, size_of, type_of, types_of, validate;
    intertype = new Intertype;
    ({isa, validate, type_of, types_of, size_of, declare, all_keys_of} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [["type_of( new WeakMap()                                  )", 'weakmap', null], ["type_of( new Map()                                      )", 'map', null], ["type_of( new Set()                                      )", 'set', null], ["type_of( new Date()                                     )", 'date', null], ["type_of( new Error()                                    )", 'error', null], ["type_of( []                                             )", 'list', null], ["type_of( true                                           )", 'boolean', null], ["type_of( false                                          )", 'boolean', null], ["type_of( ( () => {} )                                   )", 'function', null], ["type_of( ( async () => { await f() } )                  )", 'asyncfunction', null], ["type_of( null                                           )", 'null', null], ["type_of( 'helo'                                         )", 'text', null], ["type_of( undefined                                      )", 'undefined', null], ["type_of( global                                         )", 'global', null], ["type_of( /^xxx$/g                                       )", 'regex', null], ["type_of( {}                                             )", 'object', null], ["type_of( NaN                                            )", 'nan', null], ["type_of( 1 / 0                                          )", 'infinity', null], ["type_of( -1 / 0                                         )", 'infinity', null], ["type_of( 12345                                          )", 'number', null], ["type_of( 'xxx'                                          )", 'text', null], ["type_of( function () {}                                 )", 'function', null], ["type_of( async function () { await 42 }                 )", 'asyncfunction', null], ["type_of( function* () { yield 42 }                      )", 'generatorfunction', null], ["type_of( ( function* () { yield 42 } )()                )", 'generator', null], ["type_of( 123                                            )", 'number', null], ["type_of( 42                                             )", 'number', null], ["type_of( []                                             )", 'list', null], ["type_of( global                                         )", 'global', null], ["type_of( new Date()                                     )", 'date', null], ["type_of( {}                                             )", 'object', null], ["type_of( new Buffer(            'helo'  )               )", 'buffer', null], ["type_of( new ArrayBuffer(       42      )               )", 'arraybuffer', null], ["type_of( new Int8Array(         5       )               )", 'int8array', null], ["type_of( new Uint8Array(        5       )               )", 'uint8array', null], ["type_of( new Uint8ClampedArray( 5       )               )", 'uint8clampedarray', null], ["type_of( new Int16Array(        5       )               )", 'int16array', null], ["type_of( new Uint16Array(       5       )               )", 'uint16array', null], ["type_of( new Int32Array(        5       )               )", 'int32array', null], ["type_of( new Uint32Array(       5       )               )", 'uint32array', null], ["type_of( new Float32Array(      5       )               )", 'float32array', null], ["type_of( new Float64Array(      5       )               )", 'float64array', null]];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result;
          result = eval(probe);
          // log jr [ probe, result, ]
          // resolve result
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["validate"] = async function(T, done) {
    var all_keys_of, declare, error, i, intertype, isa, len, matcher, probe, probes_and_matchers, size_of, type_of, types_of, validate;
    intertype = new Intertype;
    ({isa, validate, type_of, types_of, size_of, declare, all_keys_of} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [["validate( 'callable', 'xxx'                                  )", false, 'not a valid callable'], ["validate( 'callable', ( function* () { yield 42 } )()        )", false, 'not a valid callable'], ["validate( 'date',          true                              )", false, 'not a valid date'], ["validate( 'date',          'helo'                            )", false, 'not a valid date'], ["validate( 'date',          2                                 )", false, 'not a valid date'], ["validate( 'date',          Date.now()                        )", false, 'not a valid date'], ["validate( 'number',        NaN                               )", false, 'not a valid number'], ["validate( 'number',        NaN                               )", false, 'not a valid number'], ["validate( 'text',          NaN                               )", false, 'not a valid text'], ["validate.multiple_of(      5, 2                              )", false, 'not a valid multiple_of'], ["validate( 'callable', function () {}                         )", true, null], ["validate( 'callable', async function () { await 42 }         )", true, null], ["validate( 'callable', function* () { yield 42 }              )", true, null], ["validate( 'date',          new Date()                        )", true, null], ["validate( 'finite',        123                               )", true, null], ["validate( 'global',        global                            )", true, null], ["validate( 'integer',       123                               )", true, null], ["validate( 'integer',       42                                )", true, null], ["validate( 'number',        123                               )", true, null], ["validate( 'number',        42                                )", true, null], ["validate( 'safeinteger',   123                               )", true, null], ["validate( 'text',          'x'                               )", true, null], ["validate.even(             42                                )", true, null], ["validate.finite(           123                               )", true, null], ["validate.integer(          123                               )", true, null], ["validate.integer(          42                                )", true, null], ["validate.multiple_of(      42, 2                             )", true, null], ["validate.multiple_of(      5, 2.5                            )", true, null], ["validate.number(           123                               )", true, null], ["validate.safeinteger(      123                               )", true, null], ["validate[ 'multiple_of' ]( 42, 2                             )", true, null], ["validate.weakmap(           new WeakMap()                    )", true, null], ["validate.map(               new Map()                        )", true, null], ["validate.set(               new Set()                        )", true, null], ["validate.date(              new Date()                       )", true, null], ["validate.error(             new Error()                      )", true, null], ["validate.list(              []                               )", true, null], ["validate.boolean(           true                             )", true, null], ["validate.boolean(           false                            )", true, null], ["validate.function(          ( () => {} )                     )", true, null], ["validate.asyncfunction(     ( async () => { await f() } )    )", true, null], ["validate.null(              null                             )", true, null], ["validate.text(              'helo'                           )", true, null], ["validate.undefined(         undefined                        )", true, null], ["validate.global(            global                           )", true, null], ["validate.regex(             /^xxx$/g                         )", true, null], ["validate.object(            {}                               )", true, null], ["validate.nan(               NaN                              )", true, null], ["validate.infinity(          1 / 0                            )", true, null], ["validate.infinity(          -1 / 0                           )", true, null], ["validate.number(            12345                            )", true, null], ["validate.buffer(            new Buffer( 'xyz' )              )", true, null], ["validate.uint8array(        new Buffer( 'xyz' )              )", true, null]];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result;
          result = eval(probe);
          // log jr [ probe, result, ]
          // resolve result
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["types_of"] = async function(T, done) {
    var all_keys_of, declare, error, i, intersection_of, intertype, isa, len, matcher, probe, probes_and_matchers, size_of, type_of, types_of, validate;
    intersection_of = function(a, b) {
      var x;
      return ((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = a.length; i < len; i++) {
          x = a[i];
          if (indexOf.call(b, x) >= 0) {
            results.push(x);
          }
        }
        return results;
      })()).sort();
    };
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, validate, type_of, types_of, size_of, declare, all_keys_of} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [[123, ["count", "finite", "frozen", "integer", "nonnegative", "notunset", "number", "numeric", "odd", "positive", "safeinteger", "sealed", "truthy"], null], [124, ["count", "even", "finite", "frozen", "integer", "nonnegative", "notunset", "number", "numeric", "positive", "safeinteger", "sealed", "truthy"], null], [0, ["count", "even", "falsy", "finite", "frozen", "integer", "nonnegative", "nonpositive", "notunset", "number", "numeric", "safeinteger", "sealed", "zero"], null], [true, ["boolean", "frozen", "notunset", "odd", "sealed", "truthy"], null], [null, ["falsy", "frozen", "null", "odd", "sealed", "unset"], null], [void 0, ["falsy", "frozen", "odd", "sealed", "undefined", "unset"], null], [{}, ["empty", "extensible", "notunset", "object", "odd", "truthy"], null], [[], ["empty", "extensible", "list", "notunset", "odd", "truthy"], null]];
//.........................................................................................................
// debug intersection_of [ 1, 2, 3, ], [ 'a', 3, 1, ]
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result;
          result = intersection_of(matcher, types_of(probe));
          // log jr [ probe, result, ]
          // resolve result
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["size_of"] = async function(T, done) {
    var all_keys_of, declare, error, i, intertype, isa, len, matcher, probe, probes_and_matchers, size_of, type_of, types_of, validate;
    // debug ( new Buffer '𣁬', ), ( '𣁬'.codePointAt 0 ).toString 16
    // debug ( new Buffer '𡉜', ), ( '𡉜'.codePointAt 0 ).toString 16
    // debug ( new Buffer '𠑹', ), ( '𠑹'.codePointAt 0 ).toString 16
    // debug ( new Buffer '𠅁', ), ( '𠅁'.codePointAt 0 ).toString 16
    /* TAINT re-implement types object, pod */
    // T.eq ( isa.size_of { '~isa': 'XYZ/yadda', 'foo': 42, 'bar': 108, 'baz': 3, }      ), 4
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, validate, type_of, types_of, size_of, declare, all_keys_of} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [
      [[[1,
      2,
      3,
      4]],
      4,
      null],
      [[new Buffer([1,
      2,
      3,
      4])],
      4,
      null],
      [['𣁬𡉜𠑹𠅁'],
      2 * (Array.from('𣁬𡉜𠑹𠅁')).length,
      null],
      [['𣁬𡉜𠑹𠅁',
      'codepoints'],
      (Array.from('𣁬𡉜𠑹𠅁')).length,
      null],
      [['𣁬𡉜𠑹𠅁',
      'codeunits'],
      2 * (Array.from('𣁬𡉜𠑹𠅁')).length,
      null],
      [['𣁬𡉜𠑹𠅁',
      'bytes'],
      (new Buffer('𣁬𡉜𠑹𠅁',
      'utf-8')).length,
      null],
      [['abcdefghijklmnopqrstuvwxyz'],
      26,
      null],
      [['abcdefghijklmnopqrstuvwxyz',
      'codepoints'],
      26,
      null],
      [['abcdefghijklmnopqrstuvwxyz',
      'codeunits'],
      26,
      null],
      [['abcdefghijklmnopqrstuvwxyz',
      'bytes'],
      26,
      null],
      [['ä'],
      1,
      null],
      [['ä',
      'codepoints'],
      1,
      null],
      [['ä',
      'codeunits'],
      1,
      null],
      [['ä',
      'bytes'],
      2,
      null],
      [[new Map([['foo',
      42],
      ['bar',
      108]])],
      2,
      null],
      [[new Set(['foo',
      42,
      'bar',
      108])],
      4,
      null],
      [
        [
          {
            'foo': 42,
            'bar': 108,
            'baz': 3
          }
        ],
        3,
        null
      ],
      [
        [
          {
            'foo': null,
            'bar': 108,
            'baz': 3
          }
        ],
        3,
        null
      ],
      [
        [
          {
            'foo': void 0,
            'bar': 108,
            'baz': 3
          }
        ],
        2,
        null
      ]
    ];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      // debug 'µ22900', probe
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result;
          result = size_of(...probe);
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["export to target"] = function(T, done) {
    var intertype, return_value, target;
    //.........................................................................................................
    target = {};
    intertype = new Intertype;
    return_value = intertype.export(target);
    T.ok(return_value === target);
    target.declare('sometype', function(x) {
      return (this.isa.text(x)) && (x.startsWith(':'));
    });
    debug('µ44333', target);
    debug('µ44333', target.isa.sometype('sometext'));
    debug('µ44333', target.isa.sometype(':sometext'));
    done();
    return null;
  };

  later = function() {};

  /*
  info 'µ01-47', xrpr all_keys_of          [ null, ]
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
  */
  //-----------------------------------------------------------------------------------------------------------
  this["cast"] = async function(T, done) {
    var all_keys_of, cast, declare, error, i, intertype, isa, j, len, len1, matcher, probe, probes_and_matchers, size_of, type_of, types_of, validate;
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, validate, type_of, types_of, size_of, declare, cast, all_keys_of} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [[['number', 'number', 123], 123], [['number', 'integer', 123], 123], [['number', 'integer', 23.9], 24], [['boolean', 'number', true], 1], [['boolean', 'number', false], 0], [['number', 'boolean', 0], false], [['number', 'boolean', 1], true], [['number', 'boolean', -154.7], true], [['number', 'text', 123], '123'], [['boolean', 'text', true], 'true'], [['null', 'text', null], 'null'], [['int10text', 'text', '1245'], '1245'], [['int16text', 'text', '1245'], '1245'], [['int10text', 'number', '1245'], 1245], [['int16text', 'number', '1245'], 4677], [['int16text', 'int2text', '7'], '111'], [['number', 'null', 0], null, 'unable to cast a number as null'], [['number', 'null', 1], null, 'unable to cast a number as null']];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      //.........................................................................................................
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result, type_a, type_b, x;
          [type_a, type_b, x] = probe;
          result = cast(type_a, type_b, x);
          resolve(result);
          return null;
        });
      });
    }
//.........................................................................................................
    for (j = 0, len1 = probes_and_matchers.length; j < len1; j++) {
      [probe, matcher, error] = probes_and_matchers[j];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result, type_a, type_b, x;
          [type_a, type_b, x] = probe;
          result = cast[type_a](type_b, x);
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["isa.list_of A"] = async function(T, done) {
    var error, i, intertype, isa, len, matcher, probe, probes_and_matchers, validate;
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, validate} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [[['number', [123]], true], [['integer', [123]], true], [['integer', [1, 2, 3, 123.5]], false]];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result, type, x;
          [type, x] = probe;
          result = isa.list_of(type, x);
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["isa.list_of B"] = async function(T, done) {
    var error, i, intertype, isa, isa_list_of, len, matcher, probe, probes_and_matchers, validate;
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, isa_list_of, validate} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [[['number', [123]], true], [['integer', [123]], true], [['integer', [1, 2, 3, 123.5]], false]];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result, type, x;
          [type, x] = probe;
          result = isa_list_of[type](x);
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["validate.list_of A"] = async function(T, done) {
    var error, i, intertype, isa, len, matcher, probe, probes_and_matchers, validate;
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, validate} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [[['number', [123]], true], [['integer', [123]], true], [['integer', [1, 2, 3, 123.5]], null, "not a valid list_of"]];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result, type, x;
          [type, x] = probe;
          result = validate.list_of(type, x);
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["validate.list_of B"] = async function(T, done) {
    var error, i, intertype, isa, isa_list_of, len, matcher, probe, probes_and_matchers, validate, validate_list_of;
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, validate, isa_list_of, validate_list_of} = intertype.export());
    //.........................................................................................................
    probes_and_matchers = [[['number', [123]], true], [['integer', [123]], true], [['integer', [1, 2, 3, 123.5]], null, "not a valid list_of"]];
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher, error] = probes_and_matchers[i];
      await T.perform(probe, matcher, error, function() {
        return new Promise(function(resolve, reject) {
          var result, type, x;
          [type, x] = probe;
          result = validate_list_of(type, x);
          resolve(result);
          return null;
        });
      });
    }
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["vnr, int32"] = function(T, done) {
    var d, declare, intertype, isa, isa_list_of, validate, validate_list_of;
    //.........................................................................................................
    intertype = new Intertype;
    ({isa, declare, validate, isa_list_of, validate_list_of} = intertype.export());
    //.........................................................................................................
    T.ok(isa.int32(1234));
    T.ok(isa.int32(-1234));
    T.ok(!isa.int32(1.3));
    T.ok(isa.vnr([-1234]));
    T.ok(isa_list_of.int32([-1234]));
    T.ok(isa_list_of.int32([]));
    T.ok(!isa.vnr([-1234, 7e20]));
    T.ok(isa.vnr(Int32Array.from([-1234])));
    d = [];
    d.push(Int32Array.from([10]));
    d.push(Int32Array.from([10, 0]));
    d.push(Int32Array.from([10, -1]));
    d.push(Int32Array.from([10, 2]));
    d.push(Int32Array.from([10, 20]));
    d.push(Int32Array.from([10, 1]));
    d.push(Int32Array.from([10, 10]));
    debug('µ43222', d.sort());
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["check(): validation with intermediate results (experiment)"] = function(T, done) {
    var FS, PATH, R, check, check_fso_exists, check_integer, check_is_file, check_is_json_file, declare, error, i, intertype, is_happy, is_sad, isa, isa_integer, len, path, paths, sad, sadden, validate, validate_integer;
    //.........................................................................................................
    PATH = require('path');
    FS = require('fs');
    intertype = new Intertype;
    ({isa, validate, declare} = intertype.export());
    sad = Symbol('sad'); // will be made attribute of `intertype`
    //.........................................................................................................
    is_sad = function(x) {
      return (x === sad) || (x instanceof Error) || ((isa.object(x)) && (x[sad] === true));
    };
    is_happy = function(x) {
      return !is_sad(x);
    };
    sadden = function(x) {
      return {
        [sad]: true,
        _: x
      };
    };
    //.........................................................................................................
    check = new Proxy({}, {
      get: function(t, k) {
        return function(...P) {
          var error, fn;
          if (!isa.callable(fn = t[k])) {
            return fn;
          }
          try {
            return fn(...P);
          } catch (error1) {
            error = error1;
            return error;
          }
        };
      },
      set: function(t, k, v) {
        return t[k] = v;
      },
      delete: function(t, k, v) {
        return delete t[k];
      }
    });
    check.foo = 42;
    check.foo;
    check.integer = function(x) {
      return validate.integer(x);
    };
    debug('^336552^', check.integer(42));
    debug('^336552^', check.integer(42.5));
    //.........................................................................................................
    check_fso_exists = function(path, stats = null) {
      var error;
      try {
        return stats != null ? stats : FS.statSync(path);
      } catch (error1) {
        error = error1;
        return error;
      }
    };
    //.........................................................................................................
    check_is_file = function(path, stats = null) {
      var bad;
      if (is_sad((bad = stats = check_fso_exists(path, stats)))) {
        /* Checks if `path` exists, points to a file, is readable, and parses as a JSON file

        Malfunction Risks:
        * see `check_fso_exists()` &c.
        * FS-related race conditions, including
        * longish timeouts for paths pointing to non-local or otherwise misbehaving FS resources.
         */
        //.......................................................................................................
        /* in this case, `stats` is `sad` when `check_fso_exists()` fails; in the general case, it could be any
        manner of object whose computation required effort, so we want to keep it; we document that fact by
        aliasing it as `bad`: */
        return bad;
      }
      if (stats.isFile()) {
        return stats;
      }
      return sadden(`not a file: ${path}`);
    };
    //.........................................................................................................
    check_is_json_file = function(path) {
      var error;
      try {
        /* Checks if `path` exists, points to a file, is readable, and is parsable as a JSON file; as a
        side-effect, returns the result of parsing when successful.

        Malfunction Risks:
        * see `check_is_file()` &c.
        * file will be read and parsed synchronously; as such, an arbitrary amount of time and space could be
          required in case `path` points to a large file and/or is slow to parse
         */
        // return bad if is_sad ( bad = stats = check_is_file path, stats )
        return JSON.parse(FS.readFileSync(path));
      } catch (error1) {
        error = error1;
        return error;
      }
    };
    //.........................................................................................................
    debug('^377332-1^', is_sad(sad));
    debug('^377332-6^', is_sad({
      [sad]: true
    }));
    debug('^377332-7^', is_sad(new Error("wat")));
    debug('^377332-2^', is_sad(42));
    debug('^377332-3^', is_sad(false));
    debug('^377332-4^', is_sad(null));
    debug('^377332-5^', is_sad({
      [sad]: false
    }));
    paths = [PATH.resolve(PATH.join(__dirname, '../../package.json')), PATH.resolve(PATH.join(__dirname, '../../XXXXX'))];
    for (i = 0, len = paths.length; i < len; i++) {
      path = paths[i];
      R = null;
      while (true) {
        if (is_sad((R = check_is_json_file(path, R)))) {
          // break if ( R = check_fso_exists    path, R ) is sad
          // break if ( R = check_is_file       path, R ) is sad
          break;
        }
        break;
      }
      if (is_sad(R)) {
        warn("fails with", (rpr(R)).slice(0, 80));
      } else {
        help("is JSON file; contents:", (jr(R)).slice(0, 100));
      }
    }
    warn('^99282^', (error = check_fso_exists('XXXXX')).code, CND.grey(error.message));
    warn('^99282^', (error = check_is_file('XXXXX')).code, CND.grey(error.message));
    warn('^99282^', (error = check_is_json_file('XXXXX')).code, CND.grey(error.message));
    //.........................................................................................................
    /* Turning a type declaration into a check */
    check_integer = function(x) {
      try {
        if (validate.integer(x)) {
          return x;
        }
      } catch (error1) {
        error = error1;
        return error;
      }
    };
    isa_integer = function(x) {
      return is_happy(check_integer(x));
    };
    validate_integer = function(x) {
      if (is_happy((R = check_integer(x)))) {
        return R;
      } else {
        throw R;
      }
    };
    //.........................................................................................................
    debug('^333442^', check_integer(42));
    debug('^333442^', (rpr(check_integer(42.5))).slice(0, 81));
    debug('^333442^', isa_integer(42));
    debug('^333442^', isa_integer(42.5));
    // debug stats
    // [ type, x, ] = probe
    // result = validate_list_of type, x
    // T.eq result, matcher
    done();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this["check(): validation with intermediate results (for reals)"] = function(T, done) {
    var FS, PATH, check, declare, intertype, is_happy, is_sad, isa, sad, sadden, validate;
    //.........................................................................................................
    PATH = require('path');
    FS = require('fs');
    intertype = new Intertype;
    ({isa, validate, check, sad, is_sad, is_happy, sadden, declare} = intertype.export());
    debug('^3378^', intertype.is_happy);
    debug('^3378^', intertype.export().is_happy);
    debug('^3378^', intertype.export().is_happy(42));
    debug('^3378^', intertype.export().is_sad(42));
    debug('^3378^', intertype.export().sadden(42));
    //.........................................................................................................
    intertype.checks.dvsbl_2_3 = function(x) {
      validate.even(x);
      return modulo(x, 3) === 0;
    };
    //.........................................................................................................
    T.eq(is_happy(check('integer', 42)), true);
    T.eq(is_happy(check('integer', 42.5)), false);
    T.eq(is_happy(check('dvsbl_2_3', 42)), true);
    T.eq(is_happy(check('dvsbl_2_3', 43)), false);
    T.eq(is_happy(check('dvsbl_2_3', 2 * 3)), true);
    T.eq(is_happy(check.integer(42)), true);
    T.eq(is_happy(check.integer(42.5)), false);
    T.eq(is_happy(check.dvsbl_2_3(42)), true);
    T.eq(is_happy(check.dvsbl_2_3(43)), false);
    T.eq(is_happy(check.dvsbl_2_3(2 * 3)), true);
    // debug '^390-1^',          check.integer         42.5
    // debug '^390-2^',         ( check.integer         42.5 ) is intertype.sad
    // debug '^390-3^',         sad
    // debug '^390-4^',         intertype.sad
    // debug '^390-5^',         sad is intertype.sad
    // debug '^390-6^', is_happy check.integer         42.5
    done();
    return null;
  };

  //###########################################################################################################
  if (module.parent == null) {
    // test @
    // test @[ "check(): validation with intermediate results (experiment)" ]
    test(this["check(): validation with intermediate results (for reals)"]);
  }

  // test @[ "vnr, int32" ]
  // test @[ "cast" ]
  // test @[ "isa.list_of A" ]
  // test @[ "isa.list_of B" ]
  // test @[ "validate.list_of A" ]
  // test @[ "validate.list_of B" ]

  // do -> debug ( require '../helpers' ).js_type_of arguments
  demo = function() {
    var all_keys_of, declare, error, i, intertype, isa, len, nr, result, size_of, tests, type_of, types_of, validate;
    intertype = new Intertype;
    ({isa, validate, type_of, types_of, size_of, declare, all_keys_of} = intertype.export());
    urge(size_of('𣁬𡉜𠑹𠅁', 'codepoints'));
    intertype.declare('point', {
      size: 2,
      tests: {
        '? is an object': function(x) {
          return this.isa.object(x);
        },
        '?.x is set': function(x) {
          return this.has_key(x, 'x');
        },
        '?.y is set': function(x) {
          return this.has_key(x, 'y');
        },
        '?.x is a number': function(x) {
          return this.isa.number(x.x);
        },
        '?.y is a number': function(x) {
          return this.isa.number(x.x);
        }
      }
    });
    intertype.declare('vector', {
      size: 2,
      tests: {
        '? is a list': function(x) {
          return this.isa.list(x);
        },
        'size of ? is 2': function(x) {
          return (this.size_of(x)) === 2;
        },
        '?[ 0 ] is a number': function(x) {
          return this.isa.number(x[0]);
        },
        '?[ 1 ] is a number': function(x) {
          return this.isa.number(x[1]);
        }
      }
    });
    info(isa.point(42));
    info(isa.point({
      x: 42,
      y: 108
    }));
    info(isa.point({
      x: 2e308,
      y: 108
    }));
    tests = [
      [
        1,
        (function() {
          return validate.number(42);
        })
      ],
      [
        2,
        (function() {
          return validate.integer(42);
        })
      ],
      [
        3,
        (function() {
          return validate.even(42);
        })
      ],
      [
        4,
        (function() {
          return validate.number(42.5);
        })
      ],
      [
        5,
        (function() {
          return validate.integer(42.5);
        })
      ],
      [
        6,
        (function() {
          return validate.even(42.5);
        })
      ],
      [
        7,
        (function() {
          return validate.point(42);
        })
      ],
      [
        8,
        (function() {
          return validate.point({
            x: 42,
            y: 108
          });
        })
      ],
      [
        9,
        (function() {
          return validate.point({
            y: 108
          });
        })
      ],
      [
        10,
        (function() {
          return validate.point({
            x: 2e308,
            y: 108
          });
        })
      ],
      [
        11,
        (function() {
          return validate.vector(null);
        })
      ],
      [
        12,
        (function() {
          return validate.vector([2]);
        })
      ],
      [
        13,
        (function() {
          return validate.vector([2,
        3]);
        })
      ],
      [
        14,
        (function() {
          return validate.regex([2,
        3]);
        })
      ],
      [
        15,
        (function() {
          return validate.regex(/x/);
        })
      ],
      [
        16,
        (function() {
          return validate.regex(/^x$/g);
        })
      ],
      [
        17,
        (function() {
          return isa.regex(/x/);
        })
      ],
      [
        18,
        (function() {
          return isa.regex(/^x$/g);
        })
      ]
    ];
    for (i = 0, len = tests.length; i < len; i++) {
      [nr, test] = tests[i];
      try {
        result = test();
      } catch (error1) {
        error = error1;
        warn(nr, error.message);
        // throw error
        continue;
      }
      info(nr, result);
    }
    help(isa.number(42));
    help(isa.number(new Number(42)));
    help(types_of(42));
    help(types_of(new Number(42)));
    // help validate.multiple_of 3, 4
    return debug('µ12233', types_of([]));
  };

}).call(this);
