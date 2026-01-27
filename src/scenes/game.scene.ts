import PhaserRaycaster from 'phaser-raycaster'
import config from '../game-config'
import PlayerInputs from '../controls/player-inputs'
import Pointer from '../objects/pointer.object'
import { Event } from './event'
import {
  Projection,
  StaticMatterProjectionRectangle,
  StaticMatterProjectionCircle,
} from '../objects/static-matter-projection.object'
import { WeatherConditions } from '../objects/weather.object'

// Core imports for new architecture
import '../core/display-object.ext'
import { setGlobals, setPlayer, setUIScene, clearGlobals } from '../core/globals'
import { runStepCallbacks, clearStepCallbacks } from '../core/display-object.ext'
import {
  clearAllInstances,
  Instances,
  MIXIN_LIGHT_AWARE,
  MIXIN_LIGHT_SOURCE,
} from '../core/instances'
import { getTintColorShift } from '../mixins/light-aware.mixin'

// New factory functions
import { createPlayer, PlayerObject } from '../objects/player.object'
import { createFlashlight, FlashlightObject } from '../objects/flashlight.object'
import { createEmergencyLight, EmergencyLightObject } from '../objects/emergency-light.object'
import { createBarrel, BarrelObject } from '../objects/barrel.object'

export function isGameScene(scene: object): scene is GameScene {
  return typeof scene === 'object' && 'getDebugInfo' in scene
}

type CameraMode = 'map' | 'player'

export default class GameScene extends Phaser.Scene {
  private _inputs: PlayerInputs
  private _isDark: boolean
  private _lightSceneGraphics: Phaser.GameObjects.Graphics
  private _lightShadowSceneGraphics: Phaser.GameObjects.Graphics
  private _cameraMode: CameraMode = 'map'
  private _playerAimAngle: number = 0
  private _pointerDistance: number = 100
  private _cameraRotation: number = 0
  private _targetCameraRotation: number = 0
  private _isTransitioning: boolean = false

  private raycasterPlugin: PhaserRaycaster
  private fieldUnderLight: Phaser.GameObjects.TileSprite
  private fieldUnderLightShadow: Phaser.GameObjects.TileSprite
  private field: Phaser.GameObjects.TileSprite
  private pointer: Pointer
  private player: PlayerObject
  private objects: Phaser.GameObjects.GameObject[] = []
  private obstacles: Projection[] = []
  private redLight: { light: EmergencyLightObject; isOn: boolean; enabled: boolean }
  private weather: WeatherConditions

  public get isDark(): boolean {
    return this._isDark
  }

  public get isPlayerMode(): boolean {
    return this._cameraMode === 'player'
  }

  public get lightSceneGraphics(): Phaser.GameObjects.Graphics {
    if (this._lightSceneGraphics.postFX.list.length === 0) {
      this._lightSceneGraphics.setPipeline('Light2D')
    }
    return this._lightSceneGraphics
  }

  public get lightShadowSceneGraphics(): Phaser.GameObjects.Graphics {
    if (this._lightShadowSceneGraphics.postFX.list.length === 0) {
      this._lightShadowSceneGraphics.setPipeline('Light2D')
    }
    return this._lightShadowSceneGraphics
  }

  public get inputs(): PlayerInputs {
    return this._inputs
  }

  constructor() {
    super({
      key: 'GameScene',
      physics: {
        arcade: {},
        matter: {},
      },
    })
  }

  public closestObject(): Phaser.GameObjects.GameObject {
    return this.physics.closest(
      this.player.puppet,
      this.physics.world.bodies.entries.filter(
        (body) => this.objects.indexOf(body.gameObject) > -1,
      ),
    )?.gameObject
  }

  private removeFromObjects(item: Phaser.GameObjects.GameObject): void {
    const index = this.objects.indexOf(item)
    if (index > -1) {
      this.objects.splice(index, 1)
    }
  }

