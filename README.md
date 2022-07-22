
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Motivation](#motivation)
  - [Hedges](#hedges)
  - [Intertype `state` Property](#intertype-state-property)
  - [Intertype `create`](#intertype-create)
  - [Intertype `validate`](#intertype-validate)
  - [Intertype `equals()`](#intertype-equals)
  - [Type Declarations](#type-declarations)
    - [Settings `copy`, `freeze`, and `seal`](#settings-copy-freeze-and-seal)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# InterType

## Motivation

* structural typing
* inspired by [Clojure spec](https://typedclojure.org)[https://www.youtube.com/watch?v=B_Farscj0hY]
* most of the time used to perform a 'lower bounds' check of Plain Old Dictionaries (objects), i.e. objects
  must satisfy all key/constraint checks of a given type declaration, but object may have additional
  key/value pairs

## Hedges

```
types.isa.integer                                           42
types.isa.even.integer                                      -42
types.isa.odd.integer                                       41
types.isa.negative1.integer                                 -42
types.isa.negative0.integer                                 0
types.isa.positive1.integer                                 42
types.isa.positive0.integer                                 0
types.isa.list_of.integer                                   [ 42, ]
types.isa.nonempty.list_of.negative1.integer                [ -42, ]
types.isa.nonempty.list_of.negative0.integer                [ 0, ]
types.isa.nonempty.list_of.positive1.integer                [ 42, ]
types.isa.nonempty.list_of.positive0.integer                [ 0, ]
types.isa.empty.list_of.integer                             []
types.isa.nonempty.list_of.integer                          [ 42, ]
types.isa.optional.integer                                  42
types.isa.optional.list_of.integer                          [ 42, ]
types.isa.optional.empty.list_of.integer                    []
types.isa.optional.nonempty.list_of.integer                 [ 42, ]
types.isa.optional.negative1.integer                        -42
types.isa.optional.negative0.integer                        0
types.isa.optional.positive1.integer                        42
types.isa.optional.positive0.integer                        0
types.isa.optional.nonempty.list_of.negative1.integer       [ -42, ]
types.isa.optional.nonempty.list_of.negative0.integer       [ 0, ]
types.isa.optional.nonempty.list_of.positive1.integer       [ 42, ]
types.isa.optional.nonempty.list_of.positive0.integer       [ 0, ]
types.isa.optional.empty.list_of.negative1.integer          -42
types.isa.optional.empty.list_of.negative0.integer          0
types.isa.optional.empty.list_of.positive1.integer          42
types.isa.optional.empty.list_of.positive0.integer          0

[all]     [all]     [isa_collection]  [isa_collection]  [isa_numeric]   [isa_numeric]   [mandatory]
————————————————————————————————————————————————————————————————————————————————————————————————————
isa       optional  empty             list_of           even            negative0       <type>
validate            nonempty                            odd             negative1
                                                                        positive0
                                                                        positive1
```

## Intertype `state` Property

* `Intertype` instances have a `state` property; initial value is `{ data: null, method: null, hedges: [], }`
* when chained methods on `isa` and `validate` are called (as in `isa.optional.positive0.integer 42`),
  `method` will be set to the name of method to be invokes (here `'_isa'`) and `hedges` will contain the
  chain of hedges (including the type), in this case `[ 'optional', 'positive0', 'integer', ]`
* type testing methods are allowed to set or manipulate the `types.state.data` value; this can be used as a
  side channel e.g. to cache intermediate and ancillary results from an expensive testing method

## Intertype `create`

* returns deep copy (structural clone) of `default` member of type declaration
* in the case of objects, uses `Object.assign()` to apply optional `cfg`
* all types can (and maybe should) have a `default` value:
  * `types.create.text()` returns `''`
  * `types.create.integer()` and `types.create.float()` return `0`
  * `types.create.object()` returns `{}`
  * `types.create.list()` returns `[]`
  * and so on
* no implicit type coercion
* `types.create.quantity()` (for which see below) has default `{ value: 0, unit: null, }` which does
  not satisfy the constraint `isa.nonempty.text x.unit`, so causes an error
* but `types.create.quantity { unit: 'km', }` works because `Object.assign { value: 0, unit: null, }, {
  unit: 'km', }` gives `{ value: 0, unit: 'km', }` which does satisfy all constraints of `quantity`

```coffee
types.declare.quantity
  test: [
    ( x ) -> @isa.object        x
    ( x ) -> @isa.float         x.value
    ( x ) -> @isa.nonempty.text x.unit
    ]
  default:
    value:    0
    unit:     null
```

* `create()` is of great help when writing functions with a configuration object (here always called `cfg`).
  Where in earlier versions of this library one had to write:

  ```coffee
  f = ( cfg ) ->
    types.validate.foobar ( cfg = { defaults.foobar..., cfg..., } )
    ...
  ```

  now one can write more succinctly:

  ```coffee
  f = ( cfg ) ->
    cfg = types.create.foobar cfg
    ...
  ```

  and have reference to defaults, assignment from structured value and validation all wrapped up inside
  one call to a single method.

## Intertype `validate`

* a validator is a function that accepts exactly one argument which it will return to signal validation has
  passed; if argument was found to violate a constraint, an error mmust be thrown
* convenient for writing postconditions, as in `f = ( a, b ) -> validate.integer a * b`.

## Intertype `equals()`

* a 'deep equals' implementation (see [`jseq`](https://github.com/loveencounterflow/jseq), gleaned from
  [`jkroso/equals`](https://github.com/jkroso/equals))

## Type Declarations

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

## To Do

* **[–]** allow to filter out builtin types
* **[–]** implement sum types (a.k.a. tagged union, variant, variant record, choice type, discriminated
  union, disjoint union, or coproduct :-O) as in `isa.integer.or.optional.nonempty.text`
* **[–]** implement hedges `odd`, `even`; valid for `float`s but do imply those numbers will be integer
* **[–]** implement diagnostic API, primarily to check for existence of hedged types; allow to distinguish
  between standard types and user-defined types
* **[–]** "a group is a set of types. A group's `groups` property is itself, so group `collection` is
  groupmember of group `collection`, meaning there are tests for `isa.collection`, `isa.empty.collection`
  and so on."
* **[–]** special types:
  * groups
  * hedges
  * existential / quantified:
    * `anything`:  `( x ) -> true`
    * `something`: `( x ) -> x?`
    * `nothing`:   `( x ) -> not x?`
* **[–]** allow to derive types, including derivation of defaults
* **[–]** numeric types:
  * **[–]** rename group `number` to `real`? to avoid conflict with JS `Number` and to clarify that this does
    not cover imaginary, complex numbers. Observe we now have `BigInt`s
    pre-generating literally hundreds of hedgpath chains
  * **[–]** consider `float` (includes `infinity`) vs `ffloat` ('**f**inite' float, excludes `infinity`)
    (longer name, more restricted)
* **[–]** salvage
  * from [farewell-commit of generated
    hedgepaths](https://github.com/loveencounterflow/intertype/tree/c541c4a38bb047fd0cb65b4697c54028dffc2a4f)
    solution how to make combinatorics work, write up in [Gaps &
    Islands](https://github.com/loveencounterflow/gaps-and-islands)
* **[–]** implement `or` as in `types.isa.integer.or.text 'x'`
* **[–]** consider to turn all hedges into strict owners
* **[–]** can we generate random data based on a type declaration (like [Clojure `spec`]
  does)[https://youtu.be/B_Farscj0hY?t=1562]
* **[–]** use sets not arrays when testing for extraneous keys in `Type_cfg.constructor()`
* **[–]** offer a way to collect all errors in validation ('slow fail') instead of bailing out on first
  error ('fast fail') ([see HN post](https://news.ycombinator.com/item?id=32179856#32180458))
* **[–]** <del>make it so that type declarations can be queried / viewed / checked by user, especially
  `defaults` must be retrievable so they can be referenced from new type declarations</del> <ins>offer API
  to retrieve, review, print, document type declarations</ins>
* **[–]** try to find a way to treat hedges, types equally—there shouldn't be any (apparent at least)
  difference since in a hedgerow like `isa.nonempty.text.or.optional.integer x` the types and hedges proper
  both appear all over the place

## Is Done

* **[+]** <del>use
  [`Reflect.has()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
  to check for property availability in `size_of()`</del> <ins>reject</ins> because `Reflect.has()` balks on
  primitive values like numbers, too, which further complicates the code instead of making it simpler.
  ⁂sigh⁂
* **[+]** in keeping with APIs for `isa[ typename ]` (i.e. `isa.integer &c`) and `validate[ typename ]`,
  implement the same for `declare` as in `declare.my_type cfg`
* **[+]** use 'auto-vivification' for hedgepaths as outlined in
  [`hengist/dev/intertype`](https://github.com/loveencounterflow/hengist/blob/40ec7b9cec3afc72c389a0d2889d4bab7babc893/dev/intertype/src/_ng.test.coffee#L813)
  * <del>**[–]** how to finalize hedges?</del>
    * <del>**[–]** demand to declare types with hedgepaths? `types.declare.empty.list`? `types.declare 'empty',
      'list'`?</del>
    * <del>**[–]** possible to 'auto-vivify' hedgepaths?</del>
    * <del>**[–]** scrap hedgepaths, replace by `isa.$TYPE x, cfg` API? or `isa.$TYPE P..., x` where P may be any
      number of modifiers as in `isa.list 'optional', 'empty', x`</del>
* **[+]** fix naming of type test functions (always `test`, should be name of type)
* **[+]** add `default` parameter to `declare`
* **[+]** implement `create()`
* **[+]** provide methods for the ubiquitous `validate.$TYPE ( cfg = { defaults.$TYPE..., cfg..., } )` as
  `cfg = types.get_defaults.$TYPE cfg`
* **[+]** implement
  * **[+]** declarative freezing
  * <del>**[–]** declarative sealing</del>
  * **[+]** declarative validation of absence of extraneous (enumerable) properties
  * **[+]** declarative object creation with class declaration property `create` (must be function)
* **[+]** <del>make hedgepaths configurable—**hedges need an opt-in**</del>
  * <del>using depth (length) of hedgepath; default depth is 0</del>
  * <del>using *wildcard hedgepath pattern* (provided by [`picomatch`]()https://github.com/micromatch/picomatch)</del>
  * <del>both at instantiation time for all builtins and declaration time for the type being declared</del>
* **[+]** <del>eliminate hedgepaths that end in a hedge instead of in a type (or group). So we don't allow to
  test for `empty x`, only for `empty.collection x`, `empty.any x` &c</del>
* **[+]** flatten type entries in registry to be simple `Type_cfg` instances
