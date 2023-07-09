import GameScene from "../scenes/GameScene";
import { IDebuggable } from "./Debuggable";
import { ILightAware, LightAwareShape, isLightAware } from "./LightAware";

export type LightSourceConfig = {
  emitOnDayLight: boolean;
  lightColor: number;
  lightAlpha: number;
  collisionRange: number;
  coneDeg: number;
  coneRange: number;
  closeRange: number;
  forceLightOver: boolean;
};

export interface ILightSource {
  isEnabled: boolean;

  enable(): ILightSource;
  disable(): ILightSource;
  emitLight(): ILightSource;
}

export function isLightSource(object: any): object is ILightSource {
  if (object == null) {
    return false;
  }

  return "enable" in object && "disable" in object && "emit" in object;
}

export class LightSource implements ILightSource, IDebuggable {
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

  public get isEnabled(): boolean {
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
    this.ownGraphics.clear();

    this.ray?.destroy();
    this.ray = null;
    return this;
  }

  public emitLight(): LightSource {
    if (this.ray == null) {
      return this;
    }

    let mappedObjectUnderLight = null;

    const mappedObjects = this.raycaster.mappedObjects.filter((object) => {
      if (this.config.forceLightOver) {
        if (object instanceof Phaser.GameObjects.Shape) {
          // @ts-ignore
          const ownerBody = object.owner
            ?.body as Phaser.Types.Physics.Matter.MatterBody;

          if (
            // @ts-ignore
            ownerBody.bounds &&
            this.scene.matter.intersectPoint(
              this.ray.origin.x,
              this.ray.origin.y,
              [ownerBody]
            ).length > 0
          ) {
            mappedObjectUnderLight = object;
            return false;
          }
        }
      }

      return true;
    });

    const intersections = this.ray.castCone({ objects: mappedObjects });

    const initialIntersections = intersections.slice();
    intersections.push(this.ray.origin);

    if (!this.scene.isDark) {
      if (this.config.emitOnDayLight) {
        this.ownGraphics.clear().fillPoints(intersections);
      }

      return this;
    }

    const leftEdgePoint = new Phaser.Math.Vector2(
      this.ray.origin.x,
      this.ray.origin.y
    )
      .setLength(this.config.coneRange)
      .setAngle(this.ray.angle - this.ray.cone / 2)
      .add(this.ray.origin);

    this.scene.lightShadowSceneGraphics
      .fillStyle(0xffffff, 0)
      .beginPath()
      .moveTo(this.ray.origin.x, this.ray.origin.y)
      .lineTo(leftEdgePoint.x, leftEdgePoint.y)
      .arc(
        this.ray.origin.x,
        this.ray.origin.y,
        this.config.coneRange,
        this.ray.angle - this.ray.cone / 2,
        this.ray.angle + this.ray.cone / 2
      )
      .lineTo(this.ray.origin.x, this.ray.origin.y)
      .fillPath()
      .fillPoints(intersections);

    this.scene.lightSceneGraphics
      .fillStyle(0xffffff, 0)
      .fillPoints(intersections);

    this.scene.lightSceneGraphics
      .fillStyle(this.config.lightColor, this.config.lightAlpha)
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
        owner.onLightOver(this.ray, initialIntersections, false);
      }
    });

    if (mappedObjectUnderLight) {
      const owner = mappedObjectUnderLight.owner as ILightAware;
      if (owner) {
        owner.onLightOver(this.ray, initialIntersections, true);
      }
    }

    return this;
  }

  public hasDebugInfo(): boolean {
    return false;
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
