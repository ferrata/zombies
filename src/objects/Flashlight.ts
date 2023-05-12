import GameScene from "../scenes/GameScene";
import { IDebuggable } from "../types/Debuggable";
import { ILightAware } from "../types/LightAware";

export default class Flashlight
  extends Phaser.Physics.Arcade.Sprite
  implements ILightAware, IDebuggable
{
  LIGHT_INTENSITY = 0.5;
  DARK_INTENSITY = 1;

  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private beam: Phaser.GameObjects.Light;

  public get isOff(): boolean {
    return this.beam.intensity == 0;
  }

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, "flashlight");

    this.name = "flashlight";

    this.setOrigin(0.5, 0.5).setDisplaySize(50, 30);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
    this.beam = this.scene.lights
      .addLight(180, 80, 100)
      .setColor(0xffffff)
      .setIntensity(0);
  }

  public getDebugInfo(): object {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      isOff: this.isOff,
      rotation: this.rotation,
      intensity: this.beam.intensity,
      radius: this.beam.radius,
    };
  }

  public turnOff() {
    this.beam.setIntensity(0);
  }

  public turnOn() {
    const intensity = this.scene.isDark
      ? this.DARK_INTENSITY
      : this.LIGHT_INTENSITY;
    this.beam.setIntensity(intensity);
  }

  public pointTo(x: number, y: number, distance: number) {
    this.beam.setPosition(x, y);
    this.beam.radius = Math.max(100, (400 * distance) / 1000);
  }

  public onLighten(): ILightAware {
    if (this.isOff) {
      return this;
    }

    this.beam.setIntensity(this.LIGHT_INTENSITY);
    return this;
  }

  public onDarken(): ILightAware {
    if (this.isOff) {
      return this;
    }

    this.beam.setIntensity(this.DARK_INTENSITY);
    return this;
  }
}
