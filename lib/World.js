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
  this.config     = '';
  this.Room       = require('./Room.js');
  this.Client     = require('./Client.js');
}

// Add a client to the client list.
World.prototype.addClient = function (socket) {
  var client = this.Client.newClient(socket, this);
  this.clients.push(client);
  this.usercount++;
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
  this.config = configfile;
  var jsontext = fs.readFileSync(configfile);
  var config = JSON.parse(jsontext);

  // First, let's load rooms.
  if (config.rooms)
    for (var r in config.rooms)
      this.addRoom(r, config.rooms[r]);

  // TODO: cached players, and more.
  return config;
}

// Add a room
World.prototype.addRoom = function (roomid, init) {
  var room = this.Room.newRoom(roomid, this, init);
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
    client.msg(message);
    client.showPrompt();
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
      client.msg(nl+omsg);
      client.showPrompt();
    }
  }
}

World.prototype.userCount = function () {
  return this.clients.length;
}

module.exports = new World();

// End of library.
