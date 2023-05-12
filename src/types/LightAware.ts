import { GenericConstructor } from "./Constructor";

export interface ILightAware {
  onLighten(): ILightAware;
  onDarken(): ILightAware;
}

export function isLightAware(object: any): object is ILightAware {
  if (typeof object !== "object") {
    return false;
  }

  return "onLighten" in object && "onDarken" in object;
}

export type LightAwareObject = GenericConstructor<{
  postFX: Phaser.GameObjects.Components.FX;
  scene: Phaser.Scene;
}>;

export function LightAware<TBase extends LightAwareObject>(Base: TBase): TBase {
  return class extends Base implements ILightAware {
    private shadow: Phaser.FX.Shadow;

    onLighten(): ILightAware {
      this.shadow ??= this.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3);

      this.postFX.clear();
      this.postFX.add(this.shadow);
      return this;
    }

    onDarken(): ILightAware {
      this.postFX.clear();
      this.postFX.addColorMatrix().brightness(0.2);
      return this;
    }
  };
}
