const request = require('supertest'),
    expect = require('expect.js'),
    mockery = require('mockery');

describe('GET /login', () => {
    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });
    });

    after(() => {
        mockery.disable();
    });

    var app;
    beforeEach(() => {
        const spotifyMock = {
            authorizeURL: 'SpotifyAuthorizeURL'
        };

        mockery.registerMock('../services/spotify_api_service', spotifyMock);

        app = require('../mock_app');
        loginRoute = require('../../routes/login_route');
        loginRoute.setup(app);
    });

    afterEach(() => {
        mockery.resetCache();
    });

    it('redirects to authorizeURL', (done) => {
        request(app)
            .get('/login')
            .expect(302)
            .expect('Location', 'SpotifyAuthorizeURL', done);
    });
});


