(function() {
  'use strict';
  var D, Declaration_compiler, Intervoke_phraser, Isa, Isa_proto, T, Types, debug, defaults, misfit, sample_vocabulary;

  ({Intervoke_phraser} = require('intervoke'));

  ({sample_vocabulary} = require('intervoke/lib/phrase-parser'));

  ({debug} = console);

  misfit = Symbol.for('misfit');

  //===========================================================================================================
  defaults = {
    declaration: {
      fields: null,
      template: misfit
    }
  };

  //===========================================================================================================
  Types = class Types {
    isa_function(x) {
      return typeof x === 'function';
    }

  };

  T = new Types();

  //===========================================================================================================
  Declaration_compiler = class Declaration_compiler {
    //---------------------------------------------------------------------------------------------------------
    compile(name, declaration) {
      var R;
      if (T.isa_function(declaration)) {
        declaration = {
          isa: declaration
        };
      }
      R = {...defaults.declaration, ...declaration};
      return R;
    }

  };

  D = new Declaration_compiler();

  //===========================================================================================================
  Isa_proto = class Isa_proto extends Intervoke_phraser {
    //---------------------------------------------------------------------------------------------------------
    __get_handler(accessor, ast) {
      debug('^Isa_proto::__get_handler@1^', accessor);
      debug('^Isa_proto::__get_handler@1^', ast);
      return function(x) {
        debug('^Isa_proto::__get_handler/handler@1^', accessor, ast);
        return true;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    __declare(accessor, handler) {
      /* Associate an accessor with a handler method: */
      debug('^Isa_proto::__declare@1^', {accessor, handler});
      debug('^Isa_proto::__declare@1^', D.compile(accessor, handler));
      return super.__declare(accessor, handler);
    }

  };

  Isa = (function() {
    //===========================================================================================================
    class Isa extends Isa_proto {};

    //---------------------------------------------------------------------------------------------------------
    Isa.declare = {
      null: function(x) {
        return x === null;
      },
      undefined: function(x) {
        return x === void 0;
      },
      boolean: function(x) {
        return (x === true) || (x === false);
      },
      float: function(x) {
        return Number.isFinite(x);
      },
      symbol: function(x) {
        return (typeof x) === 'symbol';
      }
    };

    return Isa;

  }).call(this);

  //===========================================================================================================
  if (module === require.main) {
    (() => {
      var isa;
      //.........................................................................................................
      isa = new Isa();
      isa.__parser.set_vocabulary(sample_vocabulary);
      debug('^do@1^', isa);
      debug('^do@2^', isa.integer);
      debug('^do@3^', isa.integer(12));
      debug('^do@4^', isa.null);
      debug('^do@4^', isa.null(5));
      return debug('^do@4^', isa.null(null));
    })();
  }

}).call(this);

//# sourceMappingURL=main.js.map