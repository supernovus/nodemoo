// The main nodemoo script.

var net = require('net');

var world = require('./lib/World.js');
var clib = require('./lib/Client.js');

var server = net.createServer(function (socket) {
  var client = clib.newClient(socket, world);
  client.msg("Welcome to NodeMoo");
  world.addRoom('start', {
    'name' : 'The Lobby',
    'desc' : "Not much to see here yet. It's a big, mostly empty room.",
  });
  client.gotoRoom('start');
  world.addClient(client);
  client.showPrompt();
  socket.on('data', function (data) { 
    client.parse(data); 
  });
});

server.listen(1337, "127.0.0.1");

// End of script.
