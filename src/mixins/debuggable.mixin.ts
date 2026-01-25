export interface DebuggableProps {
  hasDebugInfo(): boolean;
  getDebugInfo(): object;
  drawDebugPhysics(graphics: Phaser.GameObjects.Graphics): void;
}

export function isDebuggable(obj: any): obj is DebuggableProps {
  return obj != null && "hasDebugInfo" in obj && "getDebugInfo" in obj && "drawDebugPhysics" in obj;
}

export function debuggableMixin<
  T extends Phaser.GameObjects.GameObject & { x: number; y: number; name?: string }
>(obj: T, cfg?: { debugInfo?: () => object }): T & DebuggableProps {
  const result = obj as T & DebuggableProps;

  result.hasDebugInfo = function () {
    return true;
  };

  result.getDebugInfo = function () {
    if (cfg?.debugInfo) {
      return cfg.debugInfo();
    }
    return {
      name: (this as any).name ?? "unknown",
      x: this.x,
      y: this.y,
    };
  };

  result.drawDebugPhysics = function (graphics: Phaser.GameObjects.Graphics) {
    const body = (this as any).body;
    if (body?.bounds) {
      graphics.strokeRect(
        body.bounds.min.x,
        body.bounds.min.y,
        body.bounds.max.x - body.bounds.min.x,
        body.bounds.max.y - body.bounds.min.y
      );
    }
  };

  result.track(debuggableMixin);

  // Emit event so DebugScreenPlugin can pick up objects after mixin is applied
  if (obj.scene) {
    obj.scene.events.emit("debuggable-added", result);
  }

  return result;
}
