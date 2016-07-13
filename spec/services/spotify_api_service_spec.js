var expect = require('expect.js'),
    mockery = require('mockery'),
    sinon = require('sinon');

describe('SpotifyService', () => {
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

    var SpotifyService, spotifyApiMock, funcs, song1, song2, playlist;
    beforeEach(() => {
        song1 = { id: 1, uri: 'song1 uri' };
        song2 = { id: 2, uri: 'song2 uri' };

        playlist = {
            access_token: 'playlist_access_token',
            refresh_token: 'playlist_refresh_token',
            creatorName: 'Testa Roni',
            id: 1
        }

        spotifyApiMock = function SpotifyWebApi(credentials) {
            funcs = {
                createAuthorizeURL: () => 'authorize url',
                setAccessToken: sinon.spy(),
                setRefreshToken: sinon.spy(),
                getMe: sinon.stub().returns(
                        Promise.resolve({
                            body: {
                                id: 1234
                            }
                        })),
                refreshAccessToken: sinon.stub().returns(
                        Promise.resolve({
                            body: {
                                access_token: 'test_access_token'
                            }
                        })),
                searchTracks: sinon.stub().returns(
                        Promise.resolve({
                            body: {
                                tracks: {
                                    items: [ 'testTrack1', 'testTrack2' ]
                                }
                            }
                        })),
                getPlaylistTracks: sinon.stub().returns(
                        Promise.resolve({
                            body: {
                                items: [ { track: song1 } ]
                            }
                        })),
                addTracksToPlaylist: sinon.stub().returns(Promise.resolve())
            }

            return funcs;
        };

        mockery.registerMock('spotify-web-api-node', spotifyApiMock);

        SpotifyService = require('../../services/spotify_api_service');
    });

    afterEach(() => {
        mockery.resetCache();
    });

    describe('.setTokens', () => {
        it('sets the tokens', () => {
            SpotifyService.setTokens('access', 'refresh');

            expect(funcs.setAccessToken.called).to.be.ok();
            expect(funcs.setRefreshToken.called).to.be.ok();

            expect(funcs.setAccessToken.args[0]).to.eql(['access']);
            expect(funcs.setRefreshToken.args[0]).to.eql(['refresh']);
        });
    });

    describe('.getCurrentUser', () => {
        it('returns a promise for the user id', (done) => {
            SpotifyService.getCurrentUser().then(userid => {
                expect(funcs.getMe.called).to.be.ok();
                expect(userid).to.be(1234);

                done();
            })
            .catch(err => {
                done(err);
            });
        });
    });

    describe('.refreshAccessToken', () => {
        it('recieves and keeps a refreshed access token', (done) => {
            SpotifyService.refreshAccessToken().then(token => {
                expect(funcs.refreshAccessToken.called).to.be.ok();
                expect(token).to.be('test_access_token');

                done();
            })
            .catch(err => {
                done(err);
            });
        });
    });

    describe('.searchTracks', () => {
        it('searches for tracks', (done) => {
            SpotifyService.searchTracks('name').then(tracks => {
                expect(funcs.searchTracks.called).to.be.ok();
                expect(funcs.searchTracks.args[0]).to.eql(['name', { limit: 1 }]);
                expect(tracks).to.eql([ 'testTrack1', 'testTrack2' ]);

                done();
            })
            .catch(err => {
                done(err);
            });
        });
    });

    describe('.addSongToPlaylist', () => {
        it('recognizes duplicate songs', (done) => {
            SpotifyService.addSongToPlaylist(song1, playlist)
                .then(() => {
                    done('should have failed for duplicate');
                }, () => {
                    done();
                })
                .catch(err => {
                    done(err);
                });
        });

        it('adds a new song', (done) => {
            SpotifyService.addSongToPlaylist(song2, playlist)
                .then(() => {
                    expect(funcs.addTracksToPlaylist.called).to.be.ok();
                    expect(funcs.addTracksToPlaylist.args[0][2]).to.eql([song2.uri]);

                    done();
                })
                .catch(err => {
                    done(err);
                });
        });
    });
});
