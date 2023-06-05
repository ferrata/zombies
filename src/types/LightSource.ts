import GameScene from "../scenes/GameScene";
import { IDebuggable } from "./Debuggable";
import { ILightAware, LightAwareShape, isLightAware } from "./LightAware";

type LightSourceConfig = {
  lightColor: number;
  lightAlpha: number;
  collisionRange: number;
  coneDeg: number;
  coneRange: number;
  closeRange: number;
};

export class LightSource implements ILightAware, IDebuggable {
  private scene: GameScene;
  private raycaster: Raycaster;
  private config: LightSourceConfig;
  private ray: Raycaster.Ray;
  private ownGraphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: GameScene,
    raycaster: Raycaster,
    name: string,
    config: LightSourceConfig
  ) {
    this.scene = scene;
    this.raycaster = raycaster;
    this.config = config;

    const lightAware = [];
    scene.children.each((child) => {
      if (isLightAware(child)) {
        const shape = child.getLightAwareShape();
        if (shape) {
          lightAware.push(shape);
        }
      }
    });

    raycaster.mapGameObjects(lightAware);

    this.ownGraphics = this.scene.add
      .graphics({
        fillStyle: {
          color: config.lightColor,
          alpha: config.lightAlpha,
        },
      })
      .setName(`${name}-graphics`);
  }

  public get x(): number {
    return this.ray.origin.x;
  }

  public set x(value: number) {
    if (this.ray == null) {
      return;
    }

    this.ray.origin.x = value;
  }

  public get y(): number {
    return this.ray?.origin.y;
  }

  public set y(value: number) {
    if (this.ray == null) {
      return;
    }

    this.ray.origin.y = value;
  }

  public get angle(): number {
    return this.ray?.angle;
  }

  public set angle(value: number) {
    if (this.ray == null) {
      return;
    }

    this.ray.angle = value;
  }

  public get enabled(): boolean {
    return this.ray != null;
  }

  public setDepth(depth: number): LightSource {
    this.ownGraphics.setDepth(depth);
    return this;
  }

  public setOrigin(x: number, y: number): LightSource {
    this.ray?.setOrigin(x, y);
    return this;
  }

  public setAngleDeg(angle: number): LightSource {
    this.ray?.setAngleDeg(angle);
    return this;
  }

  public setConeDeg(coneDeg: number) {
    this.ray?.setConeDeg(coneDeg);
    return this;
  }

  public setRayRange(rayRange: number) {
    this.ray?.setRayRange(rayRange);
    return this;
  }

  public enable(): LightSource {
    this.ray = this.raycaster.createRay({
      collisionRange: this.config.collisionRange,
    });
    this.ray.autoSlice = true;

    return this;
  }

  public disable(): LightSource {
    this.scene.flashlightSceneGraphics.clear();
    this.scene.flashlightShadowSceneGraphics.clear();
    this.ownGraphics.clear();

    this.ray?.destroy();
    this.ray = null;
    return this;
  }

  public emit(): LightSource {
    if (this.ray == null) {
      return;
    }

    const intersections = this.ray.castCone();
    const initialIntersections = intersections.slice();
    intersections.push(this.ray.origin);

    if (!this.scene.isDark) {
      this.ownGraphics.clear().fillPoints(intersections);
      return;
    }

    const boxSize = Math.max(
      this.scene.cameras.main.width,
      this.scene.cameras.main.height
    );

    const leftEdgePoint = new Phaser.Math.Vector2(
      this.ray.origin.x,
      this.ray.origin.y
    )
      .setLength(boxSize)
      .setAngle(this.ray.angle - this.ray.cone / 2)
      .add(this.ray.origin);

    const rightEdgePoint = new Phaser.Math.Vector2(
      this.ray.origin.x,
      this.ray.origin.y
    )
      .setLength(boxSize)
      .setAngle(this.ray.angle + this.ray.cone / 2)
      .add(this.ray.origin);

    this.scene.flashlightShadowSceneGraphics
      .clear()
      .fillStyle(0xffffff, 0)
      .fillTriangle(
        this.ray.origin.x,
        this.ray.origin.y,
        leftEdgePoint.x,
        leftEdgePoint.y,
        rightEdgePoint.x,
        rightEdgePoint.y
      )
      .fillPoints(intersections);

    this.scene.flashlightSceneGraphics
      .clear()
      .fillStyle(0xffffff, 0)
      .fillPoints(intersections);

    const affectedObjects = initialIntersections.reduce((acc, intersection) => {
      // @ts-ignore
      const { object } = intersection;

      if (object && acc.indexOf(object) === -1) {
        acc.push(object);
      }

      return acc;
    }, []);

    affectedObjects.forEach((object) => {
      const owner = object.owner as ILightAware;
      if (owner) {
        owner.onLightOver(this.ray, initialIntersections);
      }
    });
  }

  public getDebugInfo(): object {
    return {};
  }

  public drawDebugPhysics(graphics: Phaser.GameObjects.Graphics) {
    if (!this.ray) {
      return;
    }

    graphics.fillStyle(0xff0000, 0.5);
    this.ray.intersections.forEach((intersection) => {
      // @ts-ignore
      graphics.fillCircle(intersection.x, intersection.y, 3);
    });

    graphics.fillStyle(0x000000, 0.2);
    graphics.lineStyle(1, 0xff00ff, 0.5);
    this.ray.slicedIntersections.forEach((intersection) => {
      graphics.strokeTriangle(
        intersection.x1,
        intersection.y1,
        intersection.x2,
        intersection.y2,
        intersection.x3,
        intersection.y3
      );
    });
  }

  public onLighten(): ILightAware {
    this.ownGraphics.clear();
    return this;
  }

  public onDarken(): ILightAware {
    this.ownGraphics.clear();
    return this;
  }

  public onLightOverReset(): ILightAware {
    return this;
  }

  public onLightOver(): ILightAware {
    return this;
  }

  public setLightAwareShape(shape: LightAwareShape): ILightAware {
    return this;
  }

  public getLightAwareShape(): LightAwareShape {
    return null;
  }
}
