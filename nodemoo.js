// The main nodemoo script.

var net = require('net');

var clients = require('./lib/ClientList.js');
var clib = require('./lib/Client.js');

var server = net.createServer(function (socket) {
  var client = clib.newClient(socket, clients);
  client.msg("Welcome to NodeMoo");
  client.gotoRoom('Start');
  clients.addClient(client);
  client.showPrompt();
  socket.on('data', function (data) { 
    client.parse(data); 
  });
});

server.listen(1337, "127.0.0.1");

// End of script.
