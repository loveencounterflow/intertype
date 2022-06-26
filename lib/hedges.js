(function() {
  'use strict';
  var CND, E, GUY, H, badge, combinate, debug, echo, njs_path, ref, rpr,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

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
      constructor() {
        super(...arguments);
        //---------------------------------------------------------------------------------------------------------
        this._combine = this._combine.bind(this);
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
      _compile_hedges(hedges, type_cfg) {
        var R, hedge, i, j, len, len1, ref1, target, termgroup;
        R = [];
        for (i = 0, len = hedges.length; i < len; i++) {
          hedge = hedges[i];
          if (!this._match_hedge_and_type_cfg(hedge, type_cfg)) {
            continue;
          }
          // termses = [ hedge.terms..., ]
          target = [];
          R.push(target);
          ref1 = hedge.terms;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            termgroup = ref1[j];
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

    };

    //---------------------------------------------------------------------------------------------------------
    Combinator._hedges = GUY.lft.freeze([]);

    return Combinator;

  }).call(this);

  //===========================================================================================================
  this.Intertype_hedge_combinator = (function() {
    class Intertype_hedge_combinator extends this.Combinator {
      //---------------------------------------------------------------------------------------------------------
      _match_hedge_and_type_cfg(hedge, type_cfg) {
        var property, ref1, value;
        ref1 = hedge.match;
        for (property in ref1) {
          value = ref1[property];
          if (property === 'all') {
            return true;
          }
          if (!type_cfg[property]) {
            return false;
          }
        }
        return true;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Intertype_hedge_combinator.hedges = GUY.lft.freeze([
      {
        terms: [null,
      'optional'],
        match: {
          all: true
        }
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
        match: {
          all: true
        }
      },
      {
        terms: [null,
      'empty',
      'nonempty'],
        match: {
          isa_collection: true
        }
      },
      {
        terms: [null,
      'positive0',
      'positive1',
      'negative0',
      'negative1'],
        match: {
          isa_numeric: true
        }
      }
    ]);

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype_hedge_combinator.prototype._signals = GUY.lft.freeze(new GUY.props.Strict_owner({
      target: {
        true_and_break: Symbol('true_and_break'),
        false_and_break: Symbol('false_and_break'),
        process_list_elements: Symbol('process_list_elements'),
        processd_set_elements: Symbol('processd_set_elements')
      }
    }));

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype_hedge_combinator.prototype._hedgemethods = GUY.lft.freeze(new GUY.props.Strict_owner({
      target: {
        optional: function(x) {
          if (x == null) {
            return this._signals.true_and_break;
          }
          return true;
        },
        //.......................................................................................................
        /* TAINT use `length` or `size` or custom method */
        empty: function(x) {
          return (this._size_of(x)) === 0;
        },
        nonempty: function(x) {
          return (this._size_of(x)) !== 0;
        },
        //.......................................................................................................
        /* TAINT this is wrong, must test ensuing arguments against each element in collection */
        list_of: function(x) {
          if (!Array.isArray(x)) {
            return this._signals.false_and_break;
          }
          return this._signals.process_list_elements;
        },
        set_of: function(x) {
          if (!(x instanceof Set)) {
            return this._signals.false_and_break;
          }
          return this._signals.processd_set_elements;
        },
        //.......................................................................................................
        positive0: function(x) {
          return x >= 0;
        },
        positive1: function(x) {
          return x > 0;
        },
        negative0: function(x) {
          return x <= 0;
        },
        negative1: function(x) {
          return x < 0;
        }
      }
    }));

    return Intertype_hedge_combinator;

  }).call(this);

}).call(this);

//# sourceMappingURL=hedges.js.map