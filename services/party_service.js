const DBService = require('../services/db_service');

function findPartyForNumber(number) {
    return DBService.findOne('numbers', number);
}

function removeFromParty(number) {
    return DBService.remove('numbers', number);
}

function findParty(code) {
    return DBService.findOne('parties', code);
}

function addNumberToParty(number, code) {
    return DBService.update('numbers', number, {
        key: number,
        party: code,
        lastSong: null
    });
}

function findNumbersForParty(partyNumber) {
    return DBService.findAllByValue('numbers', partyNumber);
}

exports.findPartyForNumber = findPartyForNumber;
exports.removeFromParty = removeFromParty;
exports.findParty = findParty;
exports.addNumberToParty = addNumberToParty;
exports.findNumbersForParty = findNumbersForParty;