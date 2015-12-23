var oio = require('../lib-cov/client');

oio.ApiProtocol = process.env.ORCHESTRATE_API_PROTOCOL || 'https:'

var token = process.env.ORCHESTRATE_API_KEY || 'sample_token';
var apiEndPoint = process.env.ORCHESTRATE_API_ENDPOINT || 'api.orchestrate.io';

module.exports = function() {
  return oio(token, apiEndPoint);
}
