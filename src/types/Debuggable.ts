export interface IDebuggable {
  hasDebugInfo(): boolean;
  getDebugInfo(): object;
  drawDebugPhysics(graphics: Phaser.GameObjects.Graphics): void;

  body?: Phaser.Physics.Arcade.Body;
}

export function isDebuggable(object: any): object is IDebuggable {
  if (!object) {
    return false;
  }

  return (
    "hasDebugInfo" in object &&
    "getDebugInfo" in object &&
    "drawDebugPhysics" in object
  );
}
