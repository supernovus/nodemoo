var nl = "\r\n";

function World () {
  this.clients = [];
  this.rooms   = {};
  this.usercount = 1;
  this.Room = require('./Room.js');
}

// Add a client to the client list.
World.prototype.addClient = function (client) {
  this.clients.push(client);
  this.usercount++;
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

// Add a room
World.prototype.addRoom = function (roomid, init) {
  var room = this.Room.newRoom(init);
  this.rooms[roomid] = room;
}

// See if a client with a given name exists.
World.prototype.userExists = function (username) {
  for (var c in this.clients) {
    if (this.clients[c].name == username)
      return true;
  }
  return false;
}

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
