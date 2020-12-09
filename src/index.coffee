'use strict'

# do =>
#   INTERTYPE = require './main.js'
#   if globalThis.window?
#     globalThis.Intertype = INTERTYPE.Intertype
#   else
#     module.exports = INTERTYPE
#   return null
module.exports = require './main.js'
