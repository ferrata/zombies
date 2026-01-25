import { MIXIN_INTERACTABLE } from '../core/instances'

export interface InteractableConfig {
  onInteract?: () => void
  range?: number
}

export interface InteractableProps {
  interactRange: number
  onInteract(): void
  canInteract(): boolean
}

export function isInteractable(obj: unknown): obj is InteractableProps {
  return obj != null && typeof obj === 'object' && 'onInteract' in obj && 'canInteract' in obj
}

export function interactableMixin<
  T extends Phaser.GameObjects.GameObject & { x: number; y: number },
>(obj: T, cfg?: InteractableConfig): T & InteractableProps {
  const result = obj as T & InteractableProps

  result.interactRange = cfg?.range ?? 150

  result.onInteract = cfg?.onInteract ?? function () {}

  result.canInteract = function () {
    return this.active
  }

  result.track(MIXIN_INTERACTABLE)

  return result
}
