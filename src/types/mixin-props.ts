// Forward declarations of mixin Props interfaces to avoid circular dependencies

export interface LightAwarePropsBase {
  lightShape: Phaser.GameObjects.Shape | null;
  onLighten(): void;
  onDarken(): void;
  onLightOverReset(): void;
  onLightOver(ray: Raycaster.Ray, intersections: Phaser.Geom.Point[], force: boolean): void;
  onLightningOver(progress: number): void;
  setLightAwareShape(shape: Phaser.GameObjects.Shape | null): void;
  getLightAwareShape(): Phaser.GameObjects.Shape | null;
}

export interface LightSourcePropsBase {
  lightConfig: {
    emitOnDayLight: boolean;
    lightColor: number;
    lightAlpha: number;
    collisionRange: number;
    coneDeg: number;
    coneRange: number;
    closeRange: number;
    forceLightOver: boolean;
  };
  lightRay: Raycaster.Ray | null;
  lightGraphics: Phaser.GameObjects.Graphics;
  lightRaycaster: Raycaster;
  readonly isLightEnabled: boolean;
  enableLight(): void;
  disableLight(): void;
  emitLight(): void;
  setLightOrigin(x: number, y: number): void;
  setLightAngleDeg(angle: number): void;
  mapLightAwareObject(obj: LightAwarePropsBase): void;
}
