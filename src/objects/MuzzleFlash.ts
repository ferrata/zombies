import config from "../GameConfig";
import GameScene from "../scenes/GameScene";
import { IDebuggable } from "../types/Debuggable";
import { ILightSource, LightSource } from "../types/LightSource";

export default class MuzzleFlash
  extends Phaser.GameObjects.Sprite
  implements ILightSource, IDebuggable
{
  private muzzleLight: LightSource;

  public body: Phaser.Physics.Arcade.Body;

  public get isEnabled(): boolean {
    return this.muzzleLight.isEnabled;
  }

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, "muzzle-flash");
    this.name = "muzzle-flash";
    this.setOrigin(0.1, 0.5).setScale(0.15).setVisible(false);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.muzzleLight = scene
      .createLightSource("muzzle-flash", config.weapon.muzzle.light)
      .setDepth(config.depths.light);
  }

  public flashOnce() {
    this.setVisible(true);
    this.muzzleLight
      .enable()
      .setOrigin(this.x, this.y)
      .setAngleDeg(this.angle)
      .setConeDeg(config.weapon.muzzle.light.coneDeg)
      .setRayRange(config.weapon.muzzle.light.coneRange);

    this.scene.time.delayedCall(config.weapon.muzzle.duration, () => {
      this.setVisible(false);
      this.muzzleLight.disable();
    });
  }

  public enable(): ILightSource {
    return this.muzzleLight.enable();
  }

  public disable(): ILightSource {
    return this.muzzleLight.disable();
  }

  public emitLight(): ILightSource {
    return this.muzzleLight.emitLight();
  }

  public hasDebugInfo(): boolean {
    return false;
  }

  public getDebugInfo(): object {
    return {};
  }

  public drawDebugPhysics(graphics: Phaser.GameObjects.Graphics): void {
    this.muzzleLight.drawDebugPhysics(graphics);
  }
}
