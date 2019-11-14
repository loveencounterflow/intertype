(function() {
  'use strict';
  var CND, alert, badge, debug, help, info, rpr, sad, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'INTERTYPE/CHECKS';

  debug = CND.get_logger('debug', badge);

  alert = CND.get_logger('alert', badge);

  whisper = CND.get_logger('whisper', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  info = CND.get_logger('info', badge);

  sad = Symbol('sad');

  // @is_sad   = ( x ) -> ( x is sad ) or ( x instanceof Error ) or ( ( @isa.object x ) and ( x[ sad ] is true ) )
// @is_happy = ( x ) -> not @is_sad x
// @sadden   = ( x ) -> { [sad]: true, _: x, }

// #-----------------------------------------------------------------------------------------------------------
// @provide = ->
//   debug '^3332^', ( k for k of @ )
//   @check = new Proxy {},
//     get: ( t, k ) -> ( P... ) ->
//       debug '^2221^', rpr k;
//       # return undefined if k is 'bind'
//       return fn unless isa.callable fn = t[ k ]
//       return try ( fn P... ) catch error then error
//     set: ( t, k, v ) -> t[ k ] = v
//     delete: ( t, k, v ) -> delete t[ k ]

}).call(this);
