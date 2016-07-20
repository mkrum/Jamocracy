'use strict';

const DBService = require('../services/db_service'),
    MessengerService = require('../services/messenger_service');
exports.setup = (app) => {
    // Create playlist code, store playlist in database
    // TODO: Refractor this. I really don't like how I wrote this, but I don't
    // know enough about closures and scope in order to properly write it.
    app.post('/success', (req, res) => {
        // check to see if this playlist already has a party code
        if (req.body.isNewPlaylist === 'false') {
            // check to see if this playlist exits in the parties collection
            DBService.find('parties', req.body.playlist)
                .then((data) => {
                    if (data.body.count === 0) {
                        putNumberAndPartyInCollections(req, randomString());
                    } else {
                        const partyCode = data.body.results[0].path.key;
                        putNumberAndPartyInCollections(req, partyCode);
                    }
                })
                .fail((err) => {
                    console.log('Error in search: ' + err);
                    putNumberAndPartyInCollections(req, randomString());
                });
        } else { // default party code is 4 random letters
            putNumberAndPartyInCollections(req, randomString());
        }
        res.end();
    });
};

//Generates a random string of four capital letters
function randomString() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let i, string = '';
    for (i = 0; i < 4; i++) {
        string += letters[Math.floor(Math.random() * 26)];
    }
    return string;
}

// add number and party to database
function putNumberAndPartyInCollections(req, partyCode) {
    //  send text response to playlist creator
    MessengerService.sendText('This is your Jamocracy Number! Text "!" to exit this playlist. Party Code: ' + partyCode, req.body.number);

    // create or update party in parties collection in database
    DBService.update('parties', partyCode, {
        'creatorNumber': req.body.number,
        'creatorName': req.body.name,
        'id': req.body.playlist,
        'access_token': req.body.access_token,
        'refresh_token': req.body.refresh_token
    }).fail((err) => {
        console.log('Database failure: ', JSON.stringify(err));
    });

    // add creator's number to numbers collection in database
    DBService.update('numbers', req.body.number, {
        'party': partyCode,
        'lastSong': null
    }).fail((err) => {
        console.log('Database failure: ', JSON.stringify(err));
    });
}

