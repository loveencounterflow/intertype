
'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ debug
  help
  info }                  = GUY.trm.get_loggers 'demo-execa'
{ rpr }                   = GUY.trm
LIB                       = require './lib'

#===========================================================================================================
std = new LIB.Typespace
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
flatly_1 = new LIB.Typespace
  evenly:       'flat'
  flat:         ( x, t ) -> t.isa std.even, x
  plain:        'evenly'
  # foo:          'bar'

#-----------------------------------------------------------------------------------------------------------
flatly_2 = new LIB.Typespace
  evenly:       'flat'
  flat:         std.even
  plain:        'evenly'


#===========================================================================================================
# if module is require.main then await do =>
module.exports = { std, flatly_1, flatly_2, }
