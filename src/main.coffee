
'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ alert
  debug
  help
  info
  plain
  praise
  urge
  warn
  whisper }               = GUY.trm.get_loggers 'demo-execa'
{ rpr
  inspect
  echo
  reverse
  bold
  log     }               = GUY.trm
{ hide }                  = GUY.props
{ props: {
    nameit } }            = require '../../../apps/webguy'


############################################################################################################
require_intertype = ->

  #===========================================================================================================
  $isa =
    text:     ( x ) -> typeof x is 'string'
    function: ( x ) -> ( Object::toString.call x ) is '[object Function]'

  #-----------------------------------------------------------------------------------------------------------
  $type_of = ( x ) ->
    return 'null'         if x is null
    return 'undefined'    if x is undefined
    return 'infinity'     if x is +Infinity
    return 'infinity'     if x is -Infinity
    return 'boolean'      if x is true
    return 'boolean'      if x is false
    return 'text'         if $isa.text      x
    return 'function'     if $isa.function  x
    return 'something'

  #===========================================================================================================
  class Types

    #---------------------------------------------------------------------------------------------------------
    constructor: ( cfg ) ->
      hide @, 'isa',        @isa.bind       @
      hide @, 'validate',   @validate.bind  @
      hide @, 'create',     @create.bind    @
      hide @, 'type_of',    @type_of.bind   @
      hide @, 'memo',       new Map()
      hide @, '_recording', false
      hide @, '_journal',   null
      hide @, '_stack',     null
      return undefined

    #---------------------------------------------------------------------------------------------------------
    isa: ( type, x ) ->
      ### TAINT use proper validation ###
      unless type instanceof Type
        throw new Error "Ω___2 expected an instance of `Type`, got a #{$type_of R}"
      #.......................................................................................................
      if @_recording
        @_stack.push type.$typename
        @_journal.push entry = {}
      #.......................................................................................................
      unless ( R = type.isa.call type, x, @ ) in [ true, false, ]
        throw new Error "Ω___3 expected `true` or `false`, got a #{$type_of R}"
      #.......................................................................................................
      if @_recording
        stack = @_stack.join '.'
        @_stack.pop()
        Object.assign entry, { type: type.$typename, stack, value: x, verdict: R, }
      #.......................................................................................................
      return R

    #---------------------------------------------------------------------------------------------------------
    type_of: ( x ) -> 'something'

    #---------------------------------------------------------------------------------------------------------
    validate: ( type, x ) ->
      return x if @isa type, x
      throw new Error "Ω___4 expected a #{type.$typename}, got a #{$type_of x}"

    #---------------------------------------------------------------------------------------------------------
    create: ( type, P... ) ->
      throw new Error "Ω___5 not yet implemented"

    #---------------------------------------------------------------------------------------------------------
    evaluate: ( type, x ) ->
      @_recording = true
      @_journal   = []
      @_stack     = []
      #.......................................................................................................
      @isa type, x
      #.......................................................................................................
      R           = @_journal
      @_recording = false
      @_journal   = null
      @_stack     = null
      return R

  #===========================================================================================================
  class Type

    #---------------------------------------------------------------------------------------------------------
    constructor: ( typespace, typename, declaration ) ->
      @$typename = typename # hide @, '$typename',  typename
      hide @, '$typespace', typespace
      @_compile_fields typespace, typename, declaration if declaration.fields?
      #.......................................................................................................
      switch true
        #.....................................................................................................
        when $isa.text declaration
          declaration = do ( typeref = declaration ) => { isa: ( ( x, t ) -> t.isa @$typespace[ typeref ], x ), }
        #.....................................................................................................
        when $isa.function declaration
          declaration = { isa: declaration, }
        #.....................................................................................................
        when declaration instanceof Type    then null
        when declaration instanceof Object  then null
        #.....................................................................................................
        else
          throw new Error "Ω___6 expected a typename, a function or a type as declaration, got a #{$type_of declaration}"
      #.......................................................................................................
      ### TAINT this is defective w/out proper validation ###
      for key, value of declaration
        nameit typename, value if key is 'isa' # check that value is function?
        hide @, key, value
      return undefined

    #---------------------------------------------------------------------------------------------------------
    _compile_fields: ( typespace, typename, declaration ) ->
      #.......................................................................................................
      ### TAINT try to move this check to validation step ###
      if declaration.isa?
        throw new Error "Ω___7 must have exactly one of `isa` or `fields`, not both"
      for field_name, field_declaration of declaration.fields
        declaration.fields[ field_name ] = new Type typespace, field_name, field_declaration
      #.......................................................................................................
      declaration.isa = @_get_default_isa_for_fields typespace, typename, declaration
      return null

    #---------------------------------------------------------------------------------------------------------
    _get_default_isa_for_fields: ( typespace, typename, declaration ) -> ( x, t ) ->
      for field_name, field of @fields
        return false unless x? and t.isa field, x[ field_name ]
      return true

  #===========================================================================================================
  class Typespace

    #---------------------------------------------------------------------------------------------------------
    constructor: ( typespace_cfg ) ->
      for typename, declaration of typespace_cfg
        declaration   = new Type @, typename, declaration unless declaration instanceof Type
        @[ typename ] = declaration
      return undefined


  #===========================================================================================================
  std = new Typespace
    #.........................................................................................................
    integer:
      isa:    ( x, t ) -> Number.isInteger x
      foo:    4
    odd:
      isa:    ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( x %% 2 isnt 0 )
    # short form just assigns either a test method or a type name:
    even:           ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( x %% 2 is 0 )
    float:          ( x, t ) -> Number.isFinite x
    bigint:         ( x, t ) -> typeof x is 'bigint'
    text:           ( x, t ) -> typeof x is 'string'
    nonempty_text:  ( x, t ) -> ( t.isa @$typespace.text, x ) and ( x.length > 0 )
    #.........................................................................................................
    # numerical:      ( x, t ) -> ( t.isa @$typespace.float, x   ) or ( t.isa @$typespace.bigint, x )
    # positive0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +0  )
    # positive1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x >= +1  )
    # negative0:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <=  0  )
    # negative1:      ( x, t ) -> ( t.isa @$typespace.float, x   ) and ( x <= -1  )
    # cardinal:       ( x, t ) -> ( t.isa @$typespace.integer, x ) and ( t.isa @$typespace.positive0, x )
    #.........................................................................................................
    # cardinalbigint: ( x, t ) -> ( t.isa @$typespace.bigint, x    ) and ( x >= +0 )
    #.........................................................................................................
    # circle1:  'circle2'
    # circle2:  'circle3'
    # circle3:  'circle1'
    #.........................................................................................................
    weird:    'strange' # declares another name for `odd`
    strange:  'odd'     # declares another name for `odd`
    abnormal: 'weird'   # declares another name for `odd`
    #.........................................................................................................
    quantity:
      fields:
        # each field becomes a `Type` instance; strings may refer to names in the same typespace
        q:    'float'
        u:    'nonempty_text'
      template:
        q:    0
        u:    'u'
    #.........................................................................................................
    address:
      fields:
        postcode:   'nonempty_text'
        city:       'nonempty_text'
    #.........................................................................................................
    employee:
      fields:
        address:    'address'
        name:
          fields:
            firstname:  'nonempty_text'
            lastname:   'nonempty_text'


  #===========================================================================================================
  flatly_1 = new Typespace
    evenly:       'flat'
    flat:         ( x, t ) -> t.isa std.even, x
    plain:        'evenly'
    # foo:          'bar'

  #-----------------------------------------------------------------------------------------------------------
  flatly_2 = new Typespace
    evenly:       'flat'
    flat:         std.even
    plain:        'evenly'



  #%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  return { Types, Type, Typespace, \
    std, \
    flatly_1, flatly_2, \
    types: ( new Types() ), }


