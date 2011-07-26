var nl = "\r\n";

function Client (socket, clients) {
  this.socket = socket;
  this.clients = clients;
  this.name = 'User ' + clients.globalcount;
  this.visited = {}; // rooms we've been to.
  this.inventory = []; // our stuff.
}

Client.prototype.gotoRoom = function (roomname) {
  this.room = require('./rooms/'+roomname+'.js');
  if (!this.visited[roomname])
  { this.room.look(this);
    this.visited[roomname] = true;
  }
}

Client.prototype.logout = function () {
  this.socket.end();
  this.clients.delClient(this);
}

Client.prototype.msg = function (message) {
  this.socket.write(message+nl);
}

Client.prototype.showPrompt = function () {
  this.socket.write('['+this.name+'] ' + this.room.name + '> ');
}

Client.prototype.say = function (message) {
  var umsg = "You say \""+message+"\"";
  var omsg = this.name + " says \"" + message + "\"";
  this.clients.message(this, umsg, omsg, this.room);
}

Client.prototype.whisper = function (to, message) {
  var target = this.clients.getUser(to);
  if (target)
  { this.msg("You whisper \""+message+"\" to "+to);
    target.msg(nl+this.name + " whispers \""+message+"\" to you.");
    target.showPrompt();
  }
  else
    this.msg("No such user \""+to+"\"");
}

Client.prototype.emote = function (message) {
  var umsg = "* "+message;
  var omsg = this.name + " " + message;
  this.clients.message(this, umsg, omsg, this.room);
}

Client.prototype.rename = function (newname) {
  if (this.clients.exists(newname)) {
    this.msg("Sorry, that name has already been taken.");
  }
  else {
    var oldname = this.name;
    this.name = newname;
    var umsg = "You have changed your name to: " + newname;
    var omsg = oldname + " has changed their name to: " + newname;
    this.clients.message(this, umsg, omsg);
  }
}

// Commands for all clients.
Client.prototype.parse = function (data) {
  var matches;
  var str = data.toString('utf8').replace(/(\n|\r)+$/, '');

  if (str.match(/^exit$/)) return this.logout();
  else if (matches = str.match(/^say "(.*?)" to (.*?)$/)) {
    this.whisper(matches[2], matches[1]);
  }
  else if (matches = str.match(/^say (.*?)$/)) {
    this.say(matches[1]);
  }
  else if (str.match(/^hi$/)) this.say("hello");
  else if (matches = str.match(/^emote (.*?)$/)) {
    this.emote(matches[1]);
  }
  else if (matches = str.match(/^rename ([\w\s'\.]+)/)) {
    this.rename(matches[1]); 
  }
  else if (str.match(/^bye$/)) this.say("goodbye");
  else if (this.room.parse(this, str)) true; // Do nothing.
  else
    this.msg("I don't understand \""+str+"\"");

  this.showPrompt();
}

exports.newClient = function (socket, clients) {
  return new Client(socket, clients);
}

// End of library.