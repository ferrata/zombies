import { MIXIN_DEBUGGABLE } from "../core/instances";

export interface DebuggableProps {
  hasDebugInfo(): boolean;
  getDebugInfo(): Record<string, unknown>;
  drawDebugPhysics(graphics: Phaser.GameObjects.Graphics): void;
}

export function isDebuggable(obj: unknown): obj is DebuggableProps {
  return obj != null && typeof obj === "object" && "hasDebugInfo" in obj && "getDebugInfo" in obj && "drawDebugPhysics" in obj;
}

export function debuggableMixin<
  T extends Phaser.GameObjects.GameObject & { x: number; y: number; name?: string }
>(obj: T, cfg?: { debugInfo?: () => Record<string, unknown> }): T & DebuggableProps {
  const result = obj as T & DebuggableProps;

  result.hasDebugInfo = function () {
    return true;
  };

  result.getDebugInfo = function (): Record<string, unknown> {
    if (cfg?.debugInfo) {
      return cfg.debugInfo();
    }
    return {
      name: this.name ?? "unknown",
      x: this.x,
      y: this.y,
    };
  };

  result.drawDebugPhysics = function (graphics: Phaser.GameObjects.Graphics) {
    const body = (this as { body?: MatterJS.BodyType }).body;
    if (body?.bounds) {
      graphics.strokeRect(
        body.bounds.min.x,
        body.bounds.min.y,
        body.bounds.max.x - body.bounds.min.x,
        body.bounds.max.y - body.bounds.min.y
      );
    }
  };

  result.track(MIXIN_DEBUGGABLE);

  // Emit event so DebugScreenPlugin can pick up objects after mixin is applied
  if (obj.scene) {
    obj.scene.events.emit("debuggable-added", result);
  }

  return result;
}
