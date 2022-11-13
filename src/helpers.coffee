

'use strict'

#-----------------------------------------------------------------------------------------------------------
GUY                       = require 'guy'
{ debug
  info
  warn
  urge
  help }                  = GUY.trm.get_loggers 'INTERTYPE'
{ rpr }                   = GUY.trm
misfit                    = Symbol 'misfit'
notavalue                 = Symbol 'notavalue'
E                         = require './errors'
{ to_width
  width_of  }             = require 'to-width'
### TAINT unify with symbols in `hedges` ###
@misfit                   = Symbol 'misfit'
#...........................................................................................................
@constructor_of_generators  = ( ( -> yield 42 )() ).constructor
@nameit                     = ( name, f ) -> Object.defineProperty f, 'name', { value: name, }
idf                         = ( x ) -> x ### IDentity Function ###
@equals                     = GUY.samesame.equals
@deep_copy                  = GUY.samesame.deep_copy


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
@_normalize_type = ( type ) -> type.toLowerCase().replace /\s+/g, ''

#-----------------------------------------------------------------------------------------------------------
@type_of = ( x, overrides = null ) ->
  throw new Error "^7746^ expected 1 or 2 arguments, got #{arity}" unless 0 < ( arity = arguments.length ) < 3
  #.........................................................................................................
  if overrides?
    for [ type, isa, ] in overrides
      return type if isa x
  #.........................................................................................................
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
  "@isa.boolean x.override": ( x ) -> @isa.boolean x.override
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
  override:         false

#-----------------------------------------------------------------------------------------------------------
@types.declare 'Type_factory_type_dsc', tests:
  #.........................................................................................................
  ### for later / under consideration ###
  # "@isa.deep_boolean x.copy":                       ( x ) -> @isa.boolean x.copy        # refers to result of `type.create()`
  # "@isa.boolean x.seal":                            ( x ) -> @isa.boolean x.seal        # refers to result of `type.create()`
  # "@isa.boolean x.oneshot":                         ( x ) -> @isa.boolean x.oneshot        # refers to result of `type.create()`
  # "@isa.deep_boolean x.freeze":                     ( x ) -> @isa.deep_boolean x.freeze   # refers to result of `type.create()`
  #.........................................................................................................
  "@isa.object x":                                  ( x ) -> @isa.object x
  "@isa.nonempty_text x.name":                      ( x ) -> @isa.nonempty_text x.name
  "@isa.nonempty_text x.typename":                  ( x ) -> @isa.nonempty_text x.typename
  "@isa.boolean x.collection":                      ( x ) -> @isa.boolean x.collection
  "@isa.function x.isa":                            ( x ) -> @isa.function x.isa
  "@isa optional list.of.function x.fields":        ( x ) ->
    return true unless @isa.list x.fields
    return @isa_list_of.function x.fields
  "@isa.boolean x.extras":                          ( x ) -> @isa.boolean x.extras        # refers to result of `type.create()`
  "if extras is false, default must be an object":  ( x ) -> ( x.extras ) or ( @isa.object x.default )
  "@isa_optional.function x.create":                ( x ) -> @isa_optional.function x.create
#...........................................................................................................
@defaults.Type_factory_type_dsc =
  name:             null
  typename:         null
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
  "@isa.boolean x.errors":                    ( x ) -> @isa.boolean x.errors
#...........................................................................................................
@defaults.Intertype_constructor_cfg =
  sep:              '.'
  errors:           true

#-----------------------------------------------------------------------------------------------------------
@types.declare 'intertype_color', ( x ) ->
  return true   if      @isa.function       x
  return true   if      @isa.boolean        x
  return false  unless  @isa.nonempty_text  x
  return false  unless  @isa.function       GUY.trm[ x ]
  return true

#-----------------------------------------------------------------------------------------------------------
@types.declare 'intertype_state_report_colors', tests:
  "@isa.object x":                            ( x ) -> @isa.object x
  "@isa.intertype_color x.ref":               ( x ) -> @isa.intertype_color x.ref
  "@isa.intertype_color x.value":             ( x ) -> @isa.intertype_color x.value
  "@isa.intertype_color x.true":              ( x ) -> @isa.intertype_color x.true
  "@isa.intertype_color x.false":             ( x ) -> @isa.intertype_color x.false
  "@isa.intertype_color x.hedge":             ( x ) -> @isa.intertype_color x.hedge
  "@isa.intertype_color x.verb":              ( x ) -> @isa.intertype_color x.verb
  "@isa.intertype_color x.arrow":             ( x ) -> @isa.intertype_color x.arrow
  "@isa.intertype_color x.error":             ( x ) -> @isa.intertype_color x.error
  "@isa.intertype_color x.reverse":           ( x ) -> @isa.intertype_color x.reverse
#...........................................................................................................
@defaults.intertype_state_report_colors = GUY.lft.freeze
  ref:            'grey'
  value:          'lime'
  true:           'green'
  false:          'red'
  hedge:          'blue'
  verb:           'gold'
  arrow:          'white'
  error:          'red'
  reverse:        'reverse'
#...........................................................................................................
@defaults.intertype_state_report_no_colors = GUY.lft.freeze
  ref:            idf
  value:          idf
  true:           idf
  false:          idf
  hedge:          idf
  verb:           idf
  arrow:          idf
  error:          idf
  reverse:        idf

