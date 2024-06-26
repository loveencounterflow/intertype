
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Exported Classes](#exported-classes)
  - [Base Types](#base-types)
    - [`create.〈type〉()`](#create%E2%8C%A9type%E2%8C%AA)
  - [`declare()`](#declare)
  - [`evaluate` methods](#evaluate-methods)
  - [Sum Types (Variants) and Product Types (Records)](#sum-types-variants-and-product-types-records)
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
* in both cases, instances will include the basetypes


## Base Types

The following basetypes are built-in and treated specially; they are always present and cannot be
overwritten or omitted. The definitions of their test methods reads like pseudo-code:

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

In addition to the above, the 'metatype' or 'quasitype' `optional` is also reserved. `optional` is not a
type proper, rather, it is a type modifier to allow for optional `null`s and `undefined`s. It is used in
constructs like `isa.optional.integer x` and `validate.optional.integer x` to state succinctly that 'if x is
given (i.e. not `null` or `undefined`), it should be an integer'.

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
  * ... is one of the basetypes, or
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

## `evaluate` methods

* when using `isa` and `validate` methods, it can be difficult to see exactly what went wrong when a test
  fails
* this is all the more true with nesting types that have complex fields as properties of complex fields;
  when `isa.employee_record x` fails you only know that either `x` was not an object or that any nested
  field such as `person.address.city.postcode` was not satisfied
* prior versions of this library attempted to solve the problem by tracing the execution of all the test
  triggered by calling an `isa` or a `validate` method; however, this was cumbersome and wasteful as
  collecting the traces needs time and RAM for each single `isa` and `validate` method call, whether the
  traces are used afterwards or, most of the time, silently discarded
* another problem with tracing is that, in the interest of performance, tests are shortcut, meaning that the
  first failed test in a series of tests will cause a negative result, without the subsequent tests being
  performed; this means that traces can only ever report the *first* failure of a complex type check, not
  *all* of the failures
* `evaluate` methods let users obtain a succinct catalog of all the transitive fields of a given type
  declaration and how they fared
* `evaluate[type] x` will always return a flat object whose keys are fully qualified type names (like
  `person.address.city`); they will appear in order of their declaration with `type` coming first, so the
  object returned by `evaluate.person x` will always have `person` as its first key, and the one returned by
  `evaluate.person.address x` will always have `person.address` as its first key

## Sum Types (Variants) and Product Types (Records)

* Variants can be defined with or without a *qualifier*, a syntactic element that precedes a type name
* Variants *without* qualifiers ('unqualified variants') can be defined by using a logical disjunction
  (`or`, `||`) in the test method. For example, one could declare a type `boolordeep` like this:

  ```coffee
  declarations:
    boolordeep: ( x ) -> ( @isa.boolean x ) or ( x is 'deep' )
  ```

  which will be satisfied by any one of the three values `true`, `false`, and (the string) `'deep'`, to the
  exclusion of any other values.
* '*Qualified* variants' do use an explicit qualifier that is meant to be used in conjunction with other
  types, for example:

  ```coffee
  declarations:
    nonempty: { role: 'qualifier', }
    'nonempty.list':  ( x ) -> ( @isa.list  x ) and ( x.length  isnt 0 )
    'nonempty.set':   ( x ) -> ( @isa.set   x ) and ( x.size    isnt 0 )
  ```

  * Having declared the above types—the qualifier `nonempty` with its two branch types `nonempty.list` and
    `nonempty.set`—we can now test for any of:
    * `isa.nonempty.list  x`: whether `x` is a `list` with non-zero `x.length`
    * `isa.nonempty.set   x`: whether `x` is a `set` with non-zero `x.size`
    * `isa.nonempty       x`: whether `x` satisifes either `isa.nonempty.list x` or `isa.nonempty.set x`
  * In other words, the qualifier is what becomes the variant—`isa.nonempty.list` and `isa.nonempty.set` are
    ordinary tpes (though conceivably one could declare them as unqualified variants, as shown above)
* 'Product types' or 'records', on the other hand, are types that mandate the presence not of alternatives,
  but of named fields each of which must satisfy its own test method for the record to be valid
* Clarification of terminology:
  * an explicit *qualifier* is what goes in front of a *qualified typename*;
  * a *variant* is a type that has several equivalent alternatives to choose from;
  * an *implicit variant* is a type that has several equivalent alternatives to choose from that are however
    not formally declared to the InterType API but inside a test method that contains disjunctions (`foo: (
    x ) -> ( @isa.a x ) or ( @isa.b x )`)
  * an *explicit variant* comes about by using a (chain of) qualifier(s) as a typename; so when we have
    declared `empty` as a `qualifier` and set up tests for both `empty.text` and `empty.list`, then the
    explicit variant `empty` can be tested for with `isa.empty x`, which will return `true` for exactly the
    values `''` and `[]`.

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
* the `type_of()` method of `Intertype_minimal` instances can only report the types of `null` and
  `undefined` (as `'null'` and `undefined'`); all other values are considered `'unknown'`. However, it is
  possible to test for `isa.anything x`, `isa.nothing x`, `isa.something x`, `isa.unknown x` (and, of
  course, `isa.undefined x` and `isa.null x`).

<!--
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
 -->



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

* **[–]** in `_compile_declaration_object()`, add validation for return value
* **[–]** implement using `optional` in a declarations, as in `{ foo: 'optional.text', }`
* **[–]** what should RHS `optional.foo.bar` mean, is it potentially different from `foo.optional.bar` (even
  if we never want to implement the latter)? Observe that wile `optional.foo.bar` might mean something
  different than `foo.optional.bar`, when testing for `isa.optional.foo.bar x` we apparently still
  understand `foo.bar` as a (compound) fully qualified name of a type (`bar` in namespace `foo`) that in its
  entirety may be present or absent
  * **[–]** consider to disallow `optional` except in front of a simple type name (without dots)
* **[–]** test `create()` method for the recursive case
* **[–]** acquire deep-freezing method
  * **[–]** use deep-freezing for declaration
  * **[–]** use deep-freezing for generated values when so configured / by default? maybe instantiation
    setting?
* **[–]** what do when, in the declaration, ...
  * **[–]** there's `fields` but no `template`
  * **[–]** there's `template` but no `fields`
  * **[–]** there's `template` but no `fields`, and all fields in `template` are constants (is it even worth
    caring about?)
  * **[–]** there's `template` but it's a function
* **[–]** `evaluate.cardinal Infinity` returns `{ cardinal: false }`; `evaluate.posnaught.integer Infinity`
  returns `{ 'posnaught.integer': false }`; in both cases, more details would be elucidating (`Infinity`
  satisfies `posnaught` but not `integer`)
* **[–]** consider to enrich result of `evaluate` methods with length-limited `rpr()` and type of values
  encountered
* **[–]** implement an `explain` or `report` method that shows a table with all the tests and what the
  actual values were that `evaluate` enountered
* **[–]** work out terminology concerning fields, sub-types (as opposed to derived types), and the to-be
  implemented 'qualifiers'
* **[–]** `nonempty` etc. could be autogenerated: go through each enumerable property `T` of
  `isa.nonempty` and add a test `( @isa[ T ] x ) and ( @isa.nonempty[ T ] x`
* **[–]** need a term for the 'sub-methods' that get attached as props to the 'target methods'(??), e.g.
  after `isa.quantity()` has been set 'sub-methods' `isa.quantity.q()`, `isa.quantity.u()` will be set as
  properties of their 'target' `isa.quantity`; the current terminology is unfortunate and obfuscates more
  than it elicits
* **[–]** clarify difference between basetypes and meta/quasitype `optional`, provide a type for the union
  of both
* **[–]** Type roles:
  * `basetype`
  * `optional`
  * `usertype`
  * `qualifier`
  * `negation` (?)
* **[–]** in addition to setting `role`, allow users to set `{ test: '@qualifier' }` which then can be
  shortened to `empty: '@qualifier'` in dotted field enumerations (maybe really the preferred way to
  differentiate qualifier trees from nested records)
* **[–]** implement method to supply all types that are present in `_isa` but missing from
  `default_declarations`
* **[–]** consider to relegate private module exports to sub-key `testing` or similar
* **[–]** implement a type `forbidden` that, in contradistinction to established rules, does throw an error
  from its test method when a record with a field thusly marked is encountered; this is to ease transition
  when extransous fields are removed from record types
* **[–]** allow `create` methods on dotted type names (as in `create.posnaught.integer '4'`)
* **[–]** implement `base` argument for `create.integer()`, `create.cardinal()`
* **[–]** when Hengist-NG offers benchmarking, implement type CFG setting `cached` to allow for transparent
  caching of `create` method results; this is hoped to bring gains when frequently-called functions need a
  `cfg` argument
* **[–]** add type declaration setting to configure what should happen when a `create` method throws an
  error
* **[–]** implement `memo` API where type checks &c can leave data that are by-products of type-checking
  to enable users to avoid duplicating work already done
  * **[–]** do we have to think of ways to do this safely for asynchronous cases?
* **[–]** when `declaration.test` is the name of another type, use that type's create method, if any
* **[–]** re-name all test, create, validate methods of types `r.s.t` to include both method and type, as in
  `test.r.s.t`, `create.r.s.t`, `validate.r.s.t` &c


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
* **[+]** allow overrides <ins>when so configured</ins> but not of <del>`built_ins`?</del> the 'basetypes'
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
* **[+]** unify usage, orthography of 'built ins', 'builtins' (?), 'base type(s)', 'basetype(s)' ->
  'basetype(s)'
* **[+]** currently `basetype` is declared as `( ( typeof x ) is 'string' ) and ( x is 'optional' or
  Reflect.has built_ins, x )`
  * <del>checking for `string` is redundant</del> <ins>checking for `( ( typeof x ) is 'string' )` is *not*
    redundant as it prevents errors when `isa.basetype()` is called with a non-object value</ins>
  * should `optional` be included?
  * **[+]** fix wrong usage of `Reflect.has()` in `_isa.basetype()` (returns `true` for `toString`)
* **[+]** to fix implementation failure connected to RHS `optional` prefix:
  * **[+]** commit current state, mistakes and all
  * **[+]** identify and rip out all places concerned with `is_optional` and/or RHS `optional` prefix
  * **[+]** reduce tests such that valuable tests are preserved but ones using RHS `optional` prefix are
    skipped
  * **[+]** whatever the outcome, update docs
* **[+]** test whether basic types are immutable with instances of `Intertype_minimal`
* **[+]** in `_compile_declaration_object()`, call recursively for each entry in `declaration.fields`
* **[+]** find a way to avoid code duplication in handling of field `sub_tests` across all four test methods
  (`isa`, `isa.optional`, `validate`, `validate.optional`) <del>; can we bake those right into
  `declarations[ type ].test()`? But then what when more fields get declared?</del>
  * <del>this wouldn't pose a problem if we required that `intertype` instances be closed for further
    declarations before being used first; this could happen implicitly on first use</del>
  * <del>if we didn't want that, we'd have to re-formulate the declaration's test method each time a field
    is declared for a given type</del>
* **[+]** implement value creation for all the builtin types
* **[+]** when fields are declared but no `create()` method is given, generate a `create()` method that
  accepts any number of objects that, together with the template, will be condensed into one object using
  `Object.assign()`
* **[+]** test that template functions are called, even when used in template fields
* **[+]** we should use a recursive `merge()` method, call it `deepmerge()`, instead of `Object.assign()`
  when creating values from templates; this method should be exported for the benefit of users who want to
  implement their own `create()` method; conceivably, `deepmerge()` could / should beimplemented in
  `webguy.props`
* **[+]** implement method `evaluate.[typename] x`; like `isa` and `validate` methods, however does not
  shortcut on failure but runs through all tests, returns object with named results so one can see e.g.
  which fields did and which ones didn't conform
  * **[+]** if an `evaluate`d value is `null`, do we want the full complement of all the type's sub-fields
    in the result or is it better to just return `{ [type]: false, }`?
* **[+]** implement a generated field in `declarations` that eumerates all fully qualified field names that
  belong to the type in question; field generated by module-level method `walk_transitive_field_names()`
* **[+]** <del>would it be worth the effort to try and implement a 'permanent debugging' facility, one whose
  calls are left in the code (maybe in the form of specially formatted comments) and can be activated when
  needed? One could imagine those to produce a complete trace when activated that goes into an SQLite DB and
  can then be inspected and filtered as needed. This would obviously be outside the scope of the present
  package</del>
* **[+]** test that a declaration with fields defaults to `{ test: 'object', }`
* **[+]** implement `fields`
* **[+]** test that incorrect templates are rejected
* **[+]** consider to implement `nonempty.text()`, `nonempty.list()`, `empty.text()`, `empty.list()`; here,
  `empty` and `nonempty` are not types names of an object with fields, and the names after the dots are not
  field names; also, `isa.nonempty x` does not necessarily have to make sense so either it shouldn't be a
* **[+]** implement 'qualifiers' (as in `nonempty.text`) that look a lot like object fields but have a
  different `isa` method implementation
  * **[+]** qualifiers should be distinguished from `optional` which is and remains a prefix that can before
    any other legal (known, declared) (fully quylified) type name, so `isa.optional.nonempty.text x` may be
    legal but `isa.nonempty.optional.text x` won't
  function or, if it is one, it should throw an error when called, something that has always been ruled out
  so far
* **[+]** use prototypes of test methods `throws()` &c for new version of `guy-test`
* **[+]** use prototype of set equality for `equals()` implementation in `webguy`
* **[+]** allow `undefined`, `null` in `create` methods that result in record
* **[+]** implement `kind` to remember what type name, if any, was used as `test`

