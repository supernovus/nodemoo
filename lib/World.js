// The main library that powers The World.

var fs = require('fs');

// Let's add an "extend" method, with an optional "setup" component.
Object.defineProperty(Object.prototype, "extend", {
  enumerable: false,
  value : function (from, init) {
    for (var f in from)
    { if (f == 'setup')
        from.setup(this, init);
      else
        this[f] = from[f];
    }
  }
});

var nl = "\r\n";

// Construct the world.
function World () {
  this.clients    = [];
  this.rooms      = {};
  this.usercount  = 1;
  this.config     = {};
  this.configfile = '';
  this.Room       = require('./Room.js');
  this.Client     = require('./Client.js');
}

// Convert a buffer data into a utf8 string, and chomp it.
World.prototype.dataString = function (data) {
  var str = data.toString('utf8').replace(/(\n|\r)+$/, '');
  return str;
}

// Login to the world
World.prototype.login = function (socket) {
  socket.write(this.config.welcome+nl);
  socket.write("Enter your username: ");
  //  Below we use "world" instead of "this" for disabiguity.
  var loginHandler = function (data) {
    var client;
    var checkpass = false;
    if (socket.worldClient) { // We have a pass-phrase.
      checkpass = true;
      var passphrase = world.dataString(data);
      client = socket.worldClient;
      if (passphrase == client.pass) {
        client.socket = socket;
        client.connected = true;
        checkpass = false;
      }
      else {
        if (socket.worldTries == 3) {
          socket.write("Sorry, goodbye."+nl);
          socket.end();
        }
        else {
          socket.worldTries++;
          socket.write("Try again: ");
        }
      }
    }
    else {
      // By default we assume users have no pass-phrase.
      var username = world.dataString(data);
      client = world.getUser(username);
      socket.worldClient = client; // Save in case of pass-phrases.
      if (client) { 
        if (client.connected)
        { username += ' ' + world.usercount;
          socket.write("Sorry, that name is in use, we'll call you "+username+nl);
          client = world.newClient(socket, username);
  
        }
        else {
          if (client.pass) {
            socket.worldTries = 0;
            socket.write("Enter your passphrase: ");
            checkpass = true;
          }
          else {
            client.socket = socket;
            client.connected = true;
          }
        }
      }
      else
        client = world.newClient(socket, username);
    }
    if (!checkpass) {
      client.showPrompt();
      socket.removeAllListeners('data');
      socket.on('data', function (data) { client.parse(data); });  
    }
  }
  socket.on('data', loginHandler);
}

// Add a new client to the client list.
World.prototype.newClient = function (socket, username, init) {
  var client = this.Client.newClient(socket, username, init);
  this.clients.push(client);
  this.usercount++;
  var room;
  if (init && init.room)
    room = init.room
  else
    room = this.config.start;
  client.gotoRoom(room);
  return client;
}

// Delete a client from the client list.
World.prototype.delClient = function (client) {
  for (var c in this.clients) {
    if (this.clients[c] === client)
    { this.clients.splice(c, 1);
      break;
    }
  }
}

// Load a world configuration
World.prototype.load = function (configfile) {
  // Okay, let's load the file.
  this.configfile = configfile;
  var jsontext = fs.readFileSync(configfile);
  var config = JSON.parse(jsontext);

  // Make the config available elsewhere.
  this.config = config;

  // Let's load rooms.
  if (config.rooms)
    for (var r in config.rooms)
      this.addRoom(r, config.rooms[r]);

  // Let's load stored client configs.
  if (config.clients)
    for (var c in config.clients)
      this.newClient(null, c, config.clients[c]);

  return config;
}

// Add a room
World.prototype.addRoom = function (roomid, init) {
  var room = this.Room.newRoom(roomid, init);
  this.rooms[roomid] = room;
}

// Parse a contents JSON config, and return
// an array of contents.
World.prototype.loadContents = function (config) {
  var contents = [];
  // TODO: actually support items maybe?
  return contents;
}

// See if a client with a given name exists.
World.prototype.userExists = function (username) {
  for (var c in this.clients) {
    if (this.clients[c].name == username)
      return true;
  }
  return false;
}

// Get a specific user.
World.prototype.getUser = function (username) {
  for (var c in this.clients) {
    if (this.clients[c].name == username)
      return this.clients[c];
  }
  return undefined;
}

World.prototype.roomExists = function (roomid) {
  if (this.rooms[roomid])
    return true;
  return false;
}

World.prototype.getRoom = function (roomid) {
  if (this.rooms[roomid])
    return this.rooms[roomid];
  return undefined;
}

// Send a message to all users. This has no "from" user.
World.prototype.broadcast = function (message) {
  for (var c in this.clients) {
    var client = this.clients[c];
    if (client.connected) {
      client.msg(message);
      client.showPrompt();
    }
  }
}

// Send a message to all users, with a different format for the
// user who sent the message versus the other users.
World.prototype.message = function (from, umsg, omsg, room) {
  for (var c in this.clients) {
    var client = this.clients[c];
    if (client === from)
      client.msg(umsg);
    else {
      if (room)
        if (client.room !== room) continue;
      if (client.connected) {
        client.msg(nl+omsg);
        client.showPrompt();
      }
    }
  }
}

World.prototype.userCount = function () {
  return this.clients.length;
}

module.exports = new World();

// End of library.
