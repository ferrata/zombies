import GameScene from "../scenes/GameScene";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private readonly walkingSpeed: number = 230;
  private readonly strafeSpeed: number = 130;

  private flashlight: Phaser.GameObjects.Light;
  private shadow: Phaser.FX.Shadow;

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    flashlight: Phaser.GameObjects.Light
  ) {
    super(scene, x, y, "player");

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
    this.flashlight = flashlight;
    this.shadow = this.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 9);
  }

  public preUpdate(time: number, delta: number) {
    let { left, right, up, down, keys } = this.scene.inputs;
    if (up) {
      this.scene.physics.velocityFromRotation(
        this.rotation,
        this.walkingSpeed,
        this.body.velocity
      );
    } else if (down) {
      this.scene.physics.velocityFromRotation(
        this.rotation,
        -this.walkingSpeed,
        this.body.velocity
      );
    } else if (left) {
      this.scene.physics.velocityFromRotation(
        this.rotation + 0.5 * Math.PI,
        -this.strafeSpeed,
        this.body.velocity
      );
    } else if (right) {
      this.scene.physics.velocityFromRotation(
        this.rotation + 0.5 * Math.PI,
        this.strafeSpeed,
        this.body.velocity
      );
    } else {
      this.setVelocity(0);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.F)) {
      const isOff = this.flashlight.intensity == 0;
      this.flashlight.setIntensity(isOff ? 1 : 0);
    }

    super.preUpdate(time, delta);
  }

  public onDark() {
    this.postFX.clear();
  }

  public onLight() {
    this.postFX.add(this.shadow);
  }
}
