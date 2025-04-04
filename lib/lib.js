(function() {
  'use strict';
  var $isa, $primitive_types, $type_of, GUY, Intertype, Type, Typespace, debug, hide, info, nameit, rpr, warn;

  //===========================================================================================================
  GUY = require('guy');

  ({debug, info, warn} = GUY.trm.get_loggers('demo-execa'));

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
    nonempty_text: function(x) {
      return (typeof x === 'string') && (x.length > 0);
    },
    function: function(x) {
      return (Object.prototype.toString.call(x)) === '[object Function]';
    },
    pod: function(x) {
      var ref;
      return (x != null) && ((ref = x.constructor) === Object || ref === (void 0));
    },
    primitive: function(x) {
      return $primitive_types.includes($type_of(x));
    },
    object: function(x) {
      return (x != null) && x instanceof Object;
    },
    type: function(x) {
      return x instanceof Type;
    },
    typespace: function(x) {
      return x instanceof Typespace;
    },
    intertype: function(x) {
      return x instanceof Intertype;
    }
  };

  // nan:                    ( x ) => Number.isNaN         x

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
    // return 'pod'          if $isa.pod x
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
          stack = this._stack.join('/');
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

    };

    //---------------------------------------------------------------------------------------------------------
    Intertype.primitive_types = $primitive_types;

    //---------------------------------------------------------------------------------------------------------
    Intertype.type_of = $type_of;

    Intertype.prototype.type_of = $type_of;

    return Intertype;

  }).call(this);

  // #---------------------------------------------------------------------------------------------------------
  // copy_template: ( type ) ->
  //   return x if $isa.primitive x
  //   return x.call

    //===========================================================================================================
  Type = class Type {
    //---------------------------------------------------------------------------------------------------------
    constructor(typespace, typename, declaration) {
      var key, value;
      this.$typename = typename;
      hide(this, '$typespace', typespace);
      //.......................................................................................................
      declaration = this._declaration_as_pod(typespace, typename, declaration);
      this._declaration_isa_as_function(typespace, typename, declaration);
      this._compile_declaration_fields(typespace, typename, declaration);
// @_compile_declaration_create  typespace, typename, declaration
//.......................................................................................................
      for (key in declaration) {
        value = declaration[key];
        /* TAINT check for overrides */
        hide(this, key, value);
      }
      //.......................................................................................................
      /* TAINT perform validation of resulting shape here */
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _declaration_as_pod(typespace, typename, declaration) {
      if (!$isa.pod(declaration)) {
        return ((function(isa) {
          return {isa};
        })(declaration));
      }
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _declaration_isa_as_function(typespace, typename, declaration) {
      if (declaration.fields != null) {
        this._compile_isa_with_fields(typespace, typename, declaration);
      } else {
        this._compile_isa_without_fields(typespace, typename, declaration);
      }
      nameit(typename, declaration.isa);
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_isa_with_fields(typespace, typename, declaration) {
      var check_fields;
      if ($isa.function(declaration.isa)) {
        return null;
      }
      check_fields = this._get_fields_check(typespace, typename, declaration);
      switch (true) {
        //.....................................................................................................
        case $isa.type(declaration.isa):
          declaration.isa = ((type) => {
            return function(x, t) {
              return (t.isa(type, x)) && (check_fields.call(this, x, t));
            };
          })(declaration.isa);
          break;
        //.....................................................................................................
        case $isa.nonempty_text(declaration.isa):
          declaration.isa = ((typeref) => {
            return function(x, t) {
              var type;
              if (!$isa.type((type = typespace[typeref]))) {
                throw new Error(`Ω__12 expected typeref ${rpr(typeref)} to give a type, got a ${$type_of(declaration.isa)}`);
              }
              return (t.isa(type, x)) && (check_fields.call(this, x, t));
            };
          })(declaration.isa);
          break;
        //.....................................................................................................
        case declaration.isa == null:
          declaration.isa = check_fields;
          break;
        default:
          //.....................................................................................................
          throw new Error(`Ω__13 expected \`declaration.isa\` to be a function, a type or a typeref, got a ${$type_of(declaration.isa)}`);
      }
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_isa_without_fields(typespace, typename, declaration) {
      if ($isa.function(declaration.isa)) {
        return null;
      }
      switch (true) {
        //.....................................................................................................
        case $isa.type(declaration.isa):
          declaration.isa = ((type) => {
            return function(x, t) {
              return t.isa(type, x);
            };
          })(declaration.isa);
          break;
        //.....................................................................................................
        case $isa.nonempty_text(declaration.isa):
          declaration.isa = ((typeref) => {
            return function(x, t) {
              var type;
              if (!$isa.type((type = typespace[typeref]))) {
                throw new Error(`Ω__14 expected typeref ${rpr(typeref)} to give a type, got a ${$type_of(declaration.isa)}`);
              }
              return t.isa(type, x);
            };
          })(declaration.isa);
          break;
        //.....................................................................................................
        case declaration.isa == null:
          declaration.isa = function(x, t) {
            return $isa.pod(x);
          };
          break;
        default:
          //.....................................................................................................
          throw new Error(`Ω__15 expected \`declaration.isa\` to be a function, a type or a typeref, got a ${$type_of(declaration.isa)}`);
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_declaration_fields(typespace, typename, declaration) {
      var field_declaration, field_name, field_typename, ref;
      if (declaration.fields == null) {
        return declaration;
      }
      if (!$isa.pod(declaration.fields)) {
        throw new Error(`Ω__16 expected \`fields\` to be a POD, got a ${$type_of(declaration.fields)}`);
      }
      ref = declaration.fields;
      //.......................................................................................................
      for (field_name in ref) {
        field_declaration = ref[field_name];
        field_typename = `${typename}_$${field_name}`;
        declaration.fields[field_name] = typespace[field_typename] = new Type(typespace, field_typename, field_declaration);
      }
      //.......................................................................................................
      declaration.isa = this._get_fields_check(typespace, typename, declaration);
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_fields_check(typespace, typename, declaration) {
      return function(x, t) {
        var field_name, field_type, ref;
        ref = this.fields;
        for (field_name in ref) {
          field_type = ref[field_name];
          if (!((x != null) && t.isa(field_type, x[field_name]))) {
            return false;
          }
        }
        return true;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_declaration_create(typespace, typename, declaration) {
      switch (true) {
        case (declaration.create == null) && (declaration.fields == null):
          if (declaration.template != null) {
            throw new Error(`Ω__17 MEH-create-1 unable to create value of type ${rpr(typename)}`);
          }
          declaration.create = function() {
            throw new Error(`Ω__18 MEH-create-1 unable to create value of type ${rpr(typename)}`);
          };
      }
      return declaration;
    }

  };

  //===========================================================================================================
  Typespace = class Typespace {
    //---------------------------------------------------------------------------------------------------------
    constructor(typespace_cfg) {
      /* TAINT check for overrides */
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
    return module.exports = {Intertype, Type, Typespace, types, $isa, $type_of};
  })();

}).call(this);

//# sourceMappingURL=lib.js.map