import config from '../game-config'
import { GameSceneInterface } from '../types/game-scene'
import { MIXIN_LIGHT_AWARE } from '../core/instances'

export type LightAware = {
  lightShape: LightAwareShape
  onLighten(): void
  onDarken(): void
  onLightOverReset(): void
  onLightOver(ray: Raycaster.Ray, intersections: Phaser.Geom.Point[], force: boolean): void
  onLightningOver(progress: number): void
  setLightAwareShape(shape: LightAwareShape): void
  getLightAwareShape(): LightAwareShape
}

export type LightAwareShape =
  | (Phaser.GameObjects.Shape & { owner?: LightAware & { body?: unknown } })
  | null

export function getColorShift(startColor: number, endColor: number, shift: number): number {
  const tintColor = Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(startColor),
    Phaser.Display.Color.ValueToColor(endColor),
    100,
    Math.round(shift * 100),
  )
  return Phaser.Display.Color.GetColor(tintColor.r, tintColor.g, tintColor.b)
}

export function getTintColorShift(startColor: number, shift: number): number {
  return getColorShift(startColor, config.colors.darkenTintColor, shift)
}

export function isLightAware(obj: unknown): obj is LightAware {
  return obj != null && typeof obj === 'object' && 'onLighten' in obj && 'onDarken' in obj
}

export function lightAwareMixin<
  T extends Phaser.GameObjects.GameObject & {
    postFX?: Phaser.GameObjects.Components.FX
    setTint?: (color?: number) => unknown
    setDepth?: (depth: number) => unknown
    x: number
    y: number
    width?: number
    height?: number
    originX?: number
    originY?: number
    scaleX?: number
    scaleY?: number
    angle?: number
  },
>(obj: T, cfg?: { shape?: LightAwareShape; depth?: number }) {
  const result = obj as T &
    LightAware & {
      _lightAwareShadow: Phaser.FX.Shadow | null
      _textureUnderLight: Phaser.GameObjects.RenderTexture | null
      _textureUnderLightMask: Phaser.GameObjects.Graphics | null
    }

  const depth = cfg?.depth ?? config.depths.lightAwareShape

  if (result.setDepth) {
    result.setDepth(depth)
  }

  result._lightAwareShadow = null
  result._textureUnderLight = null
  result._textureUnderLightMask = null
  result.lightShape = cfg?.shape ?? null

  if (result.lightShape) {
    result.lightShape.owner = result
    result.lightShape.setDepth(depth)
  }

  result.onLighten = function () {
    if (!this.postFX) return
    this._lightAwareShadow ??= this.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3)
    this.postFX.clear()
    this.postFX.add(this._lightAwareShadow)
    this.setTint?.()
  }

  result.onDarken = function () {
    if (!this.postFX) return
    this.postFX.clear()
    this._lightAwareShadow = null
    this.setTint?.(config.colors.darkenTintColor)
  }

  result.onLightOverReset = function () {
    this._textureUnderLightMask?.clear()
    if (this._textureUnderLight) {
      this._textureUnderLight.setCrop(0, 0, 0, 0)
      this._textureUnderLight.clearMask()
    }
  }

  result.onLightOver = function (
    ray: Raycaster.Ray,
    intersections: Phaser.Geom.Point[],
    force: boolean,
  ) {
    if (!this.lightShape) return
    const gameScene = this.scene as GameSceneInterface | undefined
    if (gameScene && !gameScene.isDark) return

    const owner = this.lightShape.owner
    const ownerBody = (owner as { body?: MatterJS.BodyType } | undefined)?.body
    if (!ownerBody) return

    const effectiveIntersections = intersections.filter((intersection) => {
      return this.scene.matter.query.point([ownerBody], intersection).length > 0
    })

    const w = this.width ?? 100
    const h = this.height ?? 100

    if (!effectiveIntersections.length && force) {
      if (this._textureUnderLightMask && this._textureUnderLight) {
        this._textureUnderLightMask.fillRect(this.x - w / 2, this.y - h / 2, this.x + w, this.y + h)
        this._textureUnderLight
          .setCrop(0, 0, w, h)
          .setMask(this._textureUnderLightMask.createGeometryMask())
      }
      return
    }

    if (effectiveIntersections.length > 1 && this._textureUnderLightMask) {
      const first = effectiveIntersections[0]
      const last = effectiveIntersections[effectiveIntersections.length - 1]
      const firstAngle = Phaser.Geom.Line.Angle(
        new Phaser.Geom.Line(ray.origin.x, ray.origin.y, first.x, first.y),
      )
      const lastAngle = Phaser.Geom.Line.Angle(
        new Phaser.Geom.Line(ray.origin.x, ray.origin.y, last.x, last.y),
      )
      const boxSize = Math.max(this.scene.cameras.main.width, this.scene.cameras.main.height)

      const boxTopLeft = new Phaser.Math.Vector2(first.x, first.y)
        .setLength(boxSize)
        .setAngle(firstAngle - Math.PI / 128)
        .add(first)

      const boxTopRight = new Phaser.Math.Vector2(last.x, last.y)
        .setLength(boxSize)
        .setAngle(lastAngle + Math.PI / 128)
        .add(last)

      this._textureUnderLightMask.fillTriangle(
        ray.origin.x,
        ray.origin.y,
        boxTopLeft.x,
        boxTopLeft.y,
        boxTopRight.x,
        boxTopRight.y,
      )
    }

    if (this._textureUnderLight && this._textureUnderLightMask) {
      this._textureUnderLight
        .setCrop(0, 0, w, h)
        .setMask(this._textureUnderLightMask.createGeometryMask())
    }
  }

  result.onLightningOver = function (progress: number) {
    if (!this.postFX) return

    if (progress === 1) {
      this.postFX.clear()
      this._lightAwareShadow = null
    }

    if (progress < 1) {
      const color = getTintColorShift(0x000000, progress)
      if (!this._lightAwareShadow) {
        this._lightAwareShadow = this.postFX.addShadow(0, 0, 0.1, 0.3, color, 2, 3)
        this.postFX.clear()
        this.postFX.add(this._lightAwareShadow)
      }
      this._lightAwareShadow.color = color
    }

    this.setTint?.(getTintColorShift(0xffffff, progress))
  }

  // Alias for backwards compatibility with old isLightAware() check (has a typo)
  ;(result as unknown as { onLighningtOver: typeof result.onLightningOver }).onLighningtOver =
    result.onLightningOver

  result.setLightAwareShape = function (shape: LightAwareShape) {
    const image = this as unknown as Phaser.GameObjects.Image
    const w = this.width ?? 100
    const h = this.height ?? 100

    if (image.texture && image.frame) {
      this._textureUnderLight = this.scene.add
        .renderTexture(this.x, this.y, w, h)
        .drawFrame(image.texture.key, image.frame.name)
        .setOrigin(this.originX ?? 0.5, this.originY ?? 0.5)
        .setScale(this.scaleX ?? 1, this.scaleY ?? 1)
        .setAngle(this.angle ?? 0)
        .setCrop(0, 0, 0, 0)
        .setDepth(depth + 1)
      this._textureUnderLight.setPipeline('Light2D')
    }

    this._textureUnderLightMask = this.scene.make.graphics().setDepth(depth).fillStyle(0xffffff, 1)

    this.lightShape = shape
    if (shape) {
      const namedObj = this as { name?: string }
      shape.setName?.(`${namedObj.name ?? 'object'}-shape`)
      shape.setDepth(depth)
      shape.owner = this
    }
  }

  result.getLightAwareShape = function () {
    return this.lightShape
  }

  result.track(MIXIN_LIGHT_AWARE)

  return result
}