  create() {
    const { width, height } = { width: 1600, height: 1200 }

    this.physics.world.setBounds(0, 0, width, height)
    this.matter.world.setBounds(0, 0, width, height)

    this._inputs = new PlayerInputs(this.input)
    setGlobals(this)

    this.scene.launch('UIScene')
    const ui = this.scene.get('UIScene')
    setUIScene(ui)

    this.fieldUnderLight = this.add
      .tileSprite(800, 600, width, height, 'background')
      .setDepth(config.depths.background - 2)
    this.fieldUnderLight.setPipeline('Light2D')

    this.fieldUnderLightShadow = this.add
      .tileSprite(800, 600, width, height, 'background')
      .setDepth(config.depths.background - 1)
      .setTint(config.colors.darkenShadowTintColor)
    this.fieldUnderLightShadow.setPipeline('Light2D')

    this.field = this.add
      .tileSprite(800, 600, width, height, 'background')
      .setDepth(config.depths.background)
    this.field.setPipeline('Light2D')

    this.lights.enable()
    this.lights.setAmbientColor(0xffffff)

    this._lightSceneGraphics = this.add.graphics().setName('lightSceneGraphics')
    this._lightShadowSceneGraphics = this.add.graphics().setName('lightShadowSceneGraphics')

    this.field.setMask(this._lightShadowSceneGraphics.createGeometryMask().setInvertAlpha(true))

    this.fieldUnderLightShadow.setMask(
      this._lightSceneGraphics.createGeometryMask().setInvertAlpha(true),
    )

    // Create barrels using new factory functions
    const barrel = createBarrel(this, 970, 400, 'barrel-damaged')
      .setScale(0.3)
      .setOrigin(0.5, 0.5)
      .setAngle(25)

    barrel.setLightAwareShape(
      barrel.createPolygon([
        { x: 3, y: 36 },
        { x: 211, y: 11 },
        { x: 310, y: 13 },
        { x: 440, y: 18 },
        { x: 518, y: 41 },
        { x: 625, y: 31 },
        { x: 629, y: 235 },
        { x: 592, y: 428 },
        { x: 496, y: 412 },
        { x: 444, y: 422 },
        { x: 404, y: 406 },
        { x: 390, y: 369 },
        { x: 320, y: 340 },
        { x: 271, y: 380 },
        { x: 209, y: 409 },
        { x: 81, y: 432 },
        { x: 32, y: 274 },
      ]),
    )

    const barrel2 = createBarrel(this, 770, 350, 'barrel')
      .setScale(0.3)
      .setCircle(80)
      .setAngle(-15)
      .setOrigin(0.5, 0.5)

    barrel2.setLightAwareShape(barrel2.createCircle(73))

    const barrel3 = createBarrel(this, 900, 220, 'barrel-damaged-2')
      .setScale(0.3)
      .setCircle(75)
      .setAngle(165)
      .setOrigin(0.5, 0.5)

    barrel3.setLightAwareShape(barrel3.createCircle(73))

    this.obstacles.push(new StaticMatterProjectionRectangle(this, barrel))
    this.obstacles.push(new StaticMatterProjectionCircle(this, barrel2, 75))
    this.obstacles.push(new StaticMatterProjectionCircle(this, barrel3, 70))

    // Create flashlight using new factory function
    const flashlight = createFlashlight(this, 820, 360, this.createRaycaster()).setAngle(-45)
    this.objects.push(flashlight, barrel, barrel2)

    // Create player using new factory function
    this.player = createPlayer(this, 800, 600, this.createRaycaster())
    setPlayer(this.player)

    this.pointer = new Pointer(this, 800, 500)
    this.weather = new WeatherConditions(this, this.player)

    // Create emergency light using new factory function
    const emergencyLight = createEmergencyLight(this, 10, 200, this.createRaycaster()).setAngle(90)
    emergencyLight.mapLightAwareObject(this.player)

    this.redLight = {
      light: emergencyLight,
      isOn: false,
      enabled: false,
    }

    this.time.addEvent({
      delay: 1000,
      callback: () => (this.redLight.isOn = !this.redLight.isOn),
      loop: true,
    })

    this.lighten()
    this.cameras.main.zoom = 1

    this.game.canvas.addEventListener('mousedown', () => {
      this.game.input.mouse.requestPointerLock()
    })

    this.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      function (pointer: Phaser.Input.Pointer) {
        if (!this.input.mouse.locked) return

        if (this._cameraMode === 'map') {
          this.pointer.x += pointer.movementX
          this.pointer.y += pointer.movementY
        } else {
          const sensitivity = 0.003
          this._playerAimAngle += pointer.movementX * sensitivity
          this._targetCameraRotation = -this._playerAimAngle - Math.PI / 2
          if (this._isTransitioning) {
            this._cameraRotation = this._targetCameraRotation
            this._isTransitioning = false
          }
          const maxDistance = Math.min(
            this.cameras.main.width,
            this.cameras.main.height,
          ) / 2
          this._pointerDistance = Phaser.Math.Clamp(
            this._pointerDistance - pointer.movementY,
            50,
            maxDistance,
          )
        }
      },
      this,
    )

