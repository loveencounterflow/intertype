(function() {
  'use strict';
  var E, GUY, H, L, debug, rpr;

  //###########################################################################################################
  GUY = require('guy');

  ({debug} = GUY.trm.get_loggers('INTERTYPE/hedges'));

  ({rpr} = GUY.trm);

  //...........................................................................................................
  E = require('./errors');

  H = require('./helpers');

  L = this;

  //===========================================================================================================
  this.defaults = {
    combinator_cfg: {
      hedgematch: '*'
    }
  };

  //===========================================================================================================
  this.Intertype_hedges = (function() {
    class Intertype_hedges extends GUY.props.Strict_owner {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        super();
        this.cfg = {...L.defaults.combinator_cfg, ...cfg};
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      get_hedgepaths(compiled_hedges) {
        var R, hedgematch, i, idx, ref, x;
        throw new E.Intertype_ETEMPTBD('^intertype.hedges@1^', "not implemented: get_hedgepaths()");
        if ((hedgematch = this.cfg.hedgematch) == null) {
          return [];
        }
        R = (function() {
          var i, len, ref, results;
          ref = this._combine(compiled_hedges);
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            x = ref[i];
            results.push(x.flat());
          }
          return results;
        }).call(this);
        if (hedgematch !== '*') {
          for (idx = i = ref = R.length - 1; i >= 0; idx = i += -1) {
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

    };

    //---------------------------------------------------------------------------------------------------------
    /* TAINT tack onto prototype as hidden */
    Intertype_hedges.prototype._hedgemethods = GUY.lft.freeze(new GUY.props.Strict_owner({
      target: {
        optional: function(x) {
          if (x != null) {
            return true;
          } else {
            return H.signals.return_true;
          }
        },
        //.......................................................................................................
        or: function(x) {
          return x === true;
        },
        of: function(x) {
          return H.signals.element_mode;
        },
        //.......................................................................................................
        empty: function(x) {
          return (H.size_of(x, null)) === 0;
        },
        nonempty: function(x) {
          return (H.size_of(x, null)) !== 0;
        },
        //.......................................................................................................
        positive0: function(x) {
          return (x === +2e308) || ((Number.isFinite(x)) && (x >= 0));
        },
        positive1: function(x) {
          return (x === +2e308) || ((Number.isFinite(x)) && (x > 0));
        },
        negative0: function(x) {
          return (x === -2e308) || ((Number.isFinite(x)) && (x <= 0));
        },
        negative1: function(x) {
          return (x === -2e308) || ((Number.isFinite(x)) && (x < 0));
        }
      }
    }));

    return Intertype_hedges;

  }).call(this);

}).call(this);

//# sourceMappingURL=hedges.js.map