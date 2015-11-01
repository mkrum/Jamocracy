var queryString = require('queryString');

var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};


function createURL() {
	var clientID = '0095976fe9c24fc5a6e4a7559e01f37e';
	var clientSecret = '967795bf432646f69797a1a7e7d97a0e';
	var redirect_uri = 'http://jamocracy.herokuapp.com/auth';
	var scope = 'playlist-read-private playlist-read-colloborative playlist-modify-public playlist-modify-private user-read-private';
	var statekey = 'spotify_auth_state';
	window.location.replace('https://accounts.spotify.com/authorize?' +
	queryString.stringify({
		response_type: 'code',
		client_id: client_id,
		scope: scope,
		redirect_uri: redirect_uri
	}));
};


