var nl = "\r\n";

function Client (socket, username) {
  this.socket = socket;
  this.connected = true;
  this.name = username;
  this.visited = {}; // rooms we've been to.
  this.inventory = []; // our stuff.
}

Client.prototype.gotoRoom = function (roomid) {
  var room = world.getRoom(roomid);
  if (room) {    
    this.room = room;
    if (!this.visited[roomid])
    { this.room.look(this);
      this.visited[roomid] = true;
    }
  }
  else
    this.msg("No such room: "+roomid);
}

Client.prototype.logout = function () {
  this.connected = false;
  this.socket.end();
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
  world.message(this, umsg, omsg, this.room);
}

Client.prototype.whisper = function (to, message) {
  var target = world.getUser(to);
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
  world.message(this, umsg, omsg, this.room);
}

Client.prototype.rename = function (newname) {
  if (world.userExists(newname)) {
    this.msg("Sorry, that name has already been taken.");
  }
  else {
    var oldname = this.name;
    this.name = newname;
    var umsg = "You have changed your name to: " + newname;
    var omsg = oldname + " has changed their name to: " + newname;
    world.message(this, umsg, omsg);
  }
}

// Commands for all clients.
Client.prototype.parse = function (data) {
  var matches;
  var str = world.dataString(data);

  if (str.match(/^exit$/)) return this.logout();
  else if (this.room.parse(this, str)) true; // We found a Room call.
  else if (matches = str.match(/^say "(.*?)" to (.*?)$/)) {
    this.whisper(matches[2], matches[1]);
  }
  else if (matches = str.match(/^say (.*?)$/)) {
    this.say(matches[1]);
  }
  else if (matches = str.match(/^emote (.*?)$/)) {
    this.emote(matches[1]);
  }
  else if (matches = str.match(/^call me ([\w\s'\.]+)/)) {
    this.rename(matches[1]); 
  }
  else if (matches = str.match(/^make room (\w+)\s?(?:called)?\s?([\w\s'\.]+)?/)) {
    var roomid = matches[1];
    var roomname = matches[2];
    var init = {};
    if (roomname)
      init.name = roomname;
    if (world.roomExists(roomid))
      this.msg("Sorry, a room called "+roomid+" already exists.");
    else {
      world.addRoom(roomid, init);
      this.gotoRoom(roomid);
    }
  }
  else if (str.match(/^hi$/)) this.say("hello");
  else if (str.match(/^bye$/)) this.say("goodbye");
  else
    this.msg("I don't understand \""+str+"\"");

  this.showPrompt();
}

exports.newClient = function (socket, username) {
  return new Client(socket, username);
}

// End of library.