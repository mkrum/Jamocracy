// Copyright 2013 Bowery Software, LLC
/**
 * @fileoverview Orchestrate API Client.
 */


// Module Dependencies.
var request = require('request')
var url = require('url')
var Q = require('kew')
var assert = require('assert')
var SearchBuilder = require('./search')
var parseLinks = require('parse-link-header')
var GraphBuilder = require('./graph')
var EventBuilder = require('./event')
var PatchBuilder = require('./patch')
var pjson = require('../package.json')

/**
 * Creates an instance of Client which can be used to access
 * the Orchestrate API.
 *
 * @constructor
 * @param {string} token
 * @param {string} apiEndpoint
 */
function Client (token, apiEndpoint) {
  assert(token, 'API key required.');
  if (!(this instanceof Client)) {
    return new Client(token, apiEndpoint);
  }

  /**
   * HTTP content-type.
   * @type {string}
   */
  this.contentType = 'application/json';

  /**
   * API token used for HTTP Authentication.
   * @type {string}
   * @protected
   */
  this._token = token;

  /**
   * API Endpoint used for connecting to DB.
   * @type {string}
   * @protected
   */
  this._apiEndPoint = apiEndpoint || this.constructor.ApiEndPoint;

  /**
   * Identifies the orchestrate.js client as the UserAgent to Orchestrate Service.
   * @type {string}
   * @protected
   */
  this._userAgent = 'orchestrate.js/' + pjson.version + ' (Bowery.io; node.js ' + process.version + ')';
}

Client.ApiEndPoint = 'api.orchestrate.io'

Client.ApiProtocol = 'https:';

/**
 * Api version
 * @enum {string}
 */
Client.ApiVersion = 'v0';


/**
 * Get data from collection by key-value.
 * @param {string} collection
 * @param {string} key
 * @return {Promise}
 */
Client.prototype.get = function (collection, key, ref) {
  assert(collection && key, 'Collection and key required.');
  if (!ref) {
    return this._get(this.generateApiUrl([collection, key]));
  } else {
    return this._get(this.generateApiUrl([collection, key, 'refs', ref]));
  }
}


/**
 * Get list of data from collection.
 * @param {string} collection
 * @param {object} params Listing params (startKey,afterKey,beforeKey,endKey)
 * @param {string} startKey
 * @param {string} endKey
 * @return {Promise}
 */
Client.prototype.list = function (collection, params) {
  assert(collection, 'Collection required.')
  if (typeof params == 'number') { //deprecated, prefer passing map params.
    params = {limit:params}
  }
  return this._get(this.generateApiUrl([collection], params))
}


/**
 * Get list of refs associated with a key from a collection.
 * @param {string} collection
 * @param {object} params Listing params (limit,offset,values)
 * @return {Promise}
 */
Client.prototype.list_refs = function (collection, key, params) {
  assert(collection && key, 'Collection and key required.')
  if (typeof params == 'number') { //deprecated, prefer passing map params.
    params = {limit:params}
  }
  return this._get(this.generateApiUrl([collection, key, 'refs'], params))
}


/**
 * Insert a key-value, allowing the server to generate a random key
 * @param {string} collection
 * @param {Object} data
 */
Client.prototype.post = function (collection, data) {
  assert(collection && data, 'Collection and JSON object required.')
  return this._post(this.generateApiUrl([collection]), data);
}


/**
 * Put data in collection by key-value
 * @param {string} collection
 * @param {string} key
 * @param {Object} data
 * @param {string|boolean} match
 * @return {Promise}
 */
Client.prototype.put = function (collection, key, data, match) {
  assert(collection && key && data, 'Collection, key, and JSON object required.')
  var header = {}
  if (typeof match == 'string') header['If-Match'] = this._quote(match)
  else if (typeof match == 'boolean' && match === false) header['If-None-Match'] = '"*"'
  return this._put(this.generateApiUrl([collection, key]), data, header)
}


/**
 * Merge a JSON document into an existing key
 * @param {string} collection
 * @param {string} key
 * @param {Object} data
 * @param {Object} options - Map with the following possible entries:
 *       {string} match - the item ref used to check for concurrent update (ie to make
 *               sure the item was not changed and the patch is applying to
 *               the right version of the item).
 *       {boolean} upsert - set to true if this patch should be treated as an
 *               insert when the item is not present.
 *
 * @return {Promise}
 */
Client.prototype.merge = function (collection, key, data, options) {
  assert(collection && key && data, 'Collection, key and JSON object required.')
  options = options || {}
  if (typeof options === 'string') {
    // legacy behavior, 4th arg was the 'match' ref string.
    options = {match:options}
  }
  var match = options.match;
  var upsert = options.upsert === true;
  var header = {'Content-Type': 'application/merge-patch+json'}
  if (typeof match == 'string') header['If-Match'] = this._quote(match)
  return this._patch(this.generateApiUrl([collection, key], {upsert:upsert}), data, header)
}

