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
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private raycaster: Raycaster;
  private ray: Raycaster.Ray;
  private graphics: Phaser.GameObjects.Graphics;

  public get isOff(): boolean {
    return this.ray == null;
  }

  constructor(scene: GameScene, x: number, y: number, raycaster: Raycaster) {
    super(scene, x, y, "flashlight");

    this.name = "flashlight";

    this.setOrigin(0.5, 0.5)
      .setDisplaySize(50, 30)
      .setDepth(config.depths.object + 1);

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
  }

  public getDebugInfo(): object {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      isOff: this.isOff,
      rotation: this.rotation,
    };
  }

  public turnOff() {
    this.graphics.clear();
    this.ray.destroy();
    this.ray = null;
  }

  public turnOn() {
    this.ray = this.raycaster
      .createRay()
      .setOrigin(this.x, this.y)
      .setAngleDeg(this.angle)
      .setConeDeg(config.flashlight.coneDeg)
      .setRayRange(config.flashlight.range)
      .enablePhysics()
      .enablePhysics("matter");

    this.graphics = this.scene.add
      .graphics({ fillStyle: { color: 0xffffff, alpha: 0.3 } })
      .setDepth(config.depths.light);
  }

  public pointTo(x: number, y: number, distance: number) {
    if (this.isOff) {
      return;
    }
    this.ray.setOrigin(this.x, this.y);
    this.ray.setAngleDeg(this.angle);

    const intersections = this.ray.castCone();
    intersections.push(this.ray.origin);

    this.graphics.clear().fillStyle(0xffffff, 0.3).fillPoints(intersections);
  }

  public onLighten(): ILightAware {
    if (this.isOff) {
      return this;
    }

    return this;
  }

  public onDarken(): ILightAware {
    if (this.isOff) {
      return this;
    }

    return this;
  }

  public setLightAwareShape(shape: LightAwareShape): ILightAware {
    return this;
  }

  public getLightAwareShape(): LightAwareShape {
    return null;
  }
}
