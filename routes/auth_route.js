const SpotifyService = require('../services/spotify_api_service');

exports.setup = (app) => {
    app.get('/auth', (req, res) => {
        SpotifyService.authorizationCodeGrant(req.query.code)
            .then((data) => {
                res.cookie('access',  data.access_token, {httpOnly: true});
                res.cookie('refresh', data.refresh_token, {httpOnly: true});
                res.redirect('/info.html');
            }, (err) => {
                console.log('Something went wrong in callback get!');
                console.log(JSON.stringify(err));
            });
    });
};
