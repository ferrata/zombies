export class StaticMatterThing extends Phaser.Physics.Matter.Image {
  shadow: Phaser.FX.Shadow;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene.matter.world, x, y, texture);
    scene.add.existing(this);

    this.setStatic(true);

    this.setFrictionAir(0.9);
    this.setDensity(0.999);
    this.setMass(0.999);
  }

  public createRectangle(): Phaser.GameObjects.Rectangle {
    return this.scene.add
      .rectangle(this.x, this.y, this.width, this.height)
      .setAngle(this.angle)
      .setOrigin(this.originX, this.originY)
      .setScale(this.scaleX, this.scaleY);
  }

  public createCircle(radius: number): Phaser.GameObjects.Arc {
    const center = this.getCenter();
    return this.scene.add.circle(center.x, center.y, radius);
  }

  // TODO: polygon
}
