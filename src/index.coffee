'use strict'

do =>
  Intertype = require './main.js'
  if globalThis.window?
    globalThis.Intertype = Intertype
  else
    module.exports = Intertype
  return null

