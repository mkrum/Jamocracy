const request = require('supertest'),
    expect = require('expect.js'),
    mockery = require('mockery');

describe('GET /auth', () => {
    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
    });

    after(() => {
        mockery.disable();
    });

    it('should accept an authorization code', (done) => {
        var code, access_token, refresh_token;
        const spotifyMock = {
            authorizationCodeGrant: (partyCode => {
                code = partyCode;

                return Promise.resolve({
                    body: {
                        access_token: 'access_token',
                        refresh_token: 'refresh_token'
                    }
                });
            }),

            setTokens: (access, refresh) => {
                access_token = access;
                refresh_token = refresh;
            }
        };

        mockery.registerMock('../services/spotify_api_service', spotifyMock);

        app = require('../mock_app');
        authRoute = require('../../routes/auth_route');
        authRoute.setup(app);

        request(app)
            .get('/auth')
            .query({ code: 'code' })
            .end((err, res) => {
                expect(code).to.be('code');
                expect(access_token).to.be('access_token');
                expect(refresh_token).to.be('refresh_token');

                done();
            });
    });
});