#===========================================================================================================
if module is require.main then await do =>
  { types
    flatly_1
    flatly_2
    std             } = require_intertype()
  info 'Ω___8', std
  info 'Ω___9', flatly_1
  info 'Ω__10', flatly_2
  info 'Ω__11', flatly_1.flat
  info 'Ω__12', flatly_2.flat
  info 'Ω__13', std.text.nonempty
  info 'Ω__14', 'std.quantity:              ', rpr std.quantity
  info 'Ω__15', 'std.quantity.isa:          ', rpr std.quantity.isa
  info 'Ω__16', 'std.quantity.fields:       ', rpr std.quantity.fields
  info 'Ω__17', 'std.quantity.fields.q:     ', rpr std.quantity.fields.q
  info 'Ω__18', 'std.quantity.fields.q.isa: ', rpr std.quantity.fields.q.isa
  #.........................................................................................................
  echo()
  help 'Ω__19', GUY.trm.truth     types.isa       std.integer,              5
  help 'Ω__20', GUY.trm.truth     types.isa       std.odd,                  5
  help 'Ω__21', GUY.trm.truth     types.isa       std.even,                 6
  help 'Ω__22', GUY.trm.truth     types.isa       std.strange,              5
  help 'Ω__23', GUY.trm.truth     types.isa       std.weird,                5
  help 'Ω__24', GUY.trm.truth     types.isa       std.abnormal,             5
  help 'Ω__25', GUY.trm.truth     types.isa       flatly_1.flat,            8
  help 'Ω__26', GUY.trm.truth     types.isa       flatly_1.evenly,          8
  help 'Ω__27', GUY.trm.truth     types.isa       flatly_1.plain,           8
  help 'Ω__28', GUY.trm.truth     types.isa       flatly_2.flat,            8
  help 'Ω__29', GUY.trm.truth     types.isa       flatly_2.evenly,          8
  help 'Ω__30', GUY.trm.truth     types.isa       flatly_2.plain,           8
  help 'Ω__31', GUY.trm.truth     types.isa       std.nonempty_text,        'abc'
  help 'Ω__32', GUY.trm.truth     types.isa       std.quantity.fields.q,    123.456
  help 'Ω__33', GUY.trm.truth     types.isa       std.quantity.fields.u,    'm'
  help 'Ω__34', GUY.trm.truth     types.isa       std.quantity,             { q: 123.456, u: 'm', }
  #.........................................................................................................
  echo()
  help 'Ω__35', GUY.trm.truth     types.isa       std.integer,              5.3
  help 'Ω__36', GUY.trm.truth     types.isa       std.odd,                  6
  help 'Ω__37', GUY.trm.truth     types.isa       std.odd,                  5.3
  help 'Ω__38', GUY.trm.truth     types.isa       std.even,                 5
  help 'Ω__39', GUY.trm.truth     types.isa       std.strange,              6
  help 'Ω__40', GUY.trm.truth     types.isa       std.weird,                6
  help 'Ω__41', GUY.trm.truth     types.isa       std.abnormal,             6
  help 'Ω__42', GUY.trm.truth     types.isa       flatly_1.evenly,          5
  help 'Ω__43', GUY.trm.truth     types.isa       flatly_1.flat,            5
  help 'Ω__44', GUY.trm.truth     types.isa       flatly_1.plain,           5
  help 'Ω__45', GUY.trm.truth     types.isa       flatly_2.flat,            5
  help 'Ω__46', GUY.trm.truth     types.isa       flatly_2.evenly,          5
  help 'Ω__47', GUY.trm.truth     types.isa       flatly_2.plain,           5
  help 'Ω__48', GUY.trm.truth     types.isa       std.nonempty_text,        ''
  help 'Ω__49', GUY.trm.truth     types.isa       std.quantity.fields.q,    '123.456'
  help 'Ω__50', GUY.trm.truth     types.isa       std.quantity.fields.u,    ''
  help 'Ω__51', GUY.trm.truth     types.isa       std.quantity,             { q: 123.456, u: '', }
  help 'Ω__52', GUY.trm.truth     types.isa       std.quantity,             { q: null, u: 'm', }
  #.........................................................................................................
  echo()
  probes_and_matchers = [
    [ [ std.integer,      5                         ], null, ]
    [ [ std.integer,      5.3                       ], null, ]
    [ [ std.even,         5                         ], null, ]
    [ [ flatly_1.evenly,  5                         ], null, ]
    [ [ flatly_1.evenly,  6                         ], null, ]
    [ [ flatly_2.evenly,  5                         ], null, ]
    [ [ flatly_2.evenly,  6                         ], null, ]
    [ [ std.quantity,     { q: 123.456, u: '', }    ], null, ]
    [ [ std.quantity,     { q: 123.456, u: null, }  ], null, ]
    [ [ std.quantity,     { q: 'nan', u: 'm', }     ], null, ]
    [ [ std.employee,     { address: { postcode: 'SE36', city: 'London', }, name: null, }     ], null, ]
    [ [ std.employee,     { address: { postcode: 'SE36', city: 'London', }, name: {}, }     ], null, ]
    [ [ std.employee,     { address: { postcode: 'SE36', city: 'London', }, name: { firstname: 'Bob', }, }     ], null, ]
    ]
  for [ [ type, value, ], matcher, ] in probes_and_matchers
    info 'Ω__53', type.$typename, rpr value
    records = types.evaluate type, value
    for record in records
      urge '', 'Ω__54', ( record.stack.padEnd 55 ), ( ( rpr record.value ).padEnd 35 ), GUY.trm.truth record.verdict
  #.........................................................................................................
  echo()
  # help 'Ω__55', GUY.trm.truth     types.isa       std.cardinal, 6
  # help 'Ω__56', GUY.trm.truth     types.isa       std.cardinal, 0
  # help 'Ω__57', GUY.trm.truth     types.isa       std.cardinal, -1
  # #.........................................................................................................
  help 'Ω__58', try               types.validate  std.integer,  5       catch e then warn 'Ω__59', e.message
  help 'Ω__60', try               types.validate  std.integer,  5.3     catch e then warn 'Ω__61', e.message
  # info 'Ω__62', std.weird
  # info 'Ω__63', std.weird.isa
  # info 'Ω__64', std.weird.isa.toString()



