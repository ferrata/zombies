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
}
