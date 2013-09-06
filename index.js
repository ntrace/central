require('colors');

/// In Server

var inServer = require('./in_server');
var inPort = 9190;

inServer.on('listening', function() {
  console.log('Central in server listening on port %d'.green, inPort);
});

inServer.listen(inPort);


/// Out Server

var outServer = require('./out_server');
var outPort = 9191;

outServer.on('listening', function() {
  console.log('Central out server listening on port %d'.green, outPort);
});

outServer.listen(outPort);