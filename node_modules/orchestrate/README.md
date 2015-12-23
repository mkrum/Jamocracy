# orchestrate.js [![Build Status](https://travis-ci.org/orchestrate-io/orchestrate.js.png)](https://travis-ci.org/orchestrate-io/orchestrate.js) [![Coverage Status](https://coveralls.io/repos/orchestrate-io/orchestrate.js/badge.png)](https://coveralls.io/r/orchestrate-io/orchestrate.js)

[![NPM](https://nodei.co/npm/orchestrate.png)](https://nodei.co/npm/orchestrate/)

Node Driver for [Orchestrate.io](http://orchestrate.io).


# Installation

```
$ npm install orchestrate
```

# Running Tests
Currently, Orchestrate.js runs against the actual Orchestrate API. At the moment, there is no available local version to work with.

The tests will write data to collections in the app associated with an api key you provide. The collection names are unlikely to collide with any of your own. You will need to export your api key for the tests to use it (see below). If your app is NOT located in AWS US East, you will also need to export a variable indicating the datacenter (see example below). A list of the datacenter and the endpoints can be found here [Datacenters](https://orchestrate.io/docs/multi-data-center) (be sure to only provide the hostname for the value).

Ensure all dependencies are installed within the orchestrate director by running

```
$ npm install
```
To run tests:

```
# provide your own api_key value
$ export ORCHESTRATE_API_KEY="Enter API key HERE"
# in this example, the app is located in CTL-UC1, update as appropriate
# for your app's Datacenter https://orchestrate.io/docs/multi-data-center
$ export ORCHESTRATE_API_ENDPOINT="api.ctl-uc1-a.orchestrate.io"
$ npm test
```

# Creating a Client

```javascript
var db = require('orchestrate')(token)
```

Note, the client defaults to the Amazon US East Datacenter. If you've created your Application in a different datacenter, you'll need to configure the client with that Datacenter's Api URL. For example, for Amazon EU West:

```javascript
var oio = require('orchestrate');
var db = oio(token, 'api.aws-eu-west-1.orchestrate.io');
```

Please see the Orchestrate [MDC Docs](https://orchestrate.io/docs/multi-data-center) for more information on Multi-Datacenter.

# Running Queries

Orchestrate comes with support for GET/PUT/DEL for key-value queries, as well as search, graph, and events. Documentation can be found [here](https://orchestrate.io/docs/api/).

All queries are promise based. Just as a typical function would return a callback containing an error field followed by a result, orchestrate.js returns `then` and `fail` methods.

## Key-Value

To get a value:

```javascript
db.get('collection', 'key')
.then(function (result) {

})
.fail(function (err) {

})
```

To set a value:

```javascript
db.put('collection', 'key', {
  "name": "Steve Kaliski",
  "hometown": "New York, NY",
  "twitter": "@stevekaliski"
})
.then(function (result) {

})
.fail(function (err) {

})
```

Or, setting a value and allowing the server to generate a key:

```javascript
db.post('collection', {
  "name": "Steve Kaliski",
  "hometown": "New York, NY",
  "twitter": "@stevekaliski"
})
.then(function (result) {

})
.fail(function (err) {

})
```

To merge (or update) new values into an existing key, construct a partial document with the desired changes and then use `merge`:

```javascript
db.merge('collection', 'key', {
  "name": "Stephen Kaliski"
})
.then(function (result) {

})
.fail(function (err) {

})
```

Alternatively, you can apply a series of controlled changes to a key by constructing a patch:

```javascript
db.newPatchBuilder('collection', 'key')
  .add('age', 25)
  .replace('hometown', 'NY')
  .apply()
  .then(function (result) {
      // All changes were applied successfully
  })
  .fail(function (err) {
     // No changes were applied
  })
```


Orchestrate also supports [conditional put statements](https://orchestrate.io/docs/api/#key/value/put-(create/update)) that determines whether or not the store operation will occur. `db.put` takes a fourth argument `match` which is either the `ref` value or `false`. If a ref value is provided an `update` will occur if there is a valid match, if false is provided, a `create` will occur if there is no match.


```javascript
db.put('collection', 'key', data, 'cbb48f9464612f20') // update
db.put('collection', 'key', data, false) // create
```

To remove a value:

```javascript
db.remove('collection', 'key', true)
.then(function (result) {

})
.fail(function (err) {

})
```

The last parameter is optional. If supplied the ref history will be removed as well.

## Refs

To get a value at a specific ref:

```javascript
db.get('collection', 'key', 'ref')
.then(function (result) {

})
.fail(function (err) {

})
```

To list refs for a particular key in a collection:

```javascript
db.list_refs('collection', 'key')
.then(function (result) {
  var items = result.body.results;
})
.fail(function (err) {

})
```

## Collection Creation

There is no need to explicitly create a collection. Collections are implicitly created when putting a key/value object.

## Collection Listing

To list items in a collection, you can use [collection listings](https://orchestrate.io/docs/api/#key/value/list).

```javascript
db.list('collection')
.then(function (result) {
  var items = result.body.results;
})
.fail(function (err) {

})
```

Collection listings allow you to page through your collection in key order (sorted lexicographically so be aware of that if you have numeric keys). It is also useful to list parts of your collection starting from a particular key. For example, to list the first 10 keys starting from key 'c':


```javascript
db.list('address-book', {limit:10, startKey:'c'})
.then(function (result) {

})
.fail(function (err) {

})
```

Note: if there is no item with key 'c', the first page will simply have the first 10 results that sort after 'c'.

Collection listings support pagination. If there are more items that follow the page that was retrieved, the result will have a 'links.next' that you can use to fetch the next page.

```javascript
db.list('address-book', {limit:10, startKey:'c'})
.then(function (page1) {
  // Got First Page
  if (page1.links && page1.links.next) {
    page1.links.next.get().then(function (page2) {
      // Got Second Page
    })
  }
})
.fail(function (err) {

})
```

## Collection Deletes

```javascript
db.deleteCollection('users')
```

## Search

To run a quick search, you can simply provide the collection you'd like to search within, your query, and optionally, any query parameters like a `list` or `sort` argument. Currently, Orchestrate supports the [Lucene query syntax](http://lucene.apache.org/core/2_9_4/queryparsersyntax.html).

```javascript
db.search('collection', 'query', {
  sort: 'value.sort:desc',
  limit: 5,
  offset: 2
})
.then(function (result) {

})
.fail(function (err) {

})
```

The more verbose `SearchBuilder` is also available for a more stately approach:

```javascript
db.newSearchBuilder()
.collection('users')
.limit(100)
.offset(10)
.sort('name', 'desc')
.sort('age', 'asc')
.aggregate('stats', 'value.name')
.stats('username')
// these two range aggregates are identical
// but they use different interfaces
.range('coolness', '*~1:1~2:2~*')
.range('radness', function (builder) {
  return builder
  .before(1)
  .between(1, 2)
  .after(2);
})
// these two distance aggregates are identical
// but they use different interfaces
.distance('location', '*~1:1~2:2~*')
.distance('hometown', function (builder) {
  return builder
  .before(1)
  .between(1, 2)
  .after(2);
})
.time_series('path', 'day')
.query('steve')
```

Searching Events is also supported. Event Searching is done by adding a
'@path.kind' predicate to the query to indicate what should be searched.
By default, Orchestrate will only Search for 'item's in the collection.

```javascript
db.newSearchBuilder()
.collection('users')
.query('@path.kind:event AND steve')
```

There is a builder method to set the 'kind' for you:

```javascript
db.newSearchBuilder()
.collection('users')
.kinds('event')
.query('steve')
```

This query will find all events in the users collection that have a field
containing 'steve'. You can further limit what event types are searched
by adding another @path metadata predicate:

```javascript
db.newSearchBuilder()
.collection('users')
.kinds('event')
.query('@path.type:activities AND steve')
```

This further restricts the search to event type 'activities'.

You can also Search both items and events.

```javascript
db.newSearchBuilder()
.collection('users')
.kinds('item', 'event')
.query('steve')
```

The result items will have a mix of matching items and events. Each result
has a 'path' element, and the 'path.kind' element can be used to determine
what the result kind is. For example:

```json
{
    "count": 2,
    "total_count": 2,
    "results": [
        {
            "path": {
                "collection": "users",
                "kind": "item",
                "key": "sjkaliski@gmail.com",
                "ref": "74c22b1736b9d50e",
                "reftime": 1424473968410
            },
            "value": {
                "name": "Steve Kaliski",
                "hometown": "New York, NY",
                "twitter": "@stevekaliski"
            },
            "score": 3.7323708534240723,
            "reftime": 1424473968410
        },
        {
            "path": {
                "collection": "users",
                "kind": "event",
                "key": "byrd@bowery.io",
                "type": "activities",
                "timestamp": 1412787145997,
                "ordinal": 406893558185357300,
                "ref": "82eafab14dc84ed3",
                "reftime": 1412787145997,
                "ordinal_str": "05a593890d087000"
            },
            "value": {
                "activity": "followed",
                "user": "sjkaliski@gmail.com",
                "userName": "Steve Kaliski"
            },
            "score": 2.331388473510742,
            "reftime": 1412787145997
        }
    ]
}
```

For more information about Orchestrate search, [read the docs](http://orchestrate.io/docs/apiref#search).

## Graphs
An awesome feature Orchestrate includes is the ability to generate graphs between collections. For example, consider the collections `users` and `movies`. Some user Steve will `like` a variety of movies. We can generate this relationship:

```javascript
db.newGraphBuilder()
.create()
.from('users', 'Steve')
.related('likes')
.to('movies', 'Superbad')
```

We can optionally include a JSON object representing the properties of the relationship -- which are distinct from the properties of the two items connected by the relationship -- like this:

```javascript
db.newGraphBuilder()
.create()
.data({ "rating" : "5 Stars" })
.from('users', 'Steve')
.related('likes')
.to('movies', 'Superbad')
```

We can use [conditional put statements](https://orchestrate.io/docs/api/#key/value/put-(create/update)) to determine whether or not the store operation will occur. If a ref value is provided an `update` will occur if there is a valid match, if false is provided, a `create` will occur if there is no match.


```javascript
// update if ref matches
db.newGraphBuilder()
.create()
.data({ "rating" : "4 Stars" })
.ref('cbb48f9464612f20')
.from('users', 'Steve')
.related('likes')
.to('movies', 'Superbad')

// create if no previous relationship
db.newGraphBuilder()
.create()
.data({ "rating" : "4 Stars" })
.ref(false)
.from('users', 'Steve')
.related('likes')
.to('movies', 'Superbad')
```


After storing this relationship, we can retrieve its properties like this:

```javascript
db.newGraphReader()
.get()
.from('users', 'Steve')
.related('likes')
.to('movies', 'Superbad')
```

We can then look up all the different items Steve likes:

```javascript
db.newGraphReader()
.get()
.from('users', 'Steve')
.related('likes')
```

We can even take this another step further:

```javascript
db.newGraphReader()
.get()
.from('users', 'Steve')
.related('friends', 'likes')
```

This will return all of the things that friends of Steve have liked. This assumes a friend relation has previously been defined between Steve and another user.

Orchestrate supports offsets and limits for graph relationships as well. To set those values:

```javascript
db.newGraphReader()
.get()
.limit(1)
.offset(1)
.from('users', 'Steve')
.related('friends', 'likes')
```

If we want to delete a graph relationship:

```javascript
db.newGraphBuilder()
.remove()
.from('users', 'Steve')
.related('likes')
.to('movies', 'Superbad')
```

## Events
Events are time-ordered objects that exist with the context of a Key-Value object. Consider comments on a post or messages in a thread.

Creating an event:

```javascript
db.newEventBuilder()
.from('users', 'Steve')
.type('update')
.data({"text": "Hello!"})
.create()
```

Creating an event at a specified time:

```javascript
db.newEventBuilder()
.from('users', 'Steve')
.type('update')
.time(1384534722568)
.data({"text": "Hello!"})
.create()
```

Listing events:

```javascript
db.newEventReader()
.from('users', 'Steve')
.start(1384534722568)
.end(1384535726540)
.type('update')
.list()
```

Getting a specific event:

``` javascript
db.newEventReader()
.from('users', 'Steve')
.time(1369832019085)
.ordinal(9)
.type('update')
.get()
```

Updating an event:

``` javascript
db.newEventBuilder()
.from('users', 'Steve')
.type('update')
.time(1369832019085)
.ordinal(9)
.data({
  "text": "Orchestrate is awesome!"
})
.update()
```

Updating an event, conditionally:

``` javascript
db.newEventBuilder()
.from('users', 'Steve')
.type('update')
.time(1369832019085)
.ordinal(9)
.data({
  "text": "Orchestrate is awesome!"
})
.ref('ae3dfa4325abe21e')
.update()
```

Deleting an event:

``` javascript
db.newEventBuilder()
.from('users', 'Steve')
.type('update')
.time(1369832019085)
.ordinal(9)
.remove()
```

## Validate Key

If you want to make sure your key is valid, you can simply "ping" Orchestrate.

```javascript
db.ping()
.then(function () {
  // you key is VALID
})
.fail(function (err) {
  // your key is INVALID
})
```
