// Copyright 2014 Orchestrate, Inc.
/**
 * @fileoverview Test data
 */

var assert = require('assert');
var Q = require('kew');
var db = require('./creds')();
var util = require('util');

// Test data.
function Users(collection) {
  this.collection = collection;
  this.steve = {
    "name": "Steve Kaliski",
    "email": "sjkaliski@gmail.com",
    "location": "New York",
    "type": "paid",
    "gender": "male"
  };

  this.steve_v1 = {
    "name": "Steve Kaliski",
    "email": "sjkaliski@gmail.com",
    "location": "New York, NY",
  };

  this.steve_v2 = {
    "name": "Steve Kaliski",
    "email": "sjkaliski@gmail.com",
    "location": "New York, NY",
    "type": "consultant"
  };

  this.steve_v3 = {
    "name": "Steve Kaliski",
    "email": "sjkaliski@gmail.com",
    "location": "New York, NY",
    "type": "salaried"
  };

  this.david = {
    "name": "David Byrd",
    "email": "byrd@bowery.io",
    "location": "New York",
    "type": "paid",
    "gender": "male"
  };

  this.kelsey = {
    "name": "Kelsey Jarblenkins",
    "email": "kelsey@jarblenkins.com",
    "location": "Boston, MA",
    "type": "free",
    "gender": "genderqueer"
  };

  this.kelsey_v1 = {
    "name": "Kelsey Jarblenkins",
    "email": "kelsey@jarblenkins.com",
    "location": "Boston, MA",
    "type": "consultant",
    "gender": "genderqueer"
  };
}

var USER_EVENTS = {
  "steve" : {
    "key": "sjkaliski@gmail.com",
    "events" : {
      "activities" : [
        {
          "activity": "followed",
          "user": "sjkaliski@gmail.com",
          "userName": "Steve Kaliski"
        }
      ]
    }
  }
}

function delete_all(dels) {
  return Q.all(dels)
    .then(function (res) {
      assert.equal(dels.length, res.length);
      for (var i in res) {
        assert.equal(204, res[i].statusCode);
      }
    })
    .fail(function(res) {
      assert.equal(404, res.statusCode);
    })
}

Users.prototype.reset = function(done) {
  var dels = [];
  var obj = this;
  var collection = this.collection;
  db.search(collection, '@path.kind:event', {limit:100})
    .then(function(res) {
      var results = res.body.results
      for(var i=0;i<results.length;i++) {
        var path = results[i].path
        dels.push(db.newEventBuilder()
          .from(path.collection, path.key)
          .type(path.type)
          .time(path.timestamp)
          .ordinal(path.ordinal_str)
          .remove())
      }
      return delete_all(dels)
    })
    .then(function(res){
      dels = []
      dels.push(db.remove(collection, obj.steve.email, true))
      dels.push(db.remove(collection, obj.steve.email+'_2', true))
      dels.push(db.remove(collection, obj.david.email, true))
      dels.push(db.remove(collection, obj.kelsey.email, true))
      return delete_all(dels)
    })
    .then(function(res) {
      return db.put(collection, obj.david.email, obj.david);
    })
    .then(function (res) {
      assert.equal(201, res.statusCode);
      done();
    })
    .fail(function(res){
      done(res)
    })
};

Users.prototype.insertAll = function(done) {
  var inserts = [];
  var collection = this.collection;

  inserts.push(db.put(collection, this.steve.email, this.steve));
  inserts.push(db.put(collection, this.kelsey.email, this.kelsey));
  for (var user_id in USER_EVENTS) {
    var user = USER_EVENTS[user_id]
    var user_key = user.key
    for (var event_name in user.events) {
      var event_list = user.events[event_name]
      for (var i=0; i<event_list.length; i++) {
        inserts.push(db.newEventBuilder()
            .from(collection, user_key)
            .type(event_name)
            .data(event_list[i])
            .create()
        )
      }
    }
  }
  Q.all(inserts)
    .then(function (res) {
      assert.equal(inserts.length, res.length);
      for (var i in res) {
        assert.equal(201, res[i].statusCode);
      }
      // Give search a chance to index all changes
      setTimeout(done, 1500);
    })
    .fail(function (res) {
      done(res);
    });
};

module.exports = function(testName) {
  return new Users(testName + "_users_" + process.version);
}
