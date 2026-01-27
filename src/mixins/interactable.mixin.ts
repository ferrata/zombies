import { MIXIN_INTERACTABLE } from '../core/instances'

export type Interactable = {
  interactRange: number
  onInteract(): void
  canInteract(): boolean
}

export function isInteractable(obj: unknown): obj is Interactable {
  return obj != null && typeof obj === 'object' && 'onInteract' in obj && 'canInteract' in obj
}

export function interactableMixin<
  T extends Phaser.GameObjects.GameObject & { x: number; y: number },
>(obj: T, cfg?: { onInteract?: () => void; range?: number }) {
  const result = obj as T & Interactable

  result.interactRange = cfg?.range ?? 150

  result.onInteract = cfg?.onInteract ?? function () {}

  result.canInteract = function () {
    return this.active
  }

  result.track(MIXIN_INTERACTABLE)

  return result
}
