

'use strict'

#-----------------------------------------------------------------------------------------------------------
GUY                       = require 'guy'
misfit                    = Symbol 'misfit'
notavalue                 = Symbol 'notavalue'
E                         = require './errors'
#...........................................................................................................
@constructor_of_generators  = ( ( -> yield 42 )() ).constructor
@deep_copy                  = structuredClone
@equals                     = require '../deps/jkroso-equals'
@nameit                     = ( name, f ) -> Object.defineProperty f, 'name', { value: name, }


#===========================================================================================================
# TYPE_OF FLAVORS
#-----------------------------------------------------------------------------------------------------------
@domenic_denicola_device  = ( x ) => x?.constructor?.name ? './.'
@mark_miller_device       = ( x ) => ( Object::toString.call x ).slice 8, -1
@mark_miller_device_2     = ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
@js_type_of               = ( x ) => Object::toString.call x


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@get_rprs_of_tprs = ( tprs ) ->
  ### `tprs: test parameters, i.e. additional arguments to type tester, as in `multiple_of x, 4` ###
  rpr_of_tprs = switch tprs.length
    when 0 then ''
    when 1 then "#{rpr tprs[ 0 ]}"
    else "#{rpr tprs}"
  srpr_of_tprs = switch rpr_of_tprs.length
    when 0 then ''
    else ' ' + rpr_of_tprs
  return { rpr_of_tprs, srpr_of_tprs, }

#-----------------------------------------------------------------------------------------------------------
@intersection_of = ( a, b ) ->
  a = [ a..., ].sort()
  b = [ b..., ].sort()
  return ( x for x in a when x in b ).sort()

#---------------------------------------------------------------------------------------------------------
@size_of = ( x, fallback = misfit ) ->
  return R unless ( R = GUY.props.get x, 'length',  notavalue ) is notavalue
  return R unless ( R = GUY.props.get x, 'size',    notavalue ) is notavalue
  return fallback unless fallback is misfit
  throw new E.Intertype_ETEMPTBD '^intertype.size_of@1^', \
    "expected an object with `x.length` or `x.size`, got a #{@type_of x} with neither"

#---------------------------------------------------------------------------------------------------------
@signals = GUY.lft.freeze new GUY.props.Strict_owner target:
  return_true:            Symbol 'return_true'
  advance:                Symbol 'advance'
  # element_mode:           Symbol 'element_mode'
  nothing:                Symbol 'nothing'

#-----------------------------------------------------------------------------------------------------------
@type_of = ( x ) ->
  throw new Error "^7746^ expected 1 argument, got #{arity}" unless ( arity = arguments.length ) is 1
  return 'null'       if x is null
  return 'undefined'  if x is undefined
  return 'infinity'   if ( x is Infinity  ) or  ( x is -Infinity  )
  return 'boolean'    if ( x is true      ) or  ( x is false      )
  return 'nan'        if ( Number.isNaN     x )
  return 'float'      if ( Number.isFinite  x )
  return 'buffer'     if ( Buffer.isBuffer  x )
  return 'list'       if ( Array.isArray  x )
  #.........................................................................................................
  ### TAINT Not needed (?) b/c `@js_type_of x` does work with these values, too ###
  ### this catches `Array Iterator`, `String Iterator`, `Map Iterator`, `Set Iterator`: ###
  if ( tagname = x[ Symbol.toStringTag ] )? and ( typeof tagname ) is 'string'
    return @_normalize_type tagname
  #.........................................................................................................
  ### Domenic Denicola Device, see https://stackoverflow.com/a/30560581 ###
  return 'nullobject' if ( c = x.constructor ) is undefined
  return 'object'     if ( typeof c ) isnt 'function'
  if ( R = c.name.toLowerCase() ) is ''
    return 'generator' if x.constructor is @constructor_of_generators
    ### NOTE: throw error since this should never happen ###
    return ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase() ### Mark Miller Device ###
  #.........................................................................................................
  return 'wrapper'  if ( typeof x is 'object' ) and R in [ 'boolean', 'number', 'string', ]
  return 'regex'    if R is 'regexp'
  return 'text'     if R is 'string'
  ### thx to https://stackoverflow.com/a/29094209 ###
  ### TAINT may produce an arbitrarily long throwaway string ###
  return 'class'    if R is 'function' and x.toString().startsWith 'class '
  return R


#===========================================================================================================
# INTERNAL TYPES
#-----------------------------------------------------------------------------------------------------------
@types                    = new ( require 'intertype-legacy' ).Intertype()
@defaults                 = {}

#-----------------------------------------------------------------------------------------------------------
@types.declare 'deep_boolean', ( x ) -> x in [ 'deep', false, true, ]

