

## Type Declarations


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [User-Facing Constraints on `Type_factory::constructor cfg`](#user-facing-constraints-on-type_factoryconstructor-cfg)
- [Constraints on `Type_factory::constructor cfg` After Normalization:](#constraints-on-type_factoryconstructor-cfg-after-normalization)
- [Settings `copy`, `freeze`, and `seal`](#settings-copy-freeze-and-seal)
- [`declare`](#declare)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->




### User-Facing Constraints on `Type_factory::constructor cfg`

* at the most basic level, a type may be declared with a single argument, the typename, either as first
  argument or in literal property syntax (dot notation), the latter being the preferred form:

  * `declare.t()` or, equivalently,
  * `declare 't'`.

  When no test is declared, a test for type `object` is assumed, so the above declarations amount to:

  * `declare.t 'object'` or
  * `declare 't', 'object'`.

* The notation `declare.t 'object'` is more explicitly written as

  * `declare.t { test: 'object', }`

  which, in turn, is short for

  * `declare { name: 't', test: 'object', }`.


### Constraints on `Type_factory::constructor cfg` After Normalization:

* exactly one of `type:function` or `types:list.of.function.or.object.of.function` must be given

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

------------------------------------------------------------------------------

```coffee
'use strict'

types       = new ( require '../../../apps/intertype' ).Intertype()
{ isa
  declare } = types
log         = console.log

declare 'xy_quantity', test: [
  ( x ) -> @isa.object          x
  ( x ) -> @isa.float           x.value
  ( x ) -> @isa.nonempty.text   x.unit
  ]

# can use simplified form:

declare.xy_quantity,
  test: [
    ( x ) -> @isa.object          x
    ( x ) -> @isa.float           x.value
    ( x ) -> @isa.nonempty.text   x.unit
    ]


log '^1-1^', isa.xy_quantity null
log '^1-1^', isa.xy_quantity 42
log '^1-1^', isa.xy_quantity { value: 42, unit: 'm', }
```

### Settings `copy`, `freeze`, and `seal`

* settings which affect how the returned by `create` will be treated:
  * `copy` and `seal` are under consideration
  * `freeze`:
    * `false` (default): returned object will be non-frozen, non-sealed (like most objects have always been
      in JS)
    * `true`: returned value will be a shallow freeze (implemented with
      [`Object.freeze()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze))
    * `deep`: returned value will be a deep-frozen version of the result returned by `{ defaults..., cfg...,
      }`. **Note** that in this preliminary version we will always freeze a deep copy (structural clone) of
      the `cfg` value so in no case will any nested list or object of the original `cfg` get inadvertantly
      frozen


### `declare`

* may use property syntax or call with type name as first argument
* `test` must bei either a function or a list of functions
* if `test` is a list of functions, those functions will called in the order given when `isa[ type ] x` is
  invoked; all calls must return `true` or `isa[ type ] x` will evaluate to `false`
* `test` may be given as last argument or as the `test` property of an implicit or explicit object

```coffee
types.declare 'array',  ( x ) -> Array.isArray x
types.declare 'array',  test: ( x ) -> Array.isArray x
types.declare.array     ( x ) -> Array.isArray x
types.declare.array     test: ( x ) -> Array.isArray x

types.declare 'array',  collection: true, ( x ) -> Array.isArray x
types.declare 'array',  collection: true, test: ( x ) -> Array.isArray x
types.declare.array     collection: true, ( x ) -> Array.isArray x
types.declare.array     collection: true, test: ( x ) -> Array.isArray x
```

```coffee
types.declare.array
  collection:   true
  default:      []
  test:         ( x ) -> Array.isArray x
```

* other type configuration options and their defaults:
  * `default:     (N/A)`—value to use when calling `types.create.mytype()`
  * `create:      null`—function to call for `types.create.mytype()`; if create is given, `default` will not
    be used (but the `create` function may use it); can pass in a (possibly mandatory) configuration object,
    e.g. `types.create.quantity { unit: 'meters', }` would make sense to create an object `{ value: 0, unit:
    'meters', }`
  * `freeze:      false`—whether `create` should deep-freeze the value
  * `extras:      true`—whether extraneous object properties are allowed (see below)
  * `collection:  false`—whether the type should be considered a collection, meaning it can be used with
    hedges like `empty`, `nonempty`

Like [Clojure spec](https://typedclojure.org)[https://www.youtube.com/watch?v=B_Farscj0hY], InterType
normally assumes that the contracts of object (or 'structural') types (i.e. 'structs') should be
'minimally-satisfying', meaning that an object will satisfy a type contract even if it has additional
properties. As an example, let's define two 2D point types, `open_2d_point` and `closed_2d_point`:

```coffee
types = new ( require 'intertype' ).Intertype()
{ isa
  validate
  declare
  create  } = types

declare.open_2d_point
  default:  { x: 0, y: 0, }
  test: [
    ( x ) -> @isa.float x.x
    ( x ) -> @isa.float x.y
    ]
declare.closed_2d_point
  extras:   false
  default:  { x: 0, y: 0, }
  test: [
    ( x ) -> @isa.float x.x
    ( x ) -> @isa.float x.y
    ]
```

Now we can create instances with `create` and validate them (which in this case is redundant as `create`
already does that):

```coffee
o2p = create.open_2d_point()              # { x: 0, y: 0, }
c2p = create.closed_2d_point { y: 42, }   # { x: 0, y: 42, }
validate.open_2d_point    o2p             # OK
validate.closed_2d_point  c2p             # OK
```

Since neither object is `seal`ed, we are free to add any properties; in the case of the 'open' type (where
the default setting of `{ extras: true, }` is in effect), we still get past validation. However, the closed
type does not validate anymore, as the `c2p` object has an extraneous property `z`:

```coffee
o2p.z = 123
c2p.z = 123
validate.open_2d_point    o2p             # OK
validate.closed_2d_point  c2p             # !!! Validation Error !!!
```
