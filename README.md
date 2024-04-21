
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Built-In Types](#built-in-types)
    - [`create.〈type〉()`](#create%E2%8C%A9type%E2%8C%AA)
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

In addition to the above, `optional` is also reserved. `optional` is not a type proper, rather, it is a type
modifier to allow for optional `null`s and `undefined`s. It is used in constructs like `isa.optional.integer
x` and `validate.optional.integer x` to state succinctly that 'if x is given (i.e. not `null` or
`undefined`), it should be an integer'.

### `create.〈type〉()`

Types declarations may include a `create` and a `template` entry:

* Types that have neither a `create` nor a `template` entry are not 'creatable'; trying to call
  `types.create.〈type〉()` will fail with an error.
* If given, a `create` entry must be a (synchronous) function that may accept any number of arguments; if it
  can make sense out of the values given, if any, it must return a value that passes its own `test()`
  method; otherwise, it should return any non-validating value (maybe `null` for all types except for
  `null`) to indicate failure. In the latter case, an `Intertype_wrong_arguments_for_create` will be thrown,
  assuming that the input arguments (not the create method) was at fault. Errors other than
  `Intertype_wrong_arguments_for_create` that are raised during calls to the create method should be
  considered bugs.
* a type declaration with a `template` but no `create` entry will become 'creatable' by being assigned an
  auto-generated create method.
* The auto-generated create method will accept no arguments and either
  * return the value stored under `template`, or
  * call the template method, if it is a synchronous function; this is not only how one can have a function
    being returned by an auto-generated create method, this is also a way to produce new copies instead of
    always returning the identical same object, and, furthermore, a way to return random (`random_integer`)
    or time-dependent (`date`) values.
  * anything else but a synchronous function (primitive values, but also asynchronous functions) will just
    be returned as-is from the auto-generated create method
    * but this behavior may be slightly modified in the future, especially `object`s as template values
      should be copied (shallow or deep, as the case may be)

## Browserify

```bash
browserify --require intertype --debug -o public/browserified/intertype.js
```

## To Do

* **[–]** allow name-spacing a la `isa.myproject.foobar()`?
* **[–]** allow overrides <ins>when so configured</ins> but not of <del>`built_ins`?</del> the 'base types'
  `anything`, `nothing`, `something`, `null`, `undefined`, `unknown`, or the 'meta type' `optional`
* **[–]** allow declaration objects
* **[–]** validate <ins>null</ins>arity of template methods

## Is Done

* **[+]** hard-wire basic types `anything`, `nothing`, `something`, `null`, `undefined`, `unknown`
* **[+]** allow stand-alone methods (`{ type_of } = new Intertype()`)
* **[+]** ensure all methods have reasonable names
* **[+]** use proper error types like `Validation_error`
* **[+]** make it possible for Intertype methods to use an internal, private instance so type and arity
  testing is possible for its own methods
* **[+]** throw error with instructive message when a type testing or `type_of()` is called with wrong arity
* **[+]** throw error with instructive message when an undefined type is being accessed as in `isa.quux x`
* **[+]** ensure that `optional` cannot be used as a type name
* **[+]** type-check declaration function (a.k.a. isa-test)
* **[+]** given a declaration like this:

  ```coffee
  declarations =
    float:
      test:   ( x ) -> Number.isFinite x
      create: ( p ) -> parseFloat p
  ```

  determine at what point(s) to insert a type validation; presumably, the return value of `create()` (even
  of one generated from a `template` setting) should be validated

* **[+]** validate that `create` entries are sync functions

