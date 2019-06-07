
#...........................................................................................................
{ assign
  jr
  flatten
  xrpr
  js_type_of }            = require './helpers'


#===========================================================================================================
# TYPE DECLARATIONS
#-----------------------------------------------------------------------------------------------------------
@declare_types = ->
  ### NOTE to be called as `( require './declarations' ).declare_types.apply instance` ###
  @declare 'null',                ( x ) => x is null
  @declare 'undefined',           ( x ) => x is undefined
  #.........................................................................................................
  @declare 'boolean',
    tests:
      "x is true or false":       ( x ) => ( x is true ) or ( x is false )
    casts:
      number:                     ( x ) => if x then 1 else 0
  #.........................................................................................................
  @declare 'nan',                 ( x ) => Number.isNaN         x
  @declare 'finite',              ( x ) => Number.isFinite      x
  @declare 'integer',             ( x ) => Number.isInteger     x
  @declare 'safeinteger',         ( x ) => Number.isSafeInteger x
  #.........................................................................................................
  @declare 'number',
    tests:                        ( x ) => Number.isFinite      x
    casts:
      boolean:                    ( x ) => if x is 0 then false else true
      integer:                    ( x ) => Math.round x
  #.........................................................................................................
  @declare 'frozen',              ( x ) => Object.isFrozen      x
  @declare 'sealed',              ( x ) => Object.isSealed      x
  @declare 'extensible',          ( x ) => Object.isExtensible  x
  #.........................................................................................................
  @declare 'numeric',             ( x ) => ( js_type_of x ) is 'number'
  @declare 'function',            ( x ) => ( js_type_of x ) is 'function'
  @declare 'asyncfunction',       ( x ) => ( js_type_of x ) is 'asyncfunction'
  @declare 'generatorfunction',   ( x ) => ( js_type_of x ) is 'generatorfunction'
  @declare 'generator',           ( x ) => ( js_type_of x ) is 'generator'
  @declare 'date',                ( x ) => ( js_type_of x ) is 'date'
  @declare 'callable',            ( x ) => ( @type_of x ) in [ 'function', 'asyncfunction', 'generatorfunction', ]
  #.........................................................................................................
  @declare 'truthy',              ( x ) => not not x
  @declare 'falsy',               ( x ) => not x
  @declare 'true',                ( x ) => x is true
  @declare 'false',               ( x ) => x is false
  @declare 'unset',               ( x ) => not x?
  @declare 'notunset',            ( x ) => x?
  #.........................................................................................................
  @declare 'even',                ( x ) => @isa.multiple_of x, 2
  @declare 'odd',                 ( x ) => not @isa.even x
  @declare 'count',               ( x ) -> ( @isa.safeinteger x ) and ( @isa.nonnegative x )
  @declare 'nonnegative',         ( x ) => ( @isa.number x ) and ( x >= 0 )
  @declare 'positive',            ( x ) => ( @isa.number x ) and ( x > 0 )
  @declare 'positive_integer',    ( x ) => ( @isa.integer x ) and ( x > 0 )
  @declare 'negative_integer',    ( x ) => ( @isa.integer x ) and ( x < 0 )
  @declare 'zero',                ( x ) => x is 0
  @declare 'infinity',            ( x ) => ( x is +Infinity ) or ( x is -Infinity )
  @declare 'nonpositive',         ( x ) => ( @isa.number x ) and ( x <= 0 )
  @declare 'negative',            ( x ) => ( @isa.number x ) and ( x < 0 )
  @declare 'multiple_of',         ( x, n ) => ( @isa.number x ) and ( x %% n ) is 0
  #.........................................................................................................
  @declare 'empty',               ( x ) -> ( @has_size    x ) and ( @size_of x ) == 0
  @declare 'singular',            ( x ) -> ( @has_size    x ) and ( @size_of x ) == 1
  @declare 'nonempty',            ( x ) -> ( @has_size    x ) and ( @size_of x ) > 0
  @declare 'plural',              ( x ) -> ( @has_size    x ) and ( @size_of x ) > 1
  @declare 'blank_text',          ( x ) -> ( @isa.text    x ) and     ( x.match /// ^ \s* $ ///us )?
  @declare 'nonblank_text',       ( x ) -> ( @isa.text    x ) and not ( x.match /// ^ \s* $ ///us )?
  @declare 'chr',                 ( x ) -> ( @isa.text    x ) and     ( x.match /// ^  .  $ ///us )?
  @declare 'nonempty_text',       ( x ) -> ( @isa.text    x ) and ( @isa.nonempty x )
  @declare 'nonempty_list',       ( x ) -> ( @isa.list    x ) and ( @isa.nonempty x )
  @declare 'nonempty_object',     ( x ) -> ( @isa.object  x ) and ( @isa.nonempty x )
  @declare 'nonempty_set',        ( x ) -> ( @isa.set     x ) and ( @isa.nonempty x )
  @declare 'nonempty_map',        ( x ) -> ( @isa.map     x ) and ( @isa.nonempty x )
  @declare 'empty_text',          ( x ) -> ( @isa.text    x ) and ( @isa.empty x )
  @declare 'empty_list',          ( x ) -> ( @isa.list    x ) and ( @isa.empty x )
  @declare 'empty_object',        ( x ) -> ( @isa.object  x ) and ( @isa.empty x )
  @declare 'empty_set',           ( x ) -> ( @isa.set     x ) and ( @isa.empty x )
  @declare 'empty_map',           ( x ) -> ( @isa.map     x ) and ( @isa.empty x )
  #.........................................................................................................
  @declare 'buffer',              { size: 'length', },  ( x ) => Buffer.isBuffer x
  @declare 'arraybuffer',         { size: 'length', },  ( x ) => ( js_type_of x ) is 'arraybuffer'
  @declare 'int8array',           { size: 'length', },  ( x ) => ( js_type_of x ) is 'int8array'
  @declare 'uint8array',          { size: 'length', },  ( x ) => ( js_type_of x ) is 'uint8array'
  @declare 'uint8clampedarray',   { size: 'length', },  ( x ) => ( js_type_of x ) is 'uint8clampedarray'
  @declare 'int16array',          { size: 'length', },  ( x ) => ( js_type_of x ) is 'int16array'
  @declare 'uint16array',         { size: 'length', },  ( x ) => ( js_type_of x ) is 'uint16array'
  @declare 'int32array',          { size: 'length', },  ( x ) => ( js_type_of x ) is 'int32array'
  @declare 'uint32array',         { size: 'length', },  ( x ) => ( js_type_of x ) is 'uint32array'
  @declare 'float32array',        { size: 'length', },  ( x ) => ( js_type_of x ) is 'float32array'
  @declare 'float64array',        { size: 'length', },  ( x ) => ( js_type_of x ) is 'float64array'
  @declare 'list',                { size: 'length', },  ( x ) => ( js_type_of x ) is 'array'
  @declare 'set',                 { size: 'size',   },  ( x ) -> ( js_type_of x ) is 'set'
  @declare 'map',                 { size: 'size',   },  ( x ) -> ( js_type_of x ) is 'map'
  @declare 'weakmap',                                   ( x ) -> ( js_type_of x ) is 'weakmap'
  @declare 'weakset',                                   ( x ) -> ( js_type_of x ) is 'weakset'
  @declare 'error',                                     ( x ) -> ( js_type_of x ) is 'error'
  @declare 'regex',                                     ( x ) -> ( js_type_of x ) is 'regexp'
  #.........................................................................................................
  @declare 'object',
    tests:  ( x     ) => ( js_type_of x ) is 'object'
    size:   ( xP... ) => ( @keys_of     xP... ).length
  #.........................................................................................................
  @declare 'global',
    tests:  ( x     ) => ( js_type_of x ) is 'global'
    size:   ( xP... ) => ( @all_keys_of xP... ).length
  #.........................................................................................................
  @declare 'text',
    tests:  ( x ) => ( js_type_of x ) is 'string'
    size:   ( x, selector = 'codeunits' ) ->
      switch selector
        when 'codepoints' then return ( Array.from x ).length
        when 'codeunits'  then return x.length
        when 'bytes'      then return Buffer.byteLength x, ( settings?[ 'encoding' ] ? 'utf-8' )
        else throw new Error "unknown counting selector #{rpr selector}"

  #.........................................................................................................
  @declare 'int2text',
    tests: ( x ) => ( @isa.text x ) and ( x.match /^[01]+$/ )?
    casts:
      number: ( x ) => parseInt x, 2
  #.........................................................................................................
  @declare 'int10text',
    tests: ( x ) => ( @isa.text x ) and ( x.match /^[0-9]+$/ )?
    casts:
      number: ( x ) => parseInt x, 10
  #.........................................................................................................
  @declare 'int16text',
    tests: ( x ) => ( @isa.text x ) and ( x.match /^[0-9a-fA-F]+$/ )?
    casts:
      number:   ( x ) => parseInt x, 16
      int2text: ( x ) => ( parseInt x, 16 ).toString 2 ### TAINT could use `cast()` API ###

  ### not supported until we figure out how to do it in strict mode: ###
  # @declare 'arguments',                     ( x ) -> ( js_type_of x ) is 'arguments'


# Array.isArray
# ArrayBuffer.isView
# Atomics.isLockFree
# Buffer.isBuffer
# Buffer.isEncoding
# constructor.is
# constructor.isExtensible
# constructor.isFrozen
# constructor.isSealed
# Number.isFinite
# Number.isInteger
# Number.isNaN
# Number.isSafeInteger
# Object.is
# Object.isExtensible
# Object.isFrozen
# Object.isSealed
# Reflect.isExtensible
# root.isFinite
# root.isNaN
# Symbol.isConcatSpreadable


