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
        song = { id: 1, uri: 'song1 uri' };

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
            update: sinon.spy()
        };

        messengerMock = {
            sendText: sinon.spy()
        };

        spotifyMock = {
            removeSong: sinon.stub().returns(Promise.resolve())
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
                    expect(messengerMock.sendText.called).to.be.ok();
                    expect(messengerMock.sendText.args[0]).to.eql(['Playlist exited', '+11234567890']);

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
                    expect(messengerMock.sendText.called).to.be.ok();
                    expect(messengerMock.sendText.args[0]).to.eql(['Song removed', '+11234567890']);

                    done();
                });
        });
    });
});

