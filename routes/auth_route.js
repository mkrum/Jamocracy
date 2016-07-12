exports.setup = (app) => {
    const SpotifyService = require('../services/spotify_api_service');

    // After the user logs in through Spotify, save access and refresh tokens and
    // redirect user to info.html, which contains the form
    app.get('/auth', (req, res) => {
        SpotifyService.authorizationCodeGrant(req.query.code)
            .then((data) => {
                // Set the access token on the API object to use it in later calls
                SpotifyService.setTokens(
                        data.body.access_token,
                        data.body.refresh_token
                );
                res.cookie('access',  data.body.access_token, {httpOnly: true});
                res.cookie('refresh', data.body.refresh_token, {httpOnly: true});
                //createSimilar('jump', 'artist', 'aaa');
                res.redirect('/info.html');
            }, (err) => {
                console.log('Something went wrong in callback get!');
                console.log(JSON.stringify(err));
            });
    });
};
