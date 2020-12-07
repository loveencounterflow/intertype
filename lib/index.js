(function() {
  'use strict';
  (() => {
    var INTERTYPE;
    INTERTYPE = require('./main.js');
    if (globalThis.window != null) {
      globalThis.Intertype = INTERTYPE.Intertype;
    } else {
      module.exports = INTERTYPE;
    }
    return null;
  })();

}).call(this);

//# sourceMappingURL=index.js.map