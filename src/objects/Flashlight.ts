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

  // private beam: Phaser.GameObjects.Light;
  private raycaster: Raycaster;
  private ray: Raycaster.Ray;
  private glitchy: boolean = false;
  private graphics: Phaser.GameObjects.Graphics;
  private ownGraphics: Phaser.GameObjects.Graphics;

  public get isOn(): boolean {
    return !this.isOff;
  }

  public get isOff(): boolean {
    return this.ray == null;
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

    // this.beam = this.scene.lights
    //   .addLight(180, 80, 100)
    //   .setColor(0xffffff)
    //   .setIntensity(0)
    //   .setZ(config.depths.lightAwareShape + 1);

    this.graphics = this.getLightGraphics(scene.isDark);
  }

  public getDebugInfo(): object {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      isOn: this.isOn,
      rotation: this.rotation,
      glitchy: this.glitchy,
      graphics: this.graphics ? this.graphics.name : "null",
      // intensity: this.beam.intensity,
      // radius: this.beam.radius,
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
    this.graphics?.clear();
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

  public setGlitchy() {
    this.glitchy = true;
    return this;
  }

  public pointTo(x: number, y: number, distance: number) {
    if (this.ray == null) {
      return;
    }

    // this.beam.setPosition(x, y);
    // this.beam.radius = Math.max(100, (400 * distance) / 1000);

    this.ray.setOrigin(this.x, this.y);
    this.ray.setAngleDeg(this.angle);

    const intersections = this.ray.castCone();
    const initialIntersections = intersections.slice();
    intersections.push(this.ray.origin);

    this.graphics.clear().fillPoints(intersections);

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
    // this.graphics?.postFX?.clear();
    this.ownGraphics?.clear();

    // this.beam.setIntensity(this.LIGHT_INTENSITY);
    this.graphics = this.getLightGraphics(false);

    return this;
  }

  public onDarken(): ILightAware {
    // this.graphics?.postFX?.clear();
    this.ownGraphics?.clear();

    // this.graphics.fillStyle(0xffffff, 0.2);

    // this.beam.setIntensity(this.DARK_INTENSITY);
    this.graphics = this.getLightGraphics(true);
    // this.pointTo(this.x, this.y, 0);
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

  private getLightGraphics(isDark: boolean): Phaser.GameObjects.Graphics {
    let graphics = this.scene.flashlightSceneGraphics;

    if (!isDark) {
      this.ownGraphics?.destroy();
      this.ownGraphics = this.scene.add
        .graphics({
          fillStyle: {
            color: config.flashlight.lightColor,
            alpha: config.flashlight.lightAlpha,
          },
        })
        .setName("flashlightOwnGraphics");

      graphics = this.ownGraphics;
    }

    if (this.glitchy) {
      const fx = graphics.postFX.addWipe();
      this.scene.tweens.add({
        targets: fx,
        progress: 1,
        repeatDelay: 10,
        hold: 10,
        yoyo: true,
        repeat: -1,
        duration: 0.5,
      });
    }

    return graphics.setDepth(config.depths.light);
  }
}
