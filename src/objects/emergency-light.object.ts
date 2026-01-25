import config from '../game-config'
import { lightSourceMixin, LightSource } from '../mixins/light-source.mixin'
import { debuggableMixin, Debuggable } from '../mixins/debuggable.mixin'
import { LightAwareShape } from '../mixins/light-aware.mixin'
import { GameSceneInterface } from '../types/game-scene'
import { MIXIN_LIGHT_AWARE } from '../core/instances'

function emergencyLightMixin<T extends Phaser.Physics.Arcade.Sprite & LightSource & Debuggable>(
  obj: T,
) {
  obj.getDebugInfo = function () {
    return {
      name: obj.name,
      x: obj.x,
      y: obj.y,
      angle: obj.angle,
      isOn: obj.isLightEnabled,
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
    turnOn() {
      obj.setTint()
      obj.enableLight()
      obj.setLightOrigin(obj.x, obj.y)
      obj.setLightAngleDeg(obj.angle - 90)
      obj.lightRay?.setConeDeg(config.emergencyAlarmLight.coneDeg)
      obj.lightRay?.setRayRange(config.emergencyAlarmLight.coneRange)
    },
    turnOff() {
      const gameScene = obj.scene as GameSceneInterface | undefined
      obj.setTint(gameScene?.isDark ? 0x111111 : 0x505050)
      obj.disableLight()
    },
    onLighten() {
      if (!obj.isLightEnabled) {
        obj.setTint(0x505050)
      }
    },
    onDarken() {
      if (!obj.isLightEnabled) {
        obj.setTint(0x111111)
      }
    },
    onLightOverReset() {},
    onLightOver() {},
    onLightningOver() {},
    onLighningtOver() {},
    setLightAwareShape() {},
    getLightAwareShape(): LightAwareShape {
      return null
    },
    lightShape: null as LightAwareShape,
  })
}

export function createEmergencyLight(
  scene: Phaser.Scene,
  x: number,
  y: number,
  raycaster: Raycaster,
) {
  const gameScene = scene as Phaser.Scene & { physics: Phaser.Physics.Arcade.ArcadePhysics }
  const sprite = gameScene.physics.add.sprite(x, y, 'wall-lamp') as Phaser.Physics.Arcade.Sprite

  sprite.setName('emergency-alarm-light')
  sprite.setOrigin(0.5, 0.5)
  sprite.setDisplaySize(60, 20)
  sprite.setDepth(config.depths.ceiling)

  const result = sprite
    .mixin(lightSourceMixin, { raycaster, config: config.emergencyAlarmLight })
    .mixin(debuggableMixin)
    .mixin(emergencyLightMixin)

  result.lightGraphics.setDepth(config.depths.light)
  result.track(MIXIN_LIGHT_AWARE)

  const isDark = (scene as GameSceneInterface | undefined)?.isDark ?? false
  result.setTint(isDark ? 0x111111 : 0x505050)

  return result
}

export type EmergencyLightObject = ReturnType<typeof createEmergencyLight>
