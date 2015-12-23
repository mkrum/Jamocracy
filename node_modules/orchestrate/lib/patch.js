// Copyright 2014 Orchestrate, Inc.

// Module Dependencies.
var assert = require('assert');
var Builder = require('./builder');

/**
 * @constructor
 */
function PatchBuilder (collection, key) {
  this._collection = collection;
  this._key = key;
  this._ops = [];
}

require('util').inherits(PatchBuilder, Builder);

/**
 * Add a value at the given path in the JSON document
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object} value - Value to store at the given path
 */
PatchBuilder.prototype.add = function (path, value) {
  assert(path, 'Add requires a path parameter.');
  this._ops.push({"op": "add", "path": path, "value": value});
  return this;
};

/**
 * Remove a value from the given path in the JSON document
 * @param {string} path - JSON document path; delimited by periods or slashes
 */
PatchBuilder.prototype.remove = function (path) {
  assert(path, 'Remove requires a path parameter.');
  this._ops.push({"op": "remove", "path": path});
  return this;
};

/**
 * Replace a value at the given path in the JSON document
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object} value - Value to replace at the given {path}
 */
PatchBuilder.prototype.replace = function (path, value) {
  assert(path, 'Replace requires a path parameter.');
  this._ops.push({"op": "replace", "path": path, "value": value});
  return this;
};

/**
 * Move a value at from one path in the JSON document to another path
 * @param {string} from - Source from which to move the value
 * @param {string} path - Destination document path for the value
 */
PatchBuilder.prototype.move = function (from, path) {
  assert(from && path, 'Move requires from and path parameters.');
  this._ops.push({"op": "move", "from": from, "path": path});
  return this;
};

/**
 * Copy a value at from one path in the JSON document to another path
 * @param {string} from - Source path from which to copy the value
 * @param {string} path - Destination path for the value
 */
PatchBuilder.prototype.copy = function (from, path) {
  assert(from && path, 'Copy requires from and path parameters.');
  this._ops.push({"op": "copy", "from": from, "path": path});
  return this;
};

/**
 * Test equality of a value at the specified JSON document path
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object} value - Value to compare against
 * @param {boolean} negate - true if the test should be negated
 */
PatchBuilder.prototype.test = function (path, value, negate) {
  assert(path, 'Test requires a path parameter.');
  var op = {"op": "test", "path": path, "value": value};
  if (negate === true) op.negate = true;
  this._ops.push(op);
  return this;
};

/**
 * Test NON-equality of a value at the specified JSON document path
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object} value - Value to compare against
 */
PatchBuilder.prototype.testNot = function (path, value) {
  return this.test(path, value, true);
};

/**
 * Increase the value at the specified JSON document path by the given number
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object} value - Number by which to increase the value
 */
PatchBuilder.prototype.inc = function (path, value) {
  assert(path, 'Inc requires a path parameter.');
  var op = {
    op: "inc",
    path: path,
  };
  if (value) op.value = value;
  this._ops.push(op);
  return this;
};

/**
 * Init the value at the specified JSON document path to the given value
 * ONLY if there isn't already a value there.
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object} value - Value to initialize the path to (if not present).
 */
PatchBuilder.prototype.init = function (path, value) {
  assert(path, 'Init requires a path parameter.');
  assert(value !== undefined, 'Init requires a value parameter.');
  this._ops.push({"op": "init", "path": path, "value": value});
  return this;
};

/**
 * Append the given value to an Array at the specified JSON document path.
 * If value is an Array, all items in the Array will be appended to the target
 * Array. Otherwise, the single value will be appended.
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object|Array} value - Value(s) to append to the Array.
 */
PatchBuilder.prototype.append = function (path, value) {
  assert(path, 'Append requires a path parameter.');
  assert(value !== undefined, 'Append requires a value parameter.');
  this._ops.push({"op": "append", "path": path, "value": value});
  return this;
};

/**
 * Merge the given value with an Object at the specified JSON document path.
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {Object|Array} value - Value to merge in.
 */
PatchBuilder.prototype.merge = function (path, value) {
  assert(path, 'Merge requires a path parameter.');
  assert(value !== undefined, 'Merge requires a value parameter.');
  this._ops.push({"op": "merge", "path": path, "value": value});
  return this;
};

/**
 * Apply the given value as a patch against an Object at the specified JSON document path.
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {PatchBuilder|Array} value - Patch ops to apply.
 * @param {boolean} conditional - true if this nested patch op is conditional,
 *        meaning the test ops in this nested patch's ops list will only be used
 *        to determine whether the nested patch will be applied, but will not
 *        fail the overall patch operation.
 */
PatchBuilder.prototype.patch = function (path, value, conditional) {
  assert(path, 'Patch Op requires a path parameter.');
  assert(value !== undefined, 'Patch Op requires a value parameter.');
  assert(Array.isArray(value) || value instanceof PatchBuilder,
    'Patch Op value must be an Array of ops or a PatchBuilder.');
  var ops = value._ops || value;
  var op = {"op": "patch", "path": path, "value": ops};
  if (conditional === true) op.conditional = true;
  this._ops.push(op);
  return this;
};

/**
 * Convenience method for creating a conditional nested patch op. Just calls
 * PatchBuilder.prototype.patch with 'true' for the conditional argument.
 * @param {string} path - JSON document path; delimited by periods or slashes
 * @param {PatchBuilder|Array} value - Patch ops to apply.
 */
PatchBuilder.prototype.patchIf = function (path, value) {
  return this.patch(path, value, true);
}

/**
 * Make this patch an 'upsert'. If the key does not exist in the collection,
 * it will be created as an empty Json Object, then the patch applied.
 * Call with true or with no argument to enable upsert. The default behavior
 * is non-upsert, where the response will be 404 if trying to patch a key
 * that does not exist.
 *
 * @param {boolean} upsert - true to make this patch an upsert.
 */
PatchBuilder.prototype.upsert = function (upsert) {
  this._upsert = upsert !== false;
  return this;
}

/**
 * return {Promise}
 */
PatchBuilder.prototype.apply = function (match) {
  assert(this.getDelegate(), 'No client delegate assigned');
  return this.getDelegate().patch(this._collection, this._key, this._ops,
    {match:match,upsert:this._upsert === true})
};


// Module Exports.
module.exports = PatchBuilder;
