import config from '../game-config'
import { lightAwareMixin, LightAwareProps } from '../mixins/light-aware.mixin'

export interface BarrelObject extends Phaser.Physics.Matter.Image, LightAwareProps {
  createRectangle(widthDelta?: number, heightDelta?: number): Phaser.GameObjects.Rectangle
  createCircle(radius: number): Phaser.GameObjects.Arc
  createPolygon(vertices: Phaser.Types.Math.Vector2Like[]): Phaser.GameObjects.Polygon
}

export function createBarrel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
): BarrelObject {
  const gameScene = scene as Phaser.Scene & { matter: Phaser.Physics.Matter.MatterPhysics }
  const image = gameScene.matter.add.image(x, y, texture, undefined, { isStatic: true })

  image.setName(`barrel:${texture}`)
  image.setFrictionAir(0.9)
  image.setDensity(0.999)
  image.setMass(0.999)
  image.setDepth(config.depths.matterThingBottom)

  const result = image.mixin(lightAwareMixin) as unknown as BarrelObject

  result.createRectangle = function (widthDelta = 0, heightDelta = 0) {
    return scene.add
      .rectangle(this.x, this.y, this.width - widthDelta, this.height - heightDelta)
      .setAngle(this.angle)
      .setOrigin(this.originX, this.originY)
      .setScale(this.scaleX, this.scaleY)
  }

  result.createCircle = function (radius: number) {
    const center = this.getCenter()
    return scene.add.circle(center.x, center.y, radius)
  }

  result.createPolygon = function (vertices: Phaser.Types.Math.Vector2Like[]) {
    return scene.add
      .polygon(this.x, this.y, vertices)
      .setAngle(this.angle)
      .setOrigin(this.originX, this.originY)
      .setScale(this.scaleX, this.scaleY)
  }

  return result
}
