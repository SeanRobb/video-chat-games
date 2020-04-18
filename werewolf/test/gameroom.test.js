/* eslint-disable max-len */
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const gameRoomRunner = require('../gameroom.js');
const R = require('ramda');


describe('Game Room Utilty', () => {
  let getActiveWerewolf = function(gameroom) {
    return gameroom.werewolves.find((werewolf) => R.includes(werewolf, gameroom.activePlayers));
  };
  let getActiveVillager = function(gameroom) {
    return gameroom.activePlayers.find((player) => !R.includes(player, gameroom.werewolves));
  };
  it('Game Room can be created', () => {
    let actualGameRoom = gameRoomRunner.createGameRoom();
    assert.isNotNull(actualGameRoom, 'object is null');
    assert.exists(actualGameRoom.id, 'does not contain an Id');
    assert.isString(actualGameRoom.id, 'id not a string');
    assert.lengthOf(actualGameRoom.id, 5, 'need 5 char random string');
    assert.exists(actualGameRoom.created, 'does not contain a created');
    assert.isNumber(actualGameRoom.created, 'created not a number');
    assert.isObject(actualGameRoom.playerRoster, 'players must be object');
  });
  describe('Player manipulation', () => {
    let actualGameRoom;
    beforeEach(() => {
      actualGameRoom = gameRoomRunner.createGameRoom();
      gameRoomRunner.addPlayer(actualGameRoom, 'Sean');
      gameRoomRunner.addPlayer(actualGameRoom, 'Lauren');
      gameRoomRunner.addPlayer(actualGameRoom, 'Andy');
      gameRoomRunner.addPlayer(actualGameRoom, 'Hannah');
      gameRoomRunner.addPlayer(actualGameRoom, 'Eric');
      gameRoomRunner.addPlayer(actualGameRoom, 'Emily');
      gameRoomRunner.addPlayer(actualGameRoom, 'Toph');
      gameRoomRunner.addPlayer(actualGameRoom, 'Amanda');
      gameRoomRunner.addPlayer(actualGameRoom, 'Blaine');
      gameRoomRunner.addPlayer(actualGameRoom, 'Megan');
    });

    it('Game Room can add players', () => {
      assert.isNotEmpty(actualGameRoom.playerRoster, 'players now has values');
    });
    it('Game Room trims player names when added', () => {
      actualGameRoom = gameRoomRunner.createGameRoom();
      gameRoomRunner.addPlayer(actualGameRoom, ' Sean ');
      assert.isNotEmpty(actualGameRoom.playerRoster, 'players now has values');
      assert.exists(actualGameRoom.playerRoster['SEAN'],
        'players have trimmed names');
      assert.equal(actualGameRoom.narrator, 'SEAN',
        'narrator has trimmed name');
    });
    it('Game Room wont let you add a player with the same name - Narrator Case',
      () => {
        expect(() => gameRoomRunner.addPlayer(actualGameRoom, 'Sean'))
          .to.throw('name is already in use');
      });
    it('Game Room wont let you add a player with the same name - Player Case',
      () => {
        expect(() => gameRoomRunner.addPlayer(actualGameRoom, 'Andy'))
          .to.throw('name is already in use');
      });
    it('Game Room will let you add names with special characters',
      () => {
        gameRoomRunner.addPlayer(actualGameRoom, 'An__dy');
        gameRoomRunner.addPlayer(actualGameRoom, 'An=\\dy');
        gameRoomRunner.addPlayer(actualGameRoom, 'An**dy');
      });
    it('Game Room wont let you add a player with the same name ignoring case',
      () => {
        expect(() => gameRoomRunner.addPlayer(actualGameRoom, 'AnDy'))
          .to.throw('name is already in use');
      });
    it('Game Room defaults narritor to first person', () => {
      assert.equal(actualGameRoom.narrator, 'SEAN');
    });
    it('Game Room won\'t allow you to add players after the game is started',
      () => {
        gameRoomRunner.startGame(actualGameRoom);
        expect(() => gameRoomRunner.addPlayer(actualGameRoom, 'Eric'))
          .to.throw('game has started');
      });
  });
  describe('Game Room Starts Game', () => {
    let actualGameRoom;
    beforeEach(() => {
      actualGameRoom = gameRoomRunner.createGameRoom();
      gameRoomRunner.addPlayer(actualGameRoom, 'Sean');
      gameRoomRunner.addPlayer(actualGameRoom, 'Lauren');
      gameRoomRunner.addPlayer(actualGameRoom, 'Andy');
      gameRoomRunner.addPlayer(actualGameRoom, 'Hannah');
      gameRoomRunner.addPlayer(actualGameRoom, 'Eric');
      gameRoomRunner.addPlayer(actualGameRoom, 'Emily');
      gameRoomRunner.addPlayer(actualGameRoom, 'Toph');
      gameRoomRunner.addPlayer(actualGameRoom, 'Amanda');
      gameRoomRunner.addPlayer(actualGameRoom, 'Blaine');
      gameRoomRunner.addPlayer(actualGameRoom, 'Megan');
    });

    it('Game Room changes status to isStarted = true', () => {
      gameRoomRunner.startGame(actualGameRoom);
      assert.isTrue(actualGameRoom.hasStarted);
    });
    it('Game Room must have 6 people to start', () => {
      actualGameRoom = gameRoomRunner.createGameRoom();
      gameRoomRunner.addPlayer(actualGameRoom, 'Sean');
      gameRoomRunner.addPlayer(actualGameRoom, 'Lauren');
      gameRoomRunner.addPlayer(actualGameRoom, 'Andy');
      gameRoomRunner.addPlayer(actualGameRoom, 'Hannah');
      expect(() => gameRoomRunner.startGame(actualGameRoom))
        .to.throw('not enough players');
    });
    it('Game Room Generates Roles for every player', () => {
      gameRoomRunner.startGame(actualGameRoom);

      R.forEachObjIndexed((value, key) => {
        assert.isNotEmpty(value.role, 'every player has a role');
        assert.isEmpty(value.vote, 'every player has a clear vote');
        if (key === actualGameRoom.narrator) {
          assert.notInclude(actualGameRoom.activePlayers, key);
        } else {
          assert.include(actualGameRoom.activePlayers, key);
        }
      }, actualGameRoom.playerRoster);
      assert.deepInclude(R.values(actualGameRoom.playerRoster),
        {role: 'narrator', vote: ''}, 'must have a narrator');
      assert.deepInclude(R.values(actualGameRoom.playerRoster),
        {role: 'werewolf', vote: ''}, 'must have a werewolf');
    });
    it('Game Room starts in the first night', () => {
      gameRoomRunner.startGame(actualGameRoom);
      assert.deepEqual(actualGameRoom.location, {day: 0, time: 'night'});
    });
  });
  describe('Game Room Successfully executes gameplay', () =>{
    let villageVoteForWerewolf = function(gameroom) {
      let activeWerewolf = getActiveWerewolf(gameroom);
      let activeVillager = getActiveVillager(gameroom);
      gameroom.activePlayers.forEach((player) =>{
        if (R.includes(player, gameroom.werewolves)) {
          gameRoomRunner.vote(gameroom, player, activeVillager);
        } else {
          gameRoomRunner.vote(gameroom, player, activeWerewolf);
        }
      });
      return activeWerewolf;
    };

    let villageVoteForVillager = function(gameroom) {
      let activeVillager = getActiveVillager(gameroom);
      gameroom.activePlayers.forEach((player) =>{
        if (R.includes(player, gameroom.werewolves)) {
          gameRoomRunner.vote(gameroom, player, activeVillager);
        } else {
          gameRoomRunner.vote(gameroom, player, activeVillager);
        }
      });
      return activeVillager;
    };

    let werewolvesVoteForVillager = function(gameroom) {
      let activeVillager = getActiveVillager(gameroom);
      gameroom.werewolves.forEach((werewolf) =>{
        if (R.includes(werewolf, gameroom.activePlayers)) {
          gameRoomRunner.vote(gameroom, werewolf, activeVillager);
        }
      });
      return activeVillager;
    };

    let simulateWholeDay = function(gameRoom, werewolfFound) {
      werewolvesVoteForVillager(gameRoom);
      let deactivatedPlayer = gameRoomRunner.sendToDay(gameRoom, 'SEAN');
      assert.isDefined(deactivatedPlayer);
      assert.equal(deactivatedPlayer.role, 'villager');
      gameRoomRunner.checkGameStatus(gameRoom);
      if (gameRoom.isFinished) {
        return;
      }
      if (werewolfFound) {
        villageVoteForWerewolf(gameRoom);
      } else {
        villageVoteForVillager(gameRoom);
      }
      deactivatedPlayer = gameRoomRunner.sendToNight(gameRoom, 'SEAN');
      if (deactivatedPlayer) {
        if (werewolfFound) {
          assert.equal(deactivatedPlayer.role, 'werewolf', 'werewolf has been deactivated');
        } else {
          assert.equal(deactivatedPlayer.role, 'villager', 'villager has been deactivated');
        }
      }
      gameRoomRunner.checkGameStatus(gameRoom);
    };
    describe('General Gameplay', () =>{
      beforeEach(() => {
        actualGameRoom = gameRoomRunner.createGameRoom();
        gameRoomRunner.addPlayer(actualGameRoom, 'Sean');
        gameRoomRunner.addPlayer(actualGameRoom, 'Lauren');
        gameRoomRunner.addPlayer(actualGameRoom, 'Andy');
        gameRoomRunner.addPlayer(actualGameRoom, 'Hannah');
        gameRoomRunner.addPlayer(actualGameRoom, 'Eric');
        gameRoomRunner.addPlayer(actualGameRoom, 'Toph');
        gameRoomRunner.addPlayer(actualGameRoom, 'Amanda');
        gameRoomRunner.addPlayer(actualGameRoom, 'Blaine');
      });
      it('Game Room can be sent to night', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        gameRoomRunner.vote(actualGameRoom, 'ERIC', 'Blaine');
        let deactivatedPlayer = gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        assert.isUndefined(deactivatedPlayer);
        assert.equal(actualGameRoom.location.time, 'night');
        R.forEachObjIndexed((value) => {
          assert.isEmpty(value.vote, 'all votes must be reset');
        }, actualGameRoom.playerRoster);
      });
      it('Game Room can be sent to day', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.vote(actualGameRoom, actualGameRoom.werewolves[0], 'Blaine');
        let deactivatedPlayer = gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        assert.isDefined(deactivatedPlayer);
        assert.equal(actualGameRoom.location.time, 'day');
        R.forEachObjIndexed((value) => {
          assert.isEmpty(value.vote, 'all votes must be reset');
        }, actualGameRoom.playerRoster);
      });
      it('Game Room can be sent to night by only narrator', () => {
        gameRoomRunner.startGame(actualGameRoom);
        expect(() => gameRoomRunner.sendToDay(actualGameRoom, 'ANDY'))
          .to.throw('must be narrator');
      });
      it('Game Room can be sent to day by only narrator', () => {
        gameRoomRunner.startGame(actualGameRoom);
        expect(() => gameRoomRunner.sendToDay(actualGameRoom, 'ANDY'))
          .to.throw('must be narrator');
      });
      it('Game Room only kills werewolf when a majority votes for it - no votes', () => {
        gameRoomRunner.startGame(actualGameRoom);
        let deactivatedPlayer = gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        assert.isUndefined(deactivatedPlayer);
        R.forEachObjIndexed((value, key) => {
          if (key === actualGameRoom.narrator) {
            assert.notInclude(actualGameRoom.activePlayers, key);
          } else {
            assert.include(actualGameRoom.activePlayers, key);
          }
        }, actualGameRoom.playerRoster);
      });
      it('Game Room only kills villager when it is unanimous - no votes', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        let deactivatedPlayer = gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        assert.isUndefined(deactivatedPlayer);
        R.forEachObjIndexed((value, key) => {
          if (key === actualGameRoom.narrator) {
            assert.notInclude(actualGameRoom.activePlayers, key);
          } else {
            assert.include(actualGameRoom.activePlayers, key);
          }
        }, actualGameRoom.playerRoster);
      });
      it('Game Room only allows for active players to vote', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        expect(() => gameRoomRunner.vote(actualGameRoom, 'blurb', 'Hannah'))
          .to.throw('not found');
        expect(() => gameRoomRunner.vote(actualGameRoom, 'SEAN', 'Hannah'))
          .to.throw('must be active');
        gameRoomRunner.vote(actualGameRoom, 'LAUREN', 'Hannah');
      });
      it('Game Room only allows for warewolves to vote at night', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        gameRoomRunner.vote(actualGameRoom, actualGameRoom.werewolves[0], 'Blaine');
      });
    });
    describe('1 werewolf', () => {
      let actualGameRoom;
      beforeEach(() => {
        actualGameRoom = gameRoomRunner.createGameRoom();
        gameRoomRunner.addPlayer(actualGameRoom, 'Sean');
        gameRoomRunner.addPlayer(actualGameRoom, 'Lauren');
        gameRoomRunner.addPlayer(actualGameRoom, 'Andy');
        gameRoomRunner.addPlayer(actualGameRoom, 'Hannah');
        gameRoomRunner.addPlayer(actualGameRoom, 'Eric');
        gameRoomRunner.addPlayer(actualGameRoom, 'Toph');
        gameRoomRunner.addPlayer(actualGameRoom, 'Amanda');
        gameRoomRunner.addPlayer(actualGameRoom, 'Blaine');
      });
      it('Game Room only kills player when a majority votes for it', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        gameRoomRunner.vote(actualGameRoom, 'Lauren', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Andy', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Hannah', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Eric', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Toph', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Amanda', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Blaine', 'ERIC');
        let deactivatedPlayer = gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        assert.isDefined(deactivatedPlayer);
        assert.equal(actualGameRoom.playerRoster['HANNAH'], deactivatedPlayer);

        assert.notInclude(actualGameRoom.activePlayers, 'HANNAH', 'a person who loses the vote becomes inactive');
      });
      it('Game Room only kills villager when it is unanimous', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        gameRoomRunner.vote(actualGameRoom, actualGameRoom.werewolves[0], 'HANNAH');
        let deactivatedPlayer = gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        assert.isDefined(deactivatedPlayer);
        assert.equal(actualGameRoom.playerRoster['HANNAH'], deactivatedPlayer);

        assert.notInclude(actualGameRoom.activePlayers, 'HANNAH',
          'a person who loses the vote becomes inactive');
      });
      describe('Villagers Win', () => {
        it('Villagers Win Game 1', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
        it('Villagers Win Game 2', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
      });
      describe('Werewolves Win', () => {
        it('Werewolves Win Game 1', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
      });
    });
    describe('2 werewolf', () => {
      let actualGameRoom;
      beforeEach(() => {
        actualGameRoom = gameRoomRunner.createGameRoom();
        gameRoomRunner.addPlayer(actualGameRoom, 'Sean');
        gameRoomRunner.addPlayer(actualGameRoom, 'Lauren');
        gameRoomRunner.addPlayer(actualGameRoom, 'Andy');
        gameRoomRunner.addPlayer(actualGameRoom, 'Hannah');
        gameRoomRunner.addPlayer(actualGameRoom, 'Eric');
        gameRoomRunner.addPlayer(actualGameRoom, 'Emily');
        gameRoomRunner.addPlayer(actualGameRoom, 'Toph');
        gameRoomRunner.addPlayer(actualGameRoom, 'Amanda');
        gameRoomRunner.addPlayer(actualGameRoom, 'Blaine');
        gameRoomRunner.addPlayer(actualGameRoom, 'Megan');
      });
      it('Game Room only kills player when a majority votes for it', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        gameRoomRunner.vote(actualGameRoom, 'Lauren', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Andy', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Hannah', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Eric', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Emily', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Toph', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Amanda', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Blaine', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Megan', 'HANNAH');
        let deactivatedPlayer = gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        assert.isDefined(deactivatedPlayer);
        assert.equal(actualGameRoom.playerRoster['HANNAH'], deactivatedPlayer);

        assert.notInclude(actualGameRoom.activePlayers, 'HANNAH', 'a person who loses the vote becomes inactive');
      });
      it('Game Room only kills villager when it is unanimous', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        let villagerToBeDeactivated = werewolvesVoteForVillager(actualGameRoom);
        let deactivatedPlayer = gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        assert.isDefined(deactivatedPlayer);
        assert.equal(actualGameRoom.playerRoster[villagerToBeDeactivated], deactivatedPlayer);

        assert.notInclude(actualGameRoom.activePlayers, villagerToBeDeactivated,
          'a person who loses the vote becomes inactive');
      });
      describe('Villagers Win', () => {
        it('Villagers win Game 1', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
        it('Villagers win Game 2', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
        it('Villagers win Game 3', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
      });
      describe('Werewolves Win', () => {
        it('Werewolves win Game 1', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 2', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 3', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 4', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 5', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
      });
    });
    describe('3 werewolf', () => {
      let actualGameRoom;
      beforeEach(() => {
        actualGameRoom = gameRoomRunner.createGameRoom();
        gameRoomRunner.addPlayer(actualGameRoom, 'Sean');
        gameRoomRunner.addPlayer(actualGameRoom, 'Lauren');
        gameRoomRunner.addPlayer(actualGameRoom, 'Andy');
        gameRoomRunner.addPlayer(actualGameRoom, 'Hannah');
        gameRoomRunner.addPlayer(actualGameRoom, 'Eric');
        gameRoomRunner.addPlayer(actualGameRoom, 'Emily');
        gameRoomRunner.addPlayer(actualGameRoom, 'Toph');
        gameRoomRunner.addPlayer(actualGameRoom, 'Amanda');
        gameRoomRunner.addPlayer(actualGameRoom, 'Blaine');
        gameRoomRunner.addPlayer(actualGameRoom, 'Megan');
        gameRoomRunner.addPlayer(actualGameRoom, 'Travis');
        gameRoomRunner.addPlayer(actualGameRoom, 'Lee');
        gameRoomRunner.addPlayer(actualGameRoom, 'Anna');
        gameRoomRunner.addPlayer(actualGameRoom, 'Tim');
      });
      it('Game Room only kills player when a majority votes for it', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        gameRoomRunner.vote(actualGameRoom, 'Lauren', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Andy', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Hannah', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Eric', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Emily', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Toph', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Amanda', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Blaine', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Megan', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Travis', 'HANNAH');
        gameRoomRunner.vote(actualGameRoom, 'Lee', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Anna', 'ERIC');
        gameRoomRunner.vote(actualGameRoom, 'Tim', 'HANNAH');
        let deactivatedPlayer = gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        assert.isDefined(deactivatedPlayer);
        assert.equal(actualGameRoom.playerRoster['HANNAH'], deactivatedPlayer);

        assert.notInclude(actualGameRoom.activePlayers, 'HANNAH', 'a person who loses the vote becomes inactive');
      });
      it('Game Room only kills villager when it is unanimous', () => {
        gameRoomRunner.startGame(actualGameRoom);
        gameRoomRunner.sendToNight(actualGameRoom, 'SEAN');
        let villagerToBeDeactivated = werewolvesVoteForVillager(actualGameRoom);
        let deactivatedPlayer = gameRoomRunner.sendToDay(actualGameRoom, 'SEAN');
        assert.isDefined(deactivatedPlayer);
        assert.equal(actualGameRoom.playerRoster[villagerToBeDeactivated], deactivatedPlayer);

        assert.notInclude(actualGameRoom.activePlayers, villagerToBeDeactivated,
          'a person who loses the vote becomes inactive');
      });
      describe('Villagers Win', () =>{
        it('Villagers win Game 1', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
        it('Villagers win Game 2', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
        it('Villagers win Game 3', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom, true);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'villagers');
        });
      });
      describe('Werewolves Win', () => {
        it('Werewolves win Game 1', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 2', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 3', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 4', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 5', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
        it('Werewolves win Game 6', () => {
          gameRoomRunner.startGame(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          simulateWholeDay(actualGameRoom, true);
          simulateWholeDay(actualGameRoom);
          assert.isTrue(actualGameRoom.isFinished, 'game has finished');
          assert.equal(actualGameRoom.winner, 'werewolves');
        });
      });
    });
  });
});
