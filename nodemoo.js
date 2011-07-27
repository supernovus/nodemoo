// The main nodemoo script.

var net = require('net');

var world = require('./lib/World.js');
var config = world.load('./game.json');

var server = net.createServer(function (socket) {
  var client = world.addClient(socket);
  client.msg("Welcome to NodeMoo");
  client.gotoRoom('start');
  client.showPrompt();
  socket.on('data', function (data) { 
    client.parse(data); 
  });
});

server.listen(1337, "127.0.0.1");

// End of script.
