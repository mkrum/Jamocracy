// include node modules
//var twilio = require('twilio')('ACdc7d3faac00d72c93a830191947c999a', 'dccfe5571db0d393c727cee38b68a730');
// Dan's twilio info, used for testing
var twilio = require('twilio')('ACe51cb73194af06d1048ce2b11ffb8cb1', '437e0f5d041b542c58f09b814b7e5639');//D3PRqy1WEm9fdZ2OcoluwYU70BpawbHJ
var bodyParser = require('body-parser');
var path = require('path');
var express = require('express');
var request = require('request');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');
var db = require('orchestrate')('f61515c7-8df9-4003-ab45-2f3e259610ff');
// Set up node app and server
var app = express();
var port = (process.env.PORT || 5000);
var server = app.listen(port);
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Set credentials, scope, and state
var redirectUri = port === '5000' ? 'http://127.0.0.1:5000/auth':'http://jamocracy.herokuapp.com/auth';
var credentials = {
    clientId : '0095976fe9c24fc5a6e4a7559e01f37e',
    clientSecret : '967795bf432646f69797a1a7e7d97a0e',
    redirectUri : redirectUri
};

var scopes = ['playlist-read-private', 'playlist-modify-public', 'playlist-modify-private', 'user-read-private'];
var stateKey = 'spotify_auth_state';

// Create the spotifyApi object and theauthorization URL
var spotifyApi = new SpotifyWebApi(credentials);
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, stateKey);

// Redirect to Spotify authortization when user presses login
app.get('/login', function(req, res) {
    res.redirect(authorizeURL);
});

// After the user logs in through Spotify, save access and refresh tokens and
// redirect user to info.html, which contains the form
app.get('/auth', function(req, res) {
    spotifyApi.authorizationCodeGrant(req.query.code)
    .then(function(data) {
        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body.access_token);
        spotifyApi.setRefreshToken(data.body.refresh_token);
        res.cookie('access',  data.body.access_token, {httpOnly: true});
        res.cookie('refresh', data.body.refresh_token, {httpOnly: true});
		//createSimilar('jump', 'artist', 'aaa');
        res.redirect('/info.html');
    }, function(err) {
        console.log('Something went wrong in callback get!');
        console.log(JSON.stringify(err));
    });
});

// When the user sumbits the form, create the new playlist and redirect user
// to the success page
app.post('/submit', function(req, res) {
    var phoneNumber = req.body.phoneNumber;
    var newPlaylistName = req.body.newPlaylistName;
    var existingPlaylistId = req.body.existingPlaylistId;
    var access_token = req.cookies.access;
    var refresh_token = req.cookies.refresh;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    spotifyApi.getMe()
    .then(function(data) {
        var username = data.body.id;
        //console.log(username);
        if(newPlaylistName.length !== 0) { // if the user entered a new playlist
            spotifyApi.createPlaylist(username, newPlaylistName, { 'public' : false })
            .then(function(data) {
                res.redirect('/success.html'); // show success page on screen
                postToSuccess(phoneNumber, username, data.body.id, access_token, refresh_token, true);
            }, function(err) {
                console.log('Something went wrong in create playlist!', err);
            });
        } else { // the user chose an existing playlist
            res.redirect('/success.html'); // show success page on screen
            postToSuccess(phoneNumber, username, existingPlaylistId, access_token, refresh_token, false);
        }
    }, function(err) {
        console.log('Something went wrong in submit getme!', err);
    });
});

// send number, name, and playlist id to app.post('/success')
function postToSuccess(phoneNumber, username, playlistId, access, refresh, isNew){
    var success = port === '5000' ? 'http://127.0.0.1:5000/success':'http://jamocracy.herokuapp.com/success';
    request.post(success, {
        form: {
            number:phoneNumber,
            name:username,
            playlist:playlistId,
            access_token: access,
            refresh_token: refresh,
            isNewPlaylist: isNew
        }
    });
}

//Generates a random string of four capital letters
function randomString(){
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var string = '';
    for(var i = 0; i < 4;i++){
        string += letters[Math.floor(Math.random() * 26)];
    }
<<<<<<< HEAD
	var valid = 0;
	db.get('parties', code)		//check out this recursion
	.then(function(res) {
		 valid = 0;
	})
	.fail(function(res) {
		valid = 1;
	});
	if(valid)
		return string;
	else
		return randomString();
=======
	return string;
>>>>>>> b2b41c74ac52b4d284099083ce6dda4e02482217
}

