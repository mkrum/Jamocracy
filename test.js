// db.newSearchBuilder()
// 	.collection('numbers')
// 	.query(req.body.From)
// 	.then(function() {
// 		console.log('found');
// 		db.get('numbers', req.body.From)
// 			.then(function (result) {
// 				console.log('found');
// 				console.log(result);
// 			});
// 	})
// 	.fail(function(result) {
// 		console.log('not found');
// 	});

var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var bodyParser = require('body-parser');
var path = require('path');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// var client_id = '0095976fe9c24fc5a6e4a7559e01f37e'; // Your client id
// var client_secret = '967795bf432646f69797a1a7e7d97a0e'; // Your client secret
// var redirect_uri = 'http://jamocracy.herokuapp.com/callback'; // Your redirect uri

// Set credentials
var credentials = {
  clientId : '0095976fe9c24fc5a6e4a7559e01f37e',
  clientSecret : '967795bf432646f69797a1a7e7d97a0e',
  redirectUri : 'http://jamocracy.herokuapp.com/callback'
};
var spotifyApi = new SpotifyWebApi(credentials);
// Create the authorization URL
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
var scope = 'playlist-read-private playlist-modify-public playlist-modify-private user-read-private';
var stateKey = 'spotify_auth_state';

var app = express();
var port = (process.env.PORT || 8080);
var server = app.listen(port);

app.use(express.static(__dirname + '/public')).use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// your application requests authorization
app.get('/login', function(req, res) {
  res.redirect(authorizeURL);
});

app.get('/callback', function(req, res) {
  spotifyApi.authorizationCodeGrant(code)
    .then(function(data) {
      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      res.redirect('/info.html')
  }, function(err) {
    console.log('Something went wrong!', err);
  });
});

app.post('/callback', function(req, res) {
  var phoneNumber = req.body.phoneNumber;
  var playlistName = req.body.playlistName;
  spotifyApi.getMe()
  .then(function(data) {
    console.log('Some information about the authenticated user', data.body);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
});
