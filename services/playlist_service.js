const SpotifyService = require('../services/spotify_api_service'),
    DBService = require('../services/db_service');

// getSong from text message, calls addSongToPlayList
function getSong(text, playlist, partyCode) {
    SpotifyService.setTokens(playlist.access_token, playlist.refresh_token);
    return SpotifyService.refreshAccessToken()
        .then(token => {
            playlist.access_token = token;
            // saving new access token in database
            DBService.update('parties', partyCode, {'access_token': token});

            return SpotifyService.searchTracks(text);
        })
        .then(tracks => ({ tracks: tracks, playlist: playlist }));
}

function addSongToPlaylist(song, playlist, number) {
    updateSong(number, song.uri);
    DBService.increment('songs', song.name, {playCount: 1})
        .then((r) => {
            if (r.value) {
                DBService.append('songs', song.name, 'numbers', number);
            } else {
                DBService.create('songs', {
                    'key': song.name,
                    'playCount': 1,
                    'numbers': [number]
                });
            }
        }, (err) => {
            console.log('error in increment: ' + err);
        });
    // set the credentials for the right playlist
    return SpotifyService.addSongToPlaylist(song, playlist);
}

function updateSong(number, songURI) {
    DBService.update('numbers', number, {'lastSong': songURI});
}

//song is passed in only as a uri
function removeSong(song, playlist, number) {
    // set the credentials for the right playlist
    updateSong(number, 'null');
    return SpotifyService.removeSong(song, playlist);
}

exports.getSong = getSong;
exports.addSongToPlaylist = addSongToPlaylist;
exports.updateSong = updateSong;
exports.removeSong = removeSong;
