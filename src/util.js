'use strict';

const crypto = require('crypto');
let id = null;

// Function to generate random peer_id
module.exports.genId = ()=>{
    if(!id){
        id = crypto.randomBytes(20);
        Buffer.from('-AT0001-').copy(id, 0);
    }
    return id;
}