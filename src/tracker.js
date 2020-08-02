'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');

// Function for sending message over udp
function udpSend(socket, message, rawUrl, callback=()=>{})
{
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback);
}
// Function to build a connection request => following the BEPs
function buildConnRequest(){

//    Offset     Size            Name            Value
//     0      64-bit integer  connection_id   0x41727101980
//    8       32-bit integer  action          0 // connect
//    12      32-bit integer  transaction_id  ? // random
//  Total 16

    // 64 bit connection id + 32 bit action type + 32 bit transaction_id
    // 8+4+4 = 16 bytes message length
    const buff = Buffer.alloc(16);
    // Write the connection id to the buffer
    // Magic Constant = (hex) 0x41727101980 should be the connection id
    buff.writeUInt32BE(0x417, 0); //(data, offset)
    buff.writeUInt32BE(0x27101980, 4);

    // Write the action => 0 for connect and 1 for announce
    buff.writeUInt32BE(0, 8);
    // the transaction id can be randomly generated
    // Use built in crypto module to create a random number for our buffer
    crypto.randomBytes(4).copy(buff, 12);
    return buff;
}

// Function to parse the response of the connection request
function parseConnReq(resp){
    // Read or slice on the basis of offset format
    return {
        action: resp.readUInt32BE(0),
        transactionId:resp.readUInt32BE(4),
        connectionId:resp.slice(8) // Get last 8 bytes as we can't read a 64 bit integer
    }
}

// Function to build a Announce Request

function buildAnnounceRequest(connId, torrent, port=6881){
// Offset  Size              Name            Value
// 0       64-bit integer  connection_id
// 8       32-bit integer  action          1 // announce
// 12      32-bit integer  transaction_id
// 16      20-byte string  info_hash
// 36      20-byte string  peer_id
// 56      64-bit integer  downloaded
// 64      64-bit integer  left
// 72      64-bit integer  uploaded
// 80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped
// 84      32-bit integer  IP address      0 // default
// 88      32-bit integer  key             ? // random
// 92      32-bit integer  num_want        -1 // default
// 96      16-bit integer  port            ? // should be betwee
// Total=98

    // allocUnsafe() creates a not pre-filled buffer i.e. may reuse older buffers
    const buff = Buffer.allocUnsafe(98);
    // Copy connection Id to the buffer with offset 0 (size = 8 byte)
    connId.copy(buff, 0);
    // Write the action type (announce -> 1) into the buffer with offset of 8 (size = 4 byte)
    buff.writeUInt32BE(1,8);
    // Transaction id has to be randomly generated(size = 4 bytes)
    crypto.randomBytes(4).copy(buff,12);
    // Get Info hash from torrentParser Module and copy to buffer (size = 20 byte)
    torrentParser.infoHash(torrent).copy(buff, 16);
    // Generate peer_id using util module and copy to buffer(size = 20 bytes)
    util.genId().copy(buff, 36);
    // Create a buffer for downloaded files and copy to response buffer (8 bytes)
    Buffer.alloc(8).copy(buff, 56);
    // Return the size of data left to be downloaded(size = 8 bytes)
    torrentParser.size(torrent).copy(buff, 64);
    // Create a buffer for uploaded files and copy to the response buffer(size = 8 bytes)
    // Buffer.alloc creates a buffer initiated to 0
    Buffer.alloc(8).copy(buff,72);
    // Create the status flag -> 0 : none, 1:completed, 2:started, 3:stopped
    buff.writeUInt32BE(0, 80);
    // IP Address of the Peer (size = 4 bytes)
    buff.writeUInt32BE(0, 84);
    // Generate a random key (size = 4 bytes)
    crypto.randomBytes(4).copy(buff, 88);
    // Num Want (size = 4 bytes)
    // Signed Integer (NEGATIVE VALUE (-1))
    buff.writeInt32BE(-1, 92);
    // Port value
    buff.writeUInt16BE(port, 96);
    return buff;
}

// Function to parse announce response
function parseAnnounceResp(res){
    function group(iterable, groupsize){
        let groups = [];
        for(let i=0;i<iterable.length;i+=groupsize){
            groups.push(iterable.slice(i, i+groupsize));
        }
        return groups;
    }

    return {
        action: res.readUInt32BE(0),
        transactionId:res.readUInt32BE(4),
        leechers:res.readUInt32BE(8),
        seeders:res.readUInt32BE(12),
        peers:group(res.slice(20), 6).map(address =>{
            return {
                ip:address.slice(0,4).join('.'),
                port:address.readUInt16BE(4)
            }
        })
    }
}

// Function to return the response type - connect or announce
function respType(res){
    const action = res.readUInt32BE(0);
    if(action===0) return 'connect';
    if(action===1) return 'announce';
}

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

