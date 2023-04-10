

# InterType

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [API](#api)
  - [Declarations](#declarations)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# InterType

## API


* **`types.declare.T ...`**:

* **`types.validate.T x`**:

* **`types.size_of x`**:

* **`types.create.T`**:

* **`types.isa.T x`**:

* **`types.equals x, y`**: a 'deep equals' implementation (see
  [`jseq`](https://github.com/loveencounterflow/jseq), gleaned from
  [`jkroso/equals`](https://github.com/jkroso/equals))

* **`types.is_extension_of.T U`**: tests whether class `U` is derived from class `T`; this includes the case
  where `U` is just an alias for `T` (i.e. JS `U === T`); implemented as `is_extension_of: ( U, T ) -> U is
  T or (U::) instanceof T`


## Declarations

* **`isa`**: either the name of the type, an [`isa` method](??????????????????????????????????), a list of
  (preferrably named) [`isa` clauses](??????????????????????????????????), or an object with named [`isa`
  clauses](??????????????????????????????????).
* **`fields`**: in the case of an `object`, the fields with their type declarations.
* **`template`**: in the case of an `object`, the fields with their default values.
* **`plural`**: plural form of the name in case the automatic plural is not satisfactory.
* **`walk`**: on container types, a generator function that iterates over all elements.
* **`empty`**: on container types, a function that returns `true` when the container has no elements, and
  `false` otherwise. This function will be called when `types.isa.empty_T x` is requested.
* **`size`**: on container types, a function or the name of an attribute that returns the number of elements
  in the container. This will be used by `types.size_of x` requests.
* **`extras`**: on object types, a boolean to allow (`true`, the default) or forbids (`false`) additional
  properties on the object beyond those that are listed in `fields`. Only enumerable properties will be
  considered.
* **`freeze`**: one of `false` (the default), `shallow` or `deep` that indicates whether a call to
  `types.create.T()` should return an unfrozen, shallow-frozen or deep-frozen object.



