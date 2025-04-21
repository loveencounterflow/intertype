(function() {
  'use strict';
  var B, GUY, H, Intertype, Type, Typespace, debug, hide, info, nameit, rpr, warn;

  //===========================================================================================================
  GUY = require('guy');

  ({debug, info, warn} = GUY.trm.get_loggers('demo-execa'));

  ({rpr} = GUY.trm);

  ({hide} = GUY.props);

  ({
    props: {nameit}
  } = require('webguy'));

  B = require('./builtins');

  H = require('./helpers');

  Intertype = (function() {
    //===========================================================================================================
    class Intertype {
      // #---------------------------------------------------------------------------------------------------------
      // @primitive_types = B.primitive_types

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
          throw new Error(`Ω___1 expected an instance of \`Type\`, got a ${B.type_of(R)}`);
        }
        //.......................................................................................................
        if (this._recording) {
          this._stack.push(type.$typename);
          this._journal.push(entry = {});
        }
        //.......................................................................................................
        if ((ref = (R = type.isa.call(type, x, this))) !== true && ref !== false) {
          throw new Error(`Ω___2 expected \`true\` or \`false\`, got a ${B.type_of(R)}`);
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
          throw new Error(`Ω___3 expected an instance of Typespace, got a ${B.type_of(x)}`);
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
        throw new Error(`Ω___4 expected a ${type.$typename}, got a ${B.type_of(x)}`);
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
          throw new Error(`Ω___6 expected an instance of Type, got a ${B.type_of(type)}`);
        }
        return type.create.call(type, P, this);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Intertype.type_of = B.type_of;

    Intertype.prototype.type_of = B.type_of;

    return Intertype;

  }).call(this);

  // #---------------------------------------------------------------------------------------------------------
  // copy_template: ( type ) ->
  //   return x if B.isa.primitive x
  //   return x.call

    //===========================================================================================================
  Type = class Type {
    //---------------------------------------------------------------------------------------------------------
    constructor(typespace, typename, declaration) {
      var key, value;
      this.$typename = typename;
      hide(this, '$typespace', typespace);
      hide(this, '$members', {});
      hide(this, '$fields', {});
      hide(this, '$variants', {});
      hide(this, '$member_names', []);
      hide(this, '$field_names', []);
      hide(this, '$variant_names', []);
      hide(this, '$has_members', false);
      hide(this, '$has_fields', false);
      hide(this, '$has_variants', false);
      hide(this, '$kind', null);
      hide(this, '$isa', null);
      //.......................................................................................................
      declaration = this._declaration_as_pod(typespace, typename, declaration);
      this._prepare_members(typespace, typename, declaration);
      this._prepare_kind(typespace, typename, declaration);
      this._prepare_fields(typespace, typename, declaration);
      this._prepare_variants(typespace, typename, declaration);
      return void 0;
      this._compile_declaration_$isa(typespace, typename, declaration);
      this._compile_declaration_$freeze(typespace, typename, declaration);
      this._compile_declaration_$create(typespace, typename, declaration);
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
      if (!B.isa.pod(declaration)) {
        return ((function($isa) {
          return {$isa};
        })(declaration));
      }
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _prepare_members(typespace, typename, declaration) {
      var i, len, name, ref;
      ref = H.get_own_user_keys(declaration);
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        this.$members[name] = declaration[name];
        this.$member_names.push(name);
      }
      this.$has_members = this.$member_names.length > 0;
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _prepare_kind(typespace, typename, declaration) {
      var ref;
      if (declaration.$kind != null) {
        if (this.$has_members) {
          if ((ref = declaration.$kind) !== '$record' && ref !== '$variant') {
            throw new Error(`Ω___9 expected $kind to be '$record' or '$variant', got ${rpr(declaration.$kind)}`);
          }
          this.$kind = declaration.$kind;
        } else if (B.isa.list(declaration.$isa)) {
          if (declaration.$kind !== '$enumeration') {
            throw new Error(`Ω__10 expected $kind to be '$enumeration', got ${rpr(declaration.$kind)}`);
          }
        }
        this.$kind = declaration.$kind;
      } else {
        //.......................................................................................................
        if (this.$has_members) {
          this.$kind = '$record';
        } else if (B.isa.list(declaration.$isa)) {
          this.$kind = '$enumeration';
        }
        if (this.$kind == null) {
          this.$kind = '$unspecified';
        }
      }
      //.......................................................................................................
      if (!B.isa.declaration_$kind(this.$kind)) {
        throw new Error(`Ω__11 unexpected value of \`$kind\`: ${rpr(this.$kind)}`);
      }
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _prepare_fields(typespace, typename, declaration) {
      if (this.$kind !== '$record') {
        return null;
      }
      this.$fields = this.$members;
      this.$has_fields = this.$has_members;
      this.$field_names = this.$member_names;
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _prepare_variants(typespace, typename, declaration) {
      if (this.$kind !== '$variant') {
        return null;
      }
      this.$variants = this.$members;
      this.$has_variants = this.$has_members;
      this.$variant_names = this.$member_names;
      return null;
    }

    //   return declaration unless declaration.fields?
    //   unless B.isa.pod declaration.fields
    //     throw new Error "Ω__16 expected `fields` to be a POD, got a #{B.type_of declaration.fields}"
    //   #.......................................................................................................
    //   for field_name, field_declaration of declaration.fields
    //     ### TAINT use API method ###
    //     field_typename = "#{typename}_$#{field_name}"
    //     declaration.fields[ field_name ] = \
    //       typespace[ field_typename ] = new Type typespace, field_typename, field_declaration
    //   #.......................................................................................................
    //   declaration.isa = @_get_fields_check typespace, typename, declaration
    //   return declaration

      //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################
    //#########################################################################################################

      //---------------------------------------------------------------------------------------------------------
    _compile_declaration_$freeze(typespace, typename, declaration) {
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_declaration_$isa(typespace, typename, declaration) {
      if (declaration.fields != null) {
        this._compile_isa_with_record_fields(typespace, typename, declaration);
      } else {
        this._compile_isa_without_fields(typespace, typename, declaration);
      }
      nameit(typename, declaration.isa);
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_isa_with_variant_fields(typespace, typename, declaration) {}

    //---------------------------------------------------------------------------------------------------------
    _compile_isa_with_record_fields(typespace, typename, declaration) {
      var check_fields;
      if (B.isa.function(declaration.isa)) {
        return null;
      }
      check_fields = this._get_fields_check(typespace, typename, declaration);
      switch (true) {
        //.....................................................................................................
        case B.isa.type(declaration.isa):
          declaration.isa = ((type) => {
            return function(x, t) {
              return (t.isa(type, x)) && (check_fields.call(this, x, t));
            };
          })(declaration.isa);
          break;
        //.....................................................................................................
        /* (see condition dB in README) */
        case B.isa.nonempty_text(declaration.isa):
          declaration.isa = ((typeref) => {
            var type;
            if (!B.isa.type((type = typespace[typeref]))) {
              throw new Error(`Ω__12 declaration for type ${rpr(typename)} contains forward reference to type ${rpr(typeref)}`);
            }
            return function(x, t) {
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
          throw new Error(`Ω__13 expected \`declaration.isa\` to be a function, a type or a typeref, got a ${B.type_of(declaration.isa)}`);
      }
      return declaration;
    }

    //---------------------------------------------------------------------------------------------------------
    _compile_isa_without_fields(typespace, typename, declaration) {
      if (B.isa.function(declaration.isa)) {
        return null;
      }
      switch (true) {
        //.....................................................................................................
        case B.isa.type(declaration.isa):
          declaration.isa = ((type) => {
            return function(x, t) {
              return t.isa(type, x);
            };
          })(declaration.isa);
          break;
        //.....................................................................................................
        case B.isa.nonempty_text(declaration.isa):
          declaration.isa = ((typeref) => {
            var type;
            if (!B.isa.type((type = typespace[typeref]))) {
              throw new Error(`Ω__14 declaration for type ${rpr(typename)} contains forward reference to type ${rpr(typeref)}`);
            }
            return function(x, t) {
              return t.isa(type, x);
            };
          })(declaration.isa);
          break;
        //.....................................................................................................
        case declaration.isa == null:
          declaration.isa = function(x, t) {
            return B.isa.pod(x);
          };
          break;
        default:
          //.....................................................................................................
          throw new Error(`Ω__15 expected \`declaration.isa\` to be a function, a type or a typeref, got a ${B.type_of(declaration.isa)}`);
      }
      return null;
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
    _compile_declaration_$create(typespace, typename, declaration) {
      var fields_isa_pod, has_fields, template_isa_pod;
      has_fields = declaration.fields != null;
      fields_isa_pod = B.isa.pod(declaration.fields);
      //.......................................................................................................
      /* condition cC */
      if (has_fields && !fields_isa_pod) {
        throw new Error("Ω__17 (see condition cC in README)");
      }
      //.......................................................................................................
      if (declaration.create != null) {
        /* condition cB */
        if (!B.isa.function(declaration.create)) {
          throw new Error("Ω__18 (see condition cB in README)");
        }
        /* condition cA: use user-defined `create()` method, nothing to do here: */
        return null;
      }
      //.......................................................................................................
      if (!has_fields) {
        /* condition cI */
        if (declaration.template == null) {
          declaration.create = function(P, t) {
            throw new Error(`Ω__19 type ${rpr(typename)} does not support value creation (see condition cI in README)`);
          };
          return null;
        }
        /* condition cG */
        if (B.isa.function(declaration.template)) {
          declaration.create = ((create) => {
            return function(P, t) {
              return create.call(this, P, t);
            };
          })(declaration.template);
          return null;
        }
        /* condition cH */
        declaration.create = ((seed_value) => {
          return function(P, t) {
            if (P.length !== 0) {
              throw new Error(`Ω__20 create method for ${typename} does not accept arguments, got ${P.length} (see condition cH in README)`);
            }
            return seed_value;
          };
        })(declaration.template);
        return null;
      }
      //.......................................................................................................
      template_isa_pod = B.isa.pod(declaration.template);
      if (declaration.template != null) {
        /* condition cE */
        if (!template_isa_pod) {
          throw new Error("Ω__21 (see condition cE in README)");
        }
        /* condition cD */
        // do ( fields = declaration.fields, template = declaration.template ) =>
        declaration.create = function(P, t) {
          var R, field_name, ref, seed, type;
          if (P.length !== 0) {
            throw new Error(`Ω__22 create method for ${typename} does not accept arguments, got ${P.length} (see condition cD in README)`);
          }
          R = {};
          ref = this.fields;
          for (field_name in ref) {
            type = ref[field_name];
            /* condition cDa */
            if ((seed = this.template[field_name]) != null) {
              R[field_name] = (B.isa.function(seed)) ? seed.call(this, ...P, t) : seed;
            } else {
              R[field_name] = t.create(type);
            }
          }
          return R;
        };
        return null;
      }
      //.......................................................................................................
      /* condition cF */
      declaration.create = function(P, t) {
        var R, field_name, ref, type;
        if (P.length !== 0) {
          throw new Error(`Ω__23 create method for ${typename} does not accept arguments, got ${P.length} (see condition cF in README)`);
        }
        R = {};
        ref = this.fields;
        for (field_name in ref) {
          type = ref[field_name];
          R[field_name] = t.create(type);
        }
        return R;
      };
      return null;
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

  (() => {    // #===========================================================================================================
    // class Typespace extends Type

    //   #---------------------------------------------------------------------------------------------------------
    //   constructor: ( declarations ) ->
    //     ### TAINT use proper validation, `create()` ###
    //     unless B.isa.pod declarations
    //       throw new Error "Ω__24 expected a plain object, got a #{B.type_of declarations}"
    //     if declarations.$isa? or ( declarations.$isa isnt '$variant' )
    //       throw new Error "Ω__25 expected declarations.$isa to be unset or set to '$variant', got `{ declarations.$isa: #{rpr declarations.$isa}, }`"
    //     super { declarations..., $isa: '$variant', }
    //     return undefined

    //===========================================================================================================
    // if module is require.main then await do =>
    var types;
    types = new Intertype();
    return module.exports = {
      Intertype,
      Type,
      Typespace,
      types,
      builtins: B
    };
  })();

}).call(this);

//# sourceMappingURL=lib.js.map