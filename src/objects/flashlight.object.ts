import config from '../game-config'
import { lightSourceMixin, LightSourceProps } from '../mixins/light-source.mixin'
import { pointableMixin, PointableProps } from '../mixins/pointable.mixin'
import { interactableMixin, InteractableProps } from '../mixins/interactable.mixin'
import { debuggableMixin, DebuggableProps } from '../mixins/debuggable.mixin'

export interface FlashlightObject
  extends
    Phaser.Physics.Arcade.Sprite,
    LightSourceProps,
    PointableProps,
    InteractableProps,
    DebuggableProps {
  isOn: boolean
  isOff: boolean
  isGlitchy: boolean
  turnOn(): void
  turnOff(): void
  setGlitchy(value: boolean): void
}

export function createFlashlight(
  scene: Phaser.Scene,
  x: number,
  y: number,
  raycaster: Raycaster,
): FlashlightObject {
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
    .mixin(debuggableMixin) as unknown as FlashlightObject

  result.lightGraphics.setDepth(config.depths.light)

  let glitchy = false

  Object.defineProperties(result, {
    isOn: {
      get() {
        return this.isLightEnabled
      },
    },
    isOff: {
      get() {
        return !this.isLightEnabled
      },
    },
    isGlitchy: {
      get() {
        return glitchy
      },
    },
  })

  const originalSetPosition = result.setPosition.bind(result)
  result.setPosition = function (x: number, y: number) {
    originalSetPosition(x, y)
    this.setLightOrigin(x, y)
    return this
  }

  const originalSetAngle = result.setAngle.bind(result)
  result.setAngle = function (angle: number) {
    originalSetAngle(angle)
    this.setLightAngleDeg(this.angle)
    return this
  }

  result.turnOn = function () {
    this.enableLight()
    this.setLightOrigin(this.x, this.y)
    this.setLightAngleDeg(this.angle)
    this.lightRay?.setConeDeg(config.flashlight.coneDeg)
    this.lightRay?.setRayRange(config.flashlight.coneRange)
  }

  result.turnOff = function () {
    this.disableLight()
  }

  result.setGlitchy = function (value: boolean) {
    glitchy = value
    return this
  }

  result.getDebugInfo = function () {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      isOn: this.isOn,
      rotation: this.rotation,
      glitchy: glitchy,
    }
  }

  result.drawDebugPhysics = function (graphics: Phaser.GameObjects.Graphics) {
    if (!this.lightRay) return
    graphics.fillStyle(0xff0000, 0.5)
    this.lightRay.intersections.forEach((intersection: Phaser.Geom.Point) => {
      graphics.fillCircle(intersection.x, intersection.y, 3)
    })
  }

  return result
}
