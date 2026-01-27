import config from '../game-config'
import { input } from '../core/globals'
import { Event } from '../scenes/event'
import { CasingEmitter } from './casing-emitter.object'
import { createMuzzleFlash } from './muzzle-flash.object'
import PlayerPuppet, { PlayerWeapon } from './player.puppet'
import { LightAware, getTintColorShift, LightAwareShape } from '../mixins/light-aware.mixin'
import { Debuggable } from '../mixins/debuggable.mixin'
import { FlashlightObject } from './flashlight.object'
import { GameSceneInterface } from '../types/game-scene'
import { createSpineListener } from '../types/spine-listener'

enum PlayerWeaponMode {
  NONE = 'none',
  SINGLE = 'single',
  BURST = 'burst',
  AUTO = 'auto',
}

export interface PlayerObject extends LightAware, Debuggable {
  name: string
  puppet: PlayerPuppet
  body: Phaser.Physics.Arcade.Body
  x: number
  y: number
  rotation: number
  angle: number
  flashlight: FlashlightObject | null

  preUpdate(): void
  postUpdate(): void
  attack(): void
  reload(): void
  selectWeapon(weapon: PlayerWeapon): void
  interactWithObject(item: Phaser.GameObjects.GameObject): void
}

export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  raycaster: Raycaster,
): PlayerObject {
  const gameScene = scene as GameSceneInterface

  const puppet = new PlayerPuppet(scene, x, y)
  puppet.name = 'player'

  gameScene.physics.world.enable(puppet)
  const body = puppet.body as Phaser.Physics.Arcade.Body
  body.setDrag(1, 1)

  const bounds = puppet.spine.getBounds()
  body
    .setOffset(-bounds.size.x / 3, -bounds.size.y / 3 - 15)
    .setCircle(bounds.size.x / 3)
    .setCollideWorldBounds(true)

  const matterSpot = gameScene.matter.add.circle(x, y, 50, {
    isSensor: true,
    label: 'player-spot',
  })

  const lightAwareShape: LightAwareShape = scene.add.circle(x, y, 50)
  if (lightAwareShape) lightAwareShape.owner = undefined

  const shadow = puppet.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3)
  puppet.postFX.remove(shadow)
  let shadowAdded = false

  const darkColorMatrix = puppet.postFX
    .addColorMatrix()
    .brightness(config.colors.darkenColorMatrixBrightness)

  puppet.idle()
  puppet.selectWeapon(PlayerWeapon.HANDGUN)

  const casingEmitter = new CasingEmitter(gameScene, x, y, 'bullet-casings', { from: 0.4, to: 0.3 })
  const muzzleFlash = createMuzzleFlash(scene, x, y, raycaster)

  puppet.setDepth(config.depths.player)
  casingEmitter.setDepth(config.depths.casingEmitter)
  muzzleFlash.setDepth(config.depths.player + 1)

  const currentWeaponMode: Record<PlayerWeapon, PlayerWeaponMode> = {
    [PlayerWeapon.FLASHLIGHT]: PlayerWeaponMode.NONE,
    [PlayerWeapon.HANDGUN]: PlayerWeaponMode.SINGLE,
    [PlayerWeapon.SHOTGUN]: PlayerWeaponMode.SINGLE,
    [PlayerWeapon.RIFLE]: PlayerWeaponMode.BURST,
    [PlayerWeapon.KNIFE]: PlayerWeaponMode.NONE,
  }

  const player: PlayerObject = {
    name: 'player',
    puppet,
    body,
    flashlight: null,
    lightShape: lightAwareShape,

    get x() {
      return puppet.x
    },
    set x(value: number) {
      puppet.x = value
    },
    get y() {
      return puppet.y
    },
    set y(value: number) {
      puppet.y = value
    },
    get rotation() {
      return puppet.rotation
    },
    set rotation(value: number) {
      puppet.rotation = value
    },
    get angle() {
      return puppet.angle
    },
    set angle(value: number) {
      puppet.angle = value
    },

    preUpdate() {
      const inputs = input
      if (!inputs) return

      const { up, down, left, right, keys } = inputs

      if (left) {
        strafeLeft(keys.shift.isDown)
      } else if (right) {
        strafeRight(keys.shift.isDown)
      } else if (up) {
        if (keys.shift.isDown) {
          runForward()
        } else {
          moveForward()
        }
      } else if (down) {
        if (!keys.shift.isDown) {
          moveBackward()
        } else {
          runBackward()
        }
      } else {
        stop()
      }

      if (Phaser.Input.Keyboard.JustDown(keys.F)) {
        toggleFlashlight()
      }

      if (Phaser.Input.Keyboard.JustDown(keys.E)) {
        scene.events.emit(Event.INTERACT_WITH_OBJECT)
      }

      if (Phaser.Input.Keyboard.JustDown(keys.R)) {
        this.reload()
      }

      if (Phaser.Input.Keyboard.JustDown(keys.one)) {
        toggleKnife()
      }

      if (Phaser.Input.Keyboard.JustDown(keys.two)) {
        this.selectWeapon(PlayerWeapon.HANDGUN)
      }

      if (Phaser.Input.Keyboard.JustDown(keys.three)) {
        this.selectWeapon(PlayerWeapon.SHOTGUN)
      }

      if (Phaser.Input.Keyboard.JustDown(keys.four)) {
        this.selectWeapon(PlayerWeapon.RIFLE)
      }

      if (Phaser.Input.Keyboard.JustDown(keys.space)) {
        this.attack()
      }
    },

    postUpdate() {
      updateMatterSpotPosition()
      updateFlashlightPosition()
      updateMuzzleFlashPosition()
      updateCasingEmitterPosition()
      updateLightAwareShapePosition()
    },

    attack() {
      const weapon = puppet.getWeapon()

      if (weapon === PlayerWeapon.KNIFE || weapon === PlayerWeapon.FLASHLIGHT) {
        puppet.meleeAttack()
        return
      }

      const mode = currentWeaponMode[weapon]
      if (mode === PlayerWeaponMode.SINGLE) {
        shoot()
      } else if (mode === PlayerWeaponMode.BURST) {
        shoot()
        scene.time.delayedCall(config.weapon.shotDelay, shoot)
        scene.time.delayedCall(config.weapon.shotDelay * 2, shoot)
      } else if (mode === PlayerWeaponMode.AUTO) {
        const shootEvent = scene.time.addEvent({
          delay: config.weapon.shotDelay,
          callback: () => {
            if (scene.input.keyboard!.keys[Phaser.Input.Keyboard.KeyCodes.SPACE].isDown) {
              shoot()
            } else {
              shootEvent.remove()
            }
          },
          loop: true,
        })
      }
    },

    reload() {
      puppet.reload()
    },

    selectWeapon(weapon: PlayerWeapon) {
      const currentWeapon = puppet.getWeapon()

      if (currentWeapon === weapon) {
        const oldMode = currentWeaponMode[currentWeapon]
        const newMode = nextWeaponMode(currentWeapon, oldMode)
        currentWeaponMode[currentWeapon] = newMode

        if (oldMode !== newMode) {
          scene.events.emit(Event.WEAPON_MODE_CHANGED, { weapon: currentWeapon, mode: newMode })
        }
        return
      }

      puppet.selectWeapon(weapon)
    },

    interactWithObject(item: Phaser.GameObjects.GameObject) {
      if (isAlmostWithinReach(item)) {
        almostTakeItem()
        scene.events.emit(Event.OBJECT_STILL_TOO_FAR, item)
        return
      }

      if (!isWithinReach(item)) {
        scene.events.emit(Event.OBJECT_TOO_FAR, item)
        return
      }

      const flashlightCandidate = item as Partial<FlashlightObject>
      if (flashlightCandidate.isOn !== undefined && flashlightCandidate.turnOn) {
        takeItem(() => {
          const flashlightItem = item as FlashlightObject
          // Disable physics and hide the sprite instead of removing from scene
          flashlightItem.body?.enable && (flashlightItem.body.enable = false)
          flashlightItem.removeHighlight()
          flashlightItem.removeInfo()
          flashlightItem.setVisible(false)
          flashlightItem.setActive(false)
          player.flashlight = flashlightItem
          return item
        })
      } else {
        scene.events.emit(Event.UNKNOWN_OBJECT, item)
      }
    },

    onLighten() {
      ensureShadow()
      shadow.color = 0x000000
      darkColorMatrix.reset()
      casingEmitter.onLighten()
    },

    onDarken() {
      removeShadow()
      darkColorMatrix.reset().brightness(config.colors.darkenColorMatrixBrightness)
      casingEmitter.onDarken()
    },

    onLightOverReset() {
      if (gameScene.isDark) {
        darkColorMatrix.reset().brightness(config.colors.darkenColorMatrixBrightness)
      }
    },

    onLightOver(_ray: Raycaster.Ray, _intersections: Phaser.Geom.Point[], _force: boolean) {
      darkColorMatrix.reset()
    },

    onLightningOver(progress: number) {
      removeShadow()

      if (progress < 1) {
        ensureShadow()
        shadow.color = getTintColorShift(0x000000, progress)
      }

      darkColorMatrix
        .reset()
        .brightness(Phaser.Math.Linear(0, config.colors.darkenColorMatrixBrightness, progress))
    },

    setLightAwareShape(_shape: LightAwareShape) {},

    getLightAwareShape() {
      return lightAwareShape
    },

    hasDebugInfo() {
      return true
    },

    getDebugInfo() {
      return {
        x: player.x,
        y: player.y,
        size: { width: body.width, height: body.height },
        angle: player.angle,
        velocity: body.velocity,
        currentState: puppet.getState(),
        currentLegsState: puppet.getLegsState(),
        currentWeapon: puppet.getWeapon(),
        currentWeaponMode: currentWeaponMode[puppet.getWeapon()],
        flashlight: player.flashlight?.getDebugInfo(),
      }
    },

    drawDebugPhysics(graphics: Phaser.GameObjects.Graphics) {
      player.flashlight?.drawDebugPhysics(graphics)
    },
  }

  if (lightAwareShape) lightAwareShape.owner = player

  // Map player to muzzle flash so it lights up when firing
  muzzleFlash.mapLightAwareObject(player)

  function stop() {
    puppet.idle()
    body.setVelocity(0)
  }

  function strafeRight(fast: boolean) {
    puppet.strafeRight()
    gameScene.physics.velocityFromRotation(
      player.rotation + 0.5 * Math.PI,
      fast ? config.player.speed.strafeFast : config.player.speed.strafe,
      body.velocity,
    )
  }

  function strafeLeft(fast: boolean) {
    puppet.strafeLeft()
    gameScene.physics.velocityFromRotation(
      player.rotation + 0.5 * Math.PI,
      -(fast ? config.player.speed.strafeFast : config.player.speed.strafe),
      body.velocity,
    )
  }

  function moveBackward() {
    puppet.walk()
    gameScene.physics.velocityFromRotation(
      player.rotation,
      -config.player.speed.walk,
      body.velocity,
    )
  }

  function moveForward() {
    puppet.walk()
    gameScene.physics.velocityFromRotation(player.rotation, config.player.speed.walk, body.velocity)
  }

  function runBackward() {
    puppet.run()
    gameScene.physics.velocityFromRotation(player.rotation, -config.player.speed.run, body.velocity)
  }

  function runForward() {
    puppet.run()
    gameScene.physics.velocityFromRotation(player.rotation, config.player.speed.run, body.velocity)
  }

  function shoot() {
    puppet.shoot()
    casingEmitter.emitOne(getCasingName())
    muzzleFlash.flashOnce()
  }

  function toggleFlashlight() {
    if (!player.flashlight) {
      scene.events.emit(Event.FLASHLIGHT_MISSING)
      return
    }

    if (puppet.getWeapon() === PlayerWeapon.KNIFE) {
      toggleKnife()
      return
    }

    if (player.flashlight.isOff) {
      player.flashlight.turnOn()
    } else {
      player.flashlight.turnOff()
    }
  }

  function toggleKnife() {
    if (puppet.getWeapon() === PlayerWeapon.KNIFE && player.flashlight) {
      puppet.selectWeapon(PlayerWeapon.FLASHLIGHT)
      player.flashlight.turnOn()
    } else {
      player.flashlight?.turnOff()
      puppet.selectWeapon(PlayerWeapon.KNIFE)
    }
  }

  function nextWeaponMode(weapon: PlayerWeapon, currentMode: PlayerWeaponMode): PlayerWeaponMode {
    if (weapon !== PlayerWeapon.RIFLE) return PlayerWeaponMode.SINGLE
    if (currentMode === PlayerWeaponMode.SINGLE) return PlayerWeaponMode.BURST
    if (currentMode === PlayerWeaponMode.BURST) return PlayerWeaponMode.AUTO
    if (currentMode === PlayerWeaponMode.AUTO) return PlayerWeaponMode.SINGLE
    return PlayerWeaponMode.SINGLE
  }

  function distanceTo(item: Phaser.GameObjects.GameObject) {
    const itemBody = item.body as Phaser.Physics.Arcade.Body
    const distance = Phaser.Math.Distance.Between(player.x, player.y, itemBody.x, itemBody.y)
    const angle = Phaser.Math.Angle.Between(player.x, player.y, itemBody.x, itemBody.y)
    const degreesAbs = Phaser.Math.RadToDeg(Math.abs(angle - player.rotation))
    return { distance, angle: degreesAbs }
  }

  function isWithinReach(item: Phaser.GameObjects.GameObject) {
    const { distance, angle } = distanceTo(item)
    return distance <= config.player.reach && angle <= config.player.reachAngle
  }

  function isAlmostWithinReach(item: Phaser.GameObjects.GameObject) {
    const { distance, angle } = distanceTo(item)
    return (
      distance > config.player.reach &&
      distance <= config.player.reachAlmost &&
      angle <= config.player.reachAngle
    )
  }

  function takeItem(fn: () => Phaser.GameObjects.GameObject | undefined) {
    let listener: spine.AnimationStateListener2
    listener = createSpineListener({
      complete: () => {
        puppet.spine.state.removeListener(listener)
        const item = fn()
        puppet.interactTake()
        if (item) {
          scene.events.emit(Event.OBJECT_PICKED_UP, item)
        }
      },
    })
    puppet.spine.state.addListener(listener)
    puppet.interactReach()
  }

  function almostTakeItem() {
    let listener: spine.AnimationStateListener2
    listener = createSpineListener({
      complete: () => {
        puppet.spine.state.removeListener(listener)
        scene.time.delayedCall(150, () => puppet.returnToCurrentState())
      },
    })
    puppet.spine.state.addListener(listener)
    puppet.interactReach()
  }

  function ensureShadow() {
    if (shadowAdded) return
    shadowAdded = true
    puppet.postFX.add(shadow)
  }

  function removeShadow() {
    puppet.postFX.remove(shadow)
    shadowAdded = false
  }

  function updateMatterSpotPosition() {
    matterSpot.angle = player.angle
    matterSpot.position.x = player.x
    matterSpot.position.y = player.y
  }

  function updateLightAwareShapePosition() {
    if (lightAwareShape) {
      lightAwareShape.x = player.x
      lightAwareShape.y = player.y
    }
  }

  function updateCasingEmitterPosition() {
    const weapon = puppet.getWeapon()
    const adjustByWeapon: Record<PlayerWeapon, { length: number; angle: number }> = {
      [PlayerWeapon.HANDGUN]: { length: 80, angle: 35 },
      [PlayerWeapon.SHOTGUN]: { length: 70, angle: 30 },
      [PlayerWeapon.RIFLE]: { length: 60, angle: 35 },
      [PlayerWeapon.KNIFE]: { length: 0, angle: 0 },
      [PlayerWeapon.FLASHLIGHT]: { length: 0, angle: 0 },
    }

    const { length, angle } = adjustByWeapon[weapon]
    casingEmitter.setEmitterPosition(body.center, length, player.angle + angle)
    casingEmitter.setEmitterAngle(player.angle)
  }

  function updateMuzzleFlashPosition() {
    const weapon = puppet.getWeapon()
    const scaleByWeapon: Record<PlayerWeapon, { scale: number }> = {
      [PlayerWeapon.HANDGUN]: { scale: 0.1 },
      [PlayerWeapon.SHOTGUN]: { scale: 0.15 },
      [PlayerWeapon.RIFLE]: { scale: 0.13 },
      [PlayerWeapon.KNIFE]: { scale: 0 },
      [PlayerWeapon.FLASHLIGHT]: { scale: 0 },
    }

    const scale = scaleByWeapon[weapon].scale
    const bone = getBonePosition('muzzle')
    muzzleFlash.setScale(scale).setPosition(bone.x, bone.y)
    muzzleFlash.setAngle(player.angle)
  }

  function updateFlashlightPosition() {
    if (!player.flashlight) return

    const weapon = puppet.getWeapon()
    const attachedToByWeapon: Record<
      PlayerWeapon,
      { frontBone: string; rearBone: string; shift: number }
    > = {
      [PlayerWeapon.HANDGUN]: { frontBone: 'muzzle', rearBone: 'weapon', shift: 10 },
      [PlayerWeapon.SHOTGUN]: { frontBone: 'muzzle', rearBone: 'weapon', shift: 60 },
      [PlayerWeapon.RIFLE]: { frontBone: 'muzzle', rearBone: 'weapon', shift: 60 },
      [PlayerWeapon.KNIFE]: { frontBone: 'head', rearBone: 'head', shift: 0 },
      [PlayerWeapon.FLASHLIGHT]: { frontBone: 'muzzle', rearBone: 'weapon', shift: 0 },
    }

    const attachedTo = attachedToByWeapon[weapon]
    const frontBone = getBonePosition(attachedTo.frontBone)
    const rearBone = getBonePosition(attachedTo.rearBone)

    const flashlightOffset = new Phaser.Math.Vector2(
      frontBone.x - rearBone.x,
      frontBone.y - rearBone.y,
    ).setLength(attachedTo.shift)

    const weaponAngle =
      attachedTo.frontBone === attachedTo.rearBone
        ? player.rotation
        : Phaser.Math.Angle.Between(rearBone.x, rearBone.y, frontBone.x, frontBone.y)

    player.flashlight
      .setPosition(flashlightOffset.x + rearBone.x, flashlightOffset.y + rearBone.y)
      .setAngle(Phaser.Math.RadToDeg(weaponAngle))
  }

  function getBonePosition(boneName: string): Phaser.Math.Vector2 {
    const bone = puppet.spine.skeleton.findBone(boneName)

    if (gameScene.isPlayerMode) {
      const boneLocalX = bone.worldX - puppet.spine.skeleton.x
      const boneLocalY = bone.worldY - puppet.spine.skeleton.y

      const distance = Math.sqrt(boneLocalX * boneLocalX + boneLocalY * boneLocalY)
      const localAngle = Math.atan2(-boneLocalY, boneLocalX)
      const worldAngle = localAngle + player.rotation + Math.PI / 2

      return new Phaser.Math.Vector2(
        body.center.x + Math.cos(worldAngle) * distance,
        body.center.y + Math.sin(worldAngle) * distance,
      )
    }

    const boneInnerPosition = new Phaser.Math.Vector2(
      bone.worldX + player.x - puppet.spine.skeleton.x,
      bone.worldY + player.y - puppet.spine.skeleton.y,
    )

    const distance = Phaser.Math.Distance.Between(
      body.center.x,
      body.center.y,
      boneInnerPosition.x,
      boneInnerPosition.y,
    )
    const angle = Phaser.Math.Angle.Between(
      body.center.x,
      body.center.y,
      boneInnerPosition.x,
      boneInnerPosition.y,
    )

    return new Phaser.Math.Vector2(body.center.x, body.center.y)
      .setLength(distance)
      .setAngle(-angle)
      .add(body.center)
  }

  function getCasingName(): string | undefined {
    const weapon = puppet.getWeapon()
    const casingMap: Record<PlayerWeapon, string | undefined> = {
      [PlayerWeapon.HANDGUN]: '8mm-bullet-case',
      [PlayerWeapon.SHOTGUN]: '12gauge-bullet-case',
      [PlayerWeapon.RIFLE]: 'ar-bullet-case',
      [PlayerWeapon.KNIFE]: undefined,
      [PlayerWeapon.FLASHLIGHT]: undefined,
    }
    return casingMap[weapon]
  }

  scene.time.delayedCall(0, () => {
    scene.events.emit('debuggable-added', player)
  })

  return player
}