    this.events.on(Event.FLASHLIGHT_MISSING, () => {
      console.error('Flashlight is missing')
    })

    this.events.on(Event.OBJECT_PICKED_UP, (item: Phaser.GameObjects.GameObject) => {
      console.info('Picked up', item.name)
      this.removeFromObjects(item)
    })

    this.events.on(Event.UNKNOWN_OBJECT, (item: Phaser.GameObjects.GameObject) => {
      console.error('Unknown object', item.name)
    })

    this.events.on(Event.NO_OBJECT_IN_RANGE, () => {
      console.error('No object in range')
    })

    this.events.on(Event.OBJECT_TOO_FAR, (item: Phaser.GameObjects.GameObject) => {
      console.error(`${item.name} is too far`)
    })

    this.events.on(Event.OBJECT_STILL_TOO_FAR, (item: Phaser.GameObjects.GameObject) => {
      console.error(`Can't reach this damn ${item.name}. It is still too far`)
    })

    this.events.on(Event.INTERACT_WITH_OBJECT, () => {
      const item = this.closestObject()
      if (item) {
        this.player.interactWithObject(item)
      } else {
        this.events.emit(Event.NO_OBJECT_IN_RANGE)
      }
    })

    this.events.on(Phaser.Scenes.Events.POST_UPDATE, () => {
      this.player?.postUpdate()

      if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.zero)) {
        if (this.isDark) {
          this.lighten()
        } else {
          this.darken()
        }
      }

