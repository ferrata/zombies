import { StaticMatterThing } from "./StaticMatterThing";
import { IProjection } from "../types/Projection";

export class StaticMatterProjectionCircle
  extends Phaser.Physics.Arcade.StaticGroup
  implements IProjection
{
  private coordinates: Phaser.Types.Math.Vector2Like[];

  constructor(
    scene: Phaser.Scene,
    matterObject: StaticMatterThing,
    radius: number,
    minDotsDistance: number = 20
  ) {
    super(scene.physics.world, scene);

    this.coordinates = this.normalizeCircleShape(
      matterObject.getCenter(),
      radius,
      minDotsDistance
    );

    this.coordinates.forEach((coordinate) => {
      const dot: Phaser.Physics.Arcade.Sprite = this.create(
        coordinate.x,
        coordinate.y,
        "green-dot"
      );
      dot.setScale(0.2).setCircle(1).refreshBody();
    });

    this.setVisible(false);
  }

  public shift(diff: Phaser.Types.Math.Vector2Like): IProjection {
    this.getChildren().forEach((child) => {
      const dot = child as Phaser.Physics.Arcade.Sprite;
      dot.setPosition(dot.x + diff.x, dot.y + diff.y).refreshBody();
    });

    this.refresh();
    return this;
  }

  private normalizeCircleShape(
    center: Phaser.Types.Math.Vector2Like,
    radius: number,
    minDotsDistance: number
  ): Phaser.Types.Math.Vector2Like[] {
    const coordinates: Phaser.Types.Math.Vector2Like[] = [];

    const circumference = 2 * Math.PI * radius;
    const dotsCount = Math.floor(circumference / minDotsDistance);

    for (let i = 0; i < dotsCount; i++) {
      const angle = (i / dotsCount) * 2 * Math.PI;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      coordinates.push({ x, y });
    }

    return coordinates;
  }
}

export class StaticMatterProjectionRectangle
  extends Phaser.Physics.Arcade.StaticGroup
  implements IProjection
{
  private coordinates: Phaser.Types.Math.Vector2Like[];

  constructor(
    scene: Phaser.Scene,
    matterObject: StaticMatterThing,
    minDotsDistance: number = 20
  ) {
    super(scene.physics.world, scene);

    this.coordinates = this.normalizeRectShape(
      [
        matterObject.getTopLeft(),
        matterObject.getTopRight(),
        matterObject.getBottomRight(),
        matterObject.getBottomLeft(),
      ],
      minDotsDistance
    );

    this.coordinates.forEach((coordinate) => {
      const dot: Phaser.Physics.Arcade.Sprite = this.create(
        coordinate.x,
        coordinate.y,
        "green-dot"
      );
      dot.setScale(0.2).setCircle(1).refreshBody();
    });

    this.setVisible(false);
  }

  public shift(diff: Phaser.Types.Math.Vector2Like): IProjection {
    this.getChildren().forEach((child) => {
      const dot = child as Phaser.Physics.Arcade.Sprite;
      dot.setPosition(dot.x + diff.x, dot.y + diff.y).refreshBody();
    });

    this.refresh();
    return this;
  }

  private normalizeRectShape(
    vertices: Phaser.Types.Math.Vector2Like[],
    minDistance: number
  ): Phaser.Types.Math.Vector2Like[] {
    const normalizedVertices: Phaser.Types.Math.Vector2Like[] = [];

    vertices.forEach((vertex, i) => {
      normalizedVertices.push(vertex);
      const nextVertex = vertices[i + 1] || vertices[0];
      const distance = Phaser.Math.Distance.BetweenPoints(vertex, nextVertex);
      if (distance > minDistance) {
        const additionalVertices = Math.floor(distance / minDistance);
        for (let i = 1; i < additionalVertices; i++) {
          normalizedVertices.push({
            x: Phaser.Math.Linear(
              vertex.x,
              nextVertex.x,
              i / additionalVertices
            ),
            y: Phaser.Math.Linear(
              vertex.y,
              nextVertex.y,
              i / additionalVertices
            ),
          });
        }
      }
    });

    return normalizedVertices;
  }
}
