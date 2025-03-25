(function() {
  'use strict';
  var $isa, $type_of, GUY, Type, Types, Typespace, alert, bold, debug, echo, flatly_1, flatly_2, help, hide, info, inspect, log, nameit, plain, praise, reverse, rpr, std, urge, warn, whisper,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  //===========================================================================================================
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('demo-execa'));

  ({rpr, inspect, echo, reverse, bold, log} = GUY.trm);

  ({hide} = GUY.props);

  ({
    props: {nameit}
  } = require('webguy'));

  //===========================================================================================================
  $isa = {
    text: function(x) {
      return typeof x === 'string';
    },
    function: function(x) {
      return (Object.prototype.toString.call(x)) === '[object Function]';
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  $type_of = function(x) {
    if (x === null) {
      return 'null';
    }
    if (x === void 0) {
      return 'undefined';
    }
    if (x === +2e308) {
      return 'infinity';
    }
    if (x === -2e308) {
      return 'infinity';
    }
    if (x === true) {
      return 'boolean';
    }
    if (x === false) {
      return 'boolean';
    }
    if ($isa.text(x)) {
      return 'text';
    }
    if ($isa.function(x)) {
      return 'function';
    }
    return 'something';
  };

  //===========================================================================================================
  Types = class Types {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      hide(this, 'isa', this.isa.bind(this));
      hide(this, 'validate', this.validate.bind(this));
      hide(this, 'create', this.create.bind(this));
      hide(this, 'type_of', this.type_of.bind(this));
      hide(this, 'memo', new Map());
      hide(this, '_recording', false);
      hide(this, '_journal', null);
      hide(this, '_stack', null);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    isa(type, x) {
      var R, entry, ref, stack;
      /* TAINT use proper validation */
      if (!(type instanceof Type)) {
        throw new Error(`Ω___2 expected an instance of \`Type\`, got a ${$type_of(R)}`);
      }
      //.......................................................................................................
      if (this._recording) {
        this._stack.push(type.$typename);
        this._journal.push(entry = {});
      }
      //.......................................................................................................
      if ((ref = (R = type.isa.call(type, x, this))) !== true && ref !== false) {
        throw new Error(`Ω___3 expected \`true\` or \`false\`, got a ${$type_of(R)}`);
      }
      //.......................................................................................................
      if (this._recording) {
        stack = this._stack.join('.');
        this._stack.pop();
        Object.assign(entry, {
          type: type.$typename,
          stack,
          value: x,
          verdict: R
        });
      }
      //.......................................................................................................
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    type_of(x) {
      return 'something';
    }

    //---------------------------------------------------------------------------------------------------------
    validate(type, x) {
      if (this.isa(type, x)) {
        return x;
      }
      throw new Error(`Ω___4 expected a ${type.$typename}, got a ${$type_of(x)}`);
    }

    //---------------------------------------------------------------------------------------------------------
    create(type, ...P) {
      throw new Error("Ω___5 not yet implemented");
    }

    //---------------------------------------------------------------------------------------------------------
    evaluate(type, x) {
      var R;
      this._recording = true;
      this._journal = [];
      this._stack = [];
      //.......................................................................................................
      this.isa(type, x);
      //.......................................................................................................
      R = this._journal;
      this._recording = false;
      this._journal = null;
      this._stack = null;
      return R;
    }

  };

  //===========================================================================================================
  Type = class Type {
    //---------------------------------------------------------------------------------------------------------
    constructor(typespace, typename, declaration) {
      var key, value;
      this.$typename = typename; // hide @, '$typename',  typename
      hide(this, '$typespace', typespace);
      if (declaration.fields != null) {
        this._compile_fields(typespace, typename, declaration);
      }
      //.......................................................................................................
      switch (true) {
        //.....................................................................................................
        case $isa.text(declaration):
          declaration = ((typeref) => {
            return {
              isa: (function(x, t) {
                return t.isa(this.$typespace[typeref], x);
              })
            };
          })(declaration);
          break;
        //.....................................................................................................
        case $isa.function(declaration):
          declaration = {
            isa: declaration
          };
          break;
        //.....................................................................................................
        case declaration instanceof Type:
          null;
          break;
        case declaration instanceof Object:
          null;
          break;
        default:
          //.....................................................................................................
          throw new Error(`Ω___6 expected a typename, a function or a type as declaration, got a ${$type_of(declaration)}`);
      }
//.......................................................................................................
/* TAINT this is defective w/out proper validation */
      for (key in declaration) {
        value = declaration[key];
        if (key === 'isa') { // check that value is function?
          nameit(typename, value);
        }
        hide(this, key, value);
      }
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_fields(typespace, typename, declaration) {
      var field_declaration, field_name, ref;
      //.......................................................................................................
      /* TAINT try to move this check to validation step */
      if (declaration.isa != null) {
        throw new Error("Ω___7 must have exactly one of `isa` or `fields`, not both");
      }
      ref = declaration.fields;
      for (field_name in ref) {
        field_declaration = ref[field_name];
        declaration.fields[field_name] = new Type(typespace, field_name, field_declaration);
      }
      //.......................................................................................................
      declaration.isa = this._get_default_isa_for_fields(typespace, typename, declaration);
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_default_isa_for_fields(typespace, typename, declaration) {
      return function(x, t) {
        var field, field_name, ref;
        ref = this.fields;
        for (field_name in ref) {
          field = ref[field_name];
          if (!((x != null) && t.isa(field, x[field_name]))) {
            return false;
          }
        }
        return true;
      };
    }

  };

  //===========================================================================================================
  Typespace = class Typespace {
    //---------------------------------------------------------------------------------------------------------
    constructor(typespace_cfg) {
      var declaration, typename;
      for (typename in typespace_cfg) {
        declaration = typespace_cfg[typename];
        if (!(declaration instanceof Type)) {
          declaration = new Type(this, typename, declaration);
        }
        this[typename] = declaration;
      }
      return void 0;
    }

  };

  //===========================================================================================================
  std = new Typespace({
    //.........................................................................................................
    integer: {
      isa: function(x, t) {
        return Number.isInteger(x);
      },
      foo: 4
    },
    odd: {
      isa: function(x, t) {
        return (t.isa(this.$typespace.integer, x)) && (modulo(x, 2) !== 0);
      }
    },
    // short form just assigns either a test method or a type name:
    even: function(x, t) {
      return (t.isa(this.$typespace.integer, x)) && (modulo(x, 2) === 0);
    },
    float: function(x, t) {
      return Number.isFinite(x);
    },
    bigint: function(x, t) {
      return typeof x === 'bigint';
    },
    text: function(x, t) {
      return typeof x === 'string';
    },
    nonempty_text: function(x, t) {
      return (t.isa(this.$typespace.text, x)) && (x.length > 0);
    },
    //.........................................................................................................
    // numerical:      ( x, t ) -> ( t.isa @$typespace.float, x   ) or ( t.isa @$typespace.bigint, x )
    // positive0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +0  )
    // positive1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +1  )
    // negative0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <=  0  )
    // negative1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <= -1  )
    // cardinal:       ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( t.isa @$typespace.positive0, x )
    //.........................................................................................................
    // cardinalbigint: ( x, t ) -> ( t.isa @$typespace.bigint, x    ) and ( x >= +0 )
    //.........................................................................................................
    // circle1:  'circle2'
    // circle2:  'circle3'
    // circle3:  'circle1'
    //.........................................................................................................
    weird: 'strange', // declares another name for `odd`
    strange: 'odd', // declares another name for `odd`
    abnormal: 'weird', // declares another name for `odd`
    //.........................................................................................................
    quantity: {
      fields: {
        // each field becomes a `Type` instance; strings may refer to names in the same typespace
        q: 'float',
        u: 'nonempty_text'
      },
      template: {
        q: 0,
        u: 'u'
      }
    },
    //.........................................................................................................
    address: {
      fields: {
        postcode: 'nonempty_text',
        city: 'nonempty_text'
      }
    },
    //.........................................................................................................
    employee: {
      fields: {
        address: 'address',
        name: {
          fields: {
            firstname: 'nonempty_text',
            lastname: 'nonempty_text'
          }
        }
      }
    }
  });

  //===========================================================================================================
  flatly_1 = new Typespace({
    evenly: 'flat',
    flat: function(x, t) {
      return t.isa(std.even, x);
    },
    plain: 'evenly'
  });

  // foo:          'bar'

  //-----------------------------------------------------------------------------------------------------------
  flatly_2 = new Typespace({
    evenly: 'flat',
    flat: std.even,
    plain: 'evenly'
  });

  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  module.exports = {
    Types,
    Type,
    Typespace,
    std,
    flatly_1,
    flatly_2,
    types: new Types()
  };

  //===========================================================================================================
// if module is require.main then await do =>

}).call(this);

//# sourceMappingURL=main.js.map