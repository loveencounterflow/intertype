
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Motivation](#motivation)
  - [Hedgerows](#hedgerows)
    - [Diagram](#diagram)
    - [xxx](#xxx)
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

## Hedgerows

* simplest form: test for a value; preferred form is to use property accessor syntax (a.k.a. 'dot
  notation'), e.g. `isa.integer x` (equivalent to `isa[ 'integer' ] x`)

* these accessors are called 'hedges'

* hedges can be combined in so-called 'hedgerows', e.g. `isa.positive0.integer x` tests whether `x >= 0`

* hedgerows can be arbitrarily long, e.g. `isa.optional.nonempty.list_of.optional.negative1.integer x`

* whether one wants lomng hedgerows or not is a matter of taste, but it will very probably be more
  systematic and more readable to define meaningful intermediate types instead of using log hedgerows:

  ```coffee
  declare.xy_count        { test: ( ( x ) -> @isa.optional.set_of.negative1.integer   x ), }
  declare.maybe_xy_counts { test: ( ( x ) -> @isa.optional.nonempty.list_of.xy_count  x ), }
  ...
  validate.maybe_xy_counts some_value
  ```

* in order to satisfy a hedgerow constraint, the value given must satisfy all individual terms, in the order
  given. In other words, a hedgerow is a notation for a series of terms connected by logical conjunctions,
  `a.b.c x ⇔ ( a x ) ∧ ( b x ) ∧ ( c x )` (in detail, `list_of` and `set_of` introduce a complication).

  To re-use the slightly convoluted example from above, one can understand what
  `isa.optional.nonempty.list_of.optional.negative1.integer x` means by rewriting it in pseudo-code along
  the following lines:

  ```coffee
  test: ( x ) ->
    return false unless isa.optional  x # `optional x` is satisfied if `x` is `undefined` or `null`, otherwise go on
    return false unless isa.nonempty  x # `nonempty x` is true if `x` contains at least one element
    return false unless isa.list      x # `list_of...` tests whether `x` is a list, ...
    for each e in x:      # ... and then applies the rest of the hedgerow to each of its elements:
      return false unless isa.optional  e # this `optional` clause is run against each element, so list may have `null` elements
      return false unless isa.negative1 e # `negative1 x` tests for `x < 0`
      return false unless isa.integer   e # `true` for whole numbers; uses `Number.isInteger()`
    return true
  ```

* hedgerows will be evaluated in a 'short-circuited' manner like JavaScript logical operators; this means
  that tests will only be performed up to the point where the result is definitely known. For example, if in
  `z = ( a or b )` the left sub-expression has been found to be `true`, we already know that the outcome can
  only be `true` as well, so we don't have to compute `b`. In `isa.optional.text x` we find that `x` is
  `undefined` or `null` we are already done and can (and must) skip the test for `text`. Conversely, if we'd
  find that `a` is `false` the second part of the disjunction could still be `true`, so we cannot
  short-circuit but must evaluate the second part as well, and the same goes for `isa.optional.text x` if
  `x?` (i.e. `x != null` or, even more explicitly, (JS) `( x !== null ) and ( x !== undefined )`).

* a hedgerow may contain one or more `or` hedges that signify logical disjunction, e.g.
  `isa.integer.or.nonempty.text.or.boolean x`. In this case, we partition the hedgerow into its constituent
  terms: `( integer x ) ∨ ( nonempty.text ) ∨ ( boolean x )` and evaluate by walking through each
  sub-hedgerow until it is either satisfied (which is when we can break the loop) or dissatisfied; in that
  case, we jump forward to the next sub-hedgerow to repeat the same; when there are no more sub-hedgerows
  left, the very last test then determines the result for the entire row.


### Diagram

```
isa.text

          text  is text       isnt text
                return true   ATOERF¹

             ⊙ return true     return false

¹ATOERF:  Advance To OR, Else Return False
```

```
isa.text.or.optional.list_of.positive1.integer

          text  is text         isnt text
                return true     ATOERF¹

            or  ————————————————————————

       integer  is integer      isnt integer
                next            ATOERF¹

             ⊙ return true     return false

¹ATOERF:  Advance To OR, Else Return False
```

```
isa.text.or.optional.list_of.positive1.integer

          text  is text         isnt text
                return true     ATOERF¹

            or  ————————————————————————

      optional  not x?          x?
                return true     next

list_of:  list  is list         isnt list
                switch to EM²   ATOERF¹

     positive1  e > 0           not ( e > 0 )
                next            ATOERF¹

       integer  is integer      isnt integer
                next            ATOERF¹

             ⊙ return true     return false

¹ATOERF:  Advance To OR, Else Return False
²EM:      Elements Mode
```

Schema for `isa.negative1.integer.or.optional.empty.text -42` (`true`): Both `isa.negative1 -42` and
`isa.integer -42` evaluate to `true`; since these terms are implicitly connected with `and`, we must
evaluate them all to ensure no `false` term occurs; this is what the single triangle ▼ signifies, 'continue
with next'. When we reach the `or` clause, though, we can short-circuit (▼▼▼) the evaluation and return `true`:

| FALSE     | isa       | TRUE      |
| ------:   | :-------: | :-----    |
|           | negative1 | ▼         |
|           | integer   | ▼         |
| ───────── | OR        | ▼▼▼────── |
|           | optional  |           |
|           | empty     |           |
|           | text      |           |
| ═════════ | ═════════ | ═════════ |
|           | -42       | TRUE      |


Schema for `isa.negative1.integer.or.optional.empty.text 'meep'` (`false`): `'meep'` cannot satisfy
`negative1` since it is not numeric, so the entire clause fails. We can again short-circuit, but *only up to
the next or-clause*, symbolized by ▼▼. The next term is `optional`; since all values (including `null` and
`undefined`) satisfy this constraint, we go to the next term, `empty`; since `'meep'.length` is `4`, this
term fails, so we have to ▼▼ advance to the end of the current clause which coincides with the end of the
hedgerow, meaning we can return `false`:

| FALSE     | isa       | TRUE      |
| ------:   | :-------: | :-----    |
| ▼▼        | negative1 |           |
|           | integer   |           |
| ────────▼ | OR        | ───────── |
|           | optional  | ▼         |
| ▼▼        | empty     |           |
|           | text      |           |
| ═════════ | ═════════ | ═════════ |
| FALSE     | 'meep'    |           |


Schema for `isa.negative1.integer.or.optional.empty.text -42` (`true`): `null` is not negative (and, of
course, not positive either) so we can ▼▼ advance to the next 'gate'; there, `null` does fulfill `optional`
(like any value) but with a 'special effect': `isa.optional null` and `isa.optional undefined` cause a
global short-circuit, meaning we can return `true` right away and ignore any number of other constraints:

| FALSE     | isa       | TRUE      |
| ------:   | :-------: | :-----    |
| ▼▼        | negative1 |           |
|           | integer   |           |
| ────────▼ | OR        | ───────── |
|           | optional  | ▼▼▼       |
|           | empty     |           |
|           | text      |           |
| ═════════ | ═════════ | ═════════ |
|           | null      | TRUE      |

This short-circuiting behavior of `optional` when seeing a nullish value is peculiar to `optional`; it is
similar to there only being a single empty exemplar of collections (strings, lists, sets) except applying to
all types: `( isa.empty.text a ) == ( isa.empty.text b )` entails `a == b == ''`; likewise, `(
isa.optional.$TYPE_A a ) == ( isa.optional.$TYPE_B b )` in conjunction with `( a == null )` implies `a ==
b`, so as soon as we learn that `a == null` and a value has an `optional` allowance, no other constraint has
to be considered.

**Note** on `optional`: The types `optional.integer` and `optional.text` have `{ null, undefined }` as
intersection of their domains, meaning that in the case of their disjunction—`isa.optional.integer.or.text`,
`isa.integer.or.optional.text` and so on—are indistinguishable: all variations will, among (infinitely many)
other values accept all of `null`, `undefined`, `1`, `42`, `'x'`, `'foobar'` and so on. Because of this one
may want to restrict oneself to only allow `optional` as the *first* hedge, avoiding constructs like
`isa.integer.or.optional.text` as a matter of style.

Schema for `isa.nonempty.text.or.list_of.nonempty.text [ 'helo', 'world', ]` (`true`): `nonempty` gives
`true` for `[ 'helo', 'world', ]`, but since this is a `list` rather than a `text`, the first clause fails
nonetheless. Next up is `list_of`, which first calls `isa.list [ 'helo', 'world', ]`; that being true, it
then switches to element mode, meaning that rather than applaying the remaining tests against the argument
passed in (the list), they will be applied to each *element* of the collection; this is here symbolized by
`∈ nonempty` and `∈ text`; in total, four tests will be performed: `isa.nonempty 'helo'`, `isa.text 'helo'`,
`isa.nonempty 'world'`, and `isa.text 'world'`, all of which return `true`, which leads to the entire
compound type being satisfied:

| FALSE     | isa                  | TRUE      |
| ------:   | :-------:            | :-----    |
|           | nonempty             | ▼         |
| ▼▼        | text                 |           |
| ────────▼ | OR                   | ───────── |
|           | list_of              | ▼         |
|           | ∈ nonempty           | ▼         |
|           | ∈ text               | ▼         |
| ═════════ | ═════════            | ═════════ |
|           | [ 'helo', 'world', ] | TRUE      |

Observe that in a compound type, once the mode has been switched to  element testing mode `∈`, there's no
going back, so `isa.list_of.text.or.integer` is fundamentally different from `isa.integer.or.list_of.text`:
the first will be true for all lists that contain nothing but strings and integer numbers, the second will
be true for all values that are either an integer or a list of zero or more strings. This is a shortcoming
of the current algorithm and may be fixed in the future; currently, there's no way to write `(
isa.set_of.text x ) or ( isa.list_of.text x )` in a single go. Should you need such a type, it will probably
be best to give the type a name, as in

```coffee
declare.set_or_list test: ( x ) -> ( isa.set_of.text x ) or ( isa.list_of.text x )
...
isa.nonempty.set_or_list [ 'a', 'b', ]  # true
isa.set_or_list.or.integer 123          # true
```


### xxx

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
  * **[–]** in principle then, any combination of hedges proper and types becomes allowable; one could also
    say: hedges become types and types are chainable, as in `validate.empty.text x` isnt categorically
    different from `validate.text.integer x`, even if the latter reads non-sensically and can only ever fail
    (because there's no overlap between text values and integer values). Could/should then rule out
    non-sensical hedgerows by other means (i.e. a grammar that states what can go where)
* **[–]** make the name of the disjunction—by default, `'or'`—configurable
* **[–]** allow to configure that `optional` shall only applay to `null`; additionaly or alternatively,
  offer `nullable` as a hedge for the same purpose
* **[–]** consider to change `list_of`, `set_of` into `list.of`, `set.of`, allow for all collections
  (`text.of`, `object.of`, `map.of`)

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
