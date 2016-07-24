const request = require('supertest'),
    expect = require('expect.js'),
    sinon = require('sinon'),
    mockery = require('mockery');

describe('POST /SMS', () => {
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
        dbMock,
        messengerMock,
        spotifyMock,
        song,
        playlist;
    beforeEach(() => {
        song = {
            id: 1,
            uri: 'song1 uri',
            name: 'test song',
            artists: [
                {
                    name: 'Test Artist'
                }
            ]
        };

        playlist = {
            access_token: 'playlist_access_token',
            refresh_token: 'playlist_refresh_token',
            creatorName: 'Testa Roni',
            id: 1
        }

        dbMock = {
            findOne: sinon.spy((collection, value) => {
                var db = {
                    'numbers': {
                        '1234567890': {
                            lastSong: 'song',
                            party: 'ABCD'
                        },
                        'null': {
                            lastSong: 'nullSong',
                            party: 'nullParty'
                        }
                    },
                    'parties': {
                        'ABCD': playlist
                    }
                };

                var result = db[collection][value];
                if (result) {
                    return Promise.resolve({
                        body: result
                    });
                } else {
                    return Promise.reject();
                }
            }),
            remove: sinon.spy((collection, value) => {
                if (collection === 'numbers') {
                    if (value === '1234567890') {
                        return Promise.resolve();
                    } else {
                        return Promise.reject();
                    }
                }
            }),
            update: sinon.stub().returns(Promise.resolve()),
            increment: sinon.stub().returns(Promise.resolve())
        };

        messengerMock = {
            sendText: sinon.spy(),
            validate: sinon.stub().returns(true),
            getTwiMLString: sinon.spy((msg) => { return 'twiml'; } )
        };

        spotifyMock = {
            removeSong: sinon.stub().returns(Promise.resolve()),
            setTokens: sinon.spy(),
            refreshAccessToken: sinon.stub().returns(Promise.resolve('new_token')),
            searchTracks: sinon.spy(search => {
                if (search === 'song search') {
                    return Promise.resolve([ song ]);
                } else if (search === 'duplicate song search') {
                    return Promise.resolve([ { name: 'duplicate song', artists: [ { name: 'copycat' } ] } ]);
                }

                return Promise.resolve([]);
            }),
            addSongToPlaylist: sinon.spy((song) => {
                if (song.name === 'test song') {
                    return Promise.resolve();
                } else if (song.name === 'duplicate song') {
                    return Promise.reject('duplicate song');
                }

                return Promise.reject();
            })
        };

        mockery.registerMock('../services/db_service', dbMock);
        mockery.registerMock('../services/messenger_service', messengerMock);
        mockery.registerMock('../services/spotify_api_service', spotifyMock);

        app = require('../mock_app');
        smsRoute = require('../../routes/sms_route.js');
        smsRoute.setup(app);
    });

    afterEach(() => {
        mockery.resetCache();
    });

    context('already has a playlist', () => {
        it('exits the playlist on `!`', (done) => {
            request(app)
                .post('/SMS')
                .send({ Body: '!', From: '+11234567890'})
                .end((err, req) => {
                    if (err) {
                        done(err);
                    }

                    // Tells DBService to remove the number
                    expect(dbMock.remove.called).to.be.ok();
                    expect(dbMock.remove.args[0]).to.eql(['numbers', '1234567890']);

                    // Tells MessengerService to send a confirmation text
                    expect(messengerMock.getTwiMLString.called).to.be.ok();
                    expect(messengerMock.getTwiMLString.args[0][0]).to.be('Playlist exited');

                    done();
                });
        });

        it('removes the last song on `/`', (done) => {
            request(app)
                .post('/SMS')
                .send({ Body: '/', From: '+11234567890'})
                .end((err, req) => {
                    if (err) {
                        done(err);
                    }

                    // Tells SpotifyService to remove song
                    expect(spotifyMock.removeSong).to.be.ok();
                    expect(spotifyMock.removeSong.args[0]).to.eql(['song', playlist]);

                    // Tells MessengerService to send text
                    expect(messengerMock.getTwiMLString.called).to.be.ok();
                    expect(messengerMock.getTwiMLString.args[0][0]).to.be('Song removed');

                    done();
                });
        });

        it('reports that it did not find any songs', (done) => {
            request(app)
                .post('/SMS')
                .send({ Body: 'wrong search', From: '+11234567890' })
                .end((err, req) => {
                    if (err) {
                        done(err);
                    }

                    // Tells MessengerService to send text
                    expect(messengerMock.getTwiMLString.called).to.be.ok();
                    expect(messengerMock.getTwiMLString.args[0][0]).to.be('No song found.');

                    done();
                });
        });

        it('recognizes duplicate songs', (done) => {
            request(app)
                .post('/SMS')
                .send({ Body: 'duplicate song search', From: '+11234567890' })
                .end((err, req) => {
                    if (err) {
                        done(err);
                    }

                    // Tells SpotifyService to add song
                    expect(spotifyMock.addSongToPlaylist.called).to.be.ok();
                    expect(spotifyMock.addSongToPlaylist.args[0][1]).to.eql(playlist);

                    // Sends confirmation message
                    // TODO: Doesn't work because we end the response too early
                    expect(messengerMock.getTwiMLString.called).to.be.ok();
                    expect(messengerMock.getTwiMLString.args[0][0]).to.match(/^Playlist already contains/);

                    done();
                });
        });

        it('searches for and adds a song', (done) => {
            request(app)
                .post('/SMS')
                .send({ Body: 'song search', From: '+11234567890' })
                .end((err, req) => {
                    if (err) {
                        done(err);
                    }

                    // Tells SpotifyService to add song
                    expect(spotifyMock.addSongToPlaylist.called).to.be.ok();
                    expect(spotifyMock.addSongToPlaylist.args[0]).to.eql([ song, playlist ]);

                    // Sends confirmation message
                    expect(messengerMock.getTwiMLString.called).to.be.ok();
                    expect(messengerMock.getTwiMLString.args[0][0]).to.match(/^Song added/);

                    done();
                });
        });
    });

    context('does not already have a playlist', () => {
        it('recognizes a bad party code', (done) => {
            request(app)
                .post('/SMS')
                .send({ Body: 'DEFG', From: '+10987654321' })
                .end((err, req) => {
                    if (err) {
                        done(err);
                    }

                    // Tells MessengerService to send text
                    expect(messengerMock.getTwiMLString.called).to.be.ok();
                    expect(messengerMock.getTwiMLString.args[0][0]).to.match(/^Not able to find party/);

                    done();
                });
        });

        it('joins a party code', (done) => {
            request(app)
                .post('/SMS')
                .send({ Body: 'ABCD', From: '+10987654321' })
                .end((err, req) => {
                    if (err) {
                        done(err);
                    }

                    // Tells DBService to remember entering party
                    expect(dbMock.update.called).to.be.ok();
                    expect(dbMock.update.args[0]).to.eql([
                            'numbers',
                            '0987654321',
                            {
                                'party': 'ABCD',
                                'lastSong': null
                            }
                    ]);

                    // Tells MessengerService to send text
                    expect(messengerMock.getTwiMLString.called).to.be.ok();
                    expect(messengerMock.getTwiMLString.args[0][0]).to.match(/^Connected!/);

                    done();
                });
        });
    });
});
