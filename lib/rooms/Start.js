function StartRoom () {
  this.name = 'The Lobby';
  this.description = "You are in the main lobby. There's not much here yet.";
  this.exits = { 'north' : 'Bathroom' };
}

StartRoom.prototype = require('../Room.js');

module.exports = new StartRoom();