/**
 * Patch a JSON document using a specific set of operations
 * @param {string} collection
 * @param {string} key
 * @param {[Object]} patchOps array of operations; see http://orchestrate.io/docs/apiref#keyvalue-patch
 * @param {Object} options - Map with the following possible entries:
 *       {string} match - the item ref used to check for concurrent update (ie to make
 *               sure the item was not changed and the patch is applying to
 *               the right version of the item).
 *       {boolean} upsert - set to true if this patch should be treated as an
 *               insert when the item is not present.
 * @return {Promise}
 */
Client.prototype.patch = function (collection, key, patchOps, options) {
  assert(collection && key && patchOps, 'Collection, key and JSON object required.')
  assert(patchOps.length > 0, 'At least one operation is required in a patch operation.');

  options = options || {}
  if (typeof options === 'string') {
    // legacy behavior, 4th arg was the 'match' ref string.
    options = {match:options}
  }
  var match = options.match;
  var upsert = options.upsert === true;
  var header = {'Content-Type': 'application/json-patch+json'}
  if (typeof match == 'string') header['If-Match'] = this._quote(match)
  return this._patch(this.generateApiUrl([collection, key], {upsert:upsert}), patchOps, header)
}


/**
 * Remove data from collection by key-value.
 * @param {string} collection
 * @param {string} key
 * @param {boolean} purge
 * @return {Promise}
 */
Client.prototype.remove = function (collection, key, purge) {
  assert(collection && key, 'Collection and key required.')
  return this._del(this.generateApiUrl([collection, key], {purge: purge}))
}


/**
 * Search collection by key.
 * @param {string} collection
 * @param {string} query
 * @param {Object} options (Optional)
 * @return {Promise}
 */
Client.prototype.search = function (collection, query, options) {
  assert(collection && query, 'Collection and query required.')
  options = options || {}
  options.query = query;
  return this._get(this.generateApiUrl([collection], options))
}


/**
 * Search across collections by key.
 * @param {string} query
 * @param {Object} options (Optional)
 * @return {Promise}
 */
Client.prototype.searchAcrossCollections = function (query, options) {
  assert(query, 'Query required.')
  options = options || {}
  options.query = query;
  return this._get(this.generateApiUrl([], options))
}


/**
 * Check if key is valid.
 * @return {Promise}
 */
Client.prototype.ping = function () {
  return this._head(this.generateApiUrl())
}


/**
 * Delete a collection.
 * @param {string} collection
 * @return {Promise}
 */
Client.prototype.deleteCollection = function (collection) {
  assert(collection, 'Collection required.')
  return this._del(this.generateApiUrl([collection]) + '?force=true')
}


/**
 * Create new search builder.
 * @return {SearchBuilder}
 */
Client.prototype.newSearchBuilder = function () {
  return new SearchBuilder()
    .setWrite(false)
    .setDelegate(this)
}


/**
 * Create new graph builder.
 * @return {GraphBuilder}
 */
Client.prototype.newGraphBuilder = function () {
  return new GraphBuilder()
    .setWrite(true)
    .setDelegate(this)
}


/**
 * Create new graph reader.
 * @return {GraphBuilder}
 */
Client.prototype.newGraphReader = function () {
  return new GraphBuilder()
    .setWrite(false)
    .setDelegate(this)
}


/**
 * Create new event builder.
 * @return {EventBuilder}
 */
Client.prototype.newEventBuilder = function () {
  return new EventBuilder()
    .setWrite(true)
    .setDelegate(this)
}


/**
 * Create new event reader.
 * @return {EventBuilder}
 */
Client.prototype.newEventReader = function () {
  return new EventBuilder()
    .setWrite(false)
    .setDelegate(this)
}

/**
 * Create new patch builder.
 * @return {PatchBuilder}
 */
Client.prototype.newPatchBuilder = function(collection, key) {
  return new PatchBuilder(collection, key)
    .setWrite(true)
    .setDelegate(this)
}


/**
 * GET request with authentication.
 * @param {string} url
 * @return {Promise}
 * @protected
 */
Client.prototype._get = function (url) {
  return this._request('GET', url)
}


/**
 * POST request with authentication.
 * @param {string} url
 * @param {Object} data
 * @param {Object} header
 * @return {Promise}
 * @protected
 */
Client.prototype._post = function (url, data, header) {
  return this._request('POST', url, data, header)
}


/**
 * PUT request with authentication.
 * @param {string} url
 * @param {Object} data
 * @param {Object} header
 * @return {Promise}
 * @protected
 */
Client.prototype._put = function (url, data, header) {
  return this._request('PUT', url, data, header)
}


/**
 * DELETE request with authentication.
 * @param {string} url
 * @return {Promise}
 * @protected
 */
Client.prototype._del = function (url, header) {
  return this._request('DELETE', url, undefined, header)
}


