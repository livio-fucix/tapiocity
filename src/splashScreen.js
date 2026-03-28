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

import $ from "jquery";

import { Config } from './config.js';
import { Game } from './game.js';
import { MapGenerator } from './mapGenerator.js';
import { Simulation } from './simulation.js';
import { SplashCanvas } from './splashCanvas.js';
import { Storage } from './storage.js';

/*
 *
 * The SplashScreen is the first screen the player will see on launch. It is responsible for map generation,
 * placing UI on screen to allow the player to select a map or load a game, and finally launching the game.
 * This should not be called until the tiles and sprites have been loaded.
 *
 */

var onresize = null;


// If the window is initially too small, try and relaunch if it gets bigger
var makeResizeListener = function(tileSet, spriteSheet) {
  return function(tileSet, spriteSheet, e) {
    $(window).off('resize');
    var s = new SplashScreen(tileSet, spriteSheet);
  }.bind(null, tileSet, spriteSheet);
};


function SplashScreen(tileSet, snowTileSet, spriteSheet) {
  // We don't launch the game if the screen is too small, however, we should retain the right to do so
  // should the situation change...
  if ($('#tooSmall').is(':visible')) {
    onresize = makeResizeListener(tileSet, spriteSheet);
    $(window).on('resize', onresize);
    return;
  }

  this.tileSet = tileSet;
  this.snowTileSet = snowTileSet;
  this.spriteSheet = spriteSheet;
  this.map = MapGenerator();

  // Set up listeners on buttons
  $('#splashGenerate').click(regenerateMap.bind(this));
  $('#splashPlay').click(acquireNameAndDifficulty.bind(this));
  $('#splashLoad').click(handleLoad.bind(this));

  // Conditionally enable load/save buttons
  $('#saveRequest').prop('disabled', !Storage.canStore);
  $('#splashLoad').prop('disabled', !(Storage.canStore && Storage.hasSaves()));

  // Paint the minimap
  this.splashCanvas = new SplashCanvas('splashContainer', tileSet);
  this.splashCanvas.paint(this.map);

  // Let's get some bits on screen!
  $('.awaitGeneration').toggle();
  $('#splashPlay').focus();
}


// Generate a new map at the user's request, and paint it
var regenerateMap = function(e) {
  e.preventDefault();
  this.map = MapGenerator();
  this.splashCanvas.paint(this.map);
};


// Show the load screen with the list of all saves
var handleLoad = function(e) {
  e.preventDefault();

  $('#splashLoad').off('click');
  $('#splashGenerate').off('click');
  $('#splashPlay').off('click');
  $('#splash').toggle();

  renderSavesList.call(this);

  $('#loadFilter').on('input', function() {
    renderSavesList.call(this);
  }.bind(this));

  $('#loadBack').on('click', function() {
    $('#loadScreen').toggle();
    $('#loadFilter').off('input');
    $('#loadBack').off('click');
    // Re-show splash
    $('#splash').toggle();
    $('#splashGenerate').click(regenerateMap.bind(this));
    $('#splashPlay').click(acquireNameAndDifficulty.bind(this));
    $('#splashLoad').click(handleLoad.bind(this));
    $('#splashPlay').focus();
  }.bind(this));

  $('#loadScreen').toggle();
};


var renderSavesList = function() {
  var self = this;
  var filter = ($('#loadFilter').val() || '').toLowerCase();
  var index = Storage.getIndex();

  if (filter)
    index = index.filter(function(e) {
      return e.playerNickname.toLowerCase().indexOf(filter) !== -1;
    });

  // Most recent first
  index = index.slice().sort(function(a, b) {
    return new Date(b.savedAt) - new Date(a.savedAt);
  });

  var $list = $('#savesList');
  $list.empty();

  if (index.length === 0) {
    $list.append('<div class="saves-empty">Nessun salvataggio trovato.</div>');
    return;
  }

  index.forEach(function(entry) {
    var date = new Date(entry.savedAt);
    var dateStr = date.toLocaleDateString('it-IT', {day: '2-digit', month: '2-digit', year: '2-digit'}) +
                  ' ' + date.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});

    var $row = $('<div class="save-entry"></div>');
    $row.append('<span class="save-nickname">' + escapeHtml(entry.playerNickname) + '</span>');
    $row.append('<span class="save-city">' + escapeHtml(entry.cityName) + '</span>');
    $row.append('<span class="save-score">' + entry.score + '</span>');
    $row.append('<span class="save-date">' + dateStr + '</span>');

    var $loadBtn = $('<button class="save-load-btn">Carica</button>');
    $loadBtn.on('click', function() {
      launchSave.call(self, entry.id);
    });
    $row.append($loadBtn);

    var $delBtn = $('<button class="save-delete-btn">Elimina</button>');
    $delBtn.on('click', function() {
      if (window.confirm('Eliminare il salvataggio di ' + entry.playerNickname + ' - ' + entry.cityName + '?')) {
        Storage.deleteSave(entry.id);
        renderSavesList.call(self);
      }
    });
    $row.append($delBtn);

    $list.append($row);
  });
};


var launchSave = function(id) {
  var savedGame = Storage.getSavedGame(id);
  if (!savedGame) return;

  $('#loadScreen').toggle();
  $('#loadFilter').off('input');
  $('#loadBack').off('click');

  var g = new Game(savedGame, this.tileSet, this.snowTileSet, this.spriteSheet,
                   savedGame._gameLevel || Simulation.LEVEL_EASY,
                   savedGame.name, savedGame.playerNickname, id);
};


// After a map has been selected, call this function to display a form asking the user for
// a nickname, city name and difficulty level.
var acquireNameAndDifficulty = function(e) {
  e.preventDefault();

  $('#splashLoad').off('click');
  $('#splashGenerate').off('click');
  $('#splashPlay').off('click');
  $('#splash').toggle();

  // Pre-fill last used nickname for convenience
  var lastNick = window.localStorage.getItem('tapiocity_lastNickname');
  if (lastNick) $('#nicknameForm').val(lastNick);

  // As a convenience, city name and nickname are not mandatory in debug mode
  if (Config.debug) {
    $('#nameForm').removeAttr('required');
    $('#nicknameForm').removeAttr('required');
  }

  $('#playForm').submit(play.bind(this));
  $('#start').toggle();
  $('#nicknameForm').focus();
};


var play = function(e) {
  e.preventDefault();

  $('#playForm').off('submit');
  $('#start').toggle();

  var difficulty = 0; // Default to Easy difficulty
  var name = $('#nameForm').val();
  var nickname = $('#nicknameForm').val() || 'Anonimo';

  // Remember nickname for next time
  window.localStorage.setItem('tapiocity_lastNickname', nickname);

  var g = new Game(this.map, this.tileSet, this.snowTileSet, this.spriteSheet, difficulty, name, nickname);
};


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


export { SplashScreen };
