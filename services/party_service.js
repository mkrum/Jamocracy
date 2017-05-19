const DBService = require('../services/db_service');

function findPartyForNumber(number) {
    return DBService.findOne('numbers', number)
        .then(res => {
            console.log(res);
            return res.body
        });
}

function removeFromParty(number) {
    return DBService.remove('numbers', number);
}

function findParty(code) {
    return DBService.findOne('parties', code)
        .then(res => res.body);
}

function addNumberToParty(number, code) {
    return DBService.update('numbers', number, {
        key: number,
        party: code,
        lastSong: null
    });
}

exports.findPartyForNumber = findPartyForNumber;
exports.removeFromParty = removeFromParty;
exports.findParty = findParty;
exports.addNumberToParty = addNumberToParty;
