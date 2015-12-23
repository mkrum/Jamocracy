// Copyright 2013 Bowery Software, LLC
/**
 * @fileoverview Event builder.
 */


// Module Dependencies.
var assert = require('assert')
var Builder = require('./builder')

/**
 * @constructor
 */
function EventBuilder () {}


require('util').inherits(EventBuilder, Builder)


/**
 * Set event origin.
 * @param {string} collection
 * @param {string} key
 * @return {EventBuilder}
 */
EventBuilder.prototype.from = function (collection, key) {
  assert(collection && key, 'Collection and key required.')
  this.collection = collection
  this.key = key
  return this
}


/**
 * Set event type.
 * @param {string} type
 * @return {EventBuilder}
 */
EventBuilder.prototype.type = function (type) {
  assert(type, 'Type required.')
  this.type = type
  return this
}


/**
 * Set time range start.
 * @param {number} time
 * @return {EventBuilder}
 */
EventBuilder.prototype.start = function (time) {
  assert(!this.write, 'Invalid operation.')
  assert(time && typeof time == 'number', 'Time required (number).')
  this.startTime = time
  return this
}


/**
 * Set time range end.
 * @param {number} time
 * @return {EventBuilder}
 */
EventBuilder.prototype.end = function (time) {
  assert(!this.write, 'Invalid operation.')
  assert(time && typeof time == 'number', 'Time required (number).')
  this.endTime = time
  return this
}


/**
 * Set event timestamp.
 * @param {number} time
 * @return {EventBuilder}
 */
EventBuilder.prototype.time = function (time) {
  assert(time && typeof time == 'number', 'Time required (number).')
  this.timestamp = time
  return this
}


/**
 * Set event ordinal.
 * @param {number} order
 * @return {EventBuilder}
 */
EventBuilder.prototype.ordinal = function (order) {
  assert(['number', 'string'].indexOf(typeof(order)) !== -1, 'Ordinal must be a number or a string.')
  this.order = order
  return this
}


/**
 * Set event data.
 * @param {Object} data
 * @return {EventBuilder}
 */
EventBuilder.prototype.data = function (data) {
  assert(data, 'Data required.')
  this.data = data
  return this
}


/**
 * Set event limit.
 * @param {Number} limit
 * @return {EventBuilder}
 */
EventBuilder.prototype.limit = function (limit) {
  assert(limit, 'Limit required.')
  this.limit_value = limit
  return this
}


/**
 * Set "If-Match" header to the given ref value.
 * @param {String} ref
 * @return {EventBuilder}
 */
EventBuilder.prototype.ref = function (ref) {
  assert(ref, 'Ref required.')
  this.ref_value = ref
  return this
}


/**
 * Get an event.
 * @return {Promise}
 */
EventBuilder.prototype.get = function () {
  assert(this.collection, 'Collection required.')
  assert(this.key, 'Key required.')
  assert(this.type, 'Type required.')
  assert(this.timestamp, 'Timestamp required.')
  assert(this.order, 'Ordinal required.')
  return this._execute('get')
}

/**
 * List events.
 * @return {Promise}
 */
EventBuilder.prototype.list = function () {
  assert(this.collection, 'Collection required.')
  assert(this.key, 'Key required.')
  assert(this.type, 'Type required.')
  return this._execute('list')
}


/**
 * Create an data.
 * @return {Promise}
 */
EventBuilder.prototype.create = function () {
  assert(this.collection, 'Collection required.')
  assert(this.key, 'Key required.')
  assert(this.type, 'Type required.')
  return this._execute('post')
}


/**
 * Update an event.
 * @return {Promise}
 */
EventBuilder.prototype.update = function () {
  assert(this.collection, 'Collection required.')
  assert(this.key, 'Key required.')
  assert(this.type, 'Type required.')
  assert(this.timestamp, 'Timestamp required.')
  assert(this.order, 'Ordinal required.')
  assert(this.data, 'Data required.')
  return this._execute('put')
}


/**
 * Delete an event.
 * @return {Promise}
 */
EventBuilder.prototype.remove = function () {
  assert(this.collection, 'Collection required.')
  assert(this.key, 'Key required.')
  assert(this.type, 'Type required.')
  assert(this.timestamp, 'Timestamp required.')
  assert(this.order, 'Ordinal required.')
  return this._execute('del')
}


/**
 * Execute event read/write.
 * @param {string} method
 * @return {Object}
 * @protected
 */
EventBuilder.prototype._execute = function (method) {
  var query = {}, pathArgs = [this.collection, this.key, 'events', this.type]
  var header = {}
  if (method === 'del') query['purge'] = true
  if (method !== 'list') {
    if (this.ref_value)   header['If-Match'] = '"' + this.ref_value + '"'
    if (this.timestamp)   pathArgs.push(this.timestamp)
    if (this.order)       pathArgs.push(this.order)
  } else {
    if (this.limit_value) query['limit'] =        this.limit_value
    if (this.afterTime)   query['afterEvent'] =   this.afterTime
    if (this.endTime)     query['endEvent'] =     this.endTime
    if (this.startTime)   query['startEvent'] =   this.startTime
    if (this.beforeTime)  query['beforeEvent'] =  this.beforeTime
    method = 'get'
  }
  var url = this.getDelegate() && this.getDelegate().generateApiUrl(pathArgs, query)
  return this.getDelegate()['_' + method](url, this.data, header)
}


// Module Exports.
module.exports = EventBuilder