#-----------------------------------------------------------------------------------------------------------
@types.declare 'intertype_get_state_report_cfg', tests:
  "@isa.object x":                              ( x ) -> @isa.object x
  "x.format in [ 'all', 'failing', 'short' ]":  ( x ) -> x.format in [ 'all', 'failing', 'short' ]
  "@isa.boolean x.refs":                        ( x ) -> @isa.boolean x.refs
  "@isa_optional.positive_integer x.width":     ( x ) -> @isa_optional.positive_integer x.width
  "( @isa.boolean x.colors ) or ( @isa.intertype_state_report_colors )": \
    ( x ) -> ( @isa.boolean x.colors ) or ( @isa.intertype_state_report_colors )
#...........................................................................................................
@defaults.intertype_get_state_report_cfg =
  colors:         @defaults.intertype_state_report_colors
  format:         'failing'
  width:          null
  refs:           false

#-----------------------------------------------------------------------------------------------------------
@defaults.Intertype_state =
  method:         null
  verb:           null
  isa_depth:      0
  hedgerow:       null
  hedges:         null
  hedgeresults:   null
  x:              misfit
  result:         null
  error:          null
  extra_keys:     null


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Intertype_abc extends GUY.props.Strict_owner


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
# @defaults       = GUY.lft.freeze @defaults
@Intertype_abc  = Intertype_abc


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@_get_state_report_colors = ( colors ) ->
  return @defaults.intertype_state_report_colors    if colors is true
  return @defaults.intertype_state_report_no_colors if colors is false
  R = {}
  for purpose, color of colors
    continue if @types.isa.function color
    switch color
      when true   then  R[ purpose ] = GUY.trm[ @defaults.intertype_state_report_colors[ color ] ].bind GUY.trm
      when false  then  R[ purpose ] = idf
      else              R[ purpose ] = GUY.trm[ color ].bind GUY.trm
  return R

#-----------------------------------------------------------------------------------------------------------
@get_state_report = ( hub, cfg ) ->
  @types.validate.intertype_get_state_report_cfg ( cfg = { @defaults.intertype_get_state_report_cfg..., cfg..., } )
  C = @_get_state_report_colors cfg.colors
  #.........................................................................................................
  TTY               = require 'node:tty'
  truth             = ( b, r ) -> C.reverse if b then ( C.true " T " ) else ( C.false " F " )
  first_hidx        = 0
  last_hidx         = hub.state.hedgeresults.length - 1
  #.........................................................................................................
  R                 = []
  sep               = ''
  widths            = do ->
    lw                = cfg.width ? if ( TTY.isatty process.stdout.fd ) then process.stdout.columns else 100
    widths            = {}
    widths.line       = lw
    lw               -= widths.ref      = if cfg.refs then 5 else 0
    lw               -= widths.verb     = 10
    lw               -= widths.truth    = 3
    lw               -= widths.hedgerow = Math.floor lw / 3
    lw               -= widths.value    = lw
    return widths
  #.........................................................................................................
  switch cfg.format
    when 'all'
      null
    when 'failing', 'short'
      return null if hub.state.result is true
      first_hidx = last_hidx
      while first_hidx > 0
        break if ( hub.state.hedgeresults[ first_hidx - 1 ].at -1 ) isnt false
        first_hidx--
      first_hidx = Math.min first_hidx, last_hidx
    else throw new E.Intertype_internal_error '^intertype.get_state_report@1^', "unknown format #{rpr format}"
  #.........................................................................................................
  switch cfg.format
    when 'short'
      verb_field        = C.reverse C.verb " #{hub.state.verb} "
      arrow_field       = C.reverse C.arrow " ◀ "
    else
      verb_field        = C.reverse C.verb to_width hub.state.verb, widths.verb, { align: 'center', }
      arrow_field       = null
  #.........................................................................................................
  push_value_row = ( ref, level, hedge, value, r ) ->
    level = Math.max level, 0
    dent  = '  '.repeat level
    R.push C.reverse C.ref    to_width  ( ref ? ''            ), widths.ref if cfg.refs
    R.push truth r, r?.toString()
    R.push verb_field
    R.push C.reverse C.hedge  to_width  ( ' ' + dent + hedge  ), widths.hedgerow
    R.push C.reverse C.value  to_width  ( ' ' + rpr value     ), widths.value
    R.push '\n'
    return null
  #.........................................................................................................
  push_error_row = ( error = null ) ->
    return null unless error?
    if error instanceof Error then  error_r = " Error: #{error.message.trim()}"
    else                            error_r = " Error: #{error.toString()}"
    R.push C.reverse C.error to_width error_r, widths.line
    R.push '\n'
  #.........................................................................................................
  switch cfg.format
    #.......................................................................................................
    when 'all', 'failing'
      for hidx in [ first_hidx .. last_hidx ]
        [ ref, level, hedge, value, r, ] = hub.state.hedgeresults[ hidx ]
        push_value_row ref, level, hedge, value, r
      #.....................................................................................................
      if hub.state.hedgeresults.length > 1
        push_value_row null, 0, hub.state.hedgerow, hub.state.x, hub.state.result
      push_error_row hub.state.error
    #.......................................................................................................
    when 'short'
      for hidx in [ first_hidx .. last_hidx ]
        [ ref, level, hedge, value, r, ] = hub.state.hedgeresults[ hidx ]
        value_r = rpr value
        value_r = to_width value_r, 50 if ( width_of value_r ) > 50
        R.push '' \
          + ( truth r                           ) \
          + ( verb_field                        ) \
          + ( C.reverse C.hedge " #{hedge} "    ) \
          + ( C.reverse C.value " #{value_r} "  )
      sep = arrow_field
    else throw new E.Intertype_internal_error '^intertype.get_state_report@2^', "unknown format #{rpr format}"
  #.........................................................................................................
  R = R.join sep
  if ( cfg.format is 'short' ) and ( cfg.colors is false )
    R = R.trim()
    R = R.replace /\x20{2,}/g, ' '
  return R


