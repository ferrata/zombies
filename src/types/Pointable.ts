import { GenericConstructor } from "./Constructor";
import { Label } from "../objects/Label";

export interface IPointable {
  showHighlight(): IPointable;
  removeHighlight(): IPointable;

  showInfo(): IPointable;
  removeInfo(): IPointable;

  setInfo(info: string): IPointable;
  hasInfo(): boolean;
  getInfo(): string;
}

export function isPointable(object: any): object is IPointable {
  if (typeof object !== "object") {
    return false;
  }

  return (
    "showHighlight" in object &&
    "removeHighlight" in object &&
    "showInfo" in object &&
    "removeInfo" in object
  );
}

type PointableObject = GenericConstructor<{
  postFX: Phaser.GameObjects.Components.FX;
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}>;

export function Pointable<TBase extends PointableObject>(Base: TBase): TBase {
  return class extends Base implements IPointable {
    private highlight: Phaser.FX.Glow;
    private label: Label;
    private info?: string = null;

    showHighlight(): IPointable {
      this.highlight = this.postFX.addGlow(0xffffff, 3, 0.1);
      return this;
    }

    removeHighlight(): IPointable {
      this.postFX.remove(this.highlight);
      return this;
    }

    showInfo(): IPointable {
      if (this.label) {
        this.label.destroy();
      }

      if (!this.hasInfo()) {
        return this;
      }

      // show info above and to the right of the object
      const textCoordinates = {
        x: this.x + this.width / 2 + 10,
        y: this.y - this.height / 2 - 10,
      };

      // frame with rounded corners
      this.label = new Label(
        this.scene,
        textCoordinates.x,
        textCoordinates.y,
        this.getInfo()
      );
      this.scene.add.existing(this.label);

      this.label.setDepth(1000);

      return this;
    }

    removeInfo(): IPointable {
      if (this.label) {
        this.label.destroy();
      }

      return this;
    }

    setInfo(info: string): IPointable {
      this.info = info;
      return this;
    }

    hasInfo(): boolean {
      return this.getInfo().length > 0;
    }

    getInfo(): string {
      return this.info ?? this.name;
    }
  };
}
