import config from "../GameConfig";
import { IPointable, isPointable } from "../types/Pointable";
import Player from "./Player";

export default class Pointer extends Phaser.GameObjects.GameObject {
  private dot: Phaser.GameObjects.Arc;
  private currentlyHighlighted: IPointable | null = null;

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

  public update(player: Player) {
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
    const pointableGameObject = isPointable(gameObject);

    if (pointableGameObject && gameObject != this.currentlyHighlighted) {
      // console.log("highlighting", gameObject);

      this.dot.visible = false;
      this.currentlyHighlighted?.removeHighlight().removeInfo();
      gameObject.showHighlight().showInfo();

      this.currentlyHighlighted = gameObject;
    } else if (!pointableGameObject && this.currentlyHighlighted) {
      // console.log("removing highlight", this.currentlyHighlighted);

      this.currentlyHighlighted.removeHighlight().removeInfo();
      this.currentlyHighlighted = null;
      this.dot.visible = true;
    }
  }
}
