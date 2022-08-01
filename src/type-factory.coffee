
'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  warn
  urge
  help }                  = GUY.trm.get_loggers 'INTERTYPE'
{ rpr }                   = GUY.trm
#...........................................................................................................
E                         = require './errors'
H                         = require './helpers'

###

User-facing constraints on `Type_factory::constructor cfg`

Constraints on `Type_factory::constructor cfg` after normalization:

* exactly one of `type:function`, `types:list.of.function.or.object.of.function` must be given

* if `type` is **not** given:

  * if `types` does not contain a function named `$` (called the 'own-type declaration'), it will be created
    as `$: ( x ) -> @isa.object x`, meaning the type declared implicitly describes an object. This typetest
    will be prepended to any other declarations.

  * The above entails that we may declare a type as
      * `declare.t { tests: [], }` or
      * `declare.t { tests: {}, }`
    to obtain the same effect as
      * `declare.t 'object'` or
      * `declare.t ( x ) -> @isa.object x`

* if `type` **is** given:

###

#===========================================================================================================
class Type_factory extends H.Intertype_abc

  #---------------------------------------------------------------------------------------------------------
  constructor: ( hub ) ->
    super()
    @hub = hub
    return undefined

  #---------------------------------------------------------------------------------------------------------
  create_type: ( cfg ) ->
    ### normalization of `cfg`, i.e. reducing the different allowed shapes to a single one ###
    H.types.validate.Type_cfg_constructor_cfg_NG cfg = { H.defaults.Type_cfg_constructor_cfg_NG..., cfg..., }
    test = ( GUY.props.pluck_with_fallback cfg, null, 'test' ).test
    return @_create_type test, cfg

  #---------------------------------------------------------------------------------------------------------
  _create_type: ( test, cfg ) ->
    if test?  then  cfg.tests = []
    else            test      = @_create_test_walker cfg.name, cfg.tests
    #.......................................................................................................
    R = test.bind @
    ### NOTE `hide()` uses `Object.defineProperty()`, so takes care of `name`: ###
    GUY.props.hide R, k, v for k, v of cfg # when not GUY.props.has R, k
    R = new GUY.props.Strict_owner { target: R, oneshot: true, }
    return R

  #---------------------------------------------------------------------------------------------------------
  _create_test_walker: ( name, tests ) -> H.nameit name, ( x ) =>
    for f in tests
      return false if ( R = f x ) is false
      return R unless R is true
    return true


############################################################################################################
@Type_factory = Type_factory

