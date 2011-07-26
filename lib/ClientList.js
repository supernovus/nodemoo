var nl = "\r\n";

function ClientList () {
  this.clients = [];
  this.globalcount = 1;
}

// Add a client to the client list.
ClientList.prototype.addClient = function (client) {
  this.clients.push(client);
  this.globalcount++;
}

// Delete a client from the client list.
ClientList.prototype.delClient = function (client) {
  for (var c in this.clients) {
    if (this.clients[c] === client)
    { this.clients.splice(c, 1);
      break;
    }
  }
}

// See if a client with a given name exists.
ClientList.prototype.exists = function (username) {
  for (var c in this.clients) {
    if (this.clients[c].name == username)
      return true;
  }
  return false;
}

ClientList.prototype.getUser = function (username) {
  for (var c in this.clients) {
    if (this.clients[c].name == username)
      return this.clients[c];
  }
  return undefined;
}

// Send a message to all users. This has no "from" user.
ClientList.prototype.broadcast = function (message) {
  for (var c in this.clients) {
    var client = this.clients[c];
    client.msg(message);
    client.showPrompt();
  }
}

// Send a message to all users, with a different format for the
// user who sent the message versus the other users.
ClientList.prototype.message = function (from, umsg, omsg, room) {
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

ClientList.prototype.userCount = function () {
  return this.clients.length;
}

module.exports = new ClientList();

// End of library.
