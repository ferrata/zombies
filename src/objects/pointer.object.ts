import config from "../game-config";
import { isPointable, PointableProps } from "../mixins/pointable.mixin";

interface PlayerLike {
  body: Phaser.Physics.Arcade.Body;
}

export default class Pointer extends Phaser.GameObjects.GameObject {
  private dot: Phaser.GameObjects.Arc;
  private currentlyHighlighted: PointableProps | null = null;

  public get x(): number {
    return this.dot.x;
  }

  public set x(value: number) {
    this.dot.x = value;
  }

  public get y(): number {
    return this.dot.y;
  }

  public set y(value: number) {
    this.dot.y = value;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, "pointer");

    this.dot = scene.add.circle(x, y, 5, 0xffffff, 0.5);

    this.scene.add.existing(this.dot);
    this.scene.physics.world.enable(this.dot);

    this.dot.setDepth(config.depths.pointer);
  }

  public update(player: PlayerLike) {
    this.dot.body.velocity.x = player.body.velocity.x;
    this.dot.body.velocity.y = player.body.velocity.y;

    const withinWorldBounds = this.scene.physics.world.bounds.contains(
      this.dot.x,
      this.dot.y
    );

    this.dot.fillColor = withinWorldBounds ? 0xffffff : 0xff0000;

    const body = this.scene.physics.overlapRect(
      this.dot.x,
      this.dot.y,
      1,
      1
    )[0];

    const gameObject = body?.gameObject;

    if (isPointable(gameObject) && gameObject != this.currentlyHighlighted) {
      this.dot.visible = false;
      if (this.currentlyHighlighted) {
        this.currentlyHighlighted.removeHighlight();
        this.currentlyHighlighted.removeInfo();
      }
      gameObject.showHighlight();
      gameObject.showInfo();

      this.currentlyHighlighted = gameObject;
    } else if (!isPointable(gameObject) && this.currentlyHighlighted) {
      this.currentlyHighlighted.removeHighlight();
      this.currentlyHighlighted.removeInfo();
      this.currentlyHighlighted = null;
      this.dot.visible = true;
    }
  }
}
