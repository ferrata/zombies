import { config } from "../GameConfig";
import { GenericConstructor } from "./Constructor";
import GameScene from "../scenes/GameScene";

export type LightAwareShape = null | Phaser.GameObjects.Shape;

export interface ILightAware {
  onLighten(): ILightAware;
  onDarken(): ILightAware;
  onLightOverReset(): ILightAware;
  onLightOver(
    light: Raycaster.Ray,
    distance: number,
    intersection: Phaser.Geom.Point[]
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
      this.textureUnderLight.setCrop(0, 0, 0, 0);
      this.textureUnderLight.clearMask();
      return this;
    }

    public onLightOver(
      light: Raycaster.Ray,
      distance: number,
      intersections: Point[]
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

      if (!effectiveIntersections.length) {
        return;
      }

      const g = this.scene.make
        .graphics()
        .setDepth(config.depths.lightAwareShape)
        .fillStyle(0xffffff, 1);

      const angle = light.angle;

      const leftSide = new Phaser.Math.Vector2(light.origin.x, light.origin.y)
        .setLength(distance)
        .setAngle(angle - light.cone / 2)
        .add(light.origin);

      const rightSide = new Phaser.Math.Vector2(light.origin.x, light.origin.y)
        .setLength(distance)
        .setAngle(angle + light.cone / 2)
        .add(light.origin);

      const middlePoint = new Phaser.Math.Vector2(
        light.origin.x,
        light.origin.y
      )
        .setLength(distance)
        .setAngle(angle)
        .add(light.origin);

      g.beginPath()
        .moveTo(light.origin.x, light.origin.y)
        .lineTo(leftSide.x, leftSide.y)
        .arc(
          light.origin.x,
          light.origin.y,
          distance,
          angle - light.cone / 2,
          angle + light.cone / 2,
          false,
          0.01
        )
        .lineTo(rightSide.x, rightSide.y)
        .closePath()
        .fillPath();

      const middlePointRadius = Phaser.Math.Distance.Between(
        middlePoint.x,
        middlePoint.y,
        leftSide.x,
        leftSide.y
      );

      g.fillCircle(middlePoint.x, middlePoint.y, middlePointRadius);

      this.textureUnderLight
        .setCrop(0, 0, this.width, this.height)
        .setMask(g.createGeometryMask());

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

      // // const obj = this as unknown as Phaser.GameObjects.Image;
      // // obj.texture.

      // this.textureUnderLight = this.scene.make.renderTexture({});

      // this.textureUnderLight
      //   .setPosition(this.x, this.y + 1)
      //   .setSize(this.width, this.height)
      //   .setScale(this.scaleX, this.scaleY)
      //   .setOrigin(this.originX, this.originY)
      //   .setAngle(this.angle)
      //   .setDepth(config.depths.lightAwareShape + 1);

      // this.textureUnderLight.setPipeline("Light2D");

      // this.textureUnderLight
      //   // @ts-ignore
      //   .drawFrame(this.texture.key, this.frame.name)
      //   .setCrop(0, 0, 0, 0);

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