#-----------------------------------------------------------------------------------------------------------
@types.declare 'Type_cfg_constructor_cfg', tests:
  "@isa.object x":                            ( x ) -> @isa.object x
  "@isa.nonempty_text x.name":                ( x ) -> @isa.nonempty_text x.name
  # "@isa.deep_boolean x.copy":                 ( x ) -> @isa.boolean x.copy
  # "@isa.boolean x.seal":                      ( x ) -> @isa.boolean x.seal
  "@isa.deep_boolean x.freeze":               ( x ) -> @isa.deep_boolean x.freeze
  "@isa.boolean x.extras":                    ( x ) -> @isa.boolean x.extras
  "if extras is false, default must be an object": \
    ( x ) -> ( x.extras ) or ( @isa.object x.default )
  "@isa_optional.function x.create":          ( x ) -> @isa_optional.function x.create
  ### TAINT might want to check for existence of `$`-prefixed keys in case of `( not x.test? )` ###
  ### TAINT should validate values of `$`-prefixed keys are either function or non-empty strings ###
  "x.test is an optional function or non-empty list of functions": ( x ) ->
    return true unless x.test?
    return true if @isa.function x.test
    return false unless @isa_list_of.function x.test
    return false if x.test.length is 0
    return true
  "x.groups is deprecated": ( x ) -> not x.groups?
  "@isa.boolean x.collection": ( x ) -> @isa.boolean x.collection
#...........................................................................................................
@defaults.Type_cfg_constructor_cfg =
  name:             null
  test:             null
  ### `default` omitted on purpose ###
  create:           null
  # copy:             false
  # seal:             false
  freeze:           false
  extras:           true
  collection:       false

#-----------------------------------------------------------------------------------------------------------
@types.declare 'Type_factory_type_dsc', tests:
  #.........................................................................................................
  ### for later / under consideration ###
  # "@isa.deep_boolean x.copy":                       ( x ) -> @isa.boolean x.copy        # refers to result of `type.create()`
  # "@isa.boolean x.seal":                            ( x ) -> @isa.boolean x.seal        # refers to result of `type.create()`
  # "@isa.boolean x.oneshot":                         ( x ) -> @isa.boolean x.oneshot        # refers to result of `type.create()`
  # "@isa.deep_boolean x.freeze":                     ( x ) -> @isa.deep_boolean x.freeze   # refers to result of `type.create()`
  #.........................................................................................................
  # "@isa.boolean x.extras":                          ( x ) -> @isa.boolean x.extras        # refers to result of `type.create()`
  # "if extras is false, default must be an object":  ( x ) -> ( x.extras ) or ( @isa.object x.default )
  # "@isa_optional.function x.create":                ( x ) -> @isa_optional.function x.create
  #.........................................................................................................
  "@isa.object x":                                  ( x ) -> @isa.object x
  "@isa.nonempty_text x.name":                      ( x ) -> @isa.nonempty_text x.name
  "@isa.boolean x.collection":                      ( x ) -> @isa.boolean x.collection
  ### TAINT might want to check for existence of `$`-prefixed keys in case of `( not x.test? )` ###
  ### TAINT should validate values of `$`-prefixed keys are either function or non-empty strings ###
  "( @isa.function x.isa ) or ( @isa.nonempty_text x.isa )": \
    ( x ) -> ( @isa.function x.isa ) or ( @isa.nonempty_text x.isa )
  "@isa optional list.of.function x.fields":        ( x ) ->
    return true unless @isa.list x.fields
    return @isa_list_of.function x.fields
#...........................................................................................................
@defaults.Type_factory_type_dsc =
  name:             null
  isa:              null
  fields:           null
  collection:       false
  ### `default` omitted on purpose ###
  create:           null      # refers to result of `type.create()`
  # copy:             false     # refers to result of `type.create()`
  # seal:             false     # refers to result of `type.create()`
  freeze:           false     # refers to result of `type.create()`
  extras:           true      # refers to result of `type.create()`

#-----------------------------------------------------------------------------------------------------------
@types.declare 'Intertype_iterable', ( x ) -> x? and x[ Symbol.iterator ]?

#-----------------------------------------------------------------------------------------------------------
@types.declare 'Intertype_constructor_cfg', tests:
  "@isa.object x":                            ( x ) -> @isa.object x
  "@isa_optional.nonempty_text x.sep":        ( x ) -> @isa_optional.nonempty_text x.sep
#...........................................................................................................
@defaults.Intertype_constructor_cfg =
  sep:              '.'

# #-----------------------------------------------------------------------------------------------------------
# @types.declare 'Intertype_walk_hedgepaths_cfg', tests:
#   "@isa.object x":                      ( x ) -> @isa.object x
#   "@isa_optional.nonempty_text x.sep":  ( x ) -> @isa_optional.nonempty_text x.sep
#   "@isa_optional.function x.evaluate":  ( x ) -> @isa_optional.function x.evaluate
#   ### TAINT omitted other settings for `GUY.props.tree()` ###
# #...........................................................................................................
# @defaults.Intertype_walk_hedgepaths_cfg =
#   sep:      @defaults.Intertype_constructor_cfg.sep
#   evaluate: ({ owner, key, value, }) ->
#     return 'take' if ( types.type_of value ) is 'function'
#     return 'take' unless GUY.props.has_any_keys value
#     return 'descend'


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Intertype_abc extends GUY.props.Strict_owner


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@defaults       = GUY.lft.freeze @defaults
@Intertype_abc  = Intertype_abc