/**
 * PATCH request with authentication.
 * @param {string} url
 * @param {Object} data
 * @param {Object} header
 * @return {Promise}
 * @protected
 */
Client.prototype._patch = function (url, data, header) {
  return this._request('PATCH', url, data, header)
}

/**
 * HEAD request with authentication.
 * @param {string} url
 * @return {Promise}
 * @protected
 */
Client.prototype._head = function (url) {
  return this._request('HEAD', url)
}


/**
 * Makes a request to the Orchestrate api.  The request will be set up with all
 * the necessary headers (eg auth, content type, user agent, etc).
 *
 * @param {string} method The HTTP method for the request
 * @param {string} url The full endpoint url (including query portion).
 * @param {Object} data (optional) The body of the request (will be converted to json).
 * @param {Object} header (optional) Any additional headers to go along with the request.
 * @return {Promise}
 * @protected
 */
Client.prototype._request = function (method, url, data, headers) {
  var defer = Q.defer()
  headers = headers || {}
  if (!headers['Content-Type']) headers['Content-Type'] = this.contentType
  headers['User-Agent'] = this._userAgent
  request({
    method: method,
    url : url,
    auth: {user: this._token},
    headers: headers,
    body: JSON.stringify(data),
    gzip: true
  }, defer.makeNodeResolver())

  return defer.promise
  .then(this._validateResponse.bind(this))
  .then(this._parseLinks.bind(this))
  .then(this._parsePathMeta.bind(this))
}


/**
 * Quote the provided string if not already quoted.
 * @param {string} str
 * @return {string}
 * @protected
 */
Client.prototype._quote = function (str) {
  return str.charAt(0) == '"' ? str : '"' + str + '"'
}


/**
 * Ensure valid response.
 * @param {Request} req
 * @return {(Request|Promise)}
 */
Client.prototype._validateResponse = function (res) {
  if (res.body) {
    try {
      res.body = JSON.parse(res.body)
    } catch (e) {}
  }

  if (!~[200, 201, 204].indexOf(res.statusCode))
    throw res

  return res
}

/**
 * Parses all links from the "Link" http response header. The parsed links
 * are made available on the result as result.links.  Each link is an object
 * with the following properties:
 * url - The url for the link (may be relative)
 * rel - The link header's "rel" value (the logical link 'name'),
 * paramName* - Any url query parameters are available directly on the link
 * get() - Function to fetch the link, returns a promise.
 * @param {Object} res The response to parse the 'Link' header from
 * @param {Object} res The respons (so this function can be chained in
 *         promise calls).
 */
Client.prototype._parseLinks = function (res) {
  res.links = parseLinks(res.headers['link'])
  if (res.links) {
    for (var rel in res.links) {
      var link = res.links[rel]
      link.get = function (linkUrl) {
        return this._get(Client.ApiProtocol + '//' + this._apiEndPoint + linkUrl)
      }.bind(this, link.url)
    }
  }
  return res
}

/**
 * Parses any path meta from the response. This includes parsing the Location
 * response header for PUTs and POSTs as well as the ETag response header
 * to parse the item 'ref'. The result path meta will be made available on the
 * response object under 'path'.
 */
Client.prototype._parsePathMeta = function (res) {
  var loc = res.headers['location']
  if (!loc || loc.indexOf('/'+Client.ApiVersion+'/') != 0) {
    return res
  }

  var locParts = res.headers['location'].split('/')
  if (locParts.length < 4) {
    return res
  }

  var path = {
    collection: locParts[2],
    key: locParts[3]
  }

  if (res.headers['etag']) {
    path.ref = res.headers['etag'].replace(/"/g, '')
  }

  res.path = path

  if (locParts.length > 7 && locParts[4] === 'events') {
    path['type'] = locParts[5]
    path.timestamp = parseInt(locParts[6])
    // this is the string representation of the Long in this case, and not
    // the hex value. Orchestrate detects the difference, and it is only
    // important that the JS client has a string representation it can use
    // because if used as a raw number, JS will round, changing the value.
    // For this same reason, path.ordinal should never be used in JS.
    path.ordinal_str = locParts[7]
  }

  return res
}


/**
 * Generates and formats api url.
 * @param {Array.<string>} path
 * @param {Object} query
 * @return {string}
 */
Client.prototype.generateApiUrl = function (path, query) {
  var pathname = ''

  if (!path) path = []

  for (var i = 0; i < path.length; i++)
    pathname += '/' + encodeURIComponent(path[i])

  // Remove undefined key-value pairs.
  if (query)
    Object.keys(query).forEach(function (key) {
      if (query[key] == undefined)
        delete query[key]
    })

  return url.format({
    protocol: Client.ApiProtocol,
    host: this._apiEndPoint + '/' + Client.ApiVersion,
    pathname: pathname,
    query: query
  })
}


// Module exports.
module.exports = Client
