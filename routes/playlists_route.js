const SpotifyService = require('../services/spotify_api_service');

exports.setup = (app) => {
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
};
