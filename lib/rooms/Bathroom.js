function BathRoom () {
  this.name = 'A Bathroom';
  this.description = "You are in a bathroom, there is a toilet and a sink.";
  this.exits = { 'south' : 'Start' };
  this.parseRoom = function (client, str) {
    if (str.match(/^shit$/)) {
      client.emote("sits on the toilet and takes a bit shit.");
      return true;
    }
    else
      return false
  };
}

BathRoom.prototype = require('../Room.js');

module.exports = new BathRoom();

