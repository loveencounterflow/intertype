(function() {
  'use strict';
  (() => {
    var Intertype;
    Intertype = require('./main.js');
    if (globalThis.window != null) {
      globalThis.Intertype = Intertype;
    } else {
      module.exports = Intertype;
    }
    return null;
  })();

}).call(this);

//# sourceMappingURL=index.js.map