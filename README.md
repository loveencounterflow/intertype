
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Built-In Types](#built-in-types)
  - [Browserify](#browserify)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# InterType

## Built-In Types

The following types are built-in and treated specially; they are always present and cannot be overwritten or
omitted. The definitions of their test methods reads like pseudo-code:

```coffee
anything:   ( x ) -> true
nothing:    ( x ) -> not x?
something:  ( x ) -> x?
null:       ( x ) -> x is null
undefined:  ( x ) -> x is undefined
unknown:    ( x ) -> ( @type_of x ) is 'unknown'
```

* `anything` is the set of all JS values;
* `nothing` is the set containing `null` and `undefined`,
* `something` is `anything` except `nothing` (`null` and `undefined`).
* `type_of x` will never test for and return `anything`, `nothing` or `something`.
* `null` is, unsurprisingly, the name of the value `null` and
* `undefined` is the name of the value `undefined`.
* `unknown` is the default type name returned by `type_of x` when no other type test (except for `anything`,
  `nothing` and `something`) returns `true`.


## Browserify

```bash
browserify --require intertype --debug -o public/browserified/intertype.js
```

## To Do

* **[–]** allow name-spacing a la `isa.myproject.foobar()`?
* **[–]** allow overrides <ins>when so configured</ins>
  * **[–]** but not of `built_ins`<del>?</del>
* **[–]** ensure that `optional` cannot be used as a type name

## Is Done

* **[+]** hard-wire basic types `anything`, `nothing`, `something`, `null`, `undefined`, `unknown`
* **[+]** allow stand-alone methods (`{ type_of } = new Intertype()`)
* **[+]** ensure all methods have reasonable names
* **[+]** use proper error types like `Validation_error`
* **[+]** make it possible for Intertype methods to use an internal, private instance so type and arity
  testing is possible for its own methods
* **[+]** throw error with instructive message when a type testing or `type_of()` iscalled with wrong arity
* **[+]** throw error with instructive message when an undefined type is being accessed as in `isa.quux x`

