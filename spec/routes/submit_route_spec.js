const request = require('supertest'),
    expect = require('expect.js'),
    mockery = require('mockery');

describe('POST /submit', () => {
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

    var app,
        access_token,
        refresh_token,
        route,
        phoneNumber,
        username,
        playlistId,
        isNewPlaylist;

    beforeEach(() => {
        const spotifyMock = {
            createPlaylist: (username, newPlaylistName, opts) => {
                playlistName = newPlaylistName;
                playlistOpts = opts;

                return Promise.resolve({ body: { id: 1111 } });
            },

            setTokens: (access, refresh) => {
                access_token = access;
                refresh_token = refresh;
            },

            getCurrentUser: () => Promise.resolve(1234)
        };

        const requestMock = {
            post: (postRoute, params) => {
                route = postRoute;
                phoneNumber = params.form.number;
                playlistId = params.form.playlist;
                username = params.form.name;
                isNewPlaylist = params.form.isNewPlaylist;
            }
        };

        const hostMock = {
            makeUri: () => "generated uri"
        };

        mockery.registerMock('../services/spotify_api_service', spotifyMock);
        mockery.registerMock('../services/host_service', hostMock);
        mockery.registerMock('request', requestMock);

        app = require('../mock_app');
        submitRoute = require('../../routes/submit_route');
        submitRoute.setup(app);
    });

    afterEach(() => {
        mockery.resetCache();
    });

    it('handles an existing playlist', (done) => {
        request(app)
            .post('/submit')
            .send({ phoneNumber: 456, existingPlaylistId: 7890 })
            .set('Cookie', 'access=access_token;refresh=refresh_token;')
            .expect(302)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                expect(access_token).to.be('access_token');
                expect(refresh_token).to.be('refresh_token');

                expect(route).to.be('generated uri');
                expect(phoneNumber).to.be(456);
                expect(playlistId).to.be(7890);
                expect(username).to.be(1234);
                expect(isNewPlaylist).to.not.be();

                done();
            });
    });

    it('handles a new playlist', (done) => {
        request(app)
            .post('/submit')
            .send({ phoneNumber: 456, newPlaylistName: 'new playlist' })
            .set('Cookie', 'access=access_token;refresh=refresh_token;')
            .expect(302)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                expect(access_token).to.be('access_token');
                expect(refresh_token).to.be('refresh_token');

                expect(route).to.be('generated uri');
                expect(phoneNumber).to.be(456);
                expect(playlistId).to.be(1111);
                expect(username).to.be(1234);
                expect(isNewPlaylist).to.not.be();

                expect(playlistName).to.be('new playlist');
                expect(playlistOpts.public).to.not.be();

                done();
            });
    });
});
