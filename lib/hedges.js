(function() {
  'use strict';
  var E, GUY, H, L, PMATCH, debug, ref, rpr,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } },
    indexOf = [].indexOf;

  //###########################################################################################################
  GUY = require('guy');

  ({debug} = GUY.trm.get_loggers('INTERTYPE/hedges'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  L = this;

  PMATCH = require('picomatch');

  //===========================================================================================================
  this.defaults = {
    combinator_cfg: {
      hedgematch: '*'
    }
  };

  //===========================================================================================================
  ref = this.Intertype_hedges = (function() {
    class Intertype_hedges extends GUY.props.Strict_owner {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        super();
        //---------------------------------------------------------------------------------------------------------
        this._combine = this._combine.bind(this);
        this.cfg = {...L.defaults.combinator_cfg, ...cfg};
        // @hedgepaths = new GUY.props.Strict_owner()
        // for groupname from @_get_groupnames()
        //   compiled_hedges           = @_compile_hedges groupname, @constructor.hedges
        //   hedgepaths                = @get_hedgepaths compiled_hedges
        //   @hedgepaths[ groupname ]  = @_reduce_hedgepaths hedgepaths
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
        var R, hedgematch, i, idx, ref1, x;
        throw new Error("not implemented: get_hedgepaths()");
        if ((hedgematch = this.cfg.hedgematch) == null) {
          return [];
        }
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
        if (hedgematch !== '*') {
          for (idx = i = ref1 = R.length - 1; i >= 0; idx = i += -1) {
            if (!this._match_hedgepath(R[idx], hedgematch)) {
              delete R[idx];
            }
          }
        }
        R.sort();
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _match_hedgepath(hedgepath, globpattern) {
        return PMATCH.isMatch(hedgepath, globpattern);
      }

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
    Intertype_hedges.catchall_group = 'other';

    Intertype_hedges.hedges = GUY.lft.freeze([]);

    //---------------------------------------------------------------------------------------------------------
    Intertype_hedges.hedges = GUY.lft.freeze([
      {
        // { terms: [ null, ],                                                     groups: [ 'bottom',       ], }
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
        groups: ['collection']
      },
      {
        terms: [null,
      'positive0',
      'positive1',
      'negative0',
      'negative1'],
        groups: ['number']
      }
    ]);

    // #---------------------------------------------------------------------------------------------------------
    // @groups_of_groups:
    //   collection:       [ ]

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype_hedges.prototype._hedgemethods = GUY.lft.freeze(new GUY.props.Strict_owner({
      target: {
        optional: function(x) {
          if (x == null) {
            // debug GUY.trm.reverse GUY.trm.yellow '^optional@453^', rpr x, @
            return H.signals.true_and_break;
          }
          return true;
        },
        //.......................................................................................................
        or: function(x) {
          return H.signals.disjunction;
        },
        //.......................................................................................................
        /* TAINT use `length` or `size` or custom method */
        empty: function(x) {
          return (H.size_of(x, null)) === 0;
        },
        nonempty: function(x) {
          return (H.size_of(x, null)) !== 0;
        },
        //.......................................................................................................
        list_of: function(x) {
          if (!Array.isArray(x)) {
            return H.signals.false_and_break;
          }
          return H.signals.process_list_elements;
        },
        set_of: function(x) {
          if (!(x instanceof Set)) {
            return H.signals.false_and_break;
          }
          return H.signals.process_set_elements;
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

    return Intertype_hedges;

  }).call(this);

}).call(this);

//# sourceMappingURL=hedges.js.map