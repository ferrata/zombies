import config from "../GameConfig";
import GameScene from "../scenes/GameScene";
import { IDebuggable } from "../types/Debuggable";
import { ILightAware, LightAwareShape } from "../types/LightAware";
import { LightSource } from "../types/LightSource";

export default class EmergencyAlarmLight
  extends Phaser.Physics.Arcade.Sprite
  implements ILightAware, IDebuggable
{
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private light: LightSource;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, "wall-lamp");

    this.name = "emergency-alarm-light";

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.setOrigin(0.5, 0.5)
      .setDisplaySize(60, 20)
      .setDepth(config.depths.ceiling);

    this.light = scene
      .createLightSource(
        "emergency-alarm-light-source",
        config.emergencyAlarmLight
      )
      .setDepth(config.depths.light);
  }

  public get isOn(): boolean {
    return this.light.isEnabled;
  }

  public turnOn(): EmergencyAlarmLight {
    this.setTint();
    this.light
      .enable()
      .setOrigin(this.x, this.y)
      .setAngleDeg(this.angle - 90)
      .setConeDeg(config.emergencyAlarmLight.coneDeg)
      .setRayRange(config.emergencyAlarmLight.coneRange);
    return this;
  }

  public turnOff(): EmergencyAlarmLight {
    this.setTint(this.scene.isDark ? 0x111111 : 0x505050);
    this.light.disable();
    return this;
  }

  public hasDebugInfo(): boolean {
    return true;
  }

  public getDebugInfo(): object {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      angle: this.angle,
      isOn: this.isOn,
    };
  }

  public drawDebugPhysics(graphics: Phaser.GameObjects.Graphics) {
    this.light.drawDebugPhysics(graphics);
  }

  public onLighten(): ILightAware {
    this.setTint(this.scene.isDark ? 0x111111 : 0x505050);
    this.light.onLighten();
    return this;
  }

  public onDarken(): ILightAware {
    this.setTint(this.scene.isDark ? 0x111111 : 0x505050);
    this.light.onDarken();
    return this;
  }

  public onLightOverReset(): ILightAware {
    return this;
  }

  public onLightOver(): ILightAware {
    return this;
  }

  public onLighningtOver(): ILightAware {
    return this;
  }

  public setLightAwareShape(shape: LightAwareShape): ILightAware {
    return this;
  }

  public getLightAwareShape(): LightAwareShape {
    return null;
  }
}
