export interface IDebuggable {
  getDebugInfo(): object;
  drawDebugPhysics(graphics: Phaser.GameObjects.Graphics): void;

  body?: Phaser.Physics.Arcade.Body;
}

export function isDebuggable(object: any): object is IDebuggable {
  return "getDebugInfo" in object;
}
