(function() {
  'use strict';
  var CND, E, GUY, H, badge, combinate, debug, echo, njs_path, ref, rpr,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } },
    indexOf = [].indexOf;

  //###########################################################################################################
  // njs_util                  = require 'util'
  njs_path = require('path');

  // njs_fs                    = require 'fs'
  //...........................................................................................................
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'INTERTYPE/combinator';

  debug = CND.get_logger('debug', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  GUY = require('guy');

  E = require('./errors');

  H = require('./helpers');

  combinate = (require("combinate")).default;

  //===========================================================================================================
  ref = this.Combinator = (function() {
    class Combinator extends GUY.props.Strict_owner {
      //---------------------------------------------------------------------------------------------------------
      constructor() {
        var compiled_hedges, groupname, hedgepaths, ref1;
        super();
        //---------------------------------------------------------------------------------------------------------
        this._combine = this._combine.bind(this);
        this.hedgepaths = new GUY.props.Strict_owner();
        ref1 = this._get_groupnames();
        for (groupname of ref1) {
          compiled_hedges = this._compile_hedges(groupname, this.constructor.hedges);
          hedgepaths = this.get_hedgepaths(compiled_hedges);
          this.hedgepaths[groupname] = this._reduce_hedgepaths(hedgepaths);
        }
        return void 0;
      }

      _combine(terms) {
        var _, i, len, ref1, results, v, x;
        boundMethodCheck(this, ref);
        ref1 = combinate(terms);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          x = ref1[i];
          results.push((function() {
            var results1;
            results1 = [];
            for (_ in x) {
              v = x[_];
              results1.push(v);
            }
            return results1;
          })());
        }
        return results;
      }

      //---------------------------------------------------------------------------------------------------------
      _compile_hedges(groupname, hedges) {
        var R, catchall_group, hedge, i, j, len, len1, ref1, target, termgroup;
        R = [];
        catchall_group = this.constructor.catchall_group;
        for (i = 0, len = hedges.length; i < len; i++) {
          hedge = hedges[i];
          if (indexOf.call(hedge.groups, catchall_group) < 0) {
            if (indexOf.call(hedge.groups, groupname) < 0) {
              continue;
            }
          }
          target = [];
          R.push(target);
          ref1 = hedge.terms;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            termgroup = ref1[j];
            // continue if termgroup? and @_has_conflicting_hedge_matchers
            if (Array.isArray(termgroup)) {
              target.splice(target.length - 1, 0, ...(this.get_hedgepaths(termgroup)));
            } else {
              target.push(termgroup);
            }
          }
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      get_hedgepaths(compiled_hedges) {
        var R, x;
        R = (function() {
          var i, len, ref1, results;
          ref1 = this._combine(compiled_hedges);
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            x = ref1[i];
            results.push(x.flat());
          }
          return results;
        }).call(this);
        R.sort();
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _reduce_hedgepaths(combinations) {
        var e, hp, i, len, results;
        results = [];
        for (i = 0, len = combinations.length; i < len; i++) {
          hp = combinations[i];
          results.push((function() {
            var j, len1, results1;
            results1 = [];
            for (j = 0, len1 = hp.length; j < len1; j++) {
              e = hp[j];
              if (e != null) {
                results1.push(e);
              }
            }
            return results1;
          })());
        }
        return results;
      }

      //---------------------------------------------------------------------------------------------------------
      _get_groupnames() {
        var h;
        return GUY.lft.freeze(new Set(((function() {
          var i, len, ref1, results;
          ref1 = this.constructor.hedges;
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            h = ref1[i];
            results.push(h.groups);
          }
          return results;
        }).call(this)).flat()));
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Combinator.catchall_group = 'other';

    Combinator.hedges = GUY.lft.freeze([]);

    return Combinator;

  }).call(this);

  //===========================================================================================================
  this.Intertype_hedge_combinator = (function() {
    class Intertype_hedge_combinator extends this.Combinator {};

    //---------------------------------------------------------------------------------------------------------
    Intertype_hedge_combinator.hedges = GUY.lft.freeze([
      {
        terms: [null,
      'optional'],
        groups: ['other']
      },
      {
        terms: [null,
      [[null,
      'empty',
      'nonempty'],
      ['list_of',
      'set_of'],
      [null,
      'optional']]],
        groups: ['other']
      },
      {
        terms: [null,
      'empty',
      'nonempty'],
        groups: ['collections']
      },
      {
        terms: [null,
      'positive0',
      'positive1',
      'negative0',
      'negative1'],
        groups: ['numbers']
      }
    ]);

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype_hedge_combinator.prototype._hedgemethods = GUY.lft.freeze(new GUY.props.Strict_owner({
      target: {
        optional: (x) => {
          debug(CND.reverse(CND.yellow('^optional@453^', rpr(x))));
          if (x == null) {
            return H.signals.true_and_break;
          }
          return true;
        },
        //.......................................................................................................
        /* TAINT use `length` or `size` or custom method */
        empty: (x) => {
          return (H.size_of(x)) === 0;
        },
        nonempty: (x) => {
          return (H.size_of(x)) !== 0;
        },
        //.......................................................................................................
        /* TAINT this is wrong, must test ensuing arguments against each element in collection */
        list_of: (x) => {
          if (!Array.isArray(x)) {
            return H.signals.false_and_break;
          }
          return H.signals.process_list_elements;
        },
        set_of: (x) => {
          if (!(x instanceof Set)) {
            return H.signals.false_and_break;
          }
          return H.signals.process_set_elements;
        },
        //.......................................................................................................
        positive0: (x) => {
          debug(CND.reverse(CND.yellow('^positive0@453^', rpr(x))));
          return x >= 0;
        },
        positive1: (x) => {
          return x > 0;
        },
        negative0: (x) => {
          return x <= 0;
        },
        negative1: (x) => {
          return x < 0;
        }
      }
    }));

    return Intertype_hedge_combinator;

  }).call(this);

  // #---------------------------------------------------------------------------------------------------------
// _match_hedge_and_type_cfg: ( hedge, type_cfg ) ->
//   unless @constructor.hedges_matchers_are_orthogonal
//     name = @constructor.name
//     throw new E.Intertype_not_implemented '^intertype.hedges@1^', \
//       "non-orthogonal hedge matchers not implemented, got #{name}.hedges_matchers_are_orthogonal == false"
//   return true unless property?
//   for property of hedge.match
//     return false unless type_cfg[ property ]
//   return true

}).call(this);

//# sourceMappingURL=hedges.js.map