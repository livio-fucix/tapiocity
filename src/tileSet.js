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

import { TILE_COUNT, SOLARBASE, LASTSOLAR } from "./tileValues.ts";

// Tiles must be 16px square
var TILE_SIZE = 16;
var TILES_PER_ROW = Math.sqrt(TILE_COUNT);
var ACCEPTABLE_DIMENSION = TILES_PER_ROW * TILE_SIZE;


// Draw one 16×16 tile of the solar power plant at grid position (col, row) within the 4×4 building.
// col/row range 0–3.  'size' is the tile side length in pixels (always 16).
function _drawSolarTile(ctx, col, row, size) {
  var W = size; // 16

  // ── Solar cell surface ────────────────────────────────────────────────────
  ctx.fillStyle = '#0d2952';   // dark navy: photovoltaic cell body
  ctx.fillRect(0, 0, W, W);

  // Each tile shows a 2×2 grid of cells separated by thin grid lines
  // Grid lines at x=7,8 and y=7,8 (2px wide to stay visible at small scale)
  ctx.fillStyle = '#1e4fa0';   // slightly lighter blue: grid line / cell border
  ctx.fillRect(7, 0, 2, W);   // vertical divider
  ctx.fillRect(0, 7, W, 2);   // horizontal divider

  // Small specular highlight on top-left corner of each of the 4 cells
  ctx.fillStyle = '#6ab8e8';   // sky-blue reflection
  ctx.fillRect(2, 2, 2, 1);   // top-left cell
  ctx.fillRect(10, 2, 2, 1);  // top-right cell
  ctx.fillRect(2, 10, 2, 1);  // bottom-left cell
  ctx.fillRect(10, 10, 2, 1); // bottom-right cell

  // ── Metal frame on outer edges of the building ───────────────────────────
  ctx.fillStyle = '#8a8a8a';   // gray aluminium frame
  if (row === 0) ctx.fillRect(0, 0, W, 2);      // top edge
  if (row === 3) ctx.fillRect(0, W - 2, W, 2);  // bottom edge
  if (col === 0) ctx.fillRect(0, 0, 2, W);      // left edge
  if (col === 3) ctx.fillRect(W - 2, 0, 2, W);  // right edge

  // ── Corner support posts (darker square at each corner of the building) ──
  if (col === 0 && row === 0) { ctx.fillStyle = '#404040'; ctx.fillRect(0, 0, 3, 3); }
  if (col === 3 && row === 0) { ctx.fillStyle = '#404040'; ctx.fillRect(W - 3, 0, 3, 3); }
  if (col === 0 && row === 3) { ctx.fillStyle = '#404040'; ctx.fillRect(0, W - 3, 3, 3); }
  if (col === 3 && row === 3) { ctx.fillStyle = '#404040'; ctx.fillRect(W - 3, W - 3, 3, 3); }

  // ── Central inverter box (tile 1,1 = the ZONE tile) ─────────────────────
  if (col === 1 && row === 1) {
    ctx.fillStyle = '#c8a030'; // golden yellow: power inverter/converter box
    ctx.fillRect(6, 6, 4, 4);
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(7, 7, 2, 2); // highlight
  }
}


function TileSet(image, callback, errorCallback) {
  if (!(this instanceof TileSet))
    return new TileSet(image, callback, errorCallback);

  if (callback === undefined || errorCallback === undefined) {
    if (callback === undefined && errorCallback === undefined)
      throw new Error('Tileset constructor called with no callback or errorCallback');
    else
      throw new Error('Tileset constructor called with no ' + (callback === undefined ? 'callback' : 'errorCallback'));
  }

  this.isValid = false;

  if (!(image instanceof Image)) {
    // Spin the event loop
    window.setTimeout(errorCallback, 0);
    return;
  }

  this._verifyImage(image, callback, errorCallback);
}


TileSet.prototype._verifyImage = function(image, callback, errorCallback) {
  var width = image.width;
  var height = image.height;

  // We expect tilesets to be square, and of the required width/height
  if (width !== height || width !== ACCEPTABLE_DIMENSION) {
    // Spin the event loop
    window.setTimeout(errorCallback, 0);
    return;
  }

  var tileWidth = this.tileWidth = TILE_SIZE;

  // We paint the image onto a canvas so we can split it up
  var c = document.createElement('canvas');
  c.width = tileWidth;
  c.height = tileWidth;
  var cx = c.getContext('2d');

  // Count how many tiles we have created
  var tileCount = TILE_COUNT;
  var notifications = 0;
  var self = this;

  // Callback triggered by an image load. Checks to see if we are done creating images,
  // and if so notifies the caller.
  var imageLoad = function() {
    notifications++;

    if (notifications === tileCount) {
      self.isValid = true;
      // Spin the event loop
      window.setTimeout(callback, 0);
      return;
    }
  };

  // Break up the source image into tiles by painting each tile onto a canvas, computing the dataURI
  // of the canvas, and using that to create a new image, which we install on ourselves as a new property
  for (var i = 0; i < tileCount; i++) {
    cx.clearRect(0, 0, tileWidth, tileWidth);

    if (i >= SOLARBASE && i <= LASTSOLAR) {
      // Solar power plant tiles: draw programmatically as pixel-art solar panels.
      // The building is 4×4 tiles; identify position within it.
      var tileIdx = i - SOLARBASE;
      var tileCol = tileIdx % 4;
      var tileRow = Math.floor(tileIdx / 4);
      _drawSolarTile(cx, tileCol, tileRow, tileWidth);
    } else {
      var sourceX = i % TILES_PER_ROW * tileWidth;
      var sourceY = Math.floor(i / TILES_PER_ROW) * tileWidth;
      cx.drawImage(image, sourceX, sourceY, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
    }

    this[i] = new Image();
    this[i].onload = imageLoad;
    this[i].src = c.toDataURL();
  }
};


export { TileSet };
