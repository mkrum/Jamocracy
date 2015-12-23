// Copyright 2014 Orchestrate, Inc.
/**
 * @fileoverview Test misc methods
 */

// Module Dependencies.
var assert = require('assert');
var db = require('./creds')();
var Q = require('kew');
var util = require('util');
var url = require('url');

function assertUrlsEqual(a, b) {
  var aUrl = url.parse(a);
  var bUrl = url.parse(b);
  assert.equal(aUrl.hostname, bUrl.hostname);
  assert.equal(aUrl.port, bUrl.port);
  assert.equal(aUrl.hash, bUrl.hash);
  var aUrlQueryParts = aUrl.query.split("&");
  var bUrlQueryParts = bUrl.query.split("&");
  assert.equal(aUrlQueryParts.length, bUrlQueryParts.length);
  aUrlQueryParts.sort();
  bUrlQueryParts.sort();
  for (var i = 0; i < aUrlQueryParts.length; i++) {
    assert.equal(aUrlQueryParts[i], bUrlQueryParts[i]);
  }
}

suite('Misc', function () {
  test('Service ping', function(done) {
    db.ping()
      .then(function (res) {
        assert.equal(200, res.statusCode);
        var db2 = require('../lib-cov/client')("badtoken");
        return db2.ping();
      })
      .fail(function (res) {
        assert.equal(401, res.statusCode);
        done();
      });
  });
});

module.exports.assertUrlsEqual = assertUrlsEqual;
