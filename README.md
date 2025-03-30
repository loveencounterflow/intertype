
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Declaring `Typespace`s](#declaring-typespaces)
- [InterType](#intertype-1)
  - [API](#api)
  - [`Type` Objects](#type-objects)
  - [Value Creation](#value-creation)
    - [Template Copying Procedure](#template-copying-procedure)
  - [Notation](#notation)
  - [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# InterType


* **Intertype Types**
  * are instances of class `Type`
  * **ISA method**:
    * When testing a value with, say, `types.isa std.integer, x`, `types.isa()` will internally call
      `std.integer.isa()`, where
      * `types` is a `Types` instance,
      * `std` is a `Typespace`,
      * `integer` is a `Type` declared in that typespace, and
      * `integer.isa()` is the type's ISA method.
    * An ISA method is a synchronous function `( x: any, t: Types ): boolean ->` that accepts two values:
      `x`, the value to be tested, and `t`, the `Types` instance used for testing.
    * Valid ISA methods must only return either `true` or `false` and must never throw an exception.
    * When used via `Intertype::isa()`, ISA methods will be called in the context of their respective typespace
      which means that inside an ISA method `@`&nbsp;/&nbsp;`this` can be used to refer to other types
      accessible from that typespace

* **Type declarations**: one of
  * an ISA method
  * the name of another type in the same or a parent typespace
  * an `Type` instance (from any typespace)
  * an `intertype_declaration_cfg` object

* fields of `intertype_declaration_cfg` objects:
  * `isa`: (optional) `intertype_declaration`; when `isa` is present, `fields` must not be set
  * `fields`: (optional) `object`; when `fields` is present, `isa` must not be set
  * `template`: (optional) `object`:
    * If `create()` is set, it may use the properties of the `template` object to create a new value of the
      respective type.
    * If `create()` is generated, the properties of `template` will be used as keys and values to initialize
      on a new object. No effort will be made to generate new property values from the property values of
      `template`, so if a value is not a JS primitive but for instance a list `[]`, then *that same `Array`
      object will be shared by all values created by the `create()` method of that type, **except** when the
      property is a function, in which case its return value will be used*. Therefore, the common way to
      have an (always new) empty list as default value for a field `foo`, declare `{ template: { foo: -> []
      }, }`. This is also the right way to make a function a field's default value.
  * `create`: (optional) `( P..., t ) ->`

## Declaring `Typespace`s


# InterType

## API

* `Intertype::isa: ( t: type, x: any ) ->`

* `Intertype::create: ( t: type, P...: [any] ) ->`

A call to `Intertype::create t, P...` will either:

* call the type `t`'s declared `create()` method, if present, or
* return a shallow copy

----------------------------------------

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



* `Intertype::validate: ( t: type, x: any ) ->`: synchronous, (almost) pure function that looks up
  the declaration of type `t`, and calls it with `x` as only argument; returns `true` if `x` is considered
  to be a value of type `t` and `false` otherwise; testing functions are forbidden to return anything else
  (no 'truthy' or 'falsey' values); they are allowed to be impure to the degree that they may leave data
  entries (hints or results) in `Intertype::memo`, a `Map`-like object

  * The motivation for this piece of memoization is expressed by the slogan ['parse, don't
    validate'](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/): for example, in a given
    type system, some strings (e.g. `4.5km` or `4e23s`) may look like literals of a number plus a unit and
    thus fulfill the requirements of a type `quantityliteral`; testing for the right format is probably best
    done with one or two regular expressions, possibly followed by a check whether the unit name is already
    entered in some registry. It would be a shame if a call to `isa 'quantityliteral', x` had to
    re-implement all the work that is expected of `parse 'quantityliteral', x`, or if the latter had to
    repeat all the lifting done by the former

* `Intertype::evaluate: ( t <type>, x <any> ) ->`: returns a flat object whose keys are typenames and whose values
  are either `true` or `false` depending on whether `x` satisfied the corresponding ISA method or not

<!--
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
-->

## `Type` Objects

* `Type::isa()`
* `Type::create()`
* `Type::fields <pod?>`
* `Type::template`

## Value Creation

In a type declaration, three properties—`create`, `fields` and `template`—determine whether and how a new
value of the declared type can be produced by `Intertype::create()`.

> *In the below tables*
> * *`?` indicates an optional type, so `something?` is `something` (any value except `null` or `undefined`)
>   or `nothing` (`null` or `undefined`, including the property not being set);*
> * *`pod` and 'POD' stand for 'Plain Old Dictionary (i.e. Object)', which is defined as an object whose
>   prototype is either `Object` or `undefined`, the former being the value of a JS object literal, the
>   latter being produced by `Object.create null`;*
> * *`notafunction` is a value of a type other than `null`, `undefined`, or a `function`;*
> * *`notapod` is a value of a type other than `null`, `undefined`, or a `pod`;*
> * *`ERR_TYPEDECL` indicates an error that will occur during the instantiation of a `Typespace` when a type
>   with the listed condition is encountered;*
> * *`ERR_CREATE` indicates an error that will occur when trying to call `Intertype::create()` with a type
>   whose declaration satisfies the given condition: the declaration is OK and the type is usable, but it's
>   not allowed to use the library to create a new value of this type.*

* In any event, the resulting value will be `validate`d using the type's ISA method:


* (**A**) In case `D.create` is a synchronous function, it will be called with the extraneous arguments `P`
  that are present in the call to `z = Intertype::create T, P...`, if any; its return value `z` will be
  validated using `Intertype::validate T, z`. The declaration's `create()` method is free to use
  `declaration.fields` and `declaration.template` as it sees fit.
* (**B**) Note that setting `create` to anything but a `function` and/or setting `fields` to anything but a
  `pod` will both result in compile-time errors:
* (**C**) In case `D.create` is not set (or set to `null` or `undefined`) and `fields` is set (to a POD), walk over
  the field declarations in `fields` and look up the corresponding values in `template` one by one; if the
  template field holds a function, call that function, otherwise use the field value as-is. Functions can
  only be set as return values from functions. Where `template` is missing a field, `Intertype::create()`
  will try to supply with the `create` method according to that field's declared type.
* (**D**) If `template` is not set, the effect is the same as setting `template` to a POD without any
  properties.
* (**E**) In case none of `create`, `fields` and `template` are set for a given type `T`'s declaration
  object `D`, then `Intertype::create T, P...` will fail with an error; (**F**) also, it is not allowed to
  set `template` to anything except `null` or `undefined` when neither `create` and `fields` are set.

|       | `create`       | `fields`     | `template`     | behavior of `Intertype::create T, P...` |
| ---   | :---------:    | :----------: | :------------: | :----------------------                 |
| **A** | `function`     | `pod?`       | `something?`   | call `D.create P...`                    |
| **B** | `notafunction` | `something?` | `something?`   | ❌ `ERR_TYPEDECL`                        |
| **B** | `function?`    | `notapod`    | `something?`   | ❌ `ERR_TYPEDECL`                        |

|       | `create`    | `fields`     | `template`     | behavior of `Intertype::create T, P...`    |
| ---   | :---------: | :----------: | :------------: | :----------------------                    |
| **C** | —           | `pod`        | `pod`          | create new object, set fields as per below |
| **D** | —           | `pod`        | —              | use `create()` methods of field types      |

|       | `create`    | `fields`     | `template`     | behavior of `Intertype::create T, P...` |
| ---   | :---------: | :----------: | :------------: | :----------------------                 |
| **E** | —           | —            | —              | ❌ `ERR_CREATE`                          |
| **F** | —           | —            | `something`    | ❌ `ERR_TYPEDECL`                        |

* As for what fields a composite POD type has, the Source of Truth is the `fields` property of the
  declaration, *not* the `template` property. The `template` property's fields will be examined as dictated
  by the enumerable key/value pairs of `fields`; where `template` is missing a field, it will be assumed
  that the field's declared type can be used to create a value (which may fail). `template` should not have
  an enumerable key that is not listed in `fields`.



### Template Copying Procedure

`Intertype::create()` will return either this value
(if it is a primitive value, including `undefined` and `null`), call it and use its return value (if
`declaration.template` is a synchronous function), or try to make a copy of it.


## Notation

* **Types** are indicated in *pointy brackets* behind variable and property names, as in `count <cardinal>`,
  `name <text>`.
* **Nullable Types** get a *question mark* behind the type name, as in `fields <pod?>`.
* **Class Properties** ar indicated with *a dot* between class and property name, as in
  `Intertype.primitive_types <list>`.
* **Instance Properties** are written with *a double colon* between class and property name:
  `Intertype::evaluate()`, or *a dot* between instance and property name: `types.evaluate()`.
* **Function Calls** are always written either *without parentheses* when they have one or more
  (comma-sparated) arguments: `Intertype::evaluate t <type>, x <any>`, or with an *empty pair of
  parentheses*: `Myclass::do_something()`, `x.do_something()`.
* The notation with *empty parens*, `f()`, is used both to indicate a function being called without
  arguments and to refer to a function in general, irrespective of how a correct set of arguments would have
  to look like.
* **Function Signatures** start with the *name* of the function, followed by a *colon* to indicate 'is
  defined as', followed by a *pair of parentheses* with typed, comma separated arguments, followed by an
  *arrow* to indicate a fucntion, as in `Intertype::evaluate: ( t <type>, x <any> ) ->`. In case the
  function discussed does not take any arguments, the *parentheses are omitted*, as in `Math.random: ->`.
  The return type may be indicated *behind the arrow*, as in `List::indexOf: ( x <anything> ) -> <integer>`.

## To Do

* **`[—]`** use API call rather than property access to retrieve memoized data
  * <del>**`[—]`** using `WeakMap` sounds right, but as so often, the use case leans heavily on primitive
    values (esp. strings), so using a `Map` promises to be much simpler</del>
  * <del>**`[—]`** if the need should arise, can later use a custom class to replace the plain `Map` to
    limit the number of cached values (this will likely involve storing a redundant list of keys so
    order-of-insertion can be traced w/o the need to compute and inspect `Map::keys()`—that would be OK if
    we were to drop the first entry but involves more work to find the most recent entry)</del>
  * <del>**`[—]`** with API call, might want to have to pass in `x`, test for identity in caching map; thus
    more than a single entry may be cached and repetitions that are far apart can still be served</del>
  * <del>**`[—]`** toggle to switch off caching altogether (on instantiation)?</del>
  * <del>**`[—]`** API call to clear caches?</del>
  * <del>**`[—]`** would be nice to have caching switch as declarative class property like type
    declarations</del>
  * <del>**`[—]`** should refuse to cache results of testing against mutable values</del>
  * **`[—]`** on closer inspection, caching acc. to the above turns out to be a snakes' nest, therefore: use
    API to cache explicitly in ordinary or custom (for size restriction) `Map` instance—the user is
    responsible for ensuring that cached entries stay relevant
  * **`[—]`** API is just API of `Map`:
    * `Intertype::memo.set: ( k, v ) ->`
    * `Intertype::memo.get: ( k ) ->`
    * `Intertype::memo.delete: ( k ) ->`
    * `Intertype::memo.has: ( k ) ->`
    * and so on, can always customize with bespoke class when deemed necessary; by setting
      `Intertype::memo = new Map()`, we already have a well-known, yet sub-classable API for free
  * **`[—]`** should make configurable whether values stored in `Intertype::memo` are the results of
    `parse` that should be
    * **`[—]`** **set** automatically whenever `parse()` returns a result
    * **`[—]`** **retrieved** automatically whenever `isa()`, `validate()` or `parse()` is called
    * important to separate the two concerns so users can automatically benefit from cached parsing and
      still decide whether to memoize a given result of `parse x` or not

* **`[—]`** would it be better to favor `list.empty` to express that empty lists are a subset of all lists?
  * **`[—]`** or favor `list_empty` to simplify parsing (e.g. in `[ 'nonempty_list', 'of', 'integer', ]` or
    `[ 'list_nonempty', 'of', 'integer', ]`, typenames then would occupy constant positions `0` and `2` with
    `of` in position `1`)
  * other relevant typenames include `integer_positive`, `text_blank`, `text_blank_ascii`, `text_nonempty`,
    `fraction_proper`

* **`[—]`** does it make sense to use formal prefixes to two `Intertype` instances?
  * that could look like `Intertype::isa 'foo.quantity', x` where `foo` is a namespace for type names;
    for simplicity's sake, only allow (or demand? as in `Intertype::isa 'std.integer', x`) single
    prefix
  * Maybe simpler and better to just say `types = { foo: ( new Foo_types() ), bar: ( new Bar_types() ), };
    types.foo.validate 'quux', x`, not clear where merging an advantage *except* where repetition of base
    types (`integer` in `types.foo` being identical to `integer` in `types.bar`) and their redundant
    prefixes is to be avoided

* **`[—]`** the fancy API should merge type specifiers and method names (or should it?), as in
  `Intertype::isa 'std.integer', x` becoming `Intertype_fancy::isa.std.integer x`

* **`[—]`** how to express concatenation in a generic way as in `list of ( nonempty list of integer )`?
  * **`[—]`** one idea is to restrict usage to declared, named types, i.e. one can never call
    \*`Intertype::isa 'list.of.integer', x` (using whatever syntax we settle on), one can only
    declare (and thereby name) a type (say, `intlist`) that is a `list.of.integer` and then call
    `Intertype::isa 'intlist', x`

* **`[—]`** how to express multiple refinements as in `blank nonempty text` or `positive1 even integer`?

* **`[—]`** how to express sum types as in `integer or integerliteral`?

* **`[—]`** rename `Intertype::types_of()` -> `Intertype::all_types_of()` to distinguish it better from
  `Intertype::type_of()`

* **`[—]`** implement versions of `type_of()`, `all_types_of()` that return the actual type objects, not the
  type names


