

#-----------------------------------------------------------------------------------------------------------
@_provisional_declare_basic_types = ( hub ) ->
  { declare } = hub
  #.........................................................................................................
  declare.null
    # groups:   'bottom'
    test:     ( x ) -> x is null
    default:  null
  #.........................................................................................................
  declare.boolean
    test:     ( x ) -> ( x is true ) or ( x is false )
    default:  false
  #.........................................................................................................
  declare.text
    groups:   'collection'
    test:     ( x ) -> ( typeof x ) is 'string'
    default:  ''
  #.........................................................................................................
  declare.codepoint
    groups:   'other'
    test:     ( x ) -> /^.$/u.test x
    default:  '\x00'
  #.........................................................................................................
  declare.codepointid
    groups:   'other'
    test:     ( x ) -> @isa.integer x and ( 0x00000 <= x <= 0x1ffff )
    default:  '\x00'
  #.........................................................................................................
  declare.list
    groups:   'collection'
    test:     ( x ) -> Array.isArray x
    default:  ''
  #.........................................................................................................
  declare.set
    groups:   'collection'
    test:     ( x ) -> x instanceof Set
    # default:  ''
    create:   ( cfg = [] ) -> new Set cfg
  #.........................................................................................................
  declare.integer
    groups:   'number'
    test:     ( x ) -> Number.isInteger x
    default:  0
  #.........................................................................................................
  declare.iterable
    groups:   'collection'
    test:     ( x ) -> x? and x[ Symbol.iterator ]?
  #.........................................................................................................
  declare.object
    test:     ( x ) -> x? and ( typeof x ) is 'object'
  #.........................................................................................................
  return null




