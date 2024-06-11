(function() {
  /*

  Patterns to recognize some literals

  * **`patterns.only.float`**:
    * **NOTE** one could think that float literals, being so ubiquitous in programming languages, are a
      'solved problem' in terms of a widely shared set of views of what should and what should not constitute
      a valid representation of an optionally signed, optionally fractional, optionally exponentiated
      numerical value, but not so. Some standards are too rigid, e.g. JSON does not allow plus signs in front
      of number literals; some standards are like early internet RFCs in that they want to allow any bad idea
      that any programmer has ever come up with, intentionally, out of sloppyness or due to a misguided sense
      of 'efficiency' (as in, `123` is an integer literal but `123.` is a float—we just saved the world by
      omitting a `0`). At other times, sensible things like using optional leading zeros have been frustrated
      by the equally misguided idea of engineers of old that leading zeros should indicate octal literals.
      After some deliberation, we settled on the below set of accepted and rejected literals, here shown as
      examples. In the end, `patterns.only.float` will recognize almost anything for which the JS `eval()`
      function returns a numerical value (to the exclusion of `Infinity` and trailing decimal points).
    * `patterns.only.float` will **recognize** literals that look like the following examples:
      * `123`
      * `123.45`
      * `45e43`
      * `.45`
      * `.45e43`
      * `.45e+43`
      * `.45e-43`
      * `+.45`
      * `+.45e43`
      * `+.45e+43`
      * `+.45e-43`
      * `-.45`
      * `-.45e43`
      * `-.45e+43`
      * `-.45e-43`
      * `123e3`
      * `123.0e3`
      * `123.4e3`
      * `+3`
      * `3.2e23`
      * `-4.70e+9`
      * `-.2E-4`
      * `-7.6603`
    * `patterns.only.float` will **reject** literals that look like the following examples:
      * `+0003`:       JS errors with `Octal literals are not allowed in strict mode`
      * `0003`:        JS errors with `Octal literals are not allowed in strict mode`
      * `-0003`:       JS errors with `Octal literals are not allowed in strict mode`
      * `4567.`:       sole trailing dot with no decimals considered bad habit
      * `e123`:        JS errors with `e123 is not defined`
      * `e-4`:         JS errors with `e is not defined`
      * `.e4`:         JS errors with `Unexpected token '.'`
      * `.45e-43.2`:   JS errors with `Unexpected number`
      * `45e4৩`:       JS errors with `Invalid or unexpected token`
      * `37.e88`:      sole trailing dot before the e/E-marked exponent considered bad habit
      * `123.4.e3`:    JS parses this as attribute access, return `undefined`; it evaluates but should've
        never been allowed in the first place; JS does allow stuff like `false.d`, `/./.d` &c but these are
        arguably more border cases / quirks / warts than useful, clear notations

   */
  this.patterns = {
    any: {},
    only: {}
  };

  //-----------------------------------------------------------------------------------------------------------
  /* thx to https://stackoverflow.com/a/51790561/7568091 */
  /* ///^[-+]?([0-9]*[.])?[0-9]+([eE][-+]?[0-9]+)?$/// */
  this.patterns.any.float = /[-+]?(?:([1-9][0-9]*[.])[0-9]+|([.])[0-9]+|([1-9][0-9]*))([eE][-+]?[0-9]+)?/u;

  this.patterns.only.float = RegExp(`^${this.patterns.any.float.source}$`, "u");

  this.patterns.only.float_and_rest = RegExp(`^(?<float>${this.patterns.any.float.source})(?<rest>.*)$`, "u");

}).call(this);

//# sourceMappingURL=patterns.js.map