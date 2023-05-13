import { config } from "../GameConfig";
import { GenericConstructor } from "./Constructor";

export type LightAwareShape = any;

export interface ILightAware {
  onLighten(): ILightAware;
  onDarken(): ILightAware;

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

      this.setDepth(config.depths.lightAwareObject);
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

      this.setTint(0x333333);
      return this;
    }

    public setLightAwareRectangle(): ILightAware {
      return this.setLightAwareShape(
        this.scene.add
          .rectangle(this.x, this.y, this.width, this.height)
          .setAngle(this.angle)
          .setOrigin(this.originX, this.originY)
          .setScale(this.scaleX, this.scaleY)
      );
    }

    public setLightAwareCircle(radius: number): ILightAware {
      const center = this.getCenter();
      return this.setLightAwareShape(
        this.scene.add.circle(center.x, center.y, radius)
      );
    }

    public setLightAwareShape(shape: LightAwareShape): ILightAware {
      this.shape = shape.setVisible(false);
      return this;
    }

    public getLightAwareShape(): LightAwareShape {
      return this.shape;
    }
  };
}
