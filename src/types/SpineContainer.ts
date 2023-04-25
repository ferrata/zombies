import "phaser";

export default class SpineContainer extends Phaser.GameObjects.Container {
  // @ts-ignore
  private mainSpine: SpineGameObject;
  // @ts-ignore
  private spines: { [key: string]: SpineGameObject } = {};

  get spine() {
    return this.mainSpine;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    anim: string,
    loop = false
  ) {
    super(scene, x, y);

    // @ts-ignore
    this.mainSpine = scene.add.spine(0, 0, key, anim, loop);

    scene.physics.add.existing(this);

    const bounds = this.mainSpine.getBounds();
    const width = bounds.size.x;
    const height = bounds.size.y;
    this.setPhysicsSize(width, height);

    this.add(this.mainSpine);
  }

  // @ts-ignore
  public addSpine(spine: SpineGameObject, index?: number) {
    this.addAt(spine, index);
    this.spines[spine.key] = spine;
  }

  public getSpine(key: string) {
    return this.spines[key];
  }

  faceDirection(dir: 1 | -1) {
    if (this.mainSpine.scaleX === dir) {
      return;
    }

    this.mainSpine.scaleX = dir;
  }

  setPhysicsSize(width: number, height: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setOffset(width * -0.5, -height);
    body.setSize(width, height);
  }
}
