import config from '../game-config'
import { lightSourceMixin, LightSource } from '../mixins/light-source.mixin'
import { pointableMixin } from '../mixins/pointable.mixin'
import { interactableMixin } from '../mixins/interactable.mixin'
import { debuggableMixin, Debuggable } from '../mixins/debuggable.mixin'

function flashlightMixin<T extends Phaser.GameObjects.Sprite & LightSource & Debuggable>(obj: T) {
  let glitchy = false

  const originalSetPosition = obj.setPosition.bind(obj)
  const originalSetAngle = obj.setAngle.bind(obj)

  obj.setPosition = function (x: number, y: number) {
    originalSetPosition(x, y)
    obj.setLightOrigin(x, y)
    return this
  }

  obj.setAngle = function (angle: number) {
    originalSetAngle(angle)
    obj.setLightAngleDeg(obj.angle)
    return this
  }

  obj.getDebugInfo = function () {
    return {
      name: obj.name,
      x: obj.x,
      y: obj.y,
      isOn: obj.isLightEnabled,
      rotation: obj.rotation,
      glitchy: glitchy,
    }
  }

  obj.drawDebugPhysics = function (graphics: Phaser.GameObjects.Graphics) {
    if (!obj.lightRay) return
    graphics.fillStyle(0xff0000, 0.5)
    obj.lightRay.intersections.forEach((intersection: Phaser.Geom.Point) => {
      graphics.fillCircle(intersection.x, intersection.y, 3)
    })
  }

  return obj.merge({
    get isOn() {
      return obj.isLightEnabled
    },
    get isOff() {
      return !obj.isLightEnabled
    },
    get isGlitchy() {
      return glitchy
    },
    turnOn() {
      obj.enableLight()
      obj.setLightOrigin(obj.x, obj.y)
      obj.setLightAngleDeg(obj.angle)
      obj.lightRay?.setConeDeg(config.flashlight.coneDeg)
      obj.lightRay?.setRayRange(config.flashlight.coneRange)
    },
    turnOff() {
      obj.disableLight()
    },
    setGlitchy(value: boolean) {
      glitchy = value
      return obj
    },
  })
}

export function createFlashlight(scene: Phaser.Scene, x: number, y: number, raycaster: Raycaster) {
  const gameScene = scene as Phaser.Scene & { physics: Phaser.Physics.Arcade.ArcadePhysics }
  const sprite = gameScene.physics.add.sprite(x, y, 'flashlight') as Phaser.Physics.Arcade.Sprite

  sprite.setName('flashlight')
  sprite.setOrigin(0.5, 0.5)
  sprite.setDisplaySize(50, 30)
  sprite.setDepth(config.depths.matterThingTop + 1)

  const result = sprite
    .mixin(lightSourceMixin, { raycaster, config: config.flashlight })
    .mixin(pointableMixin, { info: 'Flashlight' })
    .mixin(interactableMixin, { range: 150 })
    .mixin(debuggableMixin)
    .mixin(flashlightMixin)

  result.lightGraphics.setDepth(config.depths.light)

  return result
}

export type FlashlightObject = ReturnType<typeof createFlashlight>
