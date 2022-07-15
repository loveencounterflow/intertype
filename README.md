
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Type Declarations](#type-declarations)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# InterType

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

## To Do

* **[–]** make hedgepaths configurable—**hedges need an opt-in**
  * using depth (length) of hedgepath; default depth is 0
  * using *wildcard hedgepath pattern* (provided by [`picomatch`]()https://github.com/micromatch/picomatch)
  * both at instantiation time for all builtins and declaration time for the type being declared
* **[–]** allow to filter out builtin types
* **[–]** implement sum types (a.k.a. tagged union, variant, variant record, choice type, discriminated
  union, disjoint union, or coproduct :-O) as in `isa.integer.or.optional.nonempty.text`
* **[–]** implement hedges `odd`, `even`; valid for `float`s but do imply those numbers will be integer
* **[–]** implement diagnostic API, primarily to check for existence of hedged types; allow to distinguish
  between standard types and user-defined types
* **[–]** "a group is a set of types. A group's `groups` property is itself, so group `collection` is
  groupmember of group `collection`, meaning there are tests for `isa.collection`, `isa.empty.collection`
  and so on."
* **[–]** eliminate hedgepaths that end in a hedge instead of in a type (or group). So we don't allow to
  test for `empty x`, only for `empty.collection x`, `empty.any x` &c
* **[–]** special types:
  * groups
  * hedges
  * existential / quantified:
    * `anything`:  `( x ) -> true`
    * `something`: `( x ) -> x?`
    * `nothing`:   `( x ) -> not x?`
* **[–]** allow to derive types, including derivation of defaults
* **[–]** provide methods for the ubiquitous `validate.$TYPE ( cfg = { defaults.$TYPE..., cfg..., } )` as
  `cfg = types.get_defaults.$TYPE cfg`
* **[–]** add `defaults` parameter to `declare`
* **[–]** make it so that type declarations can be queried / viewed / checked by user, especially `defaults`
  must be retrievable so they can be referenced from new type declarations

## Is Done

* **[+]** <del>use
  [`Reflect.has()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
  to check for property availability in `size_of()`</del> <ins>reject</ins> because `Reflect.has()` balks on
  primitive values like numbers, too, which further complicates the code instead of making it simpler.
  ⁂sigh⁂
* **[+]** in keeping with APIs for `isa[ typename ]` (i.e. `isa.integer &c`) and `validate[ typename ]`,
  implement the same for `declare` as in `declare.my_type cfg`
