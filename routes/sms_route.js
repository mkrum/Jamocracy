'use strict';

const PlaylistService = require('../services/playlist_service'),
    PartyService = require('../services/party_service'),
    MessengerService = require('../services/messenger_service');

exports.setup = (app) => {
    // This is executed when the twilio number receives a text
    app.post('/SMS', (req, res) => {
        const command = req.body.Body,
            from = req.body.From,
            fromShort = from.substring(2);
        PartyService.findPartyForNumber(fromShort)
            .then(body => {
                const code = body.party;
                if (command[0] === '!') {
                    PartyService.removeFromParty(fromShort)
                        .then(() => {
                            MessengerService.sendText('Playlist exited', from);
                            PlaylistService.updateSong('null', fromShort);
                            res.sendStatus(200);
                        });
                } else if (command[0] === '/') {
                    const lastSong = body.lastSong;
                    if (lastSong !== 'null') {
                        PartyService.findParty(code)
                            .then(playlist => {
                                PlaylistService.removeSong(lastSong, playlist, fromShort)
                                    .then(() => {
                                        MessengerService.sendText('Song removed', from);
                                    });
                                res.sendStatus(200);
                            }, err => {
                                console.log(err);
                            });
                    }
                } else {
                    PartyService.findParty(code)
                        .then(playlist => PlaylistService.getSong(command, playlist, code))
                        .then(data => {
                            const tracks = data.tracks,
                                playlist = data.playlist;
                            if (tracks.length === 0) {
                                MessengerService.sendText('No song found.');
                                res.sendStatus(404);
                            } else {
                                const song = tracks[0];
                                PlaylistService.addSongToPlaylist(song, playlist, fromShort)
                                    .then(() => {
                                        MessengerService.sendText('Song added: ' + song.name + ' by ' + song.artists[0].name + '. To remove, text "/".', from);
                                        res.sendStatus(201);
                                    }, (err) => {
                                        if (err === 'duplicate song') {
                                            MessengerService.sendText('Playlist already contains ' + song.name + ' by ' + song.artists[0].name, from);
                                            res.sendStatus(400);
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
                        MessengerService.sendText('Connected! You can now search for songs and artists to add. To exit the playlist, text "!". To remove your last song, text "/".', from);
                        res.sendStatus(200);
                    }, () => {
                        MessengerService.sendText('Not able to find party: ' + code + '. Please try again.');
                        res.sendStatus(404);
                    });
            });
    });
};
