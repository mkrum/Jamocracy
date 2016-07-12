const host = (process.env.HOST || 'http://127.0.0.1:5000');

function makeUri(path) {
    return host + '/' + path;
}

exports.makeUri = makeUri;
