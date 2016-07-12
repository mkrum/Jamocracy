const db = require('orchestrate')(process.env.ORCHESTRATE_API_KEY);

function find(collection, query) {
    return db.search(collection, query);
}

function findOne(collection, key) {
    return db.get(collection, key);
}

function create(collection, key, value) {
    return update(collection, key, value);
}

function update(collection, key, value, newValue) {
    if (newValue !== undefined) {
        return db.newPatchBuilder(collection, key)
            .replace(value, newValue)
            .apply();
    }

    return db.put(collection, key, value);
}

function remove(collection, key) {
    return db.remove(collection, key);
}

function increment(collection, key, property, inc) {
    return db.newPatchBuilder(collection, key)
        .inc(property, inc)
        .apply();
}

function append(collection, key, property, value) {
    return db.newPatchBuilder(collection, key)
        .append(property, value)
        .apply();
}

exports.find = find;
exports.findOne = findOne;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.increment = increment;
exports.append = append;
