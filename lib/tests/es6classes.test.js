(function() {
  'use strict';
  var CND, INTERTYPE, Intertype, alert, assign, badge, debug, demo_test_for_generator, echo, flatten, help, info, js_type_of, log, njs_path, praise, rpr, test, urge, warn, whisper;

  //###########################################################################################################
  // njs_util                  = require 'util'
  njs_path = require('path');

  // njs_fs                    = require 'fs'
  //...........................................................................................................
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'INTERTYPE/tests/es6classes';

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

  ({assign, flatten, js_type_of} = require('../helpers'));

  // #-----------------------------------------------------------------------------------------------------------
  // @[ "es6classes type detection devices" ] = ( T, done ) ->
  //   #.........................................................................................................
  //   intertype = new Intertype()
  //   { isa
  //     validate
  //     type_of
  //     types_of
  //     size_of
  //     declare
  //     all_keys_of } = intertype.export()
  //   #.........................................................................................................
  //   probes_and_matchers = [
  //     [[ [ 1, 2, 3, 4, ]                                 ], 4,                                          null, ]
  //     ]
  //   #.........................................................................................................
  //   for [ probe, matcher, error, ] in probes_and_matchers
  //     await T.perform probe, matcher, error, -> return new Promise ( resolve, reject ) ->
  //       resolve result
  //       return null
  //   done()
  //   return null

  //-----------------------------------------------------------------------------------------------------------
  this["es6classes type detection devices"] = function(T, done) {
    var MyArrayClass, MyBareClass, MyObjectClass, SomeConstructor, color, column_width, dddx_v1, dddx_v1_type, dddx_v2, dddx_v2_type, domenic_denicola_device, h, headers, i, idx, intertype, isa, j, last_idx, len, len1, mark_miller_device, matcher, obj, probe, probes_and_matchers, raw_result, raw_results, results, toString, type_of, validate;
    intertype = new Intertype();
    ({isa, validate, type_of} = intertype.export());
    ({domenic_denicola_device, mark_miller_device} = require('../helpers'));
    //.........................................................................................................
    dddx_v1 = function(x) {
      var dd_name, mm_name;
      if (x === null) {
        return 'null';
      }
      if (x === void 0) {
        return 'undefined';
      }
      if ((x === 2e308) || (x === -2e308)) {
        return 'infinity';
      }
      if ((x === true) || (x === false)) {
        return 'boolean';
      }
      if (Number.isNaN(x)) {
        return 'nan';
      }
      //.......................................................................................................
      // https://stackoverflow.com/questions/3905144/how-to-retrieve-the-constructors-name-in-javascript#3905265
      dd_name = x.constructor.name; // Domenic Denicola Device
      mm_name = (Object.prototype.toString.call(x)).slice(8, -1); // Mark Miller Device
      if ((dd_name === 'Buffer') && (mm_name === 'Uint8Array')) {
        return 'buffer';
      }
      if ((!dd_name) || (dd_name === '')) {
        dd_name = mm_name;
      }
      if (dd_name !== mm_name) {
        return `<${dd_name}>`;
      }
      dd_name = dd_name.toLowerCase();
      //.......................................................................................................
      if (dd_name === 'regexp') {
        return 'regex';
      } else if (dd_name === 'array') {
        return 'list';
      }
      return dd_name;
    };
    //.........................................................................................................
    dddx_v2 = function(x) {
      var Generator, dd_name;
      if (x === null) {
        return 'null';
      }
      if (x === void 0) {
        return 'undefined';
      }
      if ((x === 2e308) || (x === -2e308)) {
        return 'infinity';
      }
      if ((x === true) || (x === false)) {
        return 'boolean';
      }
      if (Number.isNaN(x)) {
        return 'nan';
      }
      //.......................................................................................................
      /* TAINT move constants to module */
      Generator = ((function*() {
        return (yield 42);
      })()).constructor;
      //.......................................................................................................
      // https://stackoverflow.com/questions/3905144/how-to-retrieve-the-constructors-name-in-javascript#3905265
      dd_name = x.constructor.name.toLowerCase();
      if (/* Domenic Denicola Device */dd_name === '') {
        if (x.constructor === Generator) {
          return 'generator';
        }
        return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase();
      }
      if (dd_name === 'number') {
//.......................................................................................................
/* Mark Miller Device */        return 'float';
      }
      if (dd_name === 'regexp') {
        return 'regex';
      }
      if (dd_name === 'array') {
        return 'list';
      }
      return dd_name;
    };
    //.........................................................................................................
    MyBareClass = class MyBareClass {};
    MyObjectClass = class MyObjectClass extends Object {};
    MyArrayClass = class MyArrayClass extends Array {};
    SomeConstructor = function() {};
    //.........................................................................................................
    // ths to https://www.reddit.com/r/javascript/comments/gnbqoy/askjs_is_objectprototypetostringcall_the_best/fra7fg9?utm_source=share&utm_medium=web2x
    toString = Function.prototype.call.bind(Object.prototype.toString);
    obj = {};
    obj[Symbol.toStringTag] = 'Foo';
    // console.log(toString(obj)) // [object Foo]
    //.........................................................................................................
    probes_and_matchers = [
      [MyBareClass,
      'function'],
      [/* TAINT should ES6 classes get own type? */
      MyObjectClass,
      'function'],
      [/* TAINT should ES6 classes get own type? */
      MyArrayClass,
      'function'],
      [/* TAINT should ES6 classes get own type? */
      SomeConstructor,
      'function'],
      [new MyBareClass(),
      'mybareclass'],
      [new MyObjectClass(),
      'myobjectclass'],
      [new MyArrayClass(),
      'myarrayclass'],
      [new SomeConstructor(),
      'someconstructor'],
      [null,
      'null'],
      [void 0,
      'undefined'],
      [Object,
      'function'],
      [Array,
      'function'],
      [{},
      'object'],
      [[],
      'list'],
      [42,
      'float'],
      [0/0,
      'nan'],
      [2e308,
      'infinity'],
      [
        (async function() {
          return (await f());
        }),
        'asyncfunction'
      ],
      [
        (function*() {
          return (yield 42);
        }),
        'generatorfunction'
      ],
      [
        (function*() {
          return (yield 42);
        })(),
        'generator'
      ],
      [/x/,
      'regex'],
      [new Date(),
      'date'],
      [Set,
      'function'],
      [new Set(),
      'set'],
      [Symbol,
      'function'],
      [Symbol('abc'),
      'symbol'],
      [Symbol.for('abc'),
      'symbol'],
      [new Uint8Array([42]),
      'uint8array'],
      [Buffer.from([42]),
      'buffer'],
      [12345678912345678912345n,
      'bigint'],
      [obj,
      'object'],
      [new Promise(function(resolve) {}),
      'promise']
    ];
    //.........................................................................................................
    // [ ( class X extends NaN       ), '', ]
    // [ ( class X extends null      ), '', ]
    // [ ( class X extends undefined ), '', ]
    // [ ( class X extends 1         ), '', ]
    // [ ( class X extends {}        ), '', ]
    debug();
    column_width = 25;
    //.........................................................................................................
    headers = ['probe', 'typeof', 'miller', 'old type_of', 'denicola', 'dddx_v1', 'dddx_v2', 'expected'];
    headers = ((function() {
      var i, len, results1;
      results1 = [];
      for (i = 0, len = headers.length; i < len; i++) {
        h = headers[i];
        results1.push(h.slice(0, column_width).padEnd(column_width));
      }
      return results1;
    })()).join('|');
    echo(headers);
//.........................................................................................................
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher] = probes_and_matchers[i];
      dddx_v1_type = dddx_v1(probe);
      dddx_v2_type = dddx_v2(probe);
      raw_results = [rpr(probe), typeof probe, mark_miller_device(probe), type_of(probe), domenic_denicola_device(probe), dddx_v1_type, dddx_v2_type, matcher];
      results = [];
      last_idx = raw_results.length - 1;
      for (idx = j = 0, len1 = raw_results.length; j < len1; idx = ++j) {
        raw_result = raw_results[idx];
        if ((idx === 0 || idx === last_idx)) {
          color = CND.cyan;
        } else {
          if (raw_result === matcher) {
            color = CND.green;
          } else if (raw_result.toLowerCase() === matcher) {
            color = CND.lime;
          } else {
            color = CND.red;
          }
        }
        results.push(color(raw_result.slice(0, column_width).padEnd(column_width)));
      }
      echo(results.join('|'));
      T.eq(dddx_v2_type, matcher);
    }
    // debug rpr ( ( -> yield 42 )()       ).constructor
    // debug rpr ( ( -> yield 42 )()       ).constructor.name
    // debug '^338-10^', mmd MyBareClass           # Function
    // debug '^338-11^', mmd MyObjectClass         # Function
    // debug '^338-12^', mmd MyArrayClass          # Function
    // debug '^338-13^', mmd new MyBareClass()     # Object
    // debug '^338-14^', mmd new MyObjectClass()   # Object
    // debug '^338-15^', mmd new MyArrayClass()    # Array
    // debug()                                     #
    // debug '^338-16^', ddd MyBareClass           # Function
    // debug '^338-17^', ddd MyObjectClass         # Function
    // debug '^338-18^', ddd MyArrayClass          # Function
    // debug '^338-19^', ddd new MyBareClass()     # MyBareClass
    // debug '^338-20^', ddd new MyObjectClass()   # MyObjectClass
    // debug '^338-21^', ddd new MyArrayClass()    # MyArrayClass
    return done();
  };

  //-----------------------------------------------------------------------------------------------------------
  this["_es6classes equals"] = function(T, done) {
    var check, equals, intertype, isa;
    intertype = new Intertype();
    ({isa, check, equals} = intertype.export());
    /* TAINT copy more extensive tests from CND, `js_eq`? */
    T.eq(equals(3, 3), true);
    T.eq(equals(3, 4), false);
    if (done != null) {
      return done();
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  demo_test_for_generator = function() {
    var Generator, GeneratorFunction;
    GeneratorFunction = (function*() {
      return (yield 42);
    }).constructor;
    Generator = ((function*() {
      return (yield 42);
    })()).constructor;
    debug(rpr(GeneratorFunction.name === 'GeneratorFunction'));
    debug(rpr(Generator.name === ''));
    debug((function*() {
      return (yield 42);
    }).constructor === GeneratorFunction);
    debug((function*() {
      return (yield 42);
    }).constructor === Generator);
    debug(((function*() {
      return (yield 42);
    })()).constructor === GeneratorFunction);
    return debug(((function*() {
      return (yield 42);
    })()).constructor === Generator);
  };

  //###########################################################################################################
  if (module === require.main) {
    (() => {
      demo_test_for_generator();
      return test(this);
    })();
  }

  // debug {}.constructor
// debug {}.constructor.name
// test @[ "es6classes type detection devices" ]
// intertype = new Intertype()
// { isa
//   validate
//   type_of } = intertype.export()
// debug type_of 1n

}).call(this);
