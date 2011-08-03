var nl = "\r\n";

function Client (socket, username, init) {
  this.socket = socket;
  this.name = username;
  this.visited = {}; // rooms we've been to. This isn't stored.

  // If we are loaded from a config, assume we're not connected.
  // Otherwise, assume we are.
  if (init)
    this.connected = false;
  else
    this.connected = true;

  if (init && init.desc)
    this.desc = init.desc;
  else
    this.desc = "Looks like an uninteresting person.";

  // Our inventory, this can be stored.
  if (init && init.inventory)
    this.inventory = init.inventory;
  else
    this.inventory = [];

  // Permissions.
  if (init && init.can)
    this.can = init.can;
  else
    this.can = {
      "build" : false,
      "admin" : false
    };
  // The ultimate permission, cannot be "granted" or "revoked".
  if (init && init.god)
    this.god = init.god;

  // Passphrase support
  if (init && init.pass)
    this.pass = init.pass;

}

Client.prototype.gotoRoom = function (roomid) {
  //console.log(this.name + " is going to " + roomid);
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
  if (this.connected)
    this.socket.write(message+nl);
}

Client.prototype.showPrompt = function () {
  if (this.connected) {
    this.socket.write('['+this.name+'] ' + this.room.name);
    if (this.can.build)
      this.socket.write(' ('+this.room.id+')');
    this.socket.write('> ');
  }
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
    target.update(this.name + " whispers \""+message+"\" to you.");
  }
  else
    this.msg("No such user \""+to+"\"");
}

Client.prototype.emote = function (message) {
  var umsg = "* "+message;
  var omsg = this.name + " " + message;
  world.message(this, umsg, omsg, this.room);
}

Client.prototype.update = function (message) {
  this.msg(nl+message);
  this.showPrompt();
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

  if (str == 'exit') return this.logout();
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
    if (this.can.build) {
      var roomid = matches[1];
      var roomname = matches[2];
      this.buildRoom(roomid, roomname);
    }
    else
      this.youCant();
  }
  else if (matches = str.match(/^goto (\w+)$/)) {
    if (this.can.build) {
      var go = matches[1];
      if (world.roomExists(go))
        this.gotoRoom(roomid);
      else
        this.msg("That room does not exist.");
    }
    else
      this.youCant();
  }
  else if (matches = str.match(/^grant (\w+) (?:to )?([\w\s'\.]+)/)) {
    if (this.can.admin || this.god) { // a god can always grant.
      var permission = matches[1];
      var username = matches[2];
      var user = world.getUser(username);
      if (user) {
        user.can[permission] = true;
        user.update(this.name+" has granted you the ability to "+permission+".");
      }
      else
        this.msg("No such user.");
    }
    else
      this.youCant();
  }
  else if (matches = str.match(/^revoke (\w+) (?:from )?([\w\s'\.]+)/)) {
    if (this.can.admin) {
      var permission = matches[1];
      var username = matches[2];
      var user = world.getUser(username);
      if (user) {
        if (!this.god && user.god) {
          user.update(this.name + " tried to revoke "+permission+" on you!");
          this.msg("You cannot revoke the powers of a god!");
        }
        else {
          user.can[permission] = false;
          user.update(this.name+" has revoked your ability to "+permission+".");
        }
      }
      else
        this.msg("No such user.");
    }
    else
      this.youCant();
  }
  else if (matches = str.match(/^kill user ([\w\s'\.]+)/)) {
    if (this.can.admin) {
      var username = matches[1];
      var user = world.getUser(username);
      if (user) {
        if (user.god) {
          user.update(this.name + " tried to kill you!");
          this.msg("You cannot kill a god!");
        }
        else {
          user.update("You have been killed, goodbye.");
          user.logout();
          world.delClient(user);
        }
      }
      else
        this.msg("No such user.");
    }
    else
      this.youCant();
  }
  else if (matches = str.match(/^passwd (\w+)/)) {
    this.pass = matches[1];
  }
  else if (str == 'hi') this.say("hello");
  else if (str == 'bye') this.say("goodbye");
  else
    this.msg("I don't understand \""+str+"\"");

  this.showPrompt();
}

// A user isn't allowed to use a certain command
Client.prototype.youCant = function () {
  this.msg("You can't do that.");
}

// Build a room
Client.prototype.buildRoom = function (roomid, roomname) {
  if (world.roomExists(roomid))
    this.msg("Sorry, a room called "+roomid+" already exists.");
  else {
    var init = {};
    if (roomname)
      init.name = roomname;
    world.addRoom(roomid, init);
    this.gotoRoom(roomid);
  }
}

exports.newClient = function (socket, username, init) {
  return new Client(socket, username, init);
}

// End of library.