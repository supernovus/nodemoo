// This is basically a parent object. It's never used on it's own.

var nl = "\r\n";

function Room () {} // Yeah, pretty boring.

// Commands applicable to Rooms in general.
Room.prototype.parse = function (client, str) {
  var matches;
  var dirs = { 
    'n' : 'north',
    'e' : 'east',
    's' : 'south',
    'w' : 'west',
    'u' : 'up',
    'd' : 'down'
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
  else if (this.parseRoom && this.parseRoom(client,str))
    return true;
  else
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
  for (var c in client.clients.clients)
  { var tc = client.clients.clients[c];
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

Room.prototype.connect = function (direction, target) { 
  this.exits[direction] = target;
}

Room.prototype.disconnect = function (direction) {
  delete(this.exits[direction]);
}

module.exports = new Room();

