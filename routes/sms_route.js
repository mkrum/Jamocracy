'use strict';

const DBService = require('../services/db_service'),
    MessengerService = require('../services/messenger_service'),
    SpotifyService = require('../services/spotify_api_service');

exports.setup = (app) => {
    // This is executed when the twilio number receives a text
    app.post('/SMS', (req, res) => {
        let playlist, partyCode;
        // check if sender is in numbers collection
        DBService.findOne('numbers', req.body.From.substring(2)) // ignore the '+1' prefix
            .then((numRes) => { // if it is found in numbers
                if(req.body.Body[0] === '!'){ // leave playlist with exclamation point
                    DBService.remove('numbers', req.body.From.substring(2))
                        .then(() => {
                            MessengerService.sendText('Playlist exited', req.body.From);
                            updateSong('null', req.body.From.substring(2));
                        })
                    .fail((err) => {
                        console.log(err);
                        MessengerService.sendText('Playlist exit error', req.body.From);
                    });
                } else if (req.body.Body[0] === '/'){
                    DBService.findOne('numbers', req.body.From.substring(2))
                        .then((res) => {
                            const song = res.body.lastSong;
                            if (song !== 'null'){
                                partyCode = res.body.party;
                                DBService.findOne('parties', partyCode) // search the parties collection for this code
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
                    DBService.findOne('parties', partyCode) // search the parties collection for this code
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
            DBService.findOne('parties', partyCode) // search for this party
                .then(() => {
                    DBService.update('numbers', req.body.From.substring(2), { // link the number
                        'party' : partyCode,
                        'lastSong' : null
                    },true)
                    .then(() => {
                        MessengerService.sendText('Connected! You can now search for songs and artists to add. To exit the playlist, text "!". To remove your last song, text "/".', req.body.From);
                        res.end();
                    })
                    .fail((err) => {
                        console.log('Error putting number: ' + err);
                        MessengerService.sendText('Sorry! There was an error. Try submitting the party code again.', req.body.From);
                        res.end();
                    });
                })
            .fail((err) => {
                console.log('Error getting party: ' + JSON.stringify(err));
                res.end();
            });
        });
    });
};

// getSong from text message, calls addSongToPlayList
function getSong(text, playlist, partyCode){
    SpotifyService.setTokens(playlist.access_token, playlist.refresh_token);
    SpotifyService.refreshAccessToken()
        .then(token => {
            playlist.access_token = token;
            // saving new access token in database
            DBService.update('parties', partyCode, 'access_token', token)
                .then(() => {
                    console.log('Successful reset of access_token');
                })
                .fail((err) => {
                    console.log('Error: ' + err);
                });

            SpotifyService.searchTracks(text.Body).then(tracks => {
                if (tracks.length === 0) {
                    MessengerService.sendText('No song found.', text.From);
                } else {
                    const song = tracks[0];
                    addSongToPlaylist(song, playlist, text.From);
                }
            }).fail((err) => {
                MessengerService.sendText('Sorry, there was an error', text.From);
                console.log(err);
            });
        });
}

function addSongToPlaylist(song, playlist, number){
    updateSong(number.substring(2), song.uri);

    DBService.increment('songs', song.name, 'playCount', 1)
        .then(() => {
            DBService.append('songs', song.name, 'numbers', number)
            .then(() => {
                // success
                console.log('successful patch');
            });
        })
        .fail(() => {
            DBService.update('songs', song.name, {
                'playCount' : 1,
                'numbers' : [number]
            });
        });

    // set the credentials for the right playlist
    SpotifyService.addSongToPlaylist(song, playlist)
        .then(() => {
            console.log('Added track to playlist!');
            MessengerService.sendText('Song added: ' + song.name + ' by ' + song.artists[0].name + '. To remove, text "/".', number);
        }, (err) => {
            if (err === 'duplicate song') {
                MessengerService.sendText('Playlist already contains ' + song.name + ' by ' + song.artists[0].name, number);
            } else {
                console.log('Something went wrong!', err);
            }
        });
}

function updateSong(number, songURI){
    DBService.findOne('numbers', number)
        .then(() => {
            DBService.update('numbers', number, 'lastSong', songURI);
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
            MessengerService.sendText('Song removed', number);
        }, (err) => {
            console.log('Something went wrong! RS ' + err);
        })
    .catch((err) => {
        console.log('RS ' + err);
        console.log('JSON: ' + JSON.stringify(err));
    });
    updateSong(number, 'null');
}
