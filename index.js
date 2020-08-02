'use strict';

const download = require('./src/download');
const torrentParser = require('./src/torrent-parser');

// Get torrent file name from command line 2nd argument
const torrent = torrentParser.open(process.argv[2]);
// Run download protocol on the torrent file
download(torrent);