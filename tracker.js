'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;


// Function for sending message over udp
function udpSend(socket, message, rawUrl, callback=()=>{})
{
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback);
}

// Function to get response type -> connect or announce



module.exports.getPeers = (torrent, callback) =>{
    const socket = dgram.createSocket('udp-4');
    const url = torrent.announce.toString('utf-8');

    // Send Connection Request over the socket
    udpSend(socket, buildConnRequest(), url);
    // Event Handler for Socket
    socket.on('message', res =>{

        // Parse connection response
        // If connect
        if(respType(res)=='connect')
        {
            // Parse the connection request and get the response
            const connResp = parseConnReq(res);
            // Get the connectionId and build a announce request
            const announceReq = buildAnnounceRequest(connResp.connectionId);
            // Send the announce request over the UDP Instance
            udpSend(socket, announceReq, url);
        }
        // If announce request
        else if(respType(res)=='announce')
        {
            // Parse the Announce request and get the response
            const announceResp = parseAnnounceResp(res);

            //Pass the received Peers to callback
            callback(announceResp.peers);
        }
    });
}

