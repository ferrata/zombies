import Player from "./Player";

export default class Reticle extends Phaser.GameObjects.GameObject {
  private pointer: Phaser.GameObjects.Arc;

  public get x(): number {
    return this.pointer.x;
  }

  public set x(value: number) {
    this.pointer.x = value;
  }

  public get y(): number {
    return this.pointer.y;
  }

  public set y(value: number) {
    this.pointer.y = value;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, "reticle");

    this.pointer = scene.add.circle(x, y, 5, 0xffffff, 0.5);

    this.scene.add.existing(this.pointer);
    this.scene.physics.world.enable(this.pointer);
  }

  public update(player: Player) {
    // Makes reticle move with player
    this.pointer.body.velocity.x = player.body.velocity.x;
    this.pointer.body.velocity.y = player.body.velocity.y;

    const withinWorldBounds = this.scene.physics.world.bounds.contains(
      this.pointer.x,
      this.pointer.y
    );

    this.pointer.fillColor = withinWorldBounds ? 0xffffff : 0xff0000;
  }
}
