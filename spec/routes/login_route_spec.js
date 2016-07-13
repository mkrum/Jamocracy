const request = require('supertest'),
    expect = require('expect.js'),
    mockery = require('mockery');

describe('GET /login', () => {
    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
    });

    after(() => {
        mockery.disable();
    });

    it('redirects to authorizeURL', (done) => {
        const spotifyMock = {
            authorizeURL: 'SpotifyAuthorizeURL'
        };

        mockery.registerMock('../services/spotify_api_service', spotifyMock);

        app = require('../mock_app');
        loginRoute = require('../../routes/login_route');
        loginRoute.setup(app);

        request(app)
            .get('/login')
            .expect(302)
            .expect('Location', 'SpotifyAuthorizeURL', done);
    });
});


