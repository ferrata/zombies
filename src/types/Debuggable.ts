export interface IDebuggable {
  getDebugInfo(): object;

  body?: Phaser.Physics.Arcade.Body;
}

export function isDebuggable(object: any): object is IDebuggable {
  return "getDebugInfo" in object;
}
