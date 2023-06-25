import config from "../GameConfig";

export class StaticMatterThing extends Phaser.Physics.Matter.Image {
  private topImage: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene.matter.world, x, y, texture);
    scene.add.existing(this);

    this.setName(`static-matter:${texture}`);

    this.setStatic(true);

    this.setFrictionAir(0.9);
    this.setDensity(0.999);
    this.setMass(0.999);

    this.setDepth(config.depths.matterThingBottom);
  }

  public setTint(
    topLeft?: number,
    topRight?: number,
    bottomLeft?: number,
    bottomRight?: number
  ): this {
    super.setTint(topLeft, topRight, bottomLeft, bottomRight);

    this.topImage?.setTint(topLeft, topRight, bottomLeft, bottomRight);

    return this;
  }

  public createRectangle(
    widthDelta: number = 0,
    heightDelta: number = 0
  ): Phaser.GameObjects.Rectangle {
    return this.scene.add
      .rectangle(
        this.x,
        this.y,
        this.width - widthDelta,
        this.height - heightDelta
      )
      .setAngle(this.angle)
      .setOrigin(this.originX, this.originY)
      .setScale(this.scaleX, this.scaleY);
  }

  public createCircle(radius: number): Phaser.GameObjects.Arc {
    const center = this.getCenter();

    // // a copy of the texture is needed because of the glitch with the raycaster and circles
    // this.topImage = this.scene.add
    //   .image(center.x, center.y, this.texture.key)
    //   .setAngle(this.angle)
    //   .setOrigin(this.originX, this.originY)
    //   .setScale(this.scaleX, this.scaleY)
    //   .setDepth(config.depths.matterThingTop);

    return this.scene.add.circle(center.x, center.y, radius);
  }

  public createPolygon(
    vertices: Phaser.Types.Math.Vector2Like[]
  ): Phaser.GameObjects.Polygon {
    return this.scene.add
      .polygon(this.x, this.y, vertices)
      .setAngle(this.angle)
      .setOrigin(this.originX, this.originY)
      .setScale(this.scaleX, this.scaleY);
  }
}
