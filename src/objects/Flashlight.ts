import config from "../GameConfig";
import GameScene from "../scenes/GameScene";
import { IDebuggable } from "../types/Debuggable";
import { ILightAware, LightAwareShape } from "../types/LightAware";
import { ILightSource, LightSource } from "../types/LightSource";

export default class Flashlight
  extends Phaser.Physics.Arcade.Sprite
  implements IDebuggable
{
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private light: LightSource;
  private glitchy: boolean = false;

  public get isOn(): boolean {
    return this.light.isEnabled;
  }

  public get isOff(): boolean {
    return !this.isOn;
  }

  public get isGlitchy(): boolean {
    return this.glitchy;
  }

  constructor(scene: GameScene, x: number, y: number, raycaster: Raycaster) {
    super(scene, x, y, "flashlight");

    this.name = "flashlight";

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.setOrigin(0.5, 0.5)
      .setDisplaySize(50, 30)
      .setDepth(config.depths.matterThingTop + 1);

    this.light = scene
      .createLightSource("flashlight-source", config.flashlight)
      .setDepth(config.depths.light);
  }
  isEnabled: boolean;

  public setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    this.light?.setOrigin(x, y);
    return this;
  }

  public setAngle(angle: number): this {
    super.setAngle(angle);
    this.light?.setAngleDeg(this.angle);
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
      isOn: this.isOn,
      rotation: this.rotation,
      glitchy: this.glitchy,
    };
  }

  public drawDebugPhysics(graphics: Phaser.GameObjects.Graphics) {
    this.light.drawDebugPhysics(graphics);
  }

  public turnOff() {
    this.light.disable();
  }

  public turnOn() {
    this.light
      .enable()
      .setOrigin(this.x, this.y)
      .setAngleDeg(this.angle)
      .setConeDeg(config.flashlight.coneDeg)
      .setRayRange(config.flashlight.coneRange);
  }

  public setGlitchy(value: boolean) {
    // TODO: implement
    console.log("setGlitchy", value);
    return this;
  }

  public onLighten(): ILightAware {
    this.light.onLighten();
    return this;
  }

  public onDarken(): ILightAware {
    this.light.onDarken();
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
