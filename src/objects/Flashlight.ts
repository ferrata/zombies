import GameScene from "../scenes/GameScene";

export default class Flashlight extends Phaser.Physics.Arcade.Sprite {
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private beam: Phaser.GameObjects.Light;

  public get isOff(): boolean {
    return this.beam.intensity == 0;
  }

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, "flashlight");

    this.name = "flashlight";

    this.setOrigin(0.5, 0.5)
      .setDisplaySize(42, 20)
      .setRotation(-0.3 * Math.PI);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
    this.beam = this.scene.lights
      .addLight(180, 80, 100)
      .setColor(0xffffff)
      .setIntensity(0);
  }

  public turnOff() {
    this.beam.setIntensity(0);
  }

  public turnOn() {
    const intensity = this.scene.isDark ? 1 : 0.5;
    this.beam.setIntensity(intensity);
  }

  public pointTo(x: number, y: number, distance: number) {
    this.beam.setPosition(x, y);
    this.beam.radius = Math.max(100, (400 * distance) / 1000);
  }

  public onLight() {
    if (this.isOff) {
      return;
    }

    this.beam.setIntensity(0.3);
  }

  public onDark() {
    if (this.isOff) {
      return;
    }

    this.beam.setIntensity(2);
  }
}
