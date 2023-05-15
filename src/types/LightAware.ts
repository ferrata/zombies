import { config } from "../GameConfig";
import { GenericConstructor } from "./Constructor";

export type LightAwareShape = null | Phaser.GameObjects.Shape;

export interface ILightAware {
  onLighten(): ILightAware;
  onDarken(): ILightAware;
  onPointerOver(point: { x: number; y: number }): ILightAware;

  setLightAwareShape(shape: LightAwareShape): ILightAware;
  getLightAwareShape(): LightAwareShape;
}

export function isLightAware(object: any): object is ILightAware {
  if (typeof object !== "object") {
    return false;
  }

  return (
    "onLighten" in object &&
    "onDarken" in object &&
    "setLightAwareShape" in object &&
    "getLightAwareShape" in object
  );
}

export type LightAwareObject = GenericConstructor<{
  postFX: Phaser.GameObjects.Components.FX;
  scene: Phaser.Scene;
  angle: number;
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
  width: number;
  height: number;

  getCenter(): { x: number; y: number };

  setDepth(depth: number): any;
  setTint(color?: number): any;
}>;

export function LightAware<TBase extends LightAwareObject>(
  Base: TBase
): GenericConstructor<ILightAware> & TBase {
  return class extends Base implements ILightAware {
    private shadow: Phaser.FX.Shadow;
    private shape: LightAwareShape;

    constructor(...args: any[]) {
      super(...args);

      this.setDepth(config.depths.lightAwareShape);
    }

    public onLighten(): ILightAware {
      this.shadow ??= this.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3);

      this.postFX.clear();
      this.postFX.add(this.shadow);

      this.setTint();
      return this;
    }

    public onDarken(): ILightAware {
      this.postFX.clear();

      this.setTint(config.colors.darkenTintColor);
      return this;
    }

    public onPointerOver(point: { x: number; y: number }): ILightAware {
      return this;
    }

    public setLightAwareShape(shape: LightAwareShape): ILightAware {
      this.shape = shape.setDepth(config.depths.lightAwareShape);
      return this;
    }

    public getLightAwareShape(): LightAwareShape {
      return this.shape;
    }
  };
}
