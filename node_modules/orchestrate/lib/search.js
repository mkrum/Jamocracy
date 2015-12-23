// Copyright 2013 Bowery Software, LLC
/**
 * @fileoverview Search builder.
 */


// Module Dependencies.
var assert = require('assert')
var Builder = require('./builder')
var BucketBuilder = require('./bucket_builder');

/**
 * @constructor
 */
function SearchBuilder () {}

var util = require('util');
util.inherits(SearchBuilder, Builder)


/**
 * Set collection.
 * @param {string} collection
 * @return {SearchBuilder}
 */
SearchBuilder.prototype.collection = function (collection) {
  assert(collection, 'Collection required.')
  this._collection = collection
  return this
}


/**
 * Set limit.
 * @param {number} limit
 * @return {SearchBuilder}
 */
SearchBuilder.prototype.limit = function (limit) {
  assert(limit, 'Limit required.')
  this._limit = limit
  return this
}


/**
 * Set offset.
 * @param {number} offset
 * @return {SearchBuilder}
 */
SearchBuilder.prototype.offset = function (offset) {
  assert.equal(typeof offset, 'number', 'Offset required.')
  this._offset = offset
  return this
}


/**
 * Set sort.
 * @param {string} field
 * @param {string} order
 * @return {SearchBuilder}
 */
SearchBuilder.prototype.sort = function (field, order) {
  assert(field, 'field required')
  assert(order, 'order required')
  if (field.indexOf('@path.') != 0) {
    // TODO we should NOT be doing this default prefixing!
    // removing will be a breaking change.
    field = 'value.' + field
  }
  var _sort = field + ':' + order
  if (this._sort) this._sort = [this._sort, _sort].join(',')
  else this._sort = _sort
  return this
}


/**
 * Add new aggregate parameter.
 * @param {string} type
 * @param {string} path
 * @param {array} args
 * @return {SearchBuilder}
 */
SearchBuilder.prototype.aggregate = function (type, path, args) {
  assert(type, 'type required');
  assert(path, 'path required');
  var parts = [ path, type ];
  if (typeof(args) === "string" || util.isArray(args)) {
    parts = parts.concat(args);
  }
  var _aggregate = parts.join(':');
  if (this._aggregate)
    this._aggregate = [this._aggregate, _aggregate].join(',');
  else
    this._aggregate = _aggregate;
  return this;
}

/**
 * Add new 'top_values' aggregate parameter.
 * @param {string} path
 * @param {number} offset
 * @param {number} limit
 * @return {SearchBuilder}
 */
 SearchBuilder.prototype.top_values = function (path, offset, limit) {
  if (typeof(offset) !== "undefined" && typeof(limit) !== "undefined") {
    return this.aggregate('top_values', path, "offset", offset, "limit", limit);
  }
  assert(
    typeof(offset) === "undefined" && typeof(limit) === "undefined",
    "offset or limit params must be included together, or not at all"
  );
  return this.aggregate('top_values', path);
 }

/**
 * Add new 'stats' aggregate parameter.
 * @param {string} path
 * @return {SearchBuilder}
 */
 SearchBuilder.prototype.stats = function (path) {
  return this.aggregate('stats', path);
 }

 /**
 * Add new 'range' aggregate parameter.
 * @param {string} path
 * @param {array|function} buckets
 * @return {SearchBuilder}
 */
 SearchBuilder.prototype.range = function (path, buckets) {
  var _buckets = buckets;
  if (typeof(buckets) === 'function') {
    _buckets = buckets(new BucketBuilder());
    if (_buckets.build) _buckets = _buckets.build();
  }

  return this.aggregate('range', path, _buckets);
 }

 /**
 * Add new 'distance' aggregate parameter.
 * @param {string} path
 * @param {array|function} buckets
 * @return {SearchBuilder}
 */
SearchBuilder.prototype.distance = function (path, buckets) {
  var _buckets = buckets;
  if (typeof(buckets) === 'function') {
    _buckets = buckets(new BucketBuilder());
    if (_buckets.build) _buckets = _buckets.build();
  }

  return this.aggregate('distance', path, _buckets);
 }

 /**
 * Add new 'time_series' aggregate parameter. The 'time' param, which must be
 * one of ('year', 'quarter', 'month', 'week', 'day', or 'hour'), determines
 * the bucketing interval for the time-series. The optional timezone param,
 * if present, must begin with a "+" or "-" character, followed by four digits
 * representing the hours and minutes of offset, relative to UTC. For example,
 * Eastern Standard Time (EST) would be represented as "-0500", since the time
 * in EST is five hours behind that of UTC.
 *
 * @param {string} path
 * @param {string} time
 * @param {string} timezone
 * @return {SearchBuilder}
 */
 SearchBuilder.prototype.time_series = function (path, time, timezone) {
  if (typeof(timezone) === "undefined") {
    return this.aggregate('time_series', path, time);
  } else {
    return this.aggregate('time_series', path, [ time, timezone ]);
  }
 }

 /**
  * Sets the 'kind' to search. Currently, Orchestrate defaults to
  * searching only kv 'item's in the collection. To search only
  * 'event' objects in the collection:
  * searchBuilder.kinds('event')
  * To search both 'event' and 'item' kinds, call with both:
  * searchBuilder.kinds('item', 'event')
  *
  * @param {string} The Orchestrate 'kind' to be included ('item' or 'event').
  * @return {SearchBuilder}
  */
 SearchBuilder.prototype.kinds = function () {
   var kinds = []
   assert(arguments.length > 0, 'At least one kind required.')
   for (var i=0; i<arguments.length; i++) {
     var kind = arguments[i]
     assert(kind === 'event' || kind === 'item' || kind === 'relationship', "'item', 'event', or 'relationship' required.")
     kinds.push(kind)
   }
   this._kinds = kinds
   return this
}

/**
 * Set query and send the search request to Orchestrate.
 *
 * @param {string} query
 * @return {SearchBuilder}
 */
SearchBuilder.prototype.query = function (query) {
  assert(query, 'Query required.')
  this._query = query
  return this._execute('get')
}


/**
 * Execute search.
 * @return {Object}
 * @protected
 */
SearchBuilder.prototype._execute = function (method) {
  assert(this._query, 'Query required.')
  var pathArgs = []
  if (this._collection) {
    pathArgs.push(this._collection);
  }
  var query = this._query
  if (this._kinds) {
    query = '@path.kind:('+this._kinds.join(' ')+') AND (' + this._query + ')'
  }
  var url = this.getDelegate() && this.getDelegate().generateApiUrl(pathArgs, {
    query: query,
    limit: this._limit,
    offset: this._offset,
    sort: this._sort,
    aggregate: this._aggregate
  })

  return this.getDelegate()['_' + method](url)
}


// Module Exports.
module.exports = SearchBuilder
