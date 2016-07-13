var expect = require('expect.js');

describe('HostService', () => {
    var cachedHost;
    before(() => {
        cachedHost = process.env.HOST;
        process.env.HOST = 'HostServiceTest';
    });

    after(() => {
        process.env.HOST = cachedHost;
    });

    it('uses process.env.HOST', () => {
        var HostService = require('../../services/host_service');
        var uri = HostService.makeUri('path');

        expect(uri).to.be('HostServiceTest/path');
    });
});
