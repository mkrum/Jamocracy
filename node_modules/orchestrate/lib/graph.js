// Copyright 2013 Bowery Software, LLC
/**
 * @fileoverview Graph relation builder.
 */


// Module Dependencies.
var assert = require('assert')
var util = require('util')
var Builder = require('./builder')


/**
 * @constructor
 */
function GraphBuilder () {}


util.inherits(GraphBuilder, Builder)


/**
 * Get a relationship.
 * @return {GraphBuilder}
 */
GraphBuilder.prototype.get = function () {
  this._method = 'get'
  return this
}


/**
 * Create new relationship.
 * @return {GraphBuilder}
 */
GraphBuilder.prototype.create = function () {
  this._method = 'put'
  return this
}


/**
 * Set graph data.
 * @param {Object} data
 * @return {GraphBuilder}
 */
GraphBuilder.prototype.data = function (data) {
  assert(data, 'Data required.')
  this.data = data
  return this
}


/**
 * Set "If-Match" header to the given ref value.
 * @param {String|boolean} ref. String ref for conditional update, or false
 *        for insert-if-absent (ie fail create if already present)
 * @return {GraphBuilder}
 */
GraphBuilder.prototype.ref = function (ref) {
  assert(typeof ref === 'string' || typeof ref === 'boolean', 'Ref required.')
  this.ref = ref
  return this
}


/**
 * Delete a relationship.
 * @return {GraphBuilder}
 */
GraphBuilder.prototype.remove = function () {
  this._method = 'del'
  return this
}


/**
 * Set graph origin.
 * @param {string} collection
 * @param {string} key
 * @return {GraphBuilder}
 */
GraphBuilder.prototype.from = function (collection, key) {
  assert(collection && key, 'Collection and key required.')
  this.collection = collection
  this.key = key
  return this
}


/**
 * Set graph relation.
 * @param {string} kind
 * @return {GraphBuilder}
 */
GraphBuilder.prototype.related = function (kind) {
  assert(kind, 'Kind of relation required.')

  // Hoist the kind argument into an array.
  if (util.isArray(kind)) {
    this.kind = kind;
  } else {
    this.kind = Array.prototype.slice.call(arguments, 0)
  }

  // Make sure that the kind array is non-empty, and that its elements are non-empty strings.
  assert(this.kind.length > 0, 'Kind of relation required.')
  for (var i = 0; i < this.kind.length; i++) {
    var k = this.kind[i];
    assert(typeof(k) === "string" && k.length > 0, 'Kind must be a non-empty string')
  }

  // Call the execute method in any of these scenarios:
  // (1) This is a read-only GraphBuilder, with toCollection & toKey empty. The execute
  //     function will list (GET) all related items for the collection & key.
  // (2) This is a read-only GraphBuilder, with toCollection & toKey non-empty. The
  //     execute function will retrieve (GET) the data of a specific relationship.
  // (3) This is a write-only GraphBuilder, with toCollection & toKey non-empty. The
  //     execute function will submit (PUT) a new relationship.
  if (!this.write || (this.toCollection && this.toKey)) {
    return this._execute(this._method)
  }
  // Without toCollection and toKey on this write-only GraphBuilder, just return
  // the builder, since there are still missing params.
  return this
}


/**
 * Set graph destination.
 * @param {string} toCollection
 * @param {string} toKey
 * @return {Object}
 */
GraphBuilder.prototype.to = function (toCollection, toKey) {
  assert(toCollection && toKey, 'toCollection and toKey required.')
  this.toCollection = toCollection
  this.toKey = toKey

  // Call the execute method only if the relationship kind has already been set.
  // Otherwise, just return the builder, since there ae still missing params.
  if (this.kind) {
    return this._execute(this._method)
  }
  return this
}


/**
 * Set graph result limit.
 * @param {Number} limit
 * @return {Object}
 */
GraphBuilder.prototype.limit = function (limit) {
  assert(limit || limit == 0, 'Limit required.')
  this.limit_value = limit
  return this
}


/**
 * Set graph result offset.
 * @param {Number} offset
 * @return {Object}
 */
GraphBuilder.prototype.offset = function (offset) {
  assert.equal(typeof offset, 'number', 'Offset required.')
  this.offset_value = offset
  return this
}


/**
 * Quote the provided string if not already quoted.
 * @param {string} str
 * @return {string}
 * @protected
 */
GraphBuilder.prototype._quote = function (str) {
  return str.charAt(0) == '"' ? str : '"' + str + '"'
}


/**
 * Execute graph read/write.
 * @param {string} method
 * @return {Object}
 * @protected
 */
GraphBuilder.prototype._execute = function (method) {
  // Make sure we have a from item key
  assert(this.collection && this.key, "'from' collection and key required.")

  // Make sure that the kind array is non-empty, and that its elements are non-empty strings.
  assert(this.kind && this.kind.length > 0, 'Kind of relation required.')
  for (var i = 0; i < this.kind.length; i++) {
    var k = this.kind[i];
    assert(typeof(k) === "string" && k.length > 0, 'Kind must be a non-empty string')
  }

  // Create an array of path components.
  var pathArgs = []
  pathArgs.push(this.collection)
  pathArgs.push(this.key)
  // The 'relation' path component is used for creating and retrieving individual relations.
  // The 'relations' path component is used for traversing single-hop or multi-hop relationships.
  if (this.write || (this._method === "GET" && this.toCollection && this.toKey)) {
    pathArgs.push('relation')
  } else {
    pathArgs.push('relations')
  }
  pathArgs = pathArgs.concat(this.kind)

  // Destination collection and key are only mandatory during PUT and (non-listing) GET.
  if (this.toCollection) pathArgs.push(this.toCollection)
  if (this.toKey) pathArgs.push(this.toKey)

  // Build the querystring
  var query = {}
  if (this._method == 'del') query['purge'] = true
  if (this.limit_value)      query['limit'] = this.limit_value
  if (this.offset_value)     query['offset'] = this.offset_value

  // Build headers
  var header = {}
  if (typeof(this.ref) === 'string') {
    header['If-Match'] = this._quote(this.ref)
  } else if (typeof(this.ref) === 'boolean' && this.ref === false) {
    header['If-None-Match'] = '"*"'
  }

  // Build the URL and return a callable delegate for this request
  var url = this.getDelegate() && this.getDelegate().generateApiUrl(pathArgs, query)
  return this.getDelegate()['_' + this._method](url, this.data, header)
}


// Module Exports.
module.exports = GraphBuilder
