'use strict';

const SpotifyWebApi = require('spotify-web-api-node');

// TODO: Refactor these into their own Service
const host = (process.env.HOST || 'http://localhost:5000');
function makeUri(path) {
    return host + '/' + path;
}

// Set up the Spotify API
const redirectUri = makeUri('auth');
const credentials = {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: redirectUri
};
const scopes = [
    'playlist-read-private', 'playlist-modify-public',
    'playlist-modify-private', 'user-read-private'
];
const stateKey = 'spotify_auth_state';
const spotifyApi = new SpotifyWebApi(credentials);
const authorizeURL = spotifyApi.createAuthorizeURL(scopes, stateKey);

function authorizationCodeGrant(code) {
    return spotifyApi.authorizationCodeGrant(code);
}

function setTokens(accessToken, refreshToken) {
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
}

function getCurrentUser() {
    return spotifyApi.getMe().then(data => data.body.id);
}

function createPlaylist(username, playlistName, opts) {
    return spotifyApi.createPlaylist(username, playlistName, opts);
}

function refreshAccessToken() {
    return spotifyApi.refreshAccessToken().then(data => {
        const token = data.body.access_token;
        spotifyApi.setAccessToken(token);
        return token;
    });
}

function searchTracks(name, callback) {
    spotifyApi.searchTracks(name, { limit: 1 }, callback);
}

function addSongToPlaylist(song, playlist)  {
    setTokens(playlist.access_token, playlist.refresh_token);
    return spotifyApi.getPlaylistTracks(playlist.creatorName, playlist.id, {
        fields: 'items(track(id))'
    }).then(playlistTracks => {
        const trackIds = playlistTracks.body.items.map(item => item.track.id);
        if (trackIds.indexOf(song.id) === -1) {
            return spotifyApi.addTracksToPlaylist(playlist.creatorName, playlist.id, [ song.uri ]);
        } else {
            return Promise.reject('duplicate song');
        }
    })
    .catch(err => { console.log(err.message); });
}

function getUserPlaylists(access_token, refresh_token) {
    setTokens(access_token, refresh_token);
    return getCurrentUser().then(user => {
        return spotifyApi.getUserPlaylists(user, { limit: 50 })
            .then(playlistsData => {
                return playlistsData.body.items
                    .filter(element => element.owner.id === user)
                    .map(playlist => ({
                        name: playlist.name,
                        id: playlist.id
                    }));
            });
    })
    .catch(err => {
        console.log('SpotifyService', 'getUserPlaylists', err);
    });
}

function removeSong(song, playlist) {
    setTokens(playlist.access_token, playlist.refresh_token);
    return spotifyApi.removeTracksFromPlaylist(playlist.creatorName, playlist.id, [
            { 'uri': song }
    ]);
}

exports.authorizeURL = authorizeURL;
exports.authorizationCodeGrant = authorizationCodeGrant;
exports.setTokens = setTokens;
exports.getCurrentUser = getCurrentUser;
exports.createPlaylist = createPlaylist;
exports.refreshAccessToken = refreshAccessToken;
exports.searchTracks = searchTracks;
exports.addSongToPlaylist = addSongToPlaylist;
exports.getUserPlaylists = getUserPlaylists;
exports.removeSong = removeSong;

