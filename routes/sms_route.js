'use strict';

const PlaylistService = require('../services/playlist_service'),
    PartyService = require('../services/party_service'),
    MessengerService = require('../services/messenger_service');

exports.setup = (app) => {
    // This is executed when the twilio number receives a text
    app.post('/SMS', (req, res) => {
        if (MessengerService.validate(req)) {
            const command = req.body.Body,
                from = req.body.From,
                fromShort = from.substring(2);
            PartyService.findPartyForNumber(fromShort)
                .then(body => {
                    const code = body.party;
                    if (command[0] === '!') {
                        PartyService.removeFromParty(fromShort)
                            .then(() => {
                                respondToText(res, 'Playlist exited');
                                PlaylistService.updateSong(fromShort, 'null');
                            });
                    } else if (command[0] === '/') {
                        const lastSong = body.lastSong;
                        if (lastSong !== 'null') {
                            PartyService.findParty(code)
                                .then(playlist => {
                                    PlaylistService.removeSong(lastSong, playlist, fromShort)
                                        .then(() => {
                                            respondToText(res, 'Song removed');
                                        });
                                }, err => {
                                    console.log('song removeal error: ' + err);
                                });
                        }
                    } else {
                        PartyService.findParty(code)
                            .then(playlist => PlaylistService.getSong(command, playlist, code))
                            .then(data => {
                                const tracks = data.tracks,
                                    playlist = data.playlist;
                                if (tracks.length === 0) {
                                    respondToText(res, 'No song found.');
                                } else {
                                    const song = tracks[0];
                                    PlaylistService.addSongToPlaylist(song, playlist, fromShort)
                                        .then(() => {
                                            respondToText(res, 'Song added: ' + song.name + ' by ' + song.artists[0].name + '. To remove, text "/".');
                                        }, (err) => {
                                            if (err === 'duplicate song') {
                                                respondToText(res, 'Playlist already contains ' + song.name + ' by ' + song.artists[0].name);
                                            } else {
                                                console.log('Error in SMS route:', err);
                                            }
                                        });
                                }
                            });
                    }
                },
                () => {
                    const code = command.toUpperCase().substring(0, 4);
                    PartyService.findParty(code)
                        .then(() => PartyService.addNumberToParty(fromShort, code))
                        .then(() => {
                            respondToText(res, 'Connected! You can now search for songs and artists to add. To exit the playlist, text "!". To remove your last song, text "/".');
                        }, () => {
                            respondToText(res, 'Not able to find party: ' + code + '. Please try again.');
                        });
                });
        } else {
            res.sendStatus(403);
        }
    });
};

function respondToText(res, msg) {
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(MessengerService.getTwiMLString(msg));
}
