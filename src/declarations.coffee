

#-----------------------------------------------------------------------------------------------------------
@_provisional_declare_basic_types = ( hub ) ->
  { declare } = hub
  #.........................................................................................................
  declare.null
    test:     ( x ) -> x is null
    default:  null
  #.........................................................................................................
  declare.boolean
    test:     ( x ) -> ( x is true ) or ( x is false )
    default:  false
  #.........................................................................................................
  declare.text
    collection: true
    test:     ( x ) -> ( typeof x ) is 'string'
    default:  ''
  #.........................................................................................................
  declare.codepoint
    test:     ( x ) -> /^.$/u.test x
    default:  '\x00'
  #.........................................................................................................
  declare.codepointid
    test:     ( x ) -> @isa.integer x and ( 0x00000 <= x <= 0x1ffff )
    default:  '\x00'
  #.........................................................................................................
  declare.list
    collection: true
    test:     ( x ) -> Array.isArray x
    default:  ''
  #.........................................................................................................
  declare.set
    collection: true
    test:     ( x ) -> x instanceof Set
    # default:  ''
    create:   ( cfg = [] ) -> new Set cfg
  #.........................................................................................................
  declare.integer
    test:     ( x ) -> Number.isInteger x
    default:  0
  #.........................................................................................................
  declare.negatable # numeric? numeral?
    test:     ( x ) -> ( typeof x ) is ( typeof -x )
    default:  0
  #.........................................................................................................
  declare.sized
    collection: true
    test:     ( x ) -> ( @size_of x, @_signals.nothing ) isnt @_signals.nothing
  #.........................................................................................................
  declare.iterable
    test:     ( x ) -> x? and x[ Symbol.iterator ]?
  #.........................................................................................................
  declare.object
    test:     ( x ) -> x? and ( typeof x ) is 'object'
  #.........................................................................................................
  return null




