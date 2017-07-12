const MongoClient = require('mongodb').MongoClient;
let db;

MongoClient.connect(process.env.MONGODB_URI, (err, database) => {
    if (err) {
        throw err;
    }
    db = database;
    console.log('connected to database');
});

function find(collection, query) {
    return db.collection(collection).findOne({'key': query});
}

function findOne(collection, key) {
    return db.collection(collection).findOne({'key': key});
}

function findAllByValue(collection, value) {
    return db.collection(collection).findAll({'value': value});
}

function create(collection, doc) {
    return db.collection(collection).insertOne(doc);
}

function update(collection, key, dict) {
    return db.collection(collection)
        .findOneAndUpdate(
            {'key': key},
            {$set: dict},
            {upsert: true}
        );
}

function remove(collection, key) {
    return db.collection(collection).deleteOne({'key': key});
}

function increment(collection, key, dict) {
    return db.collection(collection)
        .findOneAndUpdate(
            {'key': key},
            {$inc: dict}
        );
}

function append(collection, key, dict) {
    return db.collection(collection)
        .findOneAndUpdate(
            {'key': key},
            {$push: dict}
        );
}

exports.find = find;
exports.findOne = findOne;
exports.findAllByValue = findAllByValue;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.increment = increment;
exports.append = append;
