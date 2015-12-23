// Copyright 2013 Bowery Software, LLC
/**
 * @fileoverview Builder class. Defines methods used across
 * other builders.
 */


function Builder () {}


/**
 * Set delegate.
 * @param {Client} delegate
 * @return {Builder}
 */
Builder.prototype.setDelegate = function (delegate) {
  this.delegate = delegate
  return this
}


/**
 * Get delegate.
 * @return {Builder}
 */
Builder.prototype.getDelegate = function () {
  return this.delegate
}


/**
 * Set write boolean.
 * @param {boolean} write
 * @return {Builder}
 */
Builder.prototype.setWrite = function (write) {
  this.write = write
  return this
}


// Module Exports.
module.exports = Builder
