import config from '../game-config'
import { lightSourceMixin, LightSource } from '../mixins/light-source.mixin'

function muzzleFlashMixin<T extends Phaser.Physics.Arcade.Sprite & LightSource>(obj: T) {
  return obj.merge({
    flashOnce() {
      obj.setVisible(true)
      obj.enableLight()
      obj.setLightOrigin(obj.x, obj.y)
      obj.setLightAngleDeg(obj.angle)
      obj.lightRay?.setConeDeg(config.weapon.muzzle.light.coneDeg)
      obj.lightRay?.setRayRange(config.weapon.muzzle.light.coneRange)

      obj.scene.time.delayedCall(config.weapon.muzzle.duration, () => {
        obj.setVisible(false)
        obj.disableLight()
      })
    },
  })
}

export function createMuzzleFlash(scene: Phaser.Scene, x: number, y: number, raycaster: Raycaster) {
  const gameScene = scene as Phaser.Scene & { physics: Phaser.Physics.Arcade.ArcadePhysics }
  const sprite = gameScene.physics.add.sprite(x, y, 'muzzle-flash') as Phaser.Physics.Arcade.Sprite

  sprite.setName('muzzle-flash')
  sprite.setOrigin(0.1, 0.5)
  sprite.setScale(0.15)
  sprite.setVisible(false)

  const result = sprite
    .mixin(lightSourceMixin, { raycaster, config: config.weapon.muzzle.light })
    .mixin(muzzleFlashMixin)

  result.lightGraphics.setDepth(config.depths.light)

  return result
}

export type MuzzleFlashObject = ReturnType<typeof createMuzzleFlash>
