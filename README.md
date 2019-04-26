

# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


## Concepts

* what is a type
* fundamental types vs. domain types
* `isa`
* `validate`
* `type_of`
* `types_of`

* Types are defined using an ordered set of (one or more) named boolean test functions known as 'aspects'.
  In order for a value `x` to be of type `T`, all aspects—when called in their defined order with `x` (and
  possibly other arguments, see below)—have to return `true`. Aspect satisfication tests are done in a lazy
  fashion, so that no tests are performed after one has failed. Likewise for type validation, the difference
  being that the first failing aspect will cause an error to thrown that quotes the aspect's name.

* Types may be parametrized. For example, there's a 'partial' type `multiple_of` which needs a module (a
  number to be a multiple of) as extra parameters; thus, we can test `isa.multiple_of 121, 11`.

* In InterType, a 'type' is, on the one hand, essentially an ordered set of aspects; on the other hand,
  since within the context of a given InterType instance, each type corresponds to exactly one type name (a
  nonempty text), a 'type' can be identified with a string. Thus, the type of, say, `[]` *is* `'list'` (i.e.
  the string that spells its name).

  Conversely, any list of functions that **1)**&nbsp;can be called with a value as first arguments (possibly
  plus a number of extra parameters), that **2)**&nbsp;never throws an error and **3)**&nbsp;always returns
  a Boolean value can be regarded as a list of aspects, hence defining a (possibly empty) set of values.


## Usage

[WIP]

One usage pattern for InterType is to make it so that one (sub-) project gets a module—call it `types`—that
is dedicated to type declarations; `require`ing that `types` module then makes type checking and type
validation methods available. Say we have:

```coffee
# in module `types.coffee`

# instantiate InterType instance, export its methods to `module.exports` in one go:
intertype = new ( require 'intertype' ) module.exports

# now you can call methods of InterType instance as *module* methods:
@declare 'mytype', ( x ) -> ( @isa number ) and ( x > 12 ) and ( x <= 42 )
```

In another module:

```coffee
# now use the declared types:
{ isa, type_of, validate, } = require './types'

console.log isa.integer     100   # true
console.log isa.mytype      20    # true
console.log isa.mytype      100   # false
console.log type_of         20    # 'number'
console.log validate.mytype 20    # true
console.log validate.mytype 100   # throws "not a valid mytype"
```

## Declaring New Types

`intertype.declare()` allows to add new type specifications to `intertype.specs`. It may be called with one
to three arguments. The three argument types are:

* `type` is the name of the new type. It is often customary to call `intertype.declare 'mytype', { ... }`,
  but it is also possible to name the type within the spec and forego the first argument, as in
  `intertype.declare { type: 'mytype', ... }`.

* `spec` is an object that describes the type. It is essentially what will end up in `intertype.specs`, but
  it will get copied and possibly rewritten in the process, depending on its content and the other
  arguments. The `spec` object may have a property `type` that names the type to be added, and a property
  `tests` which, where present, must be an object with one or more (duh) tests. It is customary but not
  obligatory to name a single test `'main'`. In any event, *the ordering in which tests are executed is the
  ordering of the properties of `spec.tests`* (which corresponds to the ordering in which those tests got
  attached to `spec.tests`). The `spec` may also have further attributes, for which see below.

* `test` is an optional boolean function that accepts one or more arguments (a value `x` to be tested and
  any number of additional parameters `P` where applicable; together these are symbolized as `xP`) and
  returns whether its arguments satisfy a certain condition. The `test` argument, where present, will be
  registered as the 'main' (and only) test for the new type, `spec.tests.main`. The rule of thumb is that
  when one wants to declare a type that can be characterized by a single, concise test, then giving a single
  anonymous one-liner (typically an arrow function) is OK; conversely, when a complex type (think:
  structured objects) needs a number of tests, then it will be better to write a suite of named tests (most
  of them typically one-liners) and pass them in as properties of `spec.tests`.

The call signatures are:

* `intertype.declare spec`—In this form, `spec` must have a `type` property that names the new type, as well
  as a `tests` property.

* `intertype.declare type, spec`—This form works like the above, except that, if `spec.type` is set, it must
  equal the `type` argument. It is primarily implemented for syntactical reasons (see examples).

* `intertype.declare type, test`—This form is handy for declaring types without any further details: you
  just name it, define a test, done. For example, to declare a type for positive numbers: `@declare
  'positive', ( x ) => ( @isa.number x ) and ( x > 0 )`. Also see the next.

* `intertype.declare type, spec, test`—This form is handy for declaring types with a minimal set of details
  and a short test. For example, to define a type for NodeJS buffers: `@declare 'buffer', { size: 'length',
  },  ( x ) => Buffer.isBuffer x` (here, the `size` spec defines how InterType's `size_of()` method should
  deal with buffers).


## To Do

* [x] Allow to pass in target object at instantiation, so e.g. `new intertype @` will cause all InterType
  methods to become available on target as `@isa()`, `@validate` and so on.

* [x] Rename `export_modules()` to `export()`, allow target object (e.g. `module.exports`) to be passed in.

* [ ] Add types `empty`, `nonempty`, ...

* [ ] Implement method to iterate over type names, specs.






