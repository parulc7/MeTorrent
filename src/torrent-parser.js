'use strict';

const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');
const bignum = require('bignum');

// Open Torrent File
module.exports.open = (filepath)=>{
    return bencode.decode(fs.readFileSync(filepath));
};

// Return Size of Torrent
module.exports.size = torrent =>{
    // Two cases possible - one file or multiple files
    // If torrent has only one file, just return the length property
    // If torrent has multiple files, iterate over the files and sum their length properties and return
    const size = torrent.info.files?torrent.info.files.map(file=>file.length).reduce((a,b)=>a+b):torrent.info.length;

    // Write the size value into a buffer of size 8 bytes
    return bignum.toBuffer(size, {size:8});
};

// Return infohash from the torrent object
module.exports.infoHash = torrent =>{
    const info = bencode.decode(torrent.info);

    // Returns a 20 byte long fixed length buffer
    return crypto.createHash('sha1').update(info).digest();
};