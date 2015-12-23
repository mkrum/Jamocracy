// Copyright 2014 Orchestrate, Inc.
/**
 * @fileoverview Test Event methods.
 */

// Module Dependencies.
var assert = require('assert');
var Q = require('kew');
var db = require('./creds')();
var users = require('./testdata')('event.test');
var util = require('util');

suite('Events', function () {
  suiteSetup(function(done) {
    users.reset(done);
  });

  test('Put/Get roundtrip', function (done) {
    var op = function(tstamp, data) {
      return db.newEventBuilder()
        .from(users.collection, users.steve.email)
        .type('update')
        .time(tstamp)
        .ordinal(0)
        .data({"text": data})
        .create(); };

    // Writes are done asynchronously, so there is no guarantee of order; even
    // so mix up the invocations just in case we got lucky and the writes were
    // properly ordered
    var writes = [];
    writes.push(op(2, "message2"));
    writes.push(op(3, "message3"));
    writes.push(op(1, "message1"));

    Q.all(writes)
      .then(function (res) {
        assert.equal(3, res.length);
        for (var i in res) {
          assert.equal(201, res[i].statusCode);
        }

        return db.newEventReader()
          .from(users.collection, users.steve.email)
          .type('update')
          .list();
      })
      .then(function (res) {
        assert.equal(200, res.statusCode);
        assert.equal(3, res.body.count);
        var expected_ts = [3,2,1]; // Ensure reverse chronological order
        var actual_ts = [];
        for (var i in res.body.results) {
          actual_ts.push(res.body.results[i].timestamp);
        }
        assert.deepEqual(expected_ts, actual_ts);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });
});
