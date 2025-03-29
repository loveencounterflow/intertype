(function() {
  'use strict';
  var $isa, $primitive_types, $type_of, GUY, Intertype, Type, Typespace, debug, hide, nameit, rpr, warn;

  //===========================================================================================================
  GUY = require('guy');

  ({debug, warn} = GUY.trm.get_loggers('demo-execa'));

  ({rpr} = GUY.trm);

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
    },
    // nan:                    ( x ) => Number.isNaN         x
    pod: function(x) {
      var ref;
      return (x != null) && ((ref = x.constructor) === Object || ref === (void 0));
    },
    primitive: function(x) {
      return $primitive_types.includes($type_of(x));
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  $primitive_types = Object.freeze(['null', 'undefined', 'infinity', 'boolean', 'nan', 'float', 'anyfloat', 'text']);

  //-----------------------------------------------------------------------------------------------------------
  $type_of = function(x) {
    /* TAINT consider to return x.constructor.name */
    var jstypeof, millertype;
    if (x === null) {
      //.........................................................................................................
      /* Primitives: */
      return 'null';
    }
    if (x === void 0) {
      return 'undefined';
    }
    if ((x === +2e308) || (x === -2e308)) {
      return 'infinity';
    }
    if ((x === true) || (x === false)) {
      return 'boolean';
    }
    if (Number.isNaN(x)) {
      return 'nan';
    }
    if (Number.isFinite(x)) {
      return 'float';
    }
    //.........................................................................................................
    switch (jstypeof = typeof x) {
      case 'string':
        return 'text';
    }
    if (Array.isArray(x)) {
      //.........................................................................................................
      return 'list';
    }
    millertype = Object.prototype.toString.call(x);
    return (millertype.replace(/^\[object ([^\]]+)\]$/, '$1')).toLowerCase();
  };

  Intertype = (function() {
    // switch millertype = Object::toString.call x
    //   when '[object Function]'            then return 'function'
    //   when '[object AsyncFunction]'       then return 'asyncfunction'
    //   when '[object GeneratorFunction]'   then return 'generatorfunction'
    //.........................................................................................................
    // return millertype[ 8 ... millertype.length - 1 ].toLowerCase()
    // return 'something'

      //===========================================================================================================
    class Intertype {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        hide(this, 'isa', this.isa.bind(this));
        hide(this, 'validate', this.validate.bind(this));
        hide(this, 'create', this.create.bind(this));
        hide(this, 'type_of', this.type_of.bind(this));
        hide(this, 'types_of', this.types_of.bind(this));
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
          throw new Error(`Ω___1 expected an instance of \`Type\`, got a ${$type_of(R)}`);
        }
        //.......................................................................................................
        if (this._recording) {
          this._stack.push(type.$typename);
          this._journal.push(entry = {});
        }
        //.......................................................................................................
        if ((ref = (R = type.isa.call(type, x, this))) !== true && ref !== false) {
          throw new Error(`Ω___2 expected \`true\` or \`false\`, got a ${$type_of(R)}`);
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
      types_of(typespace, x) {
        var type, typename;
        if (!(typespace instanceof Typespace)) {
          throw new Error(`Ω___3 expected an instance of Typespace, got a ${$type_of(x)}`);
        }
        return (function() {
          var results;
          results = [];
          for (typename in typespace) {
            type = typespace[typename];
            if (this.isa(type, x)) {
              results.push(typename);
            }
          }
          return results;
        }).call(this);
      }

      //---------------------------------------------------------------------------------------------------------
      validate(type, x) {
        if (this.isa(type, x)) {
          return x;
        }
        throw new Error(`Ω___4 expected a ${type.$typename}, got a ${$type_of(x)}`);
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

      //---------------------------------------------------------------------------------------------------------
      equals(a, b) {
        throw new Error("Ω___5 not yet implemented");
      }

      //---------------------------------------------------------------------------------------------------------
      create(type, ...P) {
        if (!(type instanceof Type)) {
          throw new Error(`Ω___6 expected an instance of Type, got a ${$type_of(type)}`);
        }
        return type.create.call(type, ...P);
      }

      //---------------------------------------------------------------------------------------------------------
      copy_template(type) {
        if ($isa.primitive(x)) {
          return x;
        }
        return x.call;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Intertype.primitive_types = $primitive_types;

    //---------------------------------------------------------------------------------------------------------
    Intertype.type_of = $type_of;

    Intertype.prototype.type_of = $type_of;

    return Intertype;

  }).call(this);

  //===========================================================================================================
  Type = class Type {
    //---------------------------------------------------------------------------------------------------------
    constructor(typespace, typename, declaration) {
      var key, value;
      this.$typename = typename; // hide @, '$typename',  typename
      hide(this, '$typespace', typespace);
      //.......................................................................................................
      declaration = this._compile_declaration_fields(typespace, typename, declaration);
      declaration = this._compile_declaration_isa(typespace, typename, declaration);
// declaration = @_compile_declaration_create  typespace, typename, declaration
//.......................................................................................................
      for (key in declaration) {
        value = declaration[key];
        if (key === 'isa') { // check that value is function?
          nameit(typename, value);
        }
        hide(this, key, value);
      }
      //.......................................................................................................
      /* TAINT perform validation of resulting shape here */
      //.......................................................................................................
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_declaration_fields(typespace, typename, declaration) {
      var field_declaration, field_name, ref;
      if (declaration.fields == null) {
        return declaration;
      }
      if (!$isa.pod(declaration.fields)) {
        throw new Error(`Ω___8 expected \`fields\` to be a POD, got a ${$type_of(declaration.fields)}`);
      }
      //.......................................................................................................
      /* TAINT try to move this check to validation step */
      if (declaration.isa != null) {
        throw new Error("Ω___9 must have exactly one of `isa` or `fields`, not both");
      }
      ref = declaration.fields;
      for (field_name in ref) {
        field_declaration = ref[field_name];
        declaration.fields[field_name] = new Type(typespace, field_name, field_declaration);
      }
      //.......................................................................................................
      declaration.isa = this._get_isa_method_for_fields_check(typespace, typename, declaration);
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_isa_method_for_fields_check(typespace, typename, declaration) {
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

    //---------------------------------------------------------------------------------------------------------
    _compile_declaration_isa(typespace, typename, declaration) {
      if (declaration.isa != null) {
        return declaration;
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
          throw new Error(`Ω___7 expected a typename, a function or a type as declaration, got a ${$type_of(declaration)}`);
      }
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_declaration_create(typespace, typename, declaration) {
      switch (true) {
        case (declaration.create == null) && (declaration.fields == null):
          if (declaration.template != null) {
            throw new Error(`Ω__10 MEH-create-1 unable to create value of type ${rpr(typename)}`);
          }
          declaration.create = function() {
            throw new Error(`Ω__11 MEH-create-1 unable to create value of type ${rpr(typename)}`);
          };
      }
      return declaration;
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

  (() => {    //===========================================================================================================
    // if module is require.main then await do =>
    var types;
    types = new Intertype();
    return module.exports = {Intertype, Type, Typespace, types};
  })();

}).call(this);

//# sourceMappingURL=lib.js.map