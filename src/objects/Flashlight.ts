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
  private glitchy: boolean;
  private graphics: Phaser.GameObjects.Graphics;

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
      isOff: this.isOff,
      rotation: this.rotation,
      // intensity: this.beam.intensity,
      // radius: this.beam.radius,
    };
  }

  public turnOff() {
    this.graphics.clear();
    this.ray.destroy();
    this.ray = null;
  }

  public turnOn() {
    this.ray = this.raycaster
      .createRay({
        collisionRange: 900, //ray's field of view range
      })
      .setOrigin(this.x, this.y)
      .setAngleDeg(this.angle)
      .setConeDeg(config.flashlight.coneDeg)
      .setRayRange(config.flashlight.coneRange);
  }

  public setGlitchy() {
    this.glitchy = true;
    return this;
  }

  public pointTo(x: number, y: number, distance: number) {
    if (this.isOff) {
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

    // if (objectIntersections.length) {
    //   console.log(objectIntersections.map((o) => o.name));
    // }

    affectedObjects.forEach((object) => {
      const owner = object.owner as ILightAware;
      if (owner) {
        owner.onLightOver(
          this.ray,
          config.flashlight.closeRange,
          initialIntersections
        );
      }
    });
  }

  public onLighten(): ILightAware {
    // this.graphics?.postFX?.clear();
    this.graphics?.clear();

    // this.beam.setIntensity(this.LIGHT_INTENSITY);
    this.graphics = this.getLightGraphics(false);
    return this;
  }

  public onDarken(): ILightAware {
    // this.graphics?.postFX?.clear();
    this.graphics?.clear();

    // this.beam.setIntensity(this.DARK_INTENSITY);
    this.graphics = this.getLightGraphics(true);
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
    const graphics = isDark
      ? this.scene.flashlightGraphics
      : this.scene.add.graphics({
          fillStyle: { color: 0xffffff, alpha: 0.2 },
        });

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
