import { config } from "../GameConfig";
import GameScene from "../scenes/GameScene";
import { IDebuggable } from "../types/Debuggable";
import {
  ILightAware,
  isLightAware,
  LightAwareShape,
} from "../types/LightAware";

export default class Flashlight
  extends Phaser.Physics.Arcade.Sprite
  implements ILightAware, IDebuggable
{
  LIGHT_INTENSITY = 0.5;
  DARK_INTENSITY = 1;

  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private raycaster: Raycaster;
  private ray: Raycaster.Ray;
  private glitchy: boolean = false;
  private ownGraphics: Phaser.GameObjects.Graphics;

  public get isOn(): boolean {
    return !this.isOff;
  }

  public get isOff(): boolean {
    return this.ray == null;
  }

  public get isGlitchy(): boolean {
    return this.glitchy;
  }

  constructor(scene: GameScene, x: number, y: number, raycaster: Raycaster) {
    super(scene, x, y, "flashlight");

    this.name = "flashlight";

    this.setOrigin(0.5, 0.5)
      .setDisplaySize(50, 30)
      .setDepth(config.depths.matterThingTop + 1);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.raycaster = raycaster;

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
          color: config.flashlight.lightColor,
          alpha: config.flashlight.lightAlpha,
        },
      })
      .setDepth(config.depths.light)
      .setName("flashlightOwnGraphics");
  }

  public getDebugInfo(): object {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      isOn: this.isOn,
      rotation: this.rotation,
      glitchy: this.glitchy,
    };
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

  public turnOff() {
    this.scene.flashlightSceneGraphics.clear();
    this.scene.flashlightShadowSceneGraphics.clear();
    this.ownGraphics.clear();

    this.ray?.destroy();
    this.ray = null;
  }

  public turnOn() {
    this.ray = this.raycaster
      .createRay({ collisionRange: config.flashlight.collisionRange })
      .setOrigin(this.x, this.y)
      .setAngleDeg(this.angle)
      .setConeDeg(config.flashlight.coneDeg)
      .setRayRange(config.flashlight.coneRange);

    this.ray.autoSlice = true;
  }

  public setGlitchy(value: boolean) {
    // TODO: implement
    console.log("setGlitchy", value);
    return this;
  }

  public pointTo(x: number, y: number, distance: number) {
    if (this.ray == null) {
      return;
    }

    this.ray.setOrigin(this.x, this.y);
    this.ray.setAngleDeg(this.angle);

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