// Create playlist code, store playlist in database
// TODO: Refractor this. I really don't like how I wrote this, but I don't
// know enough about closures and scope in order to properly write it.
app.post('/success', function(req, res) {
    // check to see if this playlist already has a party code
    if(req.body.isNewPlaylist === 'false'){
         // check to see if this playlist exits in the parties collection
        db.newSearchBuilder()
        .collection('parties')
        .limit(1)
        .query(req.body.playlist)
        .then(function (data) {
            if(data.body.count !== 0){
                partyCode = data.body.results[0].path.key;
                putNumberAndPartyInCollections(req, partyCode);
            } else {
                putNumberAndPartyInCollections(req, randomString());
            }
        })
        .fail(function (err) {
            console.log("Error in search: "+err);
            putNumberAndPartyInCollections(req, randomString());
        });
    } else { // default party code is 4 random letters
        putNumberAndPartyInCollections(req, code);
    }
    res.end();
});


// add number and party to database
function putNumberAndPartyInCollections(req, partyCode){
    //  send text response to playlist creator
    sendText('This is your Jamocracy Number! Party Code: '+partyCode, req.body.number);

    // create or update party in parties collection in database
    db.put('parties', partyCode, {
        'creatorNumber' : req.body.number,
        'creatorName' : req.body.name,
        'id' : req.body.playlist,
        'access_token': req.body.access_token,
        'refresh_token': req.body.refresh_token
    }).fail(function(err) {
        console.log('Database failure: '+JSON.stringify(err));
    });

    // add creator's number to numbers collection in database
    db.put('numbers', req.body.number, {
        'party' : partyCode,
		'lastSong' : null
    }).fail(function(err) {
        console.log('Database failure: '+JSON.stringify(err));
    });
}

// This is executed when the twilio number receives a text
app.post('/SMS', function(req, res){
    var playlist, partyCode;
    // check if sender is in numbers collection
    db.get('numbers', req.body.From.substring(2)) // ignore the '+1' prefix
    .then(function(numRes){ // if it is found in numbers
        if(req.body.Body[0] === '!'){ // leave playlist with exclamation point
            db.remove('numbers', req.body.From.substring(2))
            .then(function(data) {
                sendText("Playlist exited", req.body.From);
				updateSong('null', req.body.From.substring(2));
            })
            .fail(function(err) {
                console.log(err);
                sendText("Playlist exit error", req.body.From);
				});
		} else if (req.body.Body[0] === '/'){
			db.get('numbers', req.body.From.substring(2))
			.then(function(res){
				song = res.body.lastSong;
				if (song !== 'null'){
					partyCode = res.body.party;
					db.get('parties', partyCode) // search the parties collection for this code
					.then(function(data){
						playlist = data.body; // get the playlist for this party
						removeSong(song, playlist, req.body.From);
					})
					.fail(function(err){
						console.log('error conecting to playlist 1: '+err);
					});
				}
			});
        } else { // if not !, then it is a song
            partyCode = numRes.body.party;
            db.get('parties', partyCode) // search the parties collection for this code
            .then(function(data){
                playlist = data.body; // get the playlist for this party
                getSong(req.body, playlist, partyCode);
            })
            .fail(function(err){
                console.log('error conecting to playlist 2');
            });
        }
    })
    // the number is not in the collection
    .fail(function(err){
        // get the first four characters, which is the party code
        partyCode = (req.body.Body).toUpperCase().substring(0,4);
        db.get('parties', partyCode) // search for this party
        .then(function(data){
            db.put('numbers', req.body.From.substring(2), { // link the number
                'party' : partyCode,
				'lastSong' : null
            },true)
            .then(function(data) {
                sendText("Connected! You can now search for songs and artists to add. To exit the playlist, text '!'. To remove your last song, text '/'.", req.body.From);
                res.end();
            })
            .fail(function(err) {
                console.log("Error putting number: "+err);
                sendText("Sorry! There was an error. Try submitting the party code again.", req.body.From);
                res.end();
            });
        })
        .fail(function(err){
            console.log("Error getting party: "+JSON.stringify(err));
            res.end();
        });
    });
});

