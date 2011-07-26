function Bathroom () {} // A Bathroom Role.

Bathroom.prototype.parseBathroom = function (client, str) {
  var matches;
  if (str.match(/^shit$/)) {
    client.emote("sits on the toilet and takes a big smelly shit.");
    return true;
  }
  return false;
}

Bathroom.prototype.setup = function (room) {
  if (!room.parsers)
    room.parsers = [];
  room.parsers.push('parseBathroom');
}

module.exports = new Bathroom();
