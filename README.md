
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Exported Classes](#exported-classes)
  - [Built-In Base Types](#built-in-base-types)
    - [`create.〈type〉()`](#create%E2%8C%A9type%E2%8C%AA)
  - [`declare()`](#declare)
    - [Declaration Values (Test Method, Type Name, Object)](#declaration-values-test-method-type-name-object)
  - [Namespaces and Object Fields](#namespaces-and-object-fields)
  - [Invariants](#invariants)
  - [Browserify](#browserify)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# InterType

## Exported Classes

* `{ Intertype } = require 'intertype'`: instances of `Intertype` will contain a catalog of pre-declared
  types ('default types')
* `{ Intertype_minimal } = require 'intertype'`: instances of `Intertype_minimal` will not include the
  default types
* in both cases, instances will include the built-in base types


## Built-In Base Types

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

## `declare()`

* `Intertype#declare()` accepts any number of objects
* it will iterate over all key, value pairs and interpret
  * the key as the type (name), and
  * the value as either that type's test method, or, if it's an object, as a type declaration
* the declaration will be rejected if the type name...
  * ... is one of the built-in base types, or
  * ... is already declared
* the declaration will be rejected if the declaration ...
  * ... is missing a test method
  * ... when the `test` entry is not a unary function
  * ... test method has the wrong arity
  * ... when a `create` entry has been given but has the wrong arity
  * ...

* Type declarations are final, meaning that while you can use the `types.declare()` method after the `types`
  object has been instantiated, you cannot use it to re-declare a known type.
* When instantiating `Intertype` with a series of declaration objects, any duplicate names on the objects
  passed in must be eliminated beforehand.


### Declaration Values (Test Method, Type Name, Object)

A valid declaration is either

* a test method, or
* the name of an existing type, or
* an object with the following fields:
  * **`test`**: either a test method or the name of existing type (the latter will be compiled into the
    former)
  * **`template`**
  * **`fields`**: keys are type names, values are declarations
  * **`create()`**


## Namespaces and Object Fields

* two ways to specify fields on objects
* either in the 'nested style', by using the `fields` entry of a type declaration; for example:

  ```
  declarations:
    quantity:
      test:   'object'
      fields:
        q:      'float'
        u:      'text'
  ```

* or in the 'flat style', by using dot notation in the type name:

  ```
  declarations:
    quantity:       'object'
    'quantity.q':   'float'
    'quantity.u':   'text'
  ```

* the two styles are identical and have the same result.
* you can now call the following test methods:
  * `types.isa.quantity x`: returns `true` iff `x` is an object with (at least) two properties `q` and `u`
    whose individual test methods both return `true` as well
  * `types.isa.quantity.q x`: returns `true` iff `x` is a `float`
  * `types.isa.quantity.u x`: returns `true` iff `x` is a `text`
* at least for the time being,
  * <del>a type `T` with field declarations must have its `test` entry set to `object`, and,</del>
  * when flat style is used, type `T` must be declared before any field is declared.
* if there is an existing declaration for type `T`, the only way to add fields to it is by using the flat
  declaration style
* field declarations constitute isolated namespaces, meaning that `types.isa.text`—that is, type `text` in
  the root namespace—is entirely separate from, say, `types.isa.product.rating.text`, which is type `text`
  in the `rating` namespace of type `product` in the root namespace.
* fields can be indefinitely nested, e.g.:

  ```
  types.declare { 'person':                       'object', }
  types.declare { 'person.name':                  'text',   }
  types.declare { 'person.address':               'object', }
  types.declare { 'person.address.city':          'object', }
  types.declare { 'person.address.city.name':     'text',   }
  types.declare { 'person.address.city.postcode': 'text',   }
  ```

## Invariants

* a declaration that identifies a known type with a string of characters `S` as in `T: 'some.test.here'` is
  equivalent to using the same string `S` to spell out a (possibly dotted, thus compound chain of) property
  accessor(s) to `@isa` inside a test method, as in `T: ( x ) -> @isa.some.test.here x`
* a constant (literal) property accessor (which may be dotted or not) to `isa`, `isa.optional`, `validate`
  and `validate.optional` is equivalent to the bracket notation with a string literal (or a variable) on the
  same base; thus, `isa.some.accessor x` is equivalent to `isa[ 'some.accessor' ] x`
* a type identified by a string that starts with the sequence `optional.` followed by a type name proper, as
  in `isa[ 'optional.foo.bar' ]` will be mapped onto the same base's `optional` property, followed by the
  type name proper; thus, `isa[ 'optional.foo.bar' ] x` is equivalent to `isa.optional[ 'foo.bar' ] x` which
  is equivalent to `isa.optional.foo[ 'bar' ] x`
* an 'implicitly optional' type, i.e. a type identified by a string that starts with the sequence
  `optional.` followed by a type name proper, behaves the same as an 'explicitly optional' type, i.e. a type
  that is being tested with an `isa.optional.foo x` construct;
* an 'implicitly optional' type doesn't change its behavior when being used in an 'explicitly optional'
  context; thus, when one has declared `foo` as an `optional.float`, then `isa.foo x` and `isa.optional.foo
  x` will behave identically
* the `type_of()` method of `Intertype_minimal` instances can only report the types of `null` and
  `undefined` (as `'null'` and `undefined'`); all other values are considered `'unknown'`. However, it is
  possible to test for `isa.anything x`, `isa.nothing x`, `isa.something x`, `isa.unknown x` (and, of
  course, `isa.undefined x` and `isa.null x`).


`optional` &c: fixed semantics on top-level, may not be overridden, but free with dotted type names


what's the role of `unknown` when there's `something` and `anything`? Do `unknown` and/or
`something`+`nothing` and/or `anything` themselves not make type system complete / total?

partial / incomplete type system
total type system

(may fail)
  ```coffee
  mulint: ( a, b = 1 ) ->
    validate.integer a
    validate.integer b
    return validate.integer a * b
  ```


## Browserify

```bash
browserify --require intertype --debug -o public/browserified/intertype.js
```

## To Do

* **[–]** implement `fields`
* **[–]** in `_compile_declaration_object()`, call recursively for each entry in `declaration.fields`
* **[–]** in `_compile_declaration_object()`, add validation for return value
* **[–]** implement using `optional` in a declarations, as in `{ foo: 'optional.text', }`
* **[–]** test whether basic types are immutable with instances of `Intertype_minimal`


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
* **[+]** validate <ins>null</ins>arity of template methods <ins>when no `create` entry is present</ins>
* **[+]** implement a way to keep standard declarations and add own ones on top:
  * by implementing a `declare()` method (which accepts an object with named declarations)
  * <del>by exporting (a copy of) `default_declarations`</del>
  * <del>by allowing or requiring a `cfg` object with an appropriate setting (`default_types: true`?)</del>
  * <del>by implementing `Intertype#declarations` as a class with an `add()` method or similar</del>
* **[+]** allow overrides <ins>when so configured</ins> but not of <del>`built_ins`?</del> the 'base types'
  `anything`, `nothing`, `something`, `null`, `undefined`, `unknown`, or the 'meta type' `optional`
* **[+]** <del>what about declarations with missing `test`?</del> ensure an error is thrown when no test
  method is present
* **[+]** enable setting `test` to the name of a declared type
* **[+]** allow name-spacing a la `isa.myproject.foobar()`<del>?</del> <ins>and use it to implement `fields`
* **[+]** when `fields` are implemented, also implement modified rules for test method
* **[+]** in `isa.foo.bar x`, `foo` is implemented as a function with a `bar` property; what about the
  built-in properties of functions like `name` and `length`?
  * <del>**[–]** can we use `Function::call f, ...` instead of `f.call ...` to avoid possible difficulty if
    `call` should get shadowed?</del>
* **[+]** allow declaration objects
* **[+]** remove 'dogfeeding' (class `_Intertype`), directly use test methods from catalog instead
* **[+]** fix failure to call sub-tests for dotted type references
* **[+]** fix failure to validate dotted type
* **[+]** make `get_isa()` &c private
* **[+]** <del>consider to replace `override` with the (clearer?) `replace`</del> <ins>disallow
  overrides</ins>
* **[+]** <del>remove indirection of `declare()`, `_declare()`</del> <ins>keep indirection of `declare()` to
  avoid 'JavaScript Rip-Off' effect when detaching unbound method
* **[+]** <del>test whether correct error is thrown</del> <ins>throw meaningful error</ins> when `declare`
  is called with unsuitable arguments

