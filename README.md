

# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


### Declaring New Types


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



