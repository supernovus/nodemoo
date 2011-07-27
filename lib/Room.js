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

function Room (id, world, init) {
  // Required items.
  this.id = id;
  this.world = world;

  // The room's name.
  if (init.name)
    this.name = init.name;
  else
    this.name = "Unnamed room";

  // The room's description.
  if (init.desc)
    this.description = init.desc;

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
  this.description = newdesc;
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
    var dir = matches[1];
    var to  = matches[2];
    this.connect(dir, to);
    return true;
  }
  else if (matches = str.match(/^unlink (\w+)$/)) {
    this.disconnect(dir);
    return true;
  }
  else if (matches = str.match(/^call this (.*?)$/)) {
    this.rename(matches[1]);
    return true;
  }
  else if (matches = str.match(/^describe here as (.*?)$/)) {
    this.describe(matches[1]);
    return true;
  }
  else if (matches = str.match(/^extend with (\w+)$/)) {
    this.mixin(matches[1]);
    return true;
  }
  else if (str.match(/^show parsers$/)) {
    client.msg("Extra parsers in this room:");
    for (var p in this.parsers) {
      var parser = this.parsers[p];
      client.msg(" " + parser);
    }
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

// Feel free to override the prototype for look().
// The default just returns the 'description' member.
Room.prototype.look = function (client) {
  var desc;
  if (this.description)
    desc = this.description;
  else
    desc = "You are in " + this.name;
  client.msg(desc);
  // Okay, now list the contents of the room, as long as they aren't implicit.
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
  // Next, list other people in this room.
  for (var c in client.world.clients)
  { var tc = client.world.clients[c];
    if (tc === client) continue;
    if (tc.room !== this) continue;
    var cname = tc.name;
    client.msg(cname + " is here.");
  }
  // Finally, list any visible exits.
  if (this.exits) {
    client.msg("You can go: ");
    for (var e in this.exits) {
      client.msg(" " + e);
    }
  }
}

Room.prototype.go = function (client, direction) {
  if (this.exits && this.exits[direction]) {
    client.gotoRoom(this.exits[direction]);
  }
  else
    client.msg("You can't go that way.");
}

Room.prototype.connect = function (direction, target, nosync) { 
  if (!this.exits)
    this.exits = {};
  this.exits[direction] = target;
  if (!nosync && direction in opposites) {
    var troom = this.world.getRoom(target);
    var odir = opposites[direction];
    if (troom)
      troom.connect(odir, this.id, true);
  }
}

Room.prototype.disconnect = function (direction) {
  if (!this.exists)
    return;
  delete(this.exits[direction]);
}

// Add some functions from an extension class.
// Specify the role name here.
Room.prototype.mixin = function (rolename, init) {
  var role = require('./Room/'+rolename+'.js');
  this.extend(role, init);
}

exports.newRoom = function (id, world, init) {
  return new Room(id, world, init);
}