      if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.nine)) {
        this.redLight.enabled = !this.redLight.enabled
      }

      if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.eight)) {
        this.weather.toggle()
      }

      if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.F8)) {
        this.toggleCameraMode()
      }
    })

    this.events.on(Phaser.Scenes.Events.PRE_RENDER, () => {
      // Reset light effects using new mixin system
      for (const obj of Instances(MIXIN_LIGHT_AWARE)) {
        obj.onLightOverReset()
      }
      this.player?.onLightOverReset()

      this.lightShadowSceneGraphics.clear()
      this.lightSceneGraphics.clear()

      if (this.redLight?.enabled) {
        if (this.redLight.isOn) {
          this.redLight.light.turnOn()
        } else {
          this.redLight.light.turnOff()
        }
      }

      // Emit light from all light sources using new mixin system
      for (const source of Instances(MIXIN_LIGHT_SOURCE)) {
        if (source.isLightEnabled) {
          source.emitLight()
        }
      }
    })
  }

  public createRaycaster(): Raycaster {
    return this.raycasterPlugin.createRaycaster()
  }

  public getDebugInfo(): object {
    return {
      cameraMode: this._cameraMode,
      weather: this.weather.getDebugInfo(),
    }
  }

  private toggleCameraMode() {
    if (this._cameraMode === 'map') {
      this._cameraMode = 'player'
      this._playerAimAngle = this.player.rotation
      this._pointerDistance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.pointer.x,
        this.pointer.y,
      )
      this._targetCameraRotation = -this._playerAimAngle - Math.PI / 2
    } else {
      this._cameraMode = 'map'
      this._targetCameraRotation = 0
    }
    this._isTransitioning = true
  }

  darken() {
    this._isDark = true
    this.lightSceneGraphics.clear()
    this.lightShadowSceneGraphics.clear()

    // Clear all light source graphics (removes day-mode light cones)
    for (const source of Instances(MIXIN_LIGHT_SOURCE)) {
      source.lightGraphics.clear()
    }

    this.field.setTint(config.colors.darkenTintColor)

    for (const obj of Instances(MIXIN_LIGHT_AWARE)) {
      obj.onDarken()
    }

    this.player?.onDarken()
  }

  lighten() {
    this._isDark = false
    this.lightSceneGraphics.clear()
    this.lightShadowSceneGraphics.clear()

    // Clear all light source graphics (removes night-mode light effects)
    for (const source of Instances(MIXIN_LIGHT_SOURCE)) {
      source.lightGraphics.clear()
    }

    this.field.setTint()

    for (const obj of Instances(MIXIN_LIGHT_AWARE)) {
      obj.onLighten()
    }

    this.player?.onLighten()
  }

  reactToLightning(progress: number) {
    if (!this.isDark) {
      return
    }

    this.field.setTint(getTintColorShift(0xffffff, progress))

    for (const obj of Instances(MIXIN_LIGHT_AWARE)) {
      obj.onLightningOver(progress)
    }

    this.player?.onLightningOver(progress)
  }

  update(_time: number, _delta: number) {
    runStepCallbacks()

    this.player?.preUpdate()

    if (this.obstacles.length > 0) {
      const obstacles = this.obstacles as unknown as Phaser.Physics.Arcade.Group[]
      this.physics.world.collide(this.player.puppet, obstacles)
    }

    if (this._cameraMode === 'map') {
      this.player.rotation = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        this.pointer.x,
        this.pointer.y,
      )
    } else {
      this.pointer.x = this.player.x + Math.cos(this._playerAimAngle) * this._pointerDistance
      this.pointer.y = this.player.y + Math.sin(this._playerAimAngle) * this._pointerDistance
      this._targetCameraRotation = -this._playerAimAngle - Math.PI / 2
      this.player.rotation = this._playerAimAngle
    }

    if (this._isTransitioning) {
      const lerpSpeed = 0.1
      this._cameraRotation = Phaser.Math.Linear(
        this._cameraRotation,
        this._targetCameraRotation,
        lerpSpeed,
      )
      if (Math.abs(this._cameraRotation - this._targetCameraRotation) < 0.001) {
        this._cameraRotation = this._targetCameraRotation
        this._isTransitioning = false
      }
    } else {
      this._cameraRotation = this._targetCameraRotation
    }
    this.cameras.main.setRotation(this._cameraRotation)

    this.cameras.main.startFollow(this.player.puppet)

    this.pointer.update(this.player)

    this.constrainVelocity(this.player, 500)
    this.constrainPointer(this.pointer)
  }

  constrainVelocity(player: PlayerObject, maxVelocity: number) {
    if (!player || !player.body) {
      return
    }

    let vx = player.body.velocity.x
    let vy = player.body.velocity.y
    let currVelocitySqr = vx * vx + vy * vy

    if (currVelocitySqr > maxVelocity * maxVelocity) {
      let angle = Math.atan2(vy, vx)
      vx = Math.cos(angle) * maxVelocity
      vy = Math.sin(angle) * maxVelocity
      player.body.velocity.x = vx
      player.body.velocity.y = vy
    }
  }

  constrainPointer(pointer: Pointer) {
    if (this.cameras.main.worldView.right <= 0 || this.cameras.main.worldView.bottom <= 0) {
      return
    }

    if (pointer.x < this.cameras.main.worldView.x) {
      pointer.x = this.cameras.main.worldView.x
    } else if (pointer.x > this.cameras.main.worldView.right) {
      pointer.x = this.cameras.main.worldView.right
    }

    if (pointer.y < this.cameras.main.worldView.y) {
      pointer.y = this.cameras.main.worldView.y
    } else if (pointer.y > this.cameras.main.worldView.bottom) {
      pointer.y = this.cameras.main.worldView.bottom
    }
  }

  shutdown() {
    clearStepCallbacks()
    clearAllInstances()
    clearGlobals()
  }
}
