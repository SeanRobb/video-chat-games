const R = require('ramda');

function makeid(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

let createGameRoom = function() {
  let gameroom = {
    id: makeid(5),
    created: Date.now(),
    playerRoster: {},
    narrator: '',
    activePlayers: [],
    werewolves: [],
    location: {
      day: 0,
      time: 'night',
    },
    hasStarted: false,
    isFinished: false,
    winner: '',
  };
  return gameroom;
};

let addPlayer = function(gameroom, name) {
  name = name.trim().toUpperCase();
  // Game should not be started
  if (gameroom.hasStarted === true) {
    throw new Error('game has started');
  }
  // All Players must have unique names
  if (name in gameroom.playerRoster) {
    throw new Error('name is already in use');
  }
  let role = '';

  // First Player to join will become narrator
  if (R.isEmpty(gameroom.playerRoster)) {
    gameroom.narrator = name;
    role = 'narrator';
  }
  gameroom.playerRoster[name] = {
    role,
    vote: '',
  };
};

let startGame = function(gameroom) {
  gameroom.hasStarted = true;

  let playerCount = R.keys(gameroom.playerRoster).length;

  let roles = getRoles(playerCount);

  R.forEachObjIndexed((value, key) => {
    if (value.role === '') {
      let role = roles.pop();
      if (role === 'werewolf') {
        gameroom.werewolves.push(key);
      }
      value.role = role;
      gameroom.activePlayers.push(key);
    }
  }, gameroom.playerRoster);

  gameroom.location = {
    day: 0,
    time: 'night',
  };
};

let sendToNight = function(gameroom, narrator) {
  if (narrator !== gameroom.narrator) {
    throw new Error('must be narrator');
  }

  let tally = tallyVote(gameroom);
  let deactivatedPlayer;

  R.forEachObjIndexed((votes, playerName) => {
    if (votes.length > gameroom.activePlayers.length/2) {
      deactivatePlayer(gameroom, playerName);
      deactivatedPlayer = gameroom.playerRoster[playerName];
      deactivatedPlayer['name'] = playerName;
    }
  }, tally);

  resetVote(gameroom);

  gameroom.location.time = 'night';

  return deactivatedPlayer;
};

let sendToDay = function(gameroom, narrator) {

  if (narrator !== gameroom.narrator) {
    throw new Error('must be narrator');
  }
  let tally = tallyVote(gameroom);
  let deactivatedPlayer;

  R.forEachObjIndexed((votes, playerName) => {
    if (votes.length === activeWerewolves(gameroom).length) {
      deactivatePlayer(gameroom, playerName);
      deactivatedPlayer = gameroom.playerRoster[playerName];
      deactivatedPlayer['name'] = playerName;
    }
  }, tally);

  resetVote(gameroom);

  gameroom.location.time = 'day';

  return deactivatedPlayer;
};

let tallyVote = function(gameroom) {
  let tally={};

  R.forEachObjIndexed((player, playerName) => {
    // Vote must be for a player currently in the player roster
    if (player.vote in gameroom.playerRoster) {
      // if the array of votes already exist add on this name
      if (tally[player.vote]) {
        tally[player.vote].push(playerName);
      } else {
        tally[player.vote] = [playerName];
      }
    }
  }, gameroom.playerRoster);

  return tally;
};

let deactivatePlayer = function(gameroom, player) {
  if (player) {
    // find player
    const index = gameroom.activePlayers.indexOf(player);
    if (index > -1) {
      // remove player
      gameroom.activePlayers.splice(index, 1);
    }
  }
};

let resetVote = function(gameroom) {
  R.forEachObjIndexed((value) => {
    value.vote = '';
  }, gameroom.playerRoster);
};

let checkGameStatus = function(gameroom) {
  let currentActiveWherewolves = activeWerewolves(gameroom);

  if (currentActiveWherewolves.length === 0) {
    gameroom.isFinished = true;
    gameroom.winner = 'villagers';
    return 'villagers win';
  }
  if (currentActiveWherewolves.length === gameroom.activePlayers.length) {
    gameroom.isFinished = true;
    gameroom.winner = 'werewolves';
    return 'werewolves win';
  }
};

let vote = function(gameroom, playerName, target) {
  let player = gameroom.playerRoster[playerName.toUpperCase()];
  if (!player) {
    throw new Error('not found');
  }
  if (!R.includes(playerName.toUpperCase(), gameroom.activePlayers)) {
    throw new Error('must be active');
  }
  if (gameroom.location.time === 'night' &&
   !gameroom.werewolves.includes(playerName.toUpperCase())) {
    throw new Error('only werewolves can vote at night');
  }

  player.vote = target.toUpperCase();
};

let getRoles = function(playerCount) {
  let roles=[];

  for (let index = 0; index < playerCount -1; index++) {
    roles.push('villager');
  }

  if (playerCount < 6) {
    throw new Error('not enough players');
  }

  if (playerCount < 9) {
    roles[0] = 'werewolf';
  }
  if (playerCount > 8 && playerCount < 12) {
    roles[0] = 'werewolf';
    roles[1] = 'werewolf';
  }
  if (playerCount >11 && playerCount < 15) {
    roles[0] = 'werewolf';
    roles[1] = 'werewolf';
    roles[3] = 'werewolf';
  }
  shuffleRoles(roles);
  return roles;
};

let shuffleRoles = function(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

let activeWerewolves = function(gameroom) {
  return R.intersection(gameroom.werewolves, gameroom.activePlayers);
};

module.exports = {
  createGameRoom,
  addPlayer,
  startGame,
  sendToNight,
  sendToDay,
  vote,
  checkGameStatus,
};
