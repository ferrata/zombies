import config from '../game-config'
import { lightAwareMixin, LightAware } from '../mixins/light-aware.mixin'

function barrelMixin<T extends Phaser.Physics.Matter.Image & LightAware>(
  obj: T,
  scene: Phaser.Scene,
) {
  return obj.merge({
    createRectangle(widthDelta = 0, heightDelta = 0) {
      return scene.add
        .rectangle(obj.x, obj.y, obj.width - widthDelta, obj.height - heightDelta)
        .setAngle(obj.angle)
        .setOrigin(obj.originX, obj.originY)
        .setScale(obj.scaleX, obj.scaleY)
    },
    createCircle(radius: number) {
      const center = obj.getCenter()
      return scene.add.circle(center.x, center.y, radius)
    },
    createPolygon(vertices: Phaser.Types.Math.Vector2Like[]) {
      return scene.add
        .polygon(obj.x, obj.y, vertices)
        .setAngle(obj.angle)
        .setOrigin(obj.originX, obj.originY)
        .setScale(obj.scaleX, obj.scaleY)
    },
  })
}

export function createBarrel(scene: Phaser.Scene, x: number, y: number, texture: string) {
  const gameScene = scene as Phaser.Scene & { matter: Phaser.Physics.Matter.MatterPhysics }
  const image = gameScene.matter.add.image(x, y, texture, undefined, { isStatic: true })

  image.setName(`barrel:${texture}`)
  image.setFrictionAir(0.9)
  image.setDensity(0.999)
  image.setMass(0.999)
  image.setDepth(config.depths.matterThingBottom)

  return image.mixin(lightAwareMixin).mixin(barrelMixin, scene)
}

export type BarrelObject = ReturnType<typeof createBarrel>
