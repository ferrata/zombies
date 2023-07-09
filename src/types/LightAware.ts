import config from "../GameConfig";
import { GenericConstructor } from "./Constructor";
import GameScene from "../scenes/GameScene";

export type LightAwareShape = null | Phaser.GameObjects.Shape;

export interface ILightAware {
  onLighten(): ILightAware;
  onDarken(): ILightAware;
  onLightOverReset(): ILightAware;
  onLightOver(
    light: Raycaster.Ray,
    intersections: Phaser.Geom.Point[],
    force: boolean
  ): ILightAware;

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
    "onLightOverReset" in object &&
    "onLightOver" in object &&
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
    private textureUnderLight: Phaser.GameObjects.RenderTexture;
    private textureUnderLightMask: Phaser.GameObjects.Graphics;

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

    public onLightOverReset(): ILightAware {
      this.textureUnderLightMask.clear();
      this.textureUnderLight.setCrop(0, 0, 0, 0);
      this.textureUnderLight.clearMask();
      return this;
    }

    public onLightOver(
      light: Raycaster.Ray,
      intersections: Point[],
      force: boolean
    ): ILightAware {
      if (!this.shape) {
        return;
      }

      const gameScene = this.scene as GameScene;
      if (gameScene && !gameScene.isDark) {
        return;
      }

      // @ts-ignore
      const owner = this.shape.owner;
      const ownerBody = owner.body as MatterJS.BodyType;

      const effectiveIntersections = intersections.filter((intersection) => {
        const overlapped = this.scene.matter.query.point(
          [ownerBody],
          intersection
        );
        return overlapped.length > 0;
      });

      if (!effectiveIntersections.length && force) {
        // console.log("no effective intersections");

        this.textureUnderLightMask.fillRect(
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.x + this.width,
          this.y + this.height
        );
        this.textureUnderLight
          .setCrop(0, 0, this.width, this.height)
          .setMask(this.textureUnderLightMask.createGeometryMask());

        return;
      }

      if (effectiveIntersections.length > 1) {
        const firstIntersection = effectiveIntersections[0];
        const lastIntersection =
          effectiveIntersections[effectiveIntersections.length - 1];

        const firstIntersectionLine = new Phaser.Geom.Line(
          light.origin.x,
          light.origin.y,
          firstIntersection.x,
          firstIntersection.y
        );

        const lastIntersectionLine = new Phaser.Geom.Line(
          light.origin.x,
          light.origin.y,
          lastIntersection.x,
          lastIntersection.y
        );

        const firstIntersectionAngle = Phaser.Geom.Line.Angle(
          firstIntersectionLine
        );

        const lastIntersectionAngle =
          Phaser.Geom.Line.Angle(lastIntersectionLine);

        const boxSize = Math.max(
          this.scene.cameras.main.width,
          this.scene.cameras.main.height
        );

        const boxTopLeft = new Phaser.Math.Vector2(
          firstIntersection.x,
          firstIntersection.y
        )
          .setLength(boxSize)
          .setAngle(firstIntersectionAngle - Math.PI / 128)
          .add(firstIntersection);

        const boxTopRight = new Phaser.Math.Vector2(
          lastIntersection.x,
          lastIntersection.y
        )
          .setLength(boxSize)
          .setAngle(lastIntersectionAngle + Math.PI / 128)
          .add(lastIntersection);

        this.textureUnderLightMask.fillTriangle(
          light.origin.x,
          light.origin.y,
          boxTopLeft.x,
          boxTopLeft.y,
          boxTopRight.x,
          boxTopRight.y
        );
      }

      this.textureUnderLight
        .setCrop(0, 0, this.width, this.height)
        .setMask(this.textureUnderLightMask.createGeometryMask());

      return;
    }

    public setLightAwareShape(shape: LightAwareShape): ILightAware {
      const image = this as unknown as Phaser.GameObjects.Image;

      this.textureUnderLight = this.scene.add
        .renderTexture(this.x, this.y, this.width, this.height)
        .drawFrame(image.texture.key, image.frame.name)
        .setOrigin(this.originX, this.originY)
        .setScale(this.scaleX, this.scaleY)
        .setAngle(this.angle)
        .setCrop(0, 0, 0, 0)
        .setDepth(config.depths.lightAwareShape + 1);

      this.textureUnderLight.setPipeline("Light2D");

      this.textureUnderLightMask = this.scene.make
        .graphics()
        .setDepth(config.depths.lightAwareShape)
        .fillStyle(0xffffff, 1);

      this.shape = shape
        // @ts-ignore
        .setName(`${this.name}-shape`)
        .setDepth(config.depths.lightAwareShape);

      // @ts-ignore
      this.shape.owner = this;
      return this;
    }

    public getLightAwareShape(): LightAwareShape {
      return this.shape;
    }
  };
}
