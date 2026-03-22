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

import { BaseSprite } from './baseSprite.js';
import { MiscUtils } from './miscUtils.js';
import { Random } from './random.ts';
import { SPRITE_FOX } from './spriteConstants.ts';
import { SpriteUtils } from './spriteUtils.js';
import * as TileValues from "./tileValues.ts";

function FoxSprite(map, spriteManager, x, y) {
  this.init(SPRITE_FOX, map, spriteManager, x, y);
  this.width = 48;
  this.height = 48;
  this.xOffset = -24;
  this.yOffset = -24;
  this.frame = 1;
  this.dir = 4;
}

BaseSprite(FoxSprite);

var tileDeltaX = [  0, 16,  0, -16];
var tileDeltaY = [-16,  0, 16,   0];
var xDelta     = [  0,  2,  0,  -2, 0];
var yDelta     = [ -2,  0,  2,   0, 0];
var FoxPic2    = [  1,  2,  1,   2];

var NORTHSOUTH = 1;
var EASTWEST   = 2;
var NWSE       = 3;
var NESW       = 4;
var NORTH      = 0;
var EAST       = 1;
var SOUTH      = 2;
var WEST       = 3;
var CANTMOVE   = 4;

function isParkTile(tileValue) {
  return (tileValue >= TileValues.TREEBASE && tileValue <= TileValues.LASTTREE) ||
          tileValue === TileValues.WOODS ||
         (tileValue >= TileValues.WOODS2 && tileValue <= TileValues.WOODS5) ||
          tileValue === TileValues.FOUNTAIN;
}

FoxSprite.prototype.move = function(spriteCycle, disasterManager, blockMaps) {
  if (this.frame === NWSE || this.frame === NESW)
    this.frame = FoxPic2[this.dir];

  this.x += xDelta[this.dir];
  this.y += yDelta[this.dir];

  if ((spriteCycle & 3) === 0) {
    var dir = Random.getRandom16() & 3;

    for (var i = dir; i < dir + 4; i++) {
      var dir2 = i & 3;

      if (this.dir !== CANTMOVE) {
        if (dir2 === ((this.dir + 2) & 3))
          continue;
      }

      var tileValue = SpriteUtils.getTileValue(this.map,
        this.x + tileDeltaX[dir2], this.y + tileDeltaY[dir2]);

      if (isParkTile(tileValue)) {
        if (this.dir !== dir2 && this.dir !== CANTMOVE) {
          if (this.dir + dir2 === WEST)
            this.frame = NWSE;
          else
            this.frame = NESW;
        } else {
          this.frame = FoxPic2[dir2];
        }

        this.dir = dir2;
        return;
      }
    }

    if (this.dir === CANTMOVE) {
      this.frame = 0;
      return;
    }

    this.dir = CANTMOVE;
  }
};

Object.defineProperties(FoxSprite, {
  ID:     MiscUtils.makeConstantDescriptor(9),
  width:  MiscUtils.makeConstantDescriptor(48),
  frames: MiscUtils.makeConstantDescriptor(4)
});

export { FoxSprite };
