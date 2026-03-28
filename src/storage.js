/* micropolisJS. Adapted by Graeme McCutcheon from Micropolis.
 *
 * This code is released under the GNU GPL v3, with some additional terms.
 * Please see the files LICENSE and COPYING for details. Alternatively,
 * consult http://micropolisjs.graememcc.co.uk/LICENSE and
 * http://micropolisjs.graememcc.co.uk/COPYING
 *
 * The name/term "MICROPOLIS" is a registered trademark of Micropolis (https://www.micropolis.com) GmbH
 * (Micropolis Corporation, the "licensor") and is licensed here to the authors/publishers of the "Micropolis"
 * city simulation game and its source code (the project or "licensee(s)") as a courtesy of the owner.
 *
 */

import { MiscUtils } from './miscUtils.js';

// Multi-save storage with leaderboard support.
// Each save is stored as two localStorage entries:
//   tapiocity_saves          → JSON array of lightweight metadata (the "index")
//   tapiocity_save_<id>      → full game state blob for that save
//
// Legacy single-save key ('micropolisJSGame') is migrated automatically on first access.

var generateId = function() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};


var getIndex = function() {
  this.migrateV3();
  var raw = window.localStorage.getItem(this.INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
};


var setIndex = function(index) {
  window.localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
};


var hasSaves = function() {
  return this.getIndex().length > 0;
};


var getLeaderboard = function() {
  return this.getIndex().slice().sort(function(a, b) { return b.score - a.score; });
};


var getSavesForPlayer = function(nickname) {
  var lower = nickname.toLowerCase();
  return this.getIndex().filter(function(e) {
    return e.playerNickname.toLowerCase() === lower;
  });
};


// Load a single save blob by id. Sets isSavedGame flag for the game engine.
var getSavedGame = function(id) {
  var key = this.SAVE_PREFIX + id;
  var raw = window.localStorage.getItem(key);
  if (raw === null) return null;

  var savedGame = JSON.parse(raw);

  if (savedGame.version !== this.CURRENT_VERSION)
    this.transitionOldSave(savedGame);

  savedGame.isSavedGame = true;
  return savedGame;
};


// Persist a save: write the blob and upsert the index entry.
var saveGame = function(id, playerNickname, cityName, score, gameData) {
  gameData.version = this.CURRENT_VERSION;
  gameData.saveId = id;
  gameData.playerNickname = playerNickname;

  try {
    window.localStorage.setItem(this.SAVE_PREFIX + id, JSON.stringify(gameData));
  } catch (e) {
    if (e.name === 'QuotaExceededError')
      throw new Error('storage_full');
    throw e;
  }

  var index = this.getIndex();
  var existing = -1;
  for (var i = 0; i < index.length; i++) {
    if (index[i].id === id) { existing = i; break; }
  }

  var entry = {
    id: id,
    playerNickname: playerNickname,
    cityName: cityName,
    score: score,
    savedAt: new Date().toISOString(),
    version: this.CURRENT_VERSION
  };

  if (existing >= 0)
    index[existing] = entry;
  else
    index.push(entry);

  this.setIndex(index);
};


var deleteSave = function(id) {
  window.localStorage.removeItem(this.SAVE_PREFIX + id);
  var index = this.getIndex().filter(function(e) { return e.id !== id; });
  this.setIndex(index);
};


// One-shot migration of the legacy single-save key.
var migrateV3 = function() {
  // Already migrated if index key exists
  if (window.localStorage.getItem(this.INDEX_KEY) !== null) return;
  // No legacy save either — fresh install
  var legacy = window.localStorage.getItem(this.LEGACY_KEY);
  if (legacy === null) {
    this.setIndex([]);
    return;
  }

  try {
    var savedGame = JSON.parse(legacy);
    if (savedGame.version !== 3)
      this.transitionOldSave(savedGame);

    var id = 'legacy_001';
    var entry = {
      id: id,
      playerNickname: 'Anonimo',
      cityName: savedGame.name || 'MyTown',
      score: savedGame.cityScore || 0,
      savedAt: new Date().toISOString(),
      version: this.CURRENT_VERSION
    };

    savedGame.saveId = id;
    savedGame.playerNickname = 'Anonimo';
    savedGame.version = this.CURRENT_VERSION;

    window.localStorage.setItem(this.SAVE_PREFIX + id, JSON.stringify(savedGame));
    this.setIndex([entry]);
    window.localStorage.removeItem(this.LEGACY_KEY);
  } catch (e) {
    // Migration failed — start fresh rather than crash
    this.setIndex([]);
  }
};


var transitionOldSave = function(savedGame) {
  switch (savedGame.version) {
    case 1:
      savedGame.everClicked = false;

      /* falls through */
    case 2:
      savedGame.pollutionMaxX = Math.floor(savedGame.width / 2);
      savedGame.pollutionMaxY = Math.floor(savedGame.height / 2);
      savedGame.cityCentreX = Math.floor(savedGame.width / 2);
      savedGame.cityCentreY = Math.floor(savedGame.height / 2);

      /* falls through */
    case 3:
      // v3 → v4: no structural change to game state blob; metadata moved to index
      break;

    default:
      throw new Error('Unknown save version!');
  }
  savedGame.version = 4;
};


var Storage = {
  generateId: generateId,
  getIndex: getIndex,
  setIndex: setIndex,
  hasSaves: hasSaves,
  getLeaderboard: getLeaderboard,
  getSavesForPlayer: getSavesForPlayer,
  getSavedGame: getSavedGame,
  saveGame: saveGame,
  deleteSave: deleteSave,
  migrateV3: migrateV3,
  transitionOldSave: transitionOldSave
};


Object.defineProperty(Storage, 'CURRENT_VERSION', MiscUtils.makeConstantDescriptor(4));
Object.defineProperty(Storage, 'LEGACY_KEY',      MiscUtils.makeConstantDescriptor('micropolisJSGame'));
Object.defineProperty(Storage, 'INDEX_KEY',       MiscUtils.makeConstantDescriptor('tapiocity_saves'));
Object.defineProperty(Storage, 'SAVE_PREFIX',     MiscUtils.makeConstantDescriptor('tapiocity_save_'));
Object.defineProperty(Storage, 'canStore',        MiscUtils.makeConstantDescriptor(window.localStorage !== undefined));


export { Storage };
