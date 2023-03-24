
# ▞ InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

  - [Quick Links](#quick-links)
- [▞ InterType](#%E2%96%9E-intertype)
  - [Motivation](#motivation)
  - [Contracts of Type Tests and the Verbs `isa`, `validate`](#contracts-of-type-tests-and-the-verbs-isa-validate)
    - [Type Tests](#type-tests)
    - [`isa`](#isa)
  - [`validate`](#validate)
  - [Hedgerows](#hedgerows)
    - [Diagram](#diagram)
    - [xxx](#xxx)
  - [Intertype `state` Property](#intertype-state-property)
  - [Intertype `cast`](#intertype-cast)
  - [Intertype `create`](#intertype-create)
  - [Intertype `equals()`](#intertype-equals)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Quick Links

* [Type Declarations](README-declare.md)

# ▞ InterType

## Motivation

* structural typing
* inspired by [Clojure spec](https://typedclojure.org)[https://www.youtube.com/watch?v=B_Farscj0hY]
* most of the time used to perform a 'lower bounds' check of Plain Old Dictionaries (objects), i.e. objects
  must satisfy all key/constraint checks of a given type declaration, but object may have additional
  key/value pairs

## Contracts of Type Tests and the Verbs `isa`, `validate`

### Type Tests

* A type test (TT) is a function that accepts a single argument and returns a boolean.
* TTs should not normally throw errors; however, that can sometimes be inconvenient to implement. For this
  reason, InterType implements 'exception-guarding' which entails that should a type tester inadvertently
  cause an exception, that exception will be silently caught and stored in the `state.error` property of the
  `Intertype` instance; the return value of the call will be set `false`. The following types `nevah` and
  `oops` are almost equivalent in that they return `false` for any input; however, immediately after using
  `oops`, the suppressed error may be accessed through `types.state.error` property:

  ```coffee
  { Intertype
    Intertype_user_error } = require 'intertype'
  types = new Intertype { errors: false, }
  types.declare.nevah       ( x ) -> false
  types.declare.oops        ( x ) -> throw new Error 'oops'
  types.declare.oops_anyway ( x ) -> throw new Intertype_user_error 'oops'
  types.isa.oops  42                # `false`
  types.state.error?                # `true` (i.e. `types.state.error` contains error)
  types.isa.nevah 42                # `false`
  types.state.error?                # `false` (i.e. no error, all OK)
  types.isa.oops_anyway 42          # !!! throws an error
  ```

  Because silently suppressed errors can be tricky to debug and checking for `state.error` is easily
  forgotten (and should not normally be necessary), exception-guarding is an opt-in (as shown above, use
  `errors: false`)
* Users may always construct type testers whose intentional errors will not be silently caught by deriving
  their errors from `Intertype_user_error`

* A type test must be *idempotent* and is therefore only allowed to look at, but not to touch (modify)
  values; IOW, it must be a pure method in the sense of functional programming. Yes, in theory one could
  write an `isa` method that 'fixes' a list by transforming, adding or deleting some elements (conveniently
  so, while one has to iterate over list elements anyway), but that would most certainly violate most user's
  basic assumptions—a type check is not supposed to return with a triumphant 'does the value have the proper
  shape? Well yes, now it does!'. A type check is not a repair order. InterType does not check for `isa`
  method being pure because that is deemed (far) too computationally expensive.

### `isa`

* However, when called in the context of a hedgerow as in `isa.collection.of.type x`, an exception may be
  thrown, e.g. when a type name is undeclared or `of` is preceded by a non-iterable type name (cf the
  non-sensical `isa.integer.of.integer 42`). This is not the type test, this is the verb `isa` complaining
  about a malformed chain of type tests.
* It is not allowed to use a name in an `isa` (or `validate` or `create`) hedgerow without that name being
  `declare`d prior to that.

## `validate`

* `validate` is a verb that performs an `isa` test; should that return `false`, an exception is thrown; if
  it returns `true`, *the tested value* will be returned.
* convenient for writing postconditions, as in `f = ( a, b ) -> validate.integer a * b`.

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

* `Intertype` instances have a `state` property
* the shape and initial value of `types.state` is:

  ```coffee
  types.state = {
    method:         null
    hedges:         []
    extra_keys:     null
    error:          null
    data:           null }
  ```

* The initial value of `types.state` is resumed right before a top-level `isa` or `validate` test is
  performed.

* The fields of `types.state` are used as follows:

  * When chained methods on `isa` and `validate` are called (as in `isa.integer x`, `validate.integer x`),
    `method` will be set to the name of method to be invoked (here `'_isa'` or `'_validate'`).

  * As each hedge in a hedgerow is encountered, its name is pushed into the `types.state.hedges` list and
    its associated test is performed.

* type testing methods are allowed to set or manipulate the `types.state.data` value; this can be used as a
  side channel e.g. to cache intermediate and ancillary results from an expensive testing method

  * should an `isa` method cause an error with an `Intertype` instance with an `errors: false` setting,
    `state.error` will contain that error to enable applications to query for `types.state.error?` when an
    `isa` test has failed. Errors that are thrown instead of being silenced are *not* recorded in
    `state.error`.

  * `state.data` is a place for the user's type-checking methods to store intermediate data in. It is never
    touched by InterType methods except for being reset each time a top-level `isa` or `validate` is
    performed. It can be used to store expensive computational results that are necessitated by
    type-checking procedures; for example, one might have a type that is a potentially long list of either
    functions or names identifying functions. When checking that the list validates, one has to iterate over
    the list and check for all elements being either a function or a name. Knowing that names will have to
    be replaced by functions later on, on could have the `isa` method cache all those to-be-postprocessed
    items:

    ```coffee
    ( x ) ->
      @state.data               ?= {}
      @state.data.name_indexes  ?= []
      for idx, element in x
        switch @type_of element
          when 'function'
            continue
          when 'text'
            @state.data.name_indexes.push { idx, element, }
          else
            return false
      ...
      ...
    ```

## Intertype `cast`

Experimental feature to create a new instance of a type from any number of arguments; usage:

```coffee
declare.quantity
  fields:
    value:         'float'
    unit:          'nonempty.text'
  extras:         false
  default:
    value:    0
    unit:     null
  cast: ( x ) ->
    return x unless @isa.nonempty.text x
    return x unless ( match = x.match /^(?<value>.*?)(?<unit>\D*)$/ )?
    { value
      unit  } = match.groups
    value     = parseFloat value
    return x unless isa.float value
    return x unless isa.nonempty.text unit
    return { value, unit, }
cast.quantity '102kg' # { value: 102, unit: 'kg', }
```

Return value will be validated.

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

## Intertype `equals()`

* a 'deep equals' implementation (see [`jseq`](https://github.com/loveencounterflow/jseq), gleaned from
  [`jkroso/equals`](https://github.com/jkroso/equals))

## To Do

* **[–]** allow to filter out builtin types
* **[–]** implement sum types (a.k.a. tagged union, variant, variant record, choice type, discriminated
  union, disjoint union, or coproduct :-O) as in `isa.integer.or.optional.nonempty.text`
* **[–]** implement hedges `odd`, `even`; valid for `float`s but do imply those numbers will be integer
* **[–]** implement diagnostic API, primarily to check for existence of hedged types; allow to distinguish
  between standard types and user-defined types
* **[–]** special types:
  * <del>groups</del>
  * hedges
  * existential / quantified:
    * `anything`:  `( x ) -> true`
    * `something`: `( x ) -> x?`
    * `nothing`:   `( x ) -> not x?`
* **[–]** allow to derive types, including derivation of defaults
* **[–]** numeric types:
  * **[–]** rename `number` to `real`? to avoid conflict with JS `Number` and to clarify that this does not
    cover imaginary, complex numbers. Observe we now have `BigInt`s pre-generating literally hundreds of
    hedgpath chains
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
* **[–]** implement `last_of()`, `first_of()`
* **[–]** try to centralize hedgerow validation; happens in several places now
* **[–]** implement aliases
* **[–]** implement `isa`, `validate`, `create` as functions that accept hedgerow, value (i.e. can say both
  `isa.list.of.integer []` and `isa 'list', 'of', 'integer', []`, maybe `isa.list.of' 'integer', []`, too)
* **[–]** currently `isa` &c call instance method `_isa` &c; make it so that `isa` calls `super()` and
  define effective `isa()` in base class `Intertype_xxxxx extends Intertype_abc`, `Intertype extends
  Intertype_xxxxx`.
* **[–]** re-consider `seal`
* **[–]** implement type dependencies (both explicit and implicit), e.g. `codepoint` depends on `text` while
  `codepointid` depends on `integer`
* **[–]** clarify distinction between `container` and `collection` or remove one of them
* **[–]** `helpers.dep_copy()` should allow circular objects where necessary
* **[–]** `structuredClone()` throws an exception when encountering a function (and other things)
  * **[–]** fix (probably) related bug [metteur#1867d3a6535c4d1f12ccc55d359fc6ff681a16e6](https://github.com/loveencounterflow/metteur/tree/1867d3a6535c4d1f12ccc55d359fc6ff681a16e6)

    ```
    Validation Failure
    F   create       mtr_new_template.rpr:optional.function                 { template: 'the answers are ❰...answer❱.', open: '❰', close: '❱', rpr: null }
    F   create   mtr_new_template                                           Symbol(misfit)
    Error: ^intertype/validate@1567^ not a valid boolean (violates 'x is true or false'): Symbol(return_true)
    Validation Failure
    ```

* **[–]** in addition to single-`$`-prefixed keys, allow double-`$`-prefixed keys to allow arbitrary names
  for arbitrary conditions; these should probably always use functions as values:

  ```coffee
  declare.foobar
    $:                          'object'
    $number:                    'optional.float'
    $string:                    'optional.nonempty.text'
    $$either_number_or_string:  ( x ) ->
      ( x.number? or x.string? ) and not ( x.number? and x.string? )
  ```


* **[–]** implement 'checks', i.e. helpers to test for conditions like 'object has keys that conform to this
  pattern' &c (?)
* **[–]** turn `Type_cfg` instances into functions
* **[–]** document that `isa.optional.t x` is just a convenient way to write `isa.null.or.undefined.or.t x`,
  which explains why a hedgerow can be short-circuited as soon as `not x?` has been found to be `true`
* **[–]** implement `examine`, a non-throwing equivalent to `validate`, which returns the test clauses up to
  the point of failure or `null`. Variant: call it `fails`, returns `false` where `isa` had returned `true`,
  non-empty list of tests otherwise:

  ```coffee
  if tests = fails.foobar x      # lists are truthy in JS
    log tests.at -1              # print info about failed test
  ```
* **[–]** based on the above, provide nicely formatted error reports so users don't have to
* **[–]** implement `create` with hedges such that one can write things like
  `create.nonempty.list.of.integer size: 5`; in this case, the `create` method of type `integer` should be
  called with argument `{ hedges: [ 'nonempty', 'integer', ], size: 5, }`
* **[–]** wrap all hedges and type testers to check for arity `1`; mabe this can be done in
  `_get_hedge_base_proxy_cfg` once for all
* **[–]** rule out use of names with `cfg.sep` (`.`) (generally, check for name being a valid JS identifier;
  likewise, `sep` should be restricted to non-identifier characters)
* **[–]** consider to offer faster mode where all hegerows must get pre-declared instead of being
  auto-vivified on-the-fly
* **[–]** rename `extras` in type descriptions to `open`? Or indeed create type `noxtra` similar to `empty`,
  `nonempty`: `isa.noxtra.foo x` (or `isa.foo.noxtra x`?) is `true` when `isa.foo x` is `true`, the
  declaration of type `foo` enumerates fieldnames, and no fields except these are found in `Object.keys x`.
* **[–]** <del>allow `validate` to take an extra parameter: either string (with placeholders for data?) or
  function to be called in case of validation failure; this to make throwing more meaningful errors than
  standard validation errors easier</del> <ins>probably not possible due to existence of rest parameter in
  `_validate: ( hedges..., type, x ) ->`; instead, recommend these patterns:</ins>

  ```coffee
  ### provide custom value in case of postcondition failure: ###
  plus_1 = ( a, b ) ->
    R = a + b
    return try validate.float.or.bigint R catch error
      0
  ### throw custom error in case of postcondition failure: ###
  plus_2 = ( a, b ) ->
    R = a + b
    return try validate.float.or.bigint R catch error
      throw new Error "these values can not be added: a: #{rpr a}, b: #{rpr b}"
  ```

* **[–]** implement configuration to specifiy whether validation errors should output tracing message and
  whether to include tracing in `stderr` or print to console or both

* **[–]** must use deep copies when deriving values from defaults in `create()`
* **[–]** `get_state_report()` may report single line even with `format: 'failing'` when test has succeeded,
  should return `null`
* **[–]** change `default` to `defaults` (as in, 'field defaults') to avoid clash with JS reserved word.
  Alternative: <del>`paragon`</del> <ins>`template`</ins>
* **[–]** do not use `$`-prefixed fieldnames, define fields in `fields` sub-object
* **[–]** allow list as enumeration of allowed values as in `color: [ 'red', 'green', 'blue', ]`

* **[–]** Implement a demo type `quantity` that allows inputs like `ms: 42`, `km: 3`, `m: 800` with
  normalization

* **[–]** make sure key properties of `Intertype` instances are hidden to avoid terminal flooding on output
* **[–]** implement a way for type tests to communicate a reason for rejection of a value; this should be
  picked up by `validate` when throwing error
* **[–]** relax restriction on `extras` which currently calls for `default` (to be renamed -> `template`) to
  be set; `fields` should be sufficient
* **[–]** declarations themselves should have `extras: false` to help catch unknown and misspelled
  properties
* **[–]** A function call that *could* happen *before* shape-testing could be called `cast()` which
  might accept inputs of all kinds and shapes and try to return a conformant value from those or fail with
  an exception. So `quantity` could be declared as an object with fields `amount: 'float', unit:
  'nonempty.text'`, but also accept textual inputs like `'7.3e3kg`, to be parsed and transformed into
  `amount: 7300, unit: 'kg'`. Whether one wants `cast()` to be called always (implicitly) or only on demand
  is another question.
* **[–]** phase out dollar sigil for field declarations; instead, use `fields` sub-object
* **[–]** implement option to make result an instance of `GUY.props.Strict_owner`
* **[–]** provide a way to add computed defaults (which are, strictly speaking, redundant, or
  denormalizations); e.g. a 'layout' might specify where to put 'pages' on a printing 'sheet'; from this
  arrangement we can deduce the pages per sheet ('pps') setting which is good to have around as a ready-made
  number (as opposed to having it to compute it on the fly, maybe repeatedly, from array lengths). Suggest
  to offer a method `prepare()` that will be called *before* field validation (the way that `create()` used
  to). Note that now we have `cast()`, `prepare()`, and `create()` to aid in value construction.
* **[–]** allow enumerations (list of values)
* **[–]** allow declaration of non-settable items (useful for `cfg` objects that need pre-computed
  properties derived from user settings)
* **[–]** turns out ordering of `or`ed terms matters when it shouldn't:
  * `isa.regex.or.nonempty.text 'x'`: `true`
  * `isa.regex.or.nonempty.text /x/`: `true`
  * `isa.nonempty.text.or.regex 'x'`: `true`
  * `isa.nonempty.text.or.regex /x/`: `false` (b/c of `nonempty` which is never `true` for `regex`es)
* **[–]** all regex as value for `isa`, `declare.x /foo/` meaning `declare.x isa: ( x ) -> ( @isa.text x )
  and ( /foo/.test x )`
* **[–]** consider to abandon dotted syntax and use underscores instead, e.g.
  `validate.text_or_positive_integer 42`; this has the advantage that nested runtime name chain resolution
  can be replaced by looking up a single (compiled?) function (at least after the first use, which should
  probably cause construction of that function)
* **[–]** catch errors thrown inside a type's `create()` function and convert them to validation errors
* **[–]** implement `is_derived_from Derived, Base` (or `extends Derived, Base`) using `( Derived is Base or
  (Derived::) instanceof Base )` (first seen in MoonRiver)


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
* **[+]** <del>"a group is a set of types. A group's `groups` property is itself, so group `collection` is
  groupmember of group `collection`, meaning there are tests for `isa.collection`, `isa.empty.collection`
  and so on."</del>
* **[+]** <del>reconsider role of groups in type declarations</del> <ins>removed groups altogether, keeping
  boolean property `collection`</ins>
* **[+]** <del>change `collection` to `iterable`, b/c their distinguishing mark is that they can be iterated
  over by virtue of `x[ Symbol.iterator ]` returning a function</del> <ins>make `collection` a boolean
  property of type configuration, implement type `iterable`</ins>
* **[+]** implement 'exception-guarding' where we catch exceptions thrown by type testers when so configured
  (with `errors: false`) and return `false` instead, recording the error in `state`. When `errors: 'throw'`
  is set, errors will be thrown as normally
* **[+]** allow users to access `Intertype_user_error` class so they can throw errors that are exempt from
  exception-guarding
* **[+]** implement using the cfg directly for tests against object (struct) properties. Keys can be
  anything but if they start with a `$` dollar sign the refer to the keys of the struct being described;
  <del>`$` refers to the struct itself;</del> string values name an existing type. These additions make
  declarations highly declarative and aid in providing automatic features (e.g. implicit type dependency):

  ```coffee
  declare.quantity
    $:        'object'          # this could be implicit, judging by the use of any `$`-prefixed key
    $value:   'float'
    $unit:    'nonempty.text'
    default:
      value:    0
      unit:     null
  ```

* **[+]** in compound data types, `isa()` should be called *after* fields have been validated so that a
  consumer can perform additional checking in `isa()` knowing that the general shape of the value is
  conformant.
* **[+]** implement `override` option for `declare` to cause types that take precedence over others when
  using `type_of()`
* **[+]** implement deleting declarations and make replacements *keep* the position of the `override` entry;
  that way we don't need yet another cfg setting and can still handle precedence of overrides
