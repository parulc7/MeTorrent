'use strict';
// Download pieces of files from peers by creating a TCP Connection


const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');

// Download method for peers
function download(peer){
    // Create a socket instance
    const socket = net.Socket();
    // Print errors from socket to console
    socket.on('error', console.log);
    // Connect method for TCP Connection
    socket.connect(peer.port, peer.ip, ()=>{

    });
    // Handling Data from Peer
    socket.on('data', data =>{

    });
}

module.exports = torrent =>{
    // Run download function on all the peers obtained from the tracker
    tracker.getPeers(torrent, peers =>{
        peers.forEach(download);
    });
}

