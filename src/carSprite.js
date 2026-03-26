import { BaseSprite } from './baseSprite.js';
import { MiscUtils } from './miscUtils.js';
import { Random } from './random.ts';
import { SPRITE_CAR } from './spriteConstants.ts';
import { SpriteUtils } from './spriteUtils.js';
import * as TileValues from "./tileValues.ts";

function CarSprite(map, spriteManager, x, y) {
  this.init(SPRITE_CAR, map, spriteManager, x, y);
  this.width = 32;
  this.height = 32;
  this.xOffset = -16;
  this.yOffset = -16;
  this.frame = 1;
  this.dir = 4;
}

BaseSprite(CarSprite);

var tileDeltaX = [  0, 16,  0, -16];
var tileDeltaY = [-16,  0, 16,   0];
var xDelta     = [  0,  4,  0,  -4, 0];
var yDelta     = [ -4,  0,  4,   0, 0];
var CarPic2    = [  1,  2,  1,   2];

var NORTHSOUTH = 1;
var EASTWEST   = 2;
var NWSE       = 3;
var NESW       = 4;
var NORTH      = 0;
var EAST       = 1;
var SOUTH      = 2;
var WEST       = 3;
var CANTMOVE   = 4;

CarSprite.prototype.move = function(spriteCycle, disasterManager, blockMaps) {
  if (this.frame === NWSE || this.frame === NESW)
    this.frame = CarPic2[this.dir];

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

      if ((tileValue >= TileValues.ROADBASE && tileValue <= TileValues.LASTROAD) ||
           tileValue === TileValues.HRAILROAD || tileValue === TileValues.VRAILROAD) {
        if (this.dir !== dir2 && this.dir !== CANTMOVE) {
          if (this.dir + dir2 === WEST)
            this.frame = NWSE;
          else
            this.frame = NESW;
        } else {
          this.frame = CarPic2[dir2];
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

Object.defineProperties(CarSprite, {
  ID:     MiscUtils.makeConstantDescriptor(8),
  width:  MiscUtils.makeConstantDescriptor(32),
  frames: MiscUtils.makeConstantDescriptor(4)
});

export { CarSprite };
