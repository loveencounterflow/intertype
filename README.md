
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
omitted:

```coffee
anything:   ( x ) -> true
nothing:    ( x ) -> not x?
something:  ( x ) -> x?
null:       ( x ) -> x is null
undefined:  ( x ) -> x is undefined
unknown:    ( x ) -> ( @type_of x ) is 'unknown'
```

`anything` is the set of all JS values; `nothing` is the set `( null, undefined )`, `something` is
`anything` except `null` and `undefined`. `null` and `undefined` comprise the eponymous value only.
`unknown` is the set of values for which `type_of x` cannot find an `isa[ type ] x` for any known type that
returns `true` (`type_of x` will never test for `anything`, `nothing` or `something`).



## Browserify

```bash
browserify --require intertype --debug -o public/browserified/intertype.js
```

## To Do

* **[–]** allow name-spacing a la `isa.myproject.foobar()`?
* **[–]** allow overrides
  * **[–]** but not of `built_ins`?

## Is Done

* **[+]** hard-wire basic types `anything`, `nothing`, `something`, `null`, `undefined`, `unknown`
* **[+]** allow stand-alone methods (`{ type_of } = new Intertype()`)
* **[+]** ensure all methods have reasonable names
* **[+]** use proper error types like `Validation_error`

