const request = require('supertest'),
    expect = require('expect.js'),
    mockery = require('mockery');

describe('GET /playlists', () => {
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

    var app, access_token, refresh_token;
    beforeEach(() => {
        const spotifyMock = {
            getUserPlaylists: (access, refresh) => {
                access_token = access;
                refresh_token = refresh;

                return Promise.resolve(['track1', 'track2']);
            }
        };

        mockery.registerMock('../services/spotify_api_service', spotifyMock);

        app = require('../mock_app');
        playlistsRoute = require('../../routes/playlists_route');
        playlistsRoute.setup(app);
    });

    afterEach(() => {
        mockery.resetCache();
    });

    it('asks SpotifyService for playlists', (done) => {
        request(app)
            .get('/playlists')
            .set('Cookie', 'access=access_token;refresh=refresh_token;')
            .expect(200)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                expect(access_token).to.be('access_token');
                expect(refresh_token).to.be('refresh_token');

                expect(res.body).to.eql(['track1', 'track2']);

                done();
            });
    });
});

