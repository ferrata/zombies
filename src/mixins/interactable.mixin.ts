export interface InteractableConfig {
  onInteract?: () => void;
  range?: number;
}

export interface InteractableProps {
  interactRange: number;
  onInteract(): void;
  canInteract(): boolean;
}

export function isInteractable(obj: any): obj is InteractableProps {
  return obj != null && "onInteract" in obj && "canInteract" in obj;
}

export function interactableMixin<
  T extends Phaser.GameObjects.GameObject & { x: number; y: number }
>(obj: T, cfg?: InteractableConfig): T & InteractableProps {
  const result = obj as T & InteractableProps;

  result.interactRange = cfg?.range ?? 150;

  result.onInteract = cfg?.onInteract ?? function () {};

  result.canInteract = function () {
    return this.active;
  };

  result.track(interactableMixin);

  return result;
}
