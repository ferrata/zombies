import config from '../game-config'
import { lightSourceMixin, LightSourceProps } from '../mixins/light-source.mixin'

export interface MuzzleFlashObject extends Phaser.Physics.Arcade.Sprite, LightSourceProps {
  flashOnce(): void
}

export function createMuzzleFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  raycaster: Raycaster,
): MuzzleFlashObject {
  const gameScene = scene as Phaser.Scene & { physics: Phaser.Physics.Arcade.ArcadePhysics }
  const sprite = gameScene.physics.add.sprite(x, y, 'muzzle-flash') as Phaser.Physics.Arcade.Sprite

  sprite.setName('muzzle-flash')
  sprite.setOrigin(0.1, 0.5)
  sprite.setScale(0.15)
  sprite.setVisible(false)

  const result = sprite.mixin(lightSourceMixin, {
    raycaster,
    config: config.weapon.muzzle.light,
  }) as unknown as MuzzleFlashObject

  result.lightGraphics.setDepth(config.depths.light)

  result.flashOnce = function () {
    this.setVisible(true)
    this.enableLight()
    this.setLightOrigin(this.x, this.y)
    this.setLightAngleDeg(this.angle)
    this.lightRay?.setConeDeg(config.weapon.muzzle.light.coneDeg)
    this.lightRay?.setRayRange(config.weapon.muzzle.light.coneRange)

    this.scene.time.delayedCall(config.weapon.muzzle.duration, () => {
      this.setVisible(false)
      this.disableLight()
    })
  }

  return result
}
