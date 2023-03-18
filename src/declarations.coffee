

#-----------------------------------------------------------------------------------------------------------
@_provisional_declare_basic_types = ( hub ) ->
  { declare } = hub

  #---------------------------------------------------------------------------------------------------------
  # Bottom Types
  #.........................................................................................................
  declare.null
    isa:        ( x ) -> x is null
    default:    null
  #.........................................................................................................
  declare.undefined
    isa:        ( x ) -> x is undefined
    default:    undefined
  #.........................................................................................................
  declare.bottom
    isa:        ( x ) -> ( x is undefined ) or ( x is null )
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
    isa:        ( x ) -> ( typeof x ) is 'string'
    default:    ''
  #.........................................................................................................
  declare.codepoint
    isa:        ( x ) -> ( ( typeof x ) is 'string' ) and /^.$/u.test x
    default:    '\x00'
  #.........................................................................................................
  declare.codepointid
    isa:        ( x ) -> @isa.integer x and ( 0x00000 <= x <= 0x1ffff )
    default:    '\x00'
  #.........................................................................................................
  declare.regex
    isa:        ( x ) -> ( Object::toString.call x ) is '[object RegExp]'
    default:    new RegExp ''
  #.........................................................................................................
  declare.jsidentifier ( x ) ->
    ### thx to https://github.com/mathiasbynens/mothereff.in/blob/master/js-variables/eff.js and
    https://mathiasbynens.be/notes/javascript-identifiers-es6 ###
    return false unless @isa.text x
    return ( x.match \
      /// ^ (?: [ $_ ] | \p{ID_Start} ) (?: [ $ _ \u{200c} \u{200d} ] | \p{ID_Continue} )* $ ///u )?

  #---------------------------------------------------------------------------------------------------------
  # Container Types
  #.........................................................................................................
  declare.list
    collection: true
    isa:        ( x ) -> Array.isArray x
    default:    []
  #.........................................................................................................
  declare.set
    collection: true
    isa:        ( x ) -> x instanceof Set
    create:     ( cfg = [] ) -> new Set cfg
  #.........................................................................................................
  declare.sized
    collection: true
    isa:        ( x ) -> ( @size_of x, @_signals.nothing ) isnt @_signals.nothing
    default:    []
  #.........................................................................................................
  declare.iterable
    isa:        ( x ) -> x? and x[ Symbol.iterator ]?
    default:    []
  #.........................................................................................................
  declare.container
    isa:        ( x ) -> ( typeof x ) isnt 'string' and ( @iterable x ) and ( @sized x )
    default:    []

  #---------------------------------------------------------------------------------------------------------
  # Numeric Types
  #.........................................................................................................
  declare.numeric
    isa:        ( x ) -> ( Number.isFinite x ) or ( typeof x is 'bigint' )
    default:    0
  #.........................................................................................................
  declare.float
    isa:      ( x ) -> Number.isFinite x
    default:  0
  #.........................................................................................................
  declare.bigint
    isa:        ( x ) -> typeof x is 'bigint'
    default:    0n
  #.........................................................................................................
  declare.integer
    isa:        ( x ) -> Number.isInteger x
    default:    0
  #.........................................................................................................
  declare.cardinal
    isa:        ( x ) -> ( Number.isInteger x ) and ( x >= 0 )
    default:    0
  #.........................................................................................................
  declare.zero
    isa:        ( x ) -> x is 0 ### NOTE true for -0 as well ###
    default:    0
  #.........................................................................................................
  declare.nan
    isa:        ( x ) -> Number.isNaN x
    default:    NaN
  #.........................................................................................................
  declare.negatable # numeric? numeral?
    isa:        ( x ) -> ( typeof x ) is ( typeof -x )
    default:    0
  #.........................................................................................................
  declare.even default: 0, isa:  ( x ) ->
    if ( Number.isInteger x )     then return ( x % 2  ) is   0
    else if typeof x is 'bigint'  then return ( x % 2n ) is   0n
    return false
  #.........................................................................................................
  declare.odd  default: 1, isa:  ( x ) ->
    if ( Number.isInteger x )     then return ( x % 2  ) isnt 0
    else if typeof x is 'bigint'  then return ( x % 2n ) isnt 0n
    return false

  #---------------------------------------------------------------------------------------------------------
  # Other Types
  #.........................................................................................................
  declare.boolean
    isa:        ( x ) -> ( x is true ) or ( x is false )
    default:    false
  #.........................................................................................................
  declare.object
    isa:        ( x ) -> x? and ( typeof x is 'object' ) and ( ( Object::toString.call x ) is '[object Object]' )
    default:    {}
  #.........................................................................................................
  declare.function
    isa:        ( x ) -> ( Object::toString.call x ) is '[object Function]'
    default:    ->
  #.........................................................................................................
  declare.class
    isa:        ( x ) -> ( ( Object::toString.call x ) is '[object Function]' ) and \
      ( Object.getOwnPropertyDescriptor x, 'prototype' )?.writable is false
    # default:    ->
  #.........................................................................................................
  declare.asyncfunction
    isa:        ( x ) -> ( Object::toString.call x ) is '[object AsyncFunction]'
    default:    ->
  #.........................................................................................................
  declare.symbol
    isa:        ( x ) -> ( typeof x ) is 'symbol'
    default:    Symbol ''
    create:     ( x ) -> Symbol x

  #.........................................................................................................
  return null






