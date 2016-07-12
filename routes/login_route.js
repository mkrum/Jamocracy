const SpotifyService = require('../services/spotify_api_service');

exports.setup = (app) => {
    app.get('/login', (req, res) => {
        res.redirect(SpotifyService.authorizeURL);
    });
};

