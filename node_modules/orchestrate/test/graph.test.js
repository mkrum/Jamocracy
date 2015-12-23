// Copyright 2014 Orchestrate, Inc.
/**
 * @fileoverview Test graph methods
 */

// Module Dependencies.
var assert = require('assert');
var db = require('./creds')();
var users = require('./testdata')('graph.test');
var Q = require('kew');
var util = require('util');

var createRelation = function(collection, from, to, kind, data, ref) {
  var builder = db.newGraphBuilder().create();

  if (data) builder.data(data);
  if (ref) builder.ref(ref);

  return builder.from(collection, from)
    .to(collection, to)
    .related(kind);
};

var getRelation = function(collection, from, to, kind) {
  return db.newGraphReader()
    .get()
    .from(collection, from)
    .to(collection, to)
    .related(kind);
};

var listRelations = function(collection, from, kinds) {
  return db.newGraphReader()
    .get()
    .from(collection, from)
    .related(kinds);
};

suite('Graph', function () {
  suiteSetup(function (done) {
    users.reset(function(res) {
      if (!res) {
        users.insertAll(done);
      } else {
        done(res);
      }
    });
  });

  test('Create graph relationships', function(done) {
    var relations = [
      createRelation(users.collection, users.steve.email, users.kelsey.email, "friend"),
      createRelation(users.collection, users.kelsey.email, users.david.email, "friend")
    ]

    Q.all(relations)
      .then(function (res) {
        assert.equal(2, res.length);
        for (var i in res) {
          assert.equal(201, res[i].statusCode);
        }
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  test('Create graph relationship with properties', function(done) {

    var properties = [
      { "foo" : "bar" },
      { "bing" : "bong" }
    ];

    var relations = [
      createRelation(users.collection, users.steve.email, users.kelsey.email, "likes", properties[0]),
      createRelation(users.collection, users.kelsey.email, users.david.email, "likes", properties[1])
    ];

    Q.all(relations)
      .then(function (res) {
        assert.equal(2, res.length);
        // Test that each of the requests succeeded
        for (var i in res) {
          assert.equal(201, res[i].statusCode);
        }
        // Retrieve each of the relations and make sure they contain the correct properties
        checkRelationProperties(users.collection, users.steve.email, users.kelsey.email, "likes", properties[0], done);
        checkRelationProperties(users.collection, users.kelsey.email, users.david.email, "likes", properties[1], done);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  test('Search for graph relationship', function(done) {

    var properties = [
      { "foo" : "bar" },
      { "bing" : "bong" }
    ];

    var relations = [
      createRelation(users.collection, users.steve.email, users.kelsey.email, "likes", properties[0]),
      createRelation(users.collection, users.kelsey.email, users.david.email, "likes", properties[1])
    ];

    Q.all(relations)
      .then(function (res) {
        assert.equal(2, res.length);
        // Test that each of the requests succeeded
        for (var i in res) {
          assert.equal(201, res[i].statusCode);
        }
        // Search for one of these relationships

        // Retrieve each of the relations and make sure they contain the correct properties
        searchForRelationship(
          "@path.source.collection:`" + users.collection + "` AND value.foo:bar",
          users.steve.email, users.kelsey.email, "likes"
        );
        searchForRelationship(
          "@path.source.collection:`" + users.collection + "` AND value.bing:bong",
          users.kelsey.email, users.david.email, "likes"
        );
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  test('Conditionally create (if-match) graph relationship with properties', function(done) {

    var kind = "coworkers"

    var properties = [
      { "foo" : "bar" },
      { "fizz" : "buzz" },
      { "bing" : "bong" }
    ];

    var properties2 = [
      { "foo2" : "bar2" },
      { "fizz2" : "buzz2" },
      { "bing2" : "bong2" }
    ];

    // For starters, only create the relationship if it doesn't already exist
    var relations = [
      createRelation(users.collection, users.steve.email, users.david.email, kind, properties[0], false),
      createRelation(users.collection, users.steve.email, users.kelsey.email, kind, properties[1], false),
      createRelation(users.collection, users.kelsey.email, users.david.email, kind, properties[2], false)
    ];

    Q.all(relations)
      .then(function (res) {
        assert.equal(3, res.length);
        // Test that each of the requests succeeded, and retrieve their etags.
        var etags = [];
        for (var i in res) {
          assert.equal(201, res[i].statusCode);
          etags.push(res[i].etag);
        }
        // Update both relationships.
        // The first one, using if-none-match again, even though the item already exists, should fail.
        // The second one, using if-match with a bogus etag, should also fail.
        // The third one, using its previous etag to implement if-match, should succeed.
        var updates = [
          createRelation(users.collection, users.steve.email, users.david.email, kind, properties2[0], false),
          createRelation(users.collection, users.steve.email, users.kelsey.email, kind, properties2[1], '"nonsense"'),
          createRelation(users.collection, users.kelsey.email, users.david.email, kind, properties2[2], etags[2])
        ];
        // Process the updates
        Q.all(updates)
          .fin(function() {
            // Retrieve each of the relations and make sure they contain the correct properties.
            // Only the third one should have been updated, but the other two should contain the original json.
            checkRelationProperties(users.collection, users.steve.email, users.david.email, kind, properties[0]),
            checkRelationProperties(users.collection, users.steve.email, users.kelsey.email, kind, properties[1]),
            checkRelationProperties(users.collection, users.kelsey.email, users.david.email, kind, properties2[2])
            done();
          });
      })
      .fail(function (res) {
        done(res);
      });
  });

  test('Traverse graph relationship', function(done) {
    listRelations(users.collection, users.steve.email, [ 'friend', 'friend' ])
      .then(function (res) {
        assert.equal(200, res.statusCode);
        assert.deepEqual(users.david, res.body.results[0].value);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  test('Delete graph relationship', function(done) {
    db.newGraphBuilder()
      .remove()
      .from(users.collection, users.kelsey.email)
      .related('friend')
      .to(users.collection, users.david.email)
      .then(function (res) {
        assert.equal(res.statusCode, 204);
        return db.newGraphReader()
          .get()
          .from(users.collection, users.steve.email)
          .related('friend', 'friend');
      })
      .then(function (res) {
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.count, 0);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  });

  function checkRelationProperties(collection, key, toCollection, toKey, kind, properties, done) {
    var promise = getRelation(collection, key, toCollection, toKey, kind);
    Q.all(promise)
      .then(function(res) {
        assert.equal(res.body, properties);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  }

  function searchForRelationship(query, expectedSourceKey, expectedDestinationKey, expectedKind, done) {
    var promise = db.newSearchBuilder()
      .query(query)
      .then(function (res) {
        assert.equal(200, res.statusCode);
        assert.equal(1, res.body.count);
        assert.equal(expectedSourceKey, res.body.results[0].path.source.key);
        assert.equal(expectedDestinationKey, res.body.results[0].path.destination.key);
        assert.equal(expectedKind, res.body.results[1].path.relation);
        done();
      })
      .fail(function (res) {
        done(res);
      });
  }

});
