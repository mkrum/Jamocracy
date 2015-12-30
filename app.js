// include node modules
var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
var bodyParser = require('body-parser');
var path = require('path');
var express = require('express');
var request = require('request');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');
var db = require('orchestrate')('f61515c7-8df9-4003-ab45-2f3e259610ff');

// Set credentials, scope, and state
var credentials = {
    clientId : '0095976fe9c24fc5a6e4a7559e01f37e',
    clientSecret : '967795bf432646f69797a1a7e7d97a0e',
    redirectUri : 'http://jamocracy.herokuapp.com/callback'
};

var scopes = ['playlist-read-private', 'playlist-modify-public', 'playlist-modify-private', 'user-read-private'];
var stateKey = 'spotify_auth_state';

// Create the spotifyApi object and theauthorization URL
var spotifyApi = new SpotifyWebApi(credentials);
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, stateKey);

// Set up node app and server
var app = express();
var port = (process.env.PORT || 8080);
var server = app.listen(port);
app.use(express.static(__dirname + '/public')).use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Redirect to Spotify authortization when user presses login
app.get('/login', function(req, res) {
    res.redirect(authorizeURL);
});


// After the user logs in through Spotify, save access and refresh tokens and
// redirect user to info.html, which contains the form
app.get('/callback', function(req, res) {
    spotifyApi.authorizationCodeGrant(req.query.code)
    .then(function(data) {
        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body.access_token);
        spotifyApi.setRefreshToken(data.body.refresh_token);
        res.redirect('/info.html');
    }, function(err) {
        console.log('Something went wrong in callback get!', err);
    });
});


// When the user sumbits the form, create the new playlist and redirect user
// to the success page
app.post('/callback', function(req, res) {
    var phoneNumber = req.body.phoneNumber;
    var playlistName = req.body.playlistName;
    spotifyApi.refreshAccessToken()
    .then(function(data) {
        spotifyApi.getMe()
        .then(function(data) {
            var name = data.body.id;
            spotifyApi.createPlaylist(name, playlistName, { 'public' : false })
            .then(function(data) {
                console.log('Created playlist!');
                res.redirect('/success.html'); // show success page on screen
                // send number, name, and playlist id to app.post('/success')
                request.post('https://jamocracy.herokuapp.com/success', {
                    form: {
                            number:phoneNumber,
                            name:name,
                            playlist:data.body.id
                        }
                });
            }, function(err) {
                console.log('Something went wrong in create playlist!', err);
            });
        }, function(err) {
            console.log('Something went wrong in callback post!', err);
        });
    });
});

//Generates a random string of four capital letters
function randomString(){
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var string = '';
    for(var i = 0; i < 4;i++){
        string += letters[Math.floor(Math.random() * 26)];
    }
    return string;
}

// Create playlist code, store playlist in database
app.post('/success', function(req, res) {
    var partyCode = randomString();
    //  send text response to playlist creator
    twilio.messages.create({
        to: req.body.number,
        from: "+16305818347",
        body: 'This is your Jamocracy Number! Have your friends text their suggestions here! Party Code:'+partyCode
    }, function(err, message) {
        if(err){
            console.log('Twilio Error');
            console.log("Error: "+JSON.stringify(err));
        }
    });
    // add party code to parties collection in database
    db.put('parties', partyCode, {
        'creatorNumber' : req.body.number,
        'creatorName' : req.body.name,
        'id' : req.body.playlist
    }, false).fail(function(err) {
        console.log('Database fail');
    });
    // add creator's number to numbers collection in database
	db.put('numbers', req.body.number, {
	   'party' : partyCode
	}, true).fail(function(err) {
		 console.log('Database failure');
	});

    res.end();
});

// This is executed when the twilio number receives a text
app.post('/SMS', function(req, res){
    var playlist, partyCode;
    // check if sender is in numbers collection
    db.get('numbers', req.body.From.substring(2)) // ignore the '+1' prefix
    .then(function(res){ // if it is found in numbers
        console.log("found");
        partyCode = res.body.party;
        db.get('parties', partyCode) // search the parties collection for this code
        .then(function(data){
            playlist = data.body; // get the playlist for this party
            getSong(req.body, playlist);
        })
        .fail(function(err){
            console.log("party not found");
        });
    })
    .fail(function(err){
        console.log("not found");
    });
});
// getSong from text message, calls addSong
function getSong(text, playlist){
    spotifyApi.searchTracks(text.Body, {limit: 1}, function(error, data) {
        if(error || data.body.tracks.items.length === 0){
            twilio.messages.create({
                to: text.From,
                from: "+16305818347",
                body: "Sorry! There was an error"
            }, function(err, message) {
                console.log(message.sid);
            });
        } else {
            var song = data.body.tracks.items[0];
            addSong(song, playlist);
            twilio.messages.create({
                to: text.From,
                from: "+16305818347",
                body: "Song added: "+song.name+" by "+song.artists[0].name
            }, function(err, message) {
                console.log(message.sid);
            });
        }
    });
}
// add song to playlist
function addSong(song, playlist){
    spotifyApi.addTracksToPlaylist(playlist.creatorName, playlist.id, [song.uri])
    .then(function(data) {
        console.log('Added tracks to playlist!');
    }, function(err) {
        console.log('Something went wrong!'+err);
    });
}
