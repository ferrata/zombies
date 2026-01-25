import config from '../game-config'
import { Instances, MIXIN_LIGHT_AWARE, MIXIN_LIGHT_SOURCE } from '../core/instances'
import { LightAwareProps, isLightAware, LightAwareShape } from './light-aware.mixin'
import { GameSceneInterface } from '../types/game-scene'

export interface LightSourceConfig {
  emitOnDayLight: boolean
  lightColor: number
  lightAlpha: number
  collisionRange: number
  coneDeg: number
  coneRange: number
  closeRange: number
  forceLightOver: boolean
}

export interface LightSourceProps {
  lightConfig: LightSourceConfig
  lightRay: Raycaster.Ray | null
  lightGraphics: Phaser.GameObjects.Graphics
  lightRaycaster: Raycaster

  get isLightEnabled(): boolean
  enableLight(): void
  disableLight(): void
  emitLight(): void
  setLightOrigin(x: number, y: number): void
  setLightAngleDeg(angle: number): void
  mapLightAwareObject(obj: LightAwareProps): void
}

export function lightSourceMixin<
  T extends Phaser.GameObjects.GameObject & { x: number; y: number; name?: string },
>(obj: T, cfg: { raycaster: Raycaster; config: LightSourceConfig }): T & LightSourceProps {
  const result = obj as T & LightSourceProps

  result.lightConfig = cfg.config
  result.lightRaycaster = cfg.raycaster
  result.lightRay = null

  result.lightGraphics = obj.scene.add
    .graphics({ fillStyle: { color: cfg.config.lightColor, alpha: cfg.config.lightAlpha } })
    .setName(`${obj.name ?? 'light'}-graphics`)

  // Map existing light-aware objects
  const lightAwareShapes: Phaser.GameObjects.Shape[] = []
  for (const lightAwareObj of Instances(MIXIN_LIGHT_AWARE)) {
    const shape = lightAwareObj.getLightAwareShape()
    if (shape) lightAwareShapes.push(shape)
  }
  cfg.raycaster.mapGameObjects(lightAwareShapes)

  Object.defineProperty(result, 'isLightEnabled', {
    get() {
      return this.lightRay != null
    },
  })

  result.enableLight = function () {
    this.lightRay = this.lightRaycaster.createRay({
      collisionRange: this.lightConfig.collisionRange,
    })
    this.lightRay.autoSlice = true
  }

  result.disableLight = function () {
    this.lightGraphics.clear()
    this.lightRay?.destroy()
    this.lightRay = null
  }

  result.setLightOrigin = function (x: number, y: number) {
    if (this.lightRay) {
      this.lightRay.origin.x = x
      this.lightRay.origin.y = y
    }
  }

  result.setLightAngleDeg = function (angle: number) {
    this.lightRay?.setAngleDeg(angle)
  }

  result.mapLightAwareObject = function (lightAwareObj: LightAwareProps) {
    const shape = lightAwareObj.getLightAwareShape()
    if (shape) {
      this.lightRaycaster.mapGameObjects([shape])
    }
  }

  result.emitLight = function () {
    if (!this.lightRay) return

    const gameScene = this.scene as GameSceneInterface
    let mappedObjectUnderLight: LightAwareShape = null

    type MappedObject = Phaser.GameObjects.GameObject & {
      owner?: LightAwareProps & { body?: MatterJS.BodyType }
    }

    const mappedObjects = this.lightRaycaster.mappedObjects.filter((object: MappedObject) => {
      if (this.lightConfig.forceLightOver && object instanceof Phaser.GameObjects.Shape) {
        const ownerBody = (object as MappedObject).owner?.body
        if (
          ownerBody &&
          ownerBody.bounds &&
          this.scene.matter.intersectPoint(this.lightRay!.origin.x, this.lightRay!.origin.y, [
            ownerBody,
          ]).length > 0
        ) {
          mappedObjectUnderLight = object as LightAwareShape
          return false
        }
      }
      return true
    })

    const intersections = this.lightRay.castCone({ objects: mappedObjects })
    const initialIntersections = intersections.slice()
    intersections.push(this.lightRay.origin)

    if (!gameScene.isDark) {
      if (this.lightConfig.emitOnDayLight) {
        this.lightGraphics.clear().fillPoints(intersections)
      }
      return
    }

    const leftEdgePoint = new Phaser.Math.Vector2(this.lightRay.origin.x, this.lightRay.origin.y)
      .setLength(this.lightConfig.coneRange)
      .setAngle(this.lightRay.angle - this.lightRay.cone / 2)
      .add(this.lightRay.origin)

    gameScene.lightShadowSceneGraphics
      .fillStyle(0xffffff, 0)
      .beginPath()
      .moveTo(this.lightRay.origin.x, this.lightRay.origin.y)
      .lineTo(leftEdgePoint.x, leftEdgePoint.y)
      .arc(
        this.lightRay.origin.x,
        this.lightRay.origin.y,
        this.lightConfig.coneRange,
        this.lightRay.angle - this.lightRay.cone / 2,
        this.lightRay.angle + this.lightRay.cone / 2,
      )
      .lineTo(this.lightRay.origin.x, this.lightRay.origin.y)
      .fillPath()
      .fillPoints(intersections)

    gameScene.lightSceneGraphics.fillStyle(0xffffff, 0).fillPoints(intersections)
    gameScene.lightSceneGraphics
      .fillStyle(this.lightConfig.lightColor, this.lightConfig.lightAlpha)
      .fillPoints(intersections)

    type IntersectionPoint = Phaser.Geom.Point & { object?: MappedObject }
    const affectedObjects = initialIntersections.reduce(
      (acc: MappedObject[], intersection: IntersectionPoint) => {
        if (intersection.object && acc.indexOf(intersection.object) === -1) {
          acc.push(intersection.object)
        }
        return acc
      },
      [],
    )

    affectedObjects.forEach((object: MappedObject) => {
      const owner = object.owner
      if (owner && isLightAware(owner)) {
        owner.onLightOver(this.lightRay!, initialIntersections, false)
      }
    })

    if (mappedObjectUnderLight) {
      const owner = mappedObjectUnderLight.owner
      if (owner && isLightAware(owner)) {
        owner.onLightOver(this.lightRay!, initialIntersections, true)
      }
    }
  }

  result.track(MIXIN_LIGHT_SOURCE)

  return result
}
