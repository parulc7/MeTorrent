"use strict"

// Required Modules
const fs = require('fs');
const bencode = require('bencode');
const tracker = require('./tracker');
// Decoding the Torrent File
// readFileSync returns a buffer
// We decode the buffer using Bencode serialization format, which is exclusive to torrent files
const torrent = bencode.decode(fs.readFileSync('puppy.torrent'));

// Use the getPeers function from Tracker Protocol File to get the peers
tracker.getPeers(torrent, peers=>{
    console.log(peers);
});

