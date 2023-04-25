import "phaser";

export default class SpineContainer extends Phaser.GameObjects.Container {
  // @ts-ignore
  private spineGameObject: SpineGameObject;

  get spine() {
    return this.spineGameObject;
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
    this.spineGameObject = scene.add.spine(0, 0, key, anim, loop);

    scene.physics.add.existing(this);

    const bounds = this.spineGameObject.getBounds();
    const width = bounds.size.x;
    const height = bounds.size.y;
    this.setPhysicsSize(width, height);

    this.add(this.spineGameObject);
  }

  faceDirection(dir: 1 | -1) {
    if (this.spineGameObject.scaleX === dir) {
      return;
    }

    this.spineGameObject.scaleX = dir;
  }

  setPhysicsSize(width: number, height: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setOffset(width * -0.5, -height);
    body.setSize(width, height);
  }
}
