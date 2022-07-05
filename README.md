
# InterType

A JavaScript type checker with helpers to implement own types and do object shape validation.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [InterType](#intertype)
  - [Type Declarations](#type-declarations)
  - [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# InterType

## Type Declarations

```coffee
types       = new ( require 'intertype' ).Intertype()
{ isa
  validate
  declare } = types
```

## To Do


* **[–]** make depth of hedgepaths configurable; default depth should be 0. **Hedges need an opt-in** by
  using *`hedgedepth`* or a *wildcard hedgepath pattern*, at instantiation time and/or declaration time.
* **[–]** implement sum types (a.k.a. tagged union, variant, variant record, choice type, discriminated
  union, disjoint union, or coproduct :-O) as in `isa.integer.or.optional.nonempty.text`
* **[–]** implement hedges `odd`, `even`; valid for `float`s but do imply those numbers will be integer
