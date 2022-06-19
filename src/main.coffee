
'use strict'


############################################################################################################
# njs_util                  = require 'util'
njs_path                  = require 'path'
# njs_fs                    = require 'fs'
#...........................................................................................................
CND                       = require 'cnd'
rpr                       = CND.rpr.bind CND
badge                     = 'INTERTYPE/main'
log                       = CND.get_logger 'plain',     badge
info                      = CND.get_logger 'info',      badge
whisper                   = CND.get_logger 'whisper',   badge
alert                     = CND.get_logger 'alert',     badge
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
praise                    = CND.get_logger 'praise',    badge
echo                      = CND.echo.bind CND
#...........................................................................................................
GUY                       = require 'guy'
E                         = require './errors'


#===========================================================================================================
class Intertype_abc extends GUY.props.Strict_owner

  # #---------------------------------------------------------------------------------------------------------
  # constructor: ->
  #   super()
  #   return undefined

#===========================================================================================================
class Empty     extends Intertype_abc
class Nonempty  extends Intertype_abc
class List_of   extends Intertype_abc
class Defaults  extends Intertype_abc

#===========================================================================================================
class Isa_list_of extends Intertype_abc

#===========================================================================================================
class Validate_list_of extends Intertype_abc

#===========================================================================================================
class Isa_empty extends Intertype_abc
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate_empty extends Intertype_abc
  list_of:    new Validate_list_of()

#===========================================================================================================
class Isa_nonempty extends Intertype_abc
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate_nonempty extends Intertype_abc
  list_of:    new Validate_list_of()

#===========================================================================================================
class Isa_optional extends Intertype_abc
  empty:      new Isa_empty()
  nonempty:   new Isa_nonempty()
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate_optional extends Intertype_abc
  empty:      new Validate_empty()
  nonempty:   new Validate_nonempty()
  list_of:    new Validate_list_of()


#===========================================================================================================
class Isa extends Intertype_abc
  optional:   new Isa_optional()
  empty:      new Isa_empty()
  nonempty:   new Isa_nonempty()
  list_of:    new Isa_list_of()

#===========================================================================================================
class Validate extends Intertype_abc
  optional:   new Validate_optional()
  empty:      new Validate_empty()
  nonempty:   new Validate_nonempty()
  list_of:    new Validate_list_of()

#===========================================================================================================
class @Intertype extends Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    super()
    # @defaults           = new Defaults()
    # @isa                = new Isa()
    # @validate           = new Validate()
    @_types             = {}
    return undefined

  #---------------------------------------------------------------------------------------------------------
  declare: ( hedges..., type, descriptor ) =>
    ### TAINT code duplication ###
    ### TAINT find better name for `name` ###
    ### TAINT ensure descriptor does not contain type, name ###
    defaults    = { numeric: false, collection: false, }
    descriptor  = { defaults..., descriptor..., }
    hedges.push type
    if hedges[ 0 ] is 'optional'
      throw new E.Intertype_ETEMPTBD '^intertype@1^', "'optional' cannot be a hedge in declarations, got #{rpr hedges}"
    mandatory_name                = ( hedges.join '_' )
    mandatory_test                = descriptor.test.bind @
    optional_name                 = "optional_#{mandatory_name}"
    optional_test                 = ( test = ( x ) -> ( not x? ) or ( mandatory_test x ) ).bind @
    # debug '^4234^', { mandatory_name, mandatory_test, optional_name, optional_test, }
    @_types[ mandatory_name     ] = { descriptor..., name: mandatory_name, type, test: mandatory_test, }
    @_types[ optional_name      ] = { descriptor..., name: optional_name,  type, test: optional_test,  }
    return null

  #---------------------------------------------------------------------------------------------------------
  isa: ( hedges..., type, x ) =>
    ### TAINT code duplication ###
    hedges.push type
    name = ( hedges.join '_' )
    debug '^4563^', name
    # throw new Error '^534-1^' if hedges.length isnt 1
    unless ( test = @_types[ name ]?.test )?
      throw new E.Intertype_ETEMPTBD '^intertype@2^', "no such type #{rpr hedges}"
    return test x

  #---------------------------------------------------------------------------------------------------------
  js_type_of:                 ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
  _normalize_type:            ( type ) -> type.toLowerCase().replace /\s+/g, ''
  _constructor_of_generators: ( ( -> yield 42 )() ).constructor

  #---------------------------------------------------------------------------------------------------------
  type_of: ( x ) ->
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
      return 'generator' if x.constructor is @_constructor_of_generators
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
x = new @Intertype()
# urge x.foo = 42
# urge x.foo
# urge x.has
# urge x.has.foo
# urge x.has.bar
try urge x.bar catch error then warn CND.reverse error.message

js_type_of               = ( x ) => ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase().replace /\s+/g, ''
length_of = ( x ) ->
  throw new Error "^1^" unless x?
  return x.length if Object.hasOwnProperty x, length
  return x.size   if Object.hasOwnProperty x, size
  return ( Object.keys x ).length if ( js_type_of x ) is 'object'
  throw new Error "^2^"
nonempty  = ( x ) -> ( length_of x ) > 0
empty     = ( x ) -> ( length_of x ) == 0
list_of   = ( type, x ) ->
  return false unless ( js_type_of x ) is 'array'
  return true if x.length is 0
  # return x.every ( e ) -> isa type, e
  return x.every ( e ) -> ( js_type_of e ) is type ### TAINT should use `isa` ###

###

types.isa.integer                                           42
types.isa.even.integer                                      -42
types.isa.odd.integer                                       41
types.isa.negative1.integer                                 -42
types.isa.negative0.integer                                 0
types.isa.positive1.integer                                 42
types.isa.positive0.integer                                 0
types.isa.list_of.integer                                   [ 42, ]
types.isa.nonempty.list_of.negative1.integer                [ -42, ]
types.isa.nonempty.list_of.negative0.integer                [ 0, ]
types.isa.nonempty.list_of.positive1.integer                [ 42, ]
types.isa.nonempty.list_of.positive0.integer                [ 0, ]
types.isa.empty.list_of.integer                             []
types.isa.nonempty.list_of.integer                          [ 42, ]
types.isa.optional.integer                                  42
types.isa.optional.list_of.integer                          [ 42, ]
types.isa.optional.empty.list_of.integer                    []
types.isa.optional.nonempty.list_of.integer                 [ 42, ]
types.isa.optional.negative1.integer                        -42
types.isa.optional.negative0.integer                        0
types.isa.optional.positive1.integer                        42
types.isa.optional.positive0.integer                        0
types.isa.optional.nonempty.list_of.negative1.integer       [ -42, ]
types.isa.optional.nonempty.list_of.negative0.integer       [ 0, ]
types.isa.optional.nonempty.list_of.positive1.integer       [ 42, ]
types.isa.optional.nonempty.list_of.positive0.integer       [ 0, ]
types.isa.optional.empty.list_of.negative1.integer          -42
types.isa.optional.empty.list_of.negative0.integer          0
types.isa.optional.empty.list_of.positive1.integer          42
types.isa.optional.empty.list_of.positive0.integer          0

[all]     [all]     [collections]   [collections]   [numerical]   [numerical]   [mandatory]
————————————————————————————————————————————————————————————————————————————————————————————
isa       optional  empty           list_of         even          negative0     <type>
validate            nonempty                        odd           negative1
                                                                  positive0
                                                                  positive1

###



