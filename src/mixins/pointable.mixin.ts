import config from "../game-config";
import { Label } from "../objects/label.object";

export interface PointableProps {
  pointableInfo: string | null;
  showHighlight(): void;
  removeHighlight(): void;
  showInfo(): void;
  removeInfo(): void;
  setInfo(info: string): void;
  hasInfo(): boolean;
  getInfo(): string;
}

export function isPointable(obj: any): obj is PointableProps {
  return obj != null && "showHighlight" in obj && "removeHighlight" in obj;
}

export function pointableMixin<
  T extends Phaser.GameObjects.GameObject & {
    postFX?: Phaser.GameObjects.Components.FX;
    x: number;
    y: number;
    width?: number;
    height?: number;
    name?: string;
  }
>(obj: T, cfg?: { info?: string }): T & PointableProps {
  const result = obj as T & PointableProps & {
    _highlight: Phaser.FX.Glow | null;
    _label: Label | null;
  };

  result.pointableInfo = cfg?.info ?? null;
  result._highlight = null;
  result._label = null;

  result.showHighlight = function () {
    if (this.postFX) {
      this._highlight = this.postFX.addGlow(0xffffff, 3, 0.1);
    }
  };

  result.removeHighlight = function () {
    if (this.postFX && this._highlight) {
      this.postFX.remove(this._highlight);
      this._highlight = null;
    }
  };

  result.showInfo = function () {
    if (this._label) {
      this._label.destroy();
    }

    if (!this.hasInfo()) return;

    const textX = this.x + (this.width ?? 0) / 2 + 10;
    const textY = this.y - (this.height ?? 0) / 2 - 10;

    this._label = new Label(this.scene, textX, textY, this.getInfo());
    this.scene.add.existing(this._label);
    this._label.setDepth(config.depths.pointableObject);
  };

  result.removeInfo = function () {
    if (this._label) {
      this._label.destroy();
      this._label = null;
    }
  };

  result.setInfo = function (info: string) {
    this.pointableInfo = info;
  };

  result.hasInfo = function () {
    return this.getInfo().length > 0;
  };

  result.getInfo = function () {
    return this.pointableInfo ?? (this as any).name ?? "";
  };

  result.track(pointableMixin);

  return result;
}
