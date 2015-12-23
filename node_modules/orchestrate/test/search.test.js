// Copyright 2014 Orchestrate, Inc.
/**
 * @fileoverview Test search methods
 */

// Module Dependencies.
var assert = require('assert');
var db = require('./creds')();
var users = require('./testdata')('search.test');
var Q = require('kew');
var util = require('util');
var misc = require('./misc');

suite('Search', function () {
  suiteSetup(function (done) {
    users.reset(function(res) {
      if (!res) {
        users.insertAll(done);
      } else {
        done(res);
      }
    });
  });

  // Basic search
  test('Basic search', function (done) {
    db.newSearchBuilder()
      .collection(users.collection)
      .query('location: New*')
      .then(function (res) {
        assert.equal(200, res.statusCode);
        assert.equal(2, res.body.count);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  // Cross-collection search (find all items in the 'users' collections, via query clause)
  test('Cross-collection search', function (done) {
    db.newSearchBuilder()
      .limit(10)
      .query('@path.collection:`' + users.collection + '`')
      .then(function (res) {
        assert.equal(200, res.statusCode);
        assert.equal(3, res.body.count);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  // Search with offset
  test('Search with offset', function (done) {
    db.newSearchBuilder()
      .collection(users.collection)
      .offset(2)
      .query('*')
      .then(function (res) {
        assert.equal(200, res.statusCode);
        // Order doesn't matter, but there should be only 1 out of the three in
        // the result
        assert.equal(1, res.body.count);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  // Search with offset and limit
  test('Search with offset & limit', function (done) {
    db.newSearchBuilder()
      .collection(users.collection)
      .offset(1)
      .limit(1)
      .query('*')
      .then(function (res) {
        assert.equal(200, res.statusCode);
        // XXX: API inconsistency?
        //        assert.equal(2, res.body.total_count);
        assert.equal(1, res.body.count);
        misc.assertUrlsEqual(res.body.next, '/v0/'+users.collection+'?limit=1&query=*&offset=2');
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  // Search and sort
  test('Search and sort', function (done) {
    db.newSearchBuilder()
      .collection(users.collection)
      .sort('name', 'desc')     // Reverse-alpha
      .query('New York')
      .then(function (res) {
        assert.equal(200, res.statusCode);
        assert.equal(2, res.body.results.length);
        assert.equal(users.steve.email, res.body.results[0].path.key);
        assert.equal(users.david.email, res.body.results[1].path.key);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  // TODO Geo-search

  // Aggregates
  test('Search aggregates', function (done) {
    db.newSearchBuilder()
    .collection(users.collection)
    .aggregate('stats', 'value.name')
    .top_values('value.tags')
    .top_values('value.categories', 20, 10)
    .stats('value.username')
    .range('value.coolness', '*~1:1~2:2~*')
    .range('value.radness', function (builder) {
      return builder
      .before(1)
      .between(1, 2)
      .after(2);
    })
    .distance('value.location', '*~1:1~2:2~*')
    .distance('value.hometown', function (builder) {
      return builder
      .before(1)
      .between(1, 2)
      .after(2);
    })
    .time_series('path', 'day')
    .time_series('path', 'hour', '+0900')
    .query('value.location:NEAR:{latitude:12.3 longitude:56.7 radius:100km}')
    .then(function (res) {
      assert.equal(200, res.statusCode);
      done();
    })
    .fail(done);
  });

  // Search Events
  test('Search events', function (done) {
    db.newSearchBuilder()
      .collection(users.collection)
      .kinds('event')
      .query('@path.type:activities AND steve')
      .then(function (res) {
        assert.equal(200, res.statusCode);
        assert.equal(1, res.body.total_count);
        assert.equal(users.steve.email, res.body.results[0].path.key);
        assert.equal('event', res.body.results[0].path.kind);
        assert.equal('activities', res.body.results[0].path.type);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

});
