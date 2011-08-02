// New-style Rooms.

var opposites = {
  'north'     : 'south',
  'south'     : 'north',
  'east'      : 'west',
  'west'      : 'east',
  'up'        : 'down',
  'down'      : 'up',
  'northeast' : 'southwest',
  'southwest' : 'northeast',
  'northwest' : 'southeast',
  'southeast' : 'northwest'
};

function Room (id, init) {
  // We need an id.
  this.id = id;

  // The room's name.
  if (init.name)
    this.name = init.name;
  else
    this.name = "Unnamed room";

  // The room's description.
  if (init.desc)
    this.desc = init.desc;

  // Any exits from this room.
  if (init.exits)
    this.exits = init.exits;

  // Any mixins that need to be added.
  if (init.mixin)
    for (var m in init.mixin)
      this.mixin(init.mixin[m], init);

  // If any contents, let's add them too.
  if (init.contents) {
    this.contents = world.loadContents(init.contents);
  } 

}

Room.prototype.rename = function (newname) {
  this.name = newname;
}

Room.prototype.describe = function (newdesc) {
  this.desc = newdesc;
}

// Commands applicable to Rooms in general.
Room.prototype.parse = function (client, str) {
  var matches;
  var dirs = { 
    'n'  : 'north',
    'e'  : 'east',
    's'  : 'south',
    'w'  : 'west',
    'u'  : 'up',
    'd'  : 'down',
    'nw' : 'northwest',
    'ne' : 'northeast',
    'sw' : 'southwest',
    'se' : 'southeast'
  };
  if (str.match(/^l(ook)?$/)) {
    this.look(client);
    return true;
  }
  else if (matches = str.match(/^go (\w+)/)) {
    this.go(client, matches[1]);
    return true;
  }
  else if (matches = str.match(/^[neswud]$/)) {
    var dir = dirs[matches[0]];
    this.go(client, dir);
    return true;
  }
  else if (matches = str.match(/^(ne|nw|se|sw)$/)) {
    var dir = dirs[matches[1]];
    this.go(client, dir);
    return true;
  }
  else if (matches = str.match(/^link (\w+) to (\w+)$/)) {
    if (client.can.build) {
      var dir = matches[1];
      var to  = matches[2];
      this.connect(dir, to);
    }
    else
      client.youCant();
    return true;
  }
  else if (matches = str.match(/^unlink (\w+)$/)) {
    if (client.can.build)
      this.disconnect(dir);
    else
      client.youCant();
    return true;
  }
  else if (matches = str.match(/^call this (.*?)$/)) {
    if (client.can.build)
      this.rename(matches[1]);
    else
      client.youCant();
    return true;
  }
  else if (matches = str.match(/^describe here as (.*?)$/)) {
    if (client.can.build)
      this.describe(matches[1]);
    else
      client.youCant();
    return true;
  }
  else if (matches = str.match(/^extend with (\w+)$/)) {
    if (client.can.build)
      this.mixin(matches[1]);
    else
      client.youCant();
    return true;
  }
  else if (str.match(/^show room parsers$/)) {
    if (client.can.build) {
      client.msg("Extra parsers in this room:");
      for (var p in this.parsers) {
        var parser = this.parsers[p];
        client.msg(" " + parser);
      }
    }
    else
      client.youCant();
    return true;
  }
  else if (this.parsers)
  { for (var p in this.parsers) {
      var parser = this.parsers[p];
      var func = this[parser];
      if (func && func(client, str))
        return true;
    }
  }

  // If nothing was found, we return false.
  return false;
}

// Look at a room, list it's contents,
// exits and who is in it.
Room.prototype.look = function (client) {
  var desc;
  if (this.desc)
    desc = this.desc;
  else
    desc = "You are in " + this.name;
  client.msg(desc);

  this.listContents(client);
  this.listClients(client);
  this.listExits(client);
}

// List the contents of the room, as long as they aren't implicit.
Room.prototype.listContents = function (client) {
  if (this.contents) {
    for (var c in this.contents) {
      var item = this.contents[c];
      if (item.implicit) continue; 
      if (item.heredesc)
        client.msg(item.heredesc());
      else
        client.msg("There is a "+item.name+" here.");
    }
  }
}

// List the logged in users in this room.
Room.prototype.listClients = function (client) {
  for (var c in world.clients)
  { var tc = world.clients[c];
    if (tc === client) continue; // Skip ourselves.
    if (!tc.connected) continue; // Skip logged out users.
    if (tc.room !== this) continue; // Skip users not in this room.
    var cname = tc.name;
    client.msg(cname + " is here.");
  }
}

// List any exits from this room.
Room.prototype.listExits = function (client) {
  if (this.exits) {
    if (!this.exitlist)
      this.buildExitList();
    var ways = this.exitlist.length;
    if (ways == 1)
      client.msg("You can go "+this.exitlist[0]+".");
    else if (ways == 2)
      client.msg("You can go "+this.exitlist.join(" and ")+".");
    else {
      var message = "You can go ";
      for (var e in this.exitlist)
      { if (e == ways-1)
          message += "and ";
        message += this.exitlist[e];
        if (e != ways-1)
          message += ", ";
      }
      message += ".";
      client.msg(message);
    }
  }
  else
    client.msg("There are no obvious exits from here.");
}

// Build a flat list of exits for use in listExits.
Room.prototype.buildExitList = function () {
  if (!this.exits) return; // We can't do anything without exits.
  this.exitlist = [];
  for (var e in this.exits)
    this.exitlist.push(e);
}

Room.prototype.go = function (client, direction) {
  if (this.exits && this.exits[direction]) {
    client.gotoRoom(this.exits[direction]);
  }
  else
    client.msg("You can't go that way.");
}

// Build a connection to another room.
// If the connection is a known direction, then
// a corresponding connection will be made in the
// target room.
Room.prototype.connect = function (direction, target, nosync) { 
  if (!this.exits)
    this.exits = {};
  this.exits[direction] = target;
  if (!nosync && direction in opposites) {
    var troom = world.getRoom(target);
    var odir = opposites[direction];
    if (troom)
      troom.connect(odir, this.id, true);
  }
  this.buildExitList();
}

// Deletes a connection. This does NOT delete any corresponding connections.
Room.prototype.disconnect = function (direction) {
  if (!this.exists)
    return;
  delete(this.exits[direction]);
  this.buildExitList();
}

// Add some functions from an extension class.
// Specify the role name here.
Room.prototype.mixin = function (rolename, init) {
  var role = require('./Room/'+rolename+'.js');
  this.extend(role, init);
}

exports.newRoom = function (id, init) {
  return new Room(id, init);
}

