// include node modules
'use strict';

const fs = require('fs'),
    twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    ),
    bodyParser = require('body-parser'),
    express = require('express'),
    request = require('request'),
    cookieParser = require('cookie-parser'),
    db = require('orchestrate')(process.env.ORCHESTRATE_API_KEY),
    app = express(),
    host = (process.env.HOST || 'http://localhost:5000'),
    port = (process.env.PORT || '5000');

app.listen(port, () => {
    console.log('Jamocracy started on port', port);
});
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Set up credentials, scope, and state
function makeUri(path) {
    return host + '/' + path;
}

const SpotifyService = require('./services/spotify_api_service');

const routeFiles = fs.readdirSync('routes');
routeFiles.forEach(routeFile => {
    if (routeFile.indexOf('.js') === -1) {
        return;
    }

    const route = require('./routes/' + routeFile.replace('.js', ''));
    route.setup(app);
});

// When the user sumbits the form, create the new playlist and redirect user
// to the success page
app.post('/submit', (req, res) => {
    const phoneNumber = req.body.phoneNumber,
        newPlaylistName = req.body.newPlaylistName,
        existingPlaylistId = req.body.existingPlaylistId,
        access_token = req.cookies.access,
        refresh_token = req.cookies.refresh;
    SpotifyService.setTokens(access_token, refresh_token);
    SpotifyService.getCurrentUser()
        .then((data) => {
            const username = data.body.id;
            //console.log(username);
            if(newPlaylistName.length !== 0) { // if the user entered a new playlist
                SpotifyService.createPlaylist(username, newPlaylistName, { 'public' : false })
                    .then((data) => {
                        res.redirect('/success.html'); // show success page on screen
                        postToSuccess(phoneNumber, username, data.body.id, access_token, refresh_token, true);
                    }, (err) => {
                        console.log('Something went wrong in create playlist!', err);
                    });
            } else { // the user chose an existing playlist
                res.redirect('/success.html'); // show success page on screen
                postToSuccess(phoneNumber, username, existingPlaylistId, access_token, refresh_token, false);
            }
        }, (err) => {
            console.log('Something went wrong in submit getme!', err);
        });
});

// send number, name, and playlist id to app.post('/success')
function postToSuccess(phoneNumber, username, playlistId, access, refresh, isNew){
    const success = makeUri('success');
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
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let i, string = '';
    for(i = 0; i < 4; i++){
        string += letters[Math.floor(Math.random() * 26)];
    }
    return string;
}

// Create playlist code, store playlist in database
// TODO: Refractor this. I really don't like how I wrote this, but I don't
// know enough about closures and scope in order to properly write it.
app.post('/success', (req, res) => {
    // check to see if this playlist already has a party code
    if(req.body.isNewPlaylist === 'false'){
        // check to see if this playlist exits in the parties collection
        db.newSearchBuilder()
            .collection('parties')
            .limit(1)
            .query(req.body.playlist)
            .then((data) => {
                if(data.body.count !== 0){
                    const partyCode = data.body.results[0].path.key;
                    putNumberAndPartyInCollections(req, partyCode);
                } else {
                    putNumberAndPartyInCollections(req, randomString());
                }
            })
        .fail((err) => {
            console.log('Error in search: ' + err);
            putNumberAndPartyInCollections(req, randomString());
        });
    } else { // default party code is 4 random letters
        putNumberAndPartyInCollections(req, randomString());
    }
    res.end();
});


// add number and party to database
function putNumberAndPartyInCollections(req, partyCode){
    //  send text response to playlist creator
    sendText('This is your Jamocracy Number! Text "!" to exit this playlist. Party Code: '+partyCode, req.body.number);

    // create or update party in parties collection in database
    db.put('parties', partyCode, {
        'creatorNumber' : req.body.number,
        'creatorName' : req.body.name,
        'id' : req.body.playlist,
        'access_token': req.body.access_token,
        'refresh_token': req.body.refresh_token
    }).fail((err) => {
        console.log('Database failure: '+JSON.stringify(err));
    });

    // add creator's number to numbers collection in database
    db.put('numbers', req.body.number, {
        'party' : partyCode,
        'lastSong' : null
    }).fail((err) => {
        console.log('Database failure: '+JSON.stringify(err));
    });
}

