(function() {
  'use strict';
  var CND, INTERTYPE, Intertype, alert, assign, badge, debug, echo, flatten, help, info, js_type_of, log, njs_path, praise, rpr, test, urge, warn, whisper;

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
    var MyArrayClass, MyBareClass, MyObjectClass, SomeConstructor, color, column_width, dddx, dddx_type, domenic_denicola_device, error, i, idx, intertype, isa, j, last_idx, len, len1, mark_miller_device, matcher, obj, probe, probes_and_matchers, raw_result, raw_results, results, toString, type_of, type_of_type, validate;
    intertype = new Intertype();
    ({isa, validate, type_of} = intertype.export());
    ({domenic_denicola_device, mark_miller_device} = require('../helpers'));
    //.........................................................................................................
    dddx = function(x) {
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
        return dd_name;
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
      'MyBareClass'],
      [new MyObjectClass(),
      'MyObjectClass'],
      [new MyArrayClass(),
      'MyArrayClass'],
      [new SomeConstructor(),
      'SomeConstructor'],
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
      'number'],
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
      'Foo']
    ];
    //.........................................................................................................
    // [ ( class X extends NaN       ), '', ]
    // [ ( class X extends null      ), '', ]
    // [ ( class X extends undefined ), '', ]
    // [ ( class X extends 1         ), '', ]
    // [ ( class X extends {}        ), '', ]
    debug();
    column_width = 17;
    for (i = 0, len = probes_and_matchers.length; i < len; i++) {
      [probe, matcher] = probes_and_matchers[i];
      type_of_type = (function() {
        try {
          return type_of_type = type_of(probe);
        } catch (error1) {
          error = error1;
          return `***ERROR: ${error.message}***`;
        }
      })();
      // type_of_type = try type_of_type = type_of probe catch error then throw error # "***ERROR: #{error.message}***"
      dddx_type = dddx(probe);
      raw_results = [(rpr(probe)).slice(0, column_width), mark_miller_device(probe), (mark_miller_device(probe)).toLowerCase(), type_of_type, domenic_denicola_device(probe), (domenic_denicola_device(probe)).toLowerCase(), dddx_type, matcher];
      results = [];
      last_idx = raw_results.length - 1;
      for (idx = j = 0, len1 = raw_results.length; j < len1; idx = ++j) {
        raw_result = raw_results[idx];
        if ((idx === 0 || idx === last_idx)) {
          color = CND.cyan;
        } else {
          if (raw_result === matcher) {
            color = CND.green;
          } else {
            color = CND.red;
          }
        }
        results.push(color(raw_result.slice(0, column_width).padEnd(column_width)));
      }
      echo(results.join(' | '));
      T.eq(dddx_type, matcher);
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

  //###########################################################################################################
  if (module.parent == null) {
    test(this);
  }

  // test @[ "es6classes type detection devices" ]
// intertype = new Intertype()
// { isa
//   validate
//   type_of } = intertype.export()
// debug type_of 1n

}).call(this);
