// The main nodemoo script.

var net = require('net');

// Let's add an "extend" method, with an optional "setup" component.
Object.defineProperty(Object.prototype, "extend", {
  enumerable: false,
  value : function (from) {
    for (var f in from)
    { if (f == 'setup')
        from.setup(this);
      else
        this[f] = from[f];
    }
  }
});

var world = require('./lib/World.js');
var clib = require('./lib/Client.js');

// The starting room. Rather boring.
world.addRoom('start', {
  'name' : 'The Lobby',
  'desc' : "Not much to see here yet. It's a big, mostly empty room.",
});

var server = net.createServer(function (socket) {
  var client = clib.newClient(socket, world);
  client.msg("Welcome to NodeMoo");
  client.gotoRoom('start');
  world.addClient(client);
  client.showPrompt();
  socket.on('data', function (data) { 
    client.parse(data); 
  });
});

server.listen(1337, "127.0.0.1");

// End of script.