// This is executed when the twilio number receives a text
app.post('/SMS', (req, res) => {
    let playlist, partyCode;
    // check if sender is in numbers collection
    db.get('numbers', req.body.From.substring(2)) // ignore the '+1' prefix
        .then((numRes) => { // if it is found in numbers
            if(req.body.Body[0] === '!'){ // leave playlist with exclamation point
                db.remove('numbers', req.body.From.substring(2))
                    .then(() => {
                        sendText('Playlist exited', req.body.From);
                        updateSong('null', req.body.From.substring(2));
                    })
                .fail((err) => {
                    console.log(err);
                    sendText('Playlist exit error', req.body.From);
                });
            } else if (req.body.Body[0] === '/'){
                db.get('numbers', req.body.From.substring(2))
                    .then((res) => {
                        const song = res.body.lastSong;
                        if (song !== 'null'){
                            partyCode = res.body.party;
                            db.get('parties', partyCode) // search the parties collection for this code
                                .then((data) => {
                                    playlist = data.body; // get the playlist for this party
                                    removeSong(song, playlist, req.body.From);
                                })
                            .fail((err) => {
                                console.log('error conecting to playlist 1: '+err);
                            });
                        }
                    });
            } else { // if not !, then it is a song
                partyCode = numRes.body.party;
                db.get('parties', partyCode) // search the parties collection for this code
                    .then((data) => {
                        playlist = data.body; // get the playlist for this party
                        getSong(req.body, playlist, partyCode);
                    })
                .fail((err) => {
                    console.log('error conecting to playlist 2', err);
                });
            }
        })
    // the number is not in the collection
    .fail(() => {
        // get the first four characters, which is the party code
        partyCode = (req.body.Body).toUpperCase().substring(0,4);
        db.get('parties', partyCode) // search for this party
            .then(() => {
                db.put('numbers', req.body.From.substring(2), { // link the number
                    'party' : partyCode,
                    'lastSong' : null
                },true)
                .then(() => {
                    sendText('Connected! You can now search for songs and artists to add. To exit the playlist, text "!". To remove your last song, text "/".', req.body.From);
                    res.end();
                })
                .fail((err) => {
                    console.log('Error putting number: ' + err);
                    sendText('Sorry! There was an error. Try submitting the party code again.', req.body.From);
                    res.end();
                });
            })
        .fail((err) => {
            console.log('Error getting party: ' + JSON.stringify(err));
            res.end();
        });
    });
});

// getSong from text message, calls addSongToPlayList
function getSong(text, playlist, partyCode){
    SpotifyService.setTokens(playlist.access_token, playlist.refresh_token);
    SpotifyService.refreshAccessToken()
        .then(token => {
            playlist.access_token = token;
            // saving new access token in database
            db.newPatchBuilder('parties', partyCode)
                .replace('access_token', token)
                .apply()
                .then(() => {
                    console.log('Successful reset of access_token');
                })
                .fail((err) => {
                    console.log('Error: ' + err);
                });

            SpotifyService.searchTracks(text.Body, (error, data) => {
                if(error){
                    sendText('Sorry, there was an error', text.From);
                    console.log('********* ' + error + ' *********');
                } else if(data.body.tracks.items.length === 0){
                    sendText('No song found.', text.From);
                } else {
                    const song = data.body.tracks.items[0];
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
        .then(() => {
            // success
            console.log('successful patch');
        })
    .fail(() => {
        db.put('songs', song.name, {
            'playCount' : 1,
            'numbers' : [number]
        });
    });

    // set the credentials for the right playlist
    SpotifyService.addSongToPlaylist(song, playlist)
        .then(() => {
            console.log('Added track to playlist!');
            sendText('Song added: ' + song.name + ' by ' + song.artists[0].name + '. To remove, text "/".', number);
        }, (err) => {
            if (err === 'duplicate song') {
                sendText('Playlist already contains ' + song.name + ' by ' + song.artists[0].name, number);
            } else {
                console.log('Something went wrong!', err);
            }
        });
}

// called client side to get user's playlists
app.get('/playlists', (req, res) => {
    // set the credentials for the right playlist
    const access_token = req.cookies.access,
        refresh_token = req.cookies.refresh;
    SpotifyService.getUserPlaylists(access_token, refresh_token)
        .then(playlists => {
            res.send(playlists);
        });
});

function sendText(textMessage, number){
    twilio.messages.create({
        to: number,
        //from: "+16305818347",
        // Dan's twilio number, used for testing
        from: '+19784010087',
        body: textMessage
    }, (err) => {
        if(err){
            console.log('error: ' + JSON.stringify(err));
        }
    });
}

function updateSong(number, songURI){
    db.get('numbers', number)
        .then(() => {
            db.newPatchBuilder('numbers', number)
                .replace('lastSong', songURI)
                .apply();
        })
    .fail((err) => {
        console.log('Database failure: ' + JSON.stringify(err));
    });
}
//song is passed in only as a uri
function removeSong(song, playlist, number){
    // set the credentials for the right playlist
    SpotifyService.removeSong(song, playlist)
        .then(() => {
            sendText('Song removed', number);
        }, (err) => {
            console.log('Something went wrong! RS ' + err);
        })
    .catch((err) => {
        console.log('RS ' + err);
        console.log('JSON: ' + JSON.stringify(err));
    });
    updateSong(number, 'null');
}
