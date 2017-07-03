const request = require('supertest'),
    expect = require('expect.js'),
    sinon = require('sinon');
    mockery = require('mockery');

describe('GET /auth', () => {
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

    var app, spotifyMock;
    beforeEach(() => {
        spotifyMock = {
            authorizationCodeGrant: sinon.stub().returns(
                Promise.resolve({
                    access_token: 'access_token',
                    refresh_token: 'refresh_token'
                })
            )
        };

        mockery.registerMock('../services/spotify_api_service', spotifyMock);

        app = require('../mock_app');
        authRoute = require('../../routes/auth_route');
        authRoute.setup(app);
    });

    afterEach(() => {
        mockery.resetCache();
    });

    it('accepts an authorization code', (done) => {
        request(app)
            .get('/auth')
            .query({ code: 'code' })
            .end((err, res) => {
                expect(spotifyMock.authorizationCodeGrant.called).to.be.ok();
                expect(spotifyMock.authorizationCodeGrant.args[0]).to.eql(['code']);

                done();
            });
    });
});

