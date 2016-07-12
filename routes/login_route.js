exports.setup = (app) => {
    const SpotifyService = require('../services/spotify_api_service');

    app.get('/login', (req, res) => {
        res.redirect(SpotifyService.authorizeURL);
    });
};

