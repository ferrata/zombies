import config from '../game-config'
import { Label } from '../objects/label.object'
import { MIXIN_POINTABLE } from '../core/instances'
import { uiScene, scene } from '../core/globals'

export type Pointable = {
  showHighlight(): void
  removeHighlight(): void
  showInfo(): void
  removeInfo(): void
}

export function isPointable(obj: unknown): obj is Pointable {
  return (
    obj != null && typeof obj === 'object' && 'showHighlight' in obj && 'removeHighlight' in obj
  )
}

export function pointableMixin<
  T extends Phaser.GameObjects.GameObject & {
    postFX?: Phaser.GameObjects.Components.FX
    x: number
    y: number
    width?: number
    height?: number
    name?: string
  },
>(obj: T, cfg?: { info?: string }) {
  const result = obj as T & {
    pointableInfo: string | null
    showHighlight(): void
    removeHighlight(): void
    showInfo(): void
    removeInfo(): void
    setInfo(info: string): void
    hasInfo(): boolean
    getInfo(): string
    _highlight: Phaser.FX.Glow | null
    _label: Label | null
  }

  result.pointableInfo = cfg?.info ?? null
  result._highlight = null
  result._label = null

  result.showHighlight = function () {
    if (this.postFX) {
      this._highlight = this.postFX.addGlow(0xffffff, 3, 0.1)
    }
  }

  result.removeHighlight = function () {
    if (this.postFX && this._highlight) {
      this.postFX.remove(this._highlight)
      this._highlight = null
    }
  }

  result.showInfo = function () {
    if (this._label) return

    if (!this.hasInfo() || !uiScene || !scene) return

    this._label = new Label(uiScene, 0, 0, this.getInfo())
    this._label.setScrollFactor(0)
    uiScene.add.existing(this._label)
    this._label.setDepth(config.depths.pointableObject)

    const updatePosition = () => {
      if (!this._label || !scene) return
      const worldX = this.x + (this.width ?? 0) / 2 + 10
      const worldY = this.y - (this.height ?? 0) / 2 - 10
      const camera = scene.cameras.main

      const relX = worldX - camera.worldView.centerX
      const relY = worldY - camera.worldView.centerY
      const rot = (camera as unknown as { rotation: number }).rotation
      const cos = Math.cos(rot)
      const sin = Math.sin(rot)
      const rotatedX = relX * cos - relY * sin
      const rotatedY = relX * sin + relY * cos

      this._label.setPosition(
        camera.width / 2 + rotatedX * camera.zoom,
        camera.height / 2 + rotatedY * camera.zoom,
      )
    }

    updatePosition()
    uiScene.events.on(Phaser.Scenes.Events.UPDATE, updatePosition)
    this._label.once('destroy', () => {
      uiScene.events.off(Phaser.Scenes.Events.UPDATE, updatePosition)
    })
  }

  result.removeInfo = function () {
    if (this._label) {
      this._label.destroy()
      this._label = null
    }
  }

  result.setInfo = function (info: string) {
    this.pointableInfo = info
  }

  result.hasInfo = function () {
    return this.getInfo().length > 0
  }

  result.getInfo = function () {
    return this.pointableInfo ?? this.name ?? ''
  }

  result.track(MIXIN_POINTABLE)

  return result
}
