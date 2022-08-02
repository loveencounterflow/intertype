

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

  ```coffee
  declare.t()       # or, equivalently,
  declare 't'
  ```

  When no tests are declared, a test for type `object` is assumed, so the above declarations amount to:

  ```coffee
  declare.t 'object'      # and
  declare 't', 'object'
  ```

* The notation `declare.t 'object'`—where the first string names the type to be declared, and the second the
  constraints for that type—is more explicitly written as

  ```coffee
  declare.t { test: 'object', }             # or, even more explicitly
  declare { name: 't', test: 'object', }
  ```

  The settings object is known as the 'type configuration' or (type) `cfg`.

* Each type can be associated with one or more test functions. If only a single function is given, it may
  come as last argument, possibly preceded by the `cfg`:

  ```coffee
  declare.t { collection: true, }, ( x ) -> ( @isa.list x ) and ( x.length > 0 )
  ```

* The above test has two terms coupled with a logical conjunction (`and`); these can be rewritten as two
  (or any number of) tests:

  ```coffee
  declare.t { collection: true, }, [
    ( x ) -> @isa.list x
    ( x ) -> x.length > 0
    ]
  ```

* It is preferrable that each individual test get a name (which will later surface in eror messages when a
  validation is not satisfied):

  ```coffee
  declare.t { collection: true, }, [
    list      = ( x ) -> @isa.list x
    nonempty  = ( x ) -> x.length > 0
    ]
  ```

* But since we're naming things anyway, why not use object notation (shown here with implicit braces):

  ```coffee
  declare.t { collection: true, },
    list:     ( x ) -> @isa.list x
    nonempty: ( x ) -> x.length > 0
  ```

* It turns out that being empty or not is implemented as builtin types `empty` and `nonempty` in InterType,
  so the second term may be rewritten as an `isa` test:

  ```coffee
  declare.t { collection: true, },
    list:     ( x ) -> @isa.list x
    nonempty: ( x ) -> @isa.nonempty x
  ```

  ...which, in turn—since the tests are now all non-compound and just applying `isa`—can be reduced to the
  *names* of the types (much like we used `'object'`, above):

  ```coffee
  declare.t { collection: true, }, [
    'list',
    'nonempty', ]
  ```

* A list of typenames may be reduced to a single string with typenames separated by dots. This
  notation—the so-called *hedgerow*—is the same as the one used with `isa`, `validate` and friends:

  ```coffee
  declare.t { collection: true, }, 'list.nonempty'        # which is the implicit form of
  declare.t { collection: true, test: 'list.nonempty' }
  isa.nonempty.list [ 1, ]  # true
  isa.nonempty.list []      # false
  ```

  Observe that since (in the absence of a disjunction `or`) all tests are performed consecutively and the
  first failing term will cause the entire hedgerow to fail, ordering of terms is irrelevant except for the
  detail that, depending on the combination of terms and the value being tested, a re-ordering may entail
  more or fewer tests to be run.

* In addition to everything that has been said so far, there's a need to test compound values, both for
  their 'outer' and their 'inner' types, that is to say, for the type of a container and the types of the
  contents.

  Compound data types can be separated into two main kinds:
  * the *collections* such as lists and sets of values (which are structured by indexes or values), and
  * the *objects* (which are structered by keys, i.e. locally unique names). For the sake of exposition
    (since 'everything is an object in JavaScript', you know) we may also call these '*structs*', short for
    'structured value', sometimes also 'records' (or, in the context of relational DBs, 'rows' or 'tuples').

* The first kind—collections—can be dealt with quickly: as soon as there's declared type that has the
  `collection` property (for which see the examples above), we can apply the pseudo-type `of` in
  declarations and type tests:

  ```coffee
  declare.foobar 'nonempty.list.of.integer.or.nonempty.text'
  ```

* The second kind of compound types—structs—requires more detail. A struct may or may not be of type
  `object`; it consists as far as InterType is concerned, of *fields*, which are key / value pairs.

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
