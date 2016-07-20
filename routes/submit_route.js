const request = require('request'),
    HostService = require('../services/host_service'),
    SpotifyService = require('../services/spotify_api_service');

exports.setup = (app) => {
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
            .then(username => {
                if (!newPlaylistName || newPlaylistName.length === 0) {
                    // the user chose an existing playlist
                    res.redirect('/success.html');
                    postToSuccess(phoneNumber, username, existingPlaylistId, access_token, refresh_token, false);
                } else {
                    // if the user entered a new playlist
                    SpotifyService.createPlaylist(username, newPlaylistName, { 'public': false })
                        .then((data) => {
                            res.redirect('/success.html');
                            postToSuccess(phoneNumber, username, data.body.id, access_token, refresh_token, true);
                        }, (err) => {
                            console.log('Something went wrong in create playlist!', err);
                        });
                }
            }, (err) => {
                console.log('Something went wrong in submit getme!', err);
            });
    });
};

// send number, name, and playlist id to app.post('/success')
function postToSuccess(phoneNumber, username, playlistId, access, refresh, isNew) {
    const success = HostService.makeUri('success');
    request.post(success, {
        form: {
            number: phoneNumber,
            name: username,
            playlist: playlistId,
            access_token: access,
            refresh_token: refresh,
            isNewPlaylist: isNew
        }
    });
}
