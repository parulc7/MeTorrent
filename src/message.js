'use strict';
// Module to build Handshake Message Buffer used to interact with peers

// Handshake Buffer = <pstr_len><pstr><reserved><info_hash><peer_id>

/** pstr => string identifier of the protocol (pstr = "BitTorrent Protocol as per version 1.0 of BitTorrent Protocol")
 * pstr_len => length of pstr (pstrlen = 19)
 * reserved => eight reserved bytes (all intitally 0 )
 * peer_id => 20 byte unique id for client
 */

const Buffer = require('buffer').Buffer;
const torrentParser = require('./torrent-parser');
const util = require('./util');


// Function to build a handshake message buffer
module.exports.buildHandshake = (torrent)=>{
    // 68 byte buffer
    const buf = Buffer.alloc(68);
    // pstrlen
    buf.writeUInt8(19, 0);
    // pstr
    buf.write('BitTorrent Protocol', 1);
    // reserved 
    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);
    // infohash from torrentParser.js
    torrentParser.infoHash(torrent).copy(buf, 28);
    // peer_id from util.js
    buf.write(util.genId());
    return buf;
}