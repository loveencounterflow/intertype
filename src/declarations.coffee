

#-----------------------------------------------------------------------------------------------------------
@_provisional_declare_basic_types = ( hub ) ->
  { declare } = hub

  #---------------------------------------------------------------------------------------------------------
  # Bottom Types
  #.........................................................................................................
  declare.null
    test:       ( x ) -> x is null
    default:    null
  #.........................................................................................................
  declare.undefined
    test:       ( x ) -> x is undefined
    default:    undefined
  #.........................................................................................................
  declare.bottom
    test:       ( x ) -> ( x is undefined ) or ( x is null )
    default:    undefined


  #---------------------------------------------------------------------------------------------------------
  # Existential Types
  #.........................................................................................................
  declare.anything  ( x ) -> true
  declare.something ( x ) -> x?
  declare.nothing   ( x ) -> not x?

  #---------------------------------------------------------------------------------------------------------
  # Textual Types
  #.........................................................................................................
  declare.text
    collection: true
    test:       ( x ) -> ( typeof x ) is 'string'
    default:    ''
  #.........................................................................................................
  declare.codepoint
    test:       ( x ) -> ( ( typeof x ) is 'string' ) and /^.$/u.test x
    default:    '\x00'
  #.........................................................................................................
  declare.codepointid
    test:       ( x ) -> @isa.integer x and ( 0x00000 <= x <= 0x1ffff )
    default:    '\x00'

  #---------------------------------------------------------------------------------------------------------
  # Container Types
  #.........................................................................................................
  declare.list
    collection: true
    test:       ( x ) -> Array.isArray x
    default:    []
  #.........................................................................................................
  declare.set
    collection: true
    test:       ( x ) -> x instanceof Set
    create:     ( cfg = [] ) -> new Set cfg
  #.........................................................................................................
  ### NOTE we use `GUY.props.get() for `sized` but direct property access for `iterable` b/c
  `GUY.props.Strict_owner` special-cases access to `Symbol.iterator` (allowing it although not set) ###
  declare.sized
    collection: true
    test:       ( x ) -> ( @size_of x, @_signals.nothing ) isnt @_signals.nothing
    default:    []
  #.........................................................................................................
  declare.iterable
    test:       ( x ) -> x? and x[ Symbol.iterator ]?
    default:    []
  #.........................................................................................................
  declare.container
    test:       ( x ) -> ( typeof x ) isnt 'string' and ( @iterable x ) and ( @sized x )
    default:    []

  #---------------------------------------------------------------------------------------------------------
  # Numeric Types
  #.........................................................................................................
  declare.numeric
    test:       ( x ) -> ( Number.isFinite x ) or ( typeof x is 'bigint' )
    default:    0
  #.........................................................................................................
  declare.float
    test:     ( x ) -> Number.isFinite x
    default:  0
  #.........................................................................................................
  declare.bigint
    test:       ( x ) -> typeof x is 'bigint'
    default:    0n
  #.........................................................................................................
  declare.integer
    test:       ( x ) -> Number.isInteger x
    default:    0
  #.........................................................................................................
  declare.negatable # numeric? numeral?
    test:       ( x ) -> ( typeof x ) is ( typeof -x )
    default:    0
  #.........................................................................................................
  declare.even default: 0, test: ( x ) ->
    if ( Number.isInteger x )     then return ( x % 2  ) is   0
    else if typeof x is 'bigint'  then return ( x % 2n ) is   0n
    return false
  #.........................................................................................................
  declare.odd  default: 1, test: ( x ) ->
    if ( Number.isInteger x )     then return ( x % 2  ) isnt 0
    else if typeof x is 'bigint'  then return ( x % 2n ) isnt 0n
    return false

  #---------------------------------------------------------------------------------------------------------
  # Other Types
  #.........................................................................................................
  declare.boolean
    test:       ( x ) -> ( x is true ) or ( x is false )
    default:    false
  #.........................................................................................................
  declare.object
    test:       ( x ) -> x? and ( typeof x ) is 'object'
    default:    {}

  #.........................................................................................................
  return null