// getSong from text message, calls addSongToPlayList
function getSong(text, playlist, partyCode){
    spotifyApi.setAccessToken(playlist.access_token);
    spotifyApi.setRefreshToken(playlist.refresh_token);
    spotifyApi.refreshAccessToken()
    .then(function(data){
        // saving new access token for spotifyApi
        spotifyApi.setAccessToken(data.body.access_token);
        playlist.access_token = data.body.access_token;
        // saving new access token in database
        db.newPatchBuilder('parties', partyCode)
        .replace('access_token', data.body.access_token)
        .apply()
        .then(function(result){
            console.log("Successful reset of access_token");
        })
        .fail(function(err){
            console.log("Error: "+err);
        });

        spotifyApi.searchTracks(text.Body, {limit: 1}, function(error, data) {
            if(error){
                sendText("Sorry, there was an error", text.From);
                console.log("********* "+error+" *********");
            } else if(data.body.tracks.items.length === 0){
                sendText("No song found.", text.From);
            } else {
                var song = data.body.tracks.items[0];
                addSongToPlaylist(song, playlist, text.From);
            }
        });
    });
}

function addSongToPlaylist(song, playlist, number){
	updateSong(number.substring(2), song.uri);

    db.newPatchBuilder('songs', song.name)
    .inc('playCount', 1)
    .append('numbers', number)
    .apply()
    .then(function(result){
        // success
        console.log("successful patch");
    })
    .fail(function(err){
        db.put('songs', song.name, {
            'playCount' : 1,
            'numbers' : [number]
        });
    });

	// set the credentials for the right playlist
    spotifyApi.setAccessToken(playlist.access_token);
    spotifyApi.setRefreshToken(playlist.refresh_token);
    spotifyApi.getPlaylistTracks(playlist.creatorName, playlist.id, {fields: 'items(track(id))'})
    .then(function(playlistTracks){
        return playlistTracks.body.items.map(function(item){return item.track.id;});
    })
    .then(function(trackIds){
        if(trackIds.indexOf(song.id) === -1){
            spotifyApi.addTracksToPlaylist(playlist.creatorName, playlist.id, [song.uri])
            .then(function(data) {
                console.log('Added track to playlist!');
                sendText("Song added: "+song.name+" by "+song.artists[0].name+". To remove, text '/'.", number);
            }, function(err) {
                console.log('Something went wrong! '+err);
            });
        } else {
            sendText("Playlist already contains "+song.name+" by "+song.artists[0].name, number);
        }
    })
    .catch(function(err){
        console.log(err.messsage);
    });
}

// called client side to get user's playlists
app.get('/playlists', function(req, res) {
    // set the credentials for the right playlist
    var access_token = req.cookies.access;
    var refresh_token = req.cookies.refresh;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    spotifyApi.getMe()
    .then(function(me){
        var user = me.body.id;
        spotifyApi.getUserPlaylists(user, {limit : 50})
        .then(function(data){
            var playlists = data.body.items;
            // remove playlists that the user does not own
            // only save playlist name and id
            playlists = playlists.filter(function(element){
                return element.owner.id === user;
            }).map(function(playlist){
                return {
                    name:  playlist.name,
                    id: playlist.id
                };
            });
            res.send(playlists);
        })
        .catch(function(err){
            console.log(err);
        });
    })
    .catch(function(err){
        console.log(err);
    });
});

function sendText(textMessage, number){
    twilio.messages.create({
        to: number,
        //from: "+16305818347",
        // Dan's twilio number, used for testing
        from: "+19784010087",
        body: textMessage
    }, function(err, message) {
        if(err){
            console.log("error: "+JSON.stringify(err));
        }
    });
}

function updateSong(number, songURI){
	 db.get('numbers', number)
		.then(function(req, res){
			db.newPatchBuilder('numbers', number)
				.replace('lastSong', songURI)
                .apply();
		})
		.fail(function(req, res){
			console.log('Database failure: '+JSON.stringify(err));
		});
}
//song is passed in only as a uri
function removeSong(song, playlist, number){
	// set the credentials for the right playlist
    spotifyApi.setAccessToken(playlist.access_token);
    spotifyApi.setRefreshToken(playlist.refresh_token);
    spotifyApi.getPlaylistTracks(playlist.creatorName, playlist.id, {fields: 'items(track(id))'})
    .then(function(playlistTracks){
        return playlistTracks.body.items.map(function(item){return item.track.id;});
    })
    .then(function(trackIds){
		spotifyApi.removeTracksFromPlaylist(playlist.creatorName, playlist.id,
            [{
                'uri' : song
            }])
		.then(function(data) {
			sendText("Song removed", number);
		}, function(err) {
			console.log('Something went wrong! RS '+err);
		});
    })
    .catch(function(err){
        console.log("RS "+err);
        console.log("JSON: "+JSON.stringify(err));
    });
	updateSong(number, 'null');
}
