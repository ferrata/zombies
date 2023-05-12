import { IObstacle } from "./Obstacle";

export interface IProjection extends IObstacle {
  shift(diff: Phaser.Types.Math.Vector2Like): IProjection;
}
