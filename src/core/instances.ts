import { LightAwarePropsBase, LightSourcePropsBase } from '../types/mixin-props'

// Registry uses symbols as keys for type safety
export const MIXIN_LIGHT_AWARE = Symbol('lightAware')
export const MIXIN_LIGHT_SOURCE = Symbol('lightSource')
export const MIXIN_POINTABLE = Symbol('pointable')
export const MIXIN_DEBUGGABLE = Symbol('debuggable')
export const MIXIN_INTERACTABLE = Symbol('interactable')

type MixinSymbol =
  | typeof MIXIN_LIGHT_AWARE
  | typeof MIXIN_LIGHT_SOURCE
  | typeof MIXIN_POINTABLE
  | typeof MIXIN_DEBUGGABLE
  | typeof MIXIN_INTERACTABLE

interface MixinTypeMap {
  [MIXIN_LIGHT_AWARE]: LightAwarePropsBase
  [MIXIN_LIGHT_SOURCE]: LightSourcePropsBase
}

const instanceRegistry = new Map<MixinSymbol, Set<Phaser.GameObjects.GameObject>>()

export function registerInstance(mixinKey: MixinSymbol, obj: Phaser.GameObjects.GameObject): void {
  let instances = instanceRegistry.get(mixinKey)
  if (!instances) {
    instances = new Set()
    instanceRegistry.set(mixinKey, instances)
  }
  instances.add(obj)
}

export function unregisterInstance(
  mixinKey: MixinSymbol,
  obj: Phaser.GameObjects.GameObject,
): void {
  const instances = instanceRegistry.get(mixinKey)
  if (instances) {
    instances.delete(obj)
  }
}

export function unregisterFromAll(obj: Phaser.GameObjects.GameObject): void {
  for (const instances of instanceRegistry.values()) {
    instances.delete(obj)
  }
}

export function Instances<K extends keyof MixinTypeMap>(mixinKey: K): Iterable<MixinTypeMap[K]> {
  const instances = instanceRegistry.get(mixinKey)
  return instances ? (instances as unknown as Set<MixinTypeMap[K]>) : []
}

export function InstancesArray<K extends keyof MixinTypeMap>(mixinKey: K): MixinTypeMap[K][] {
  const instances = instanceRegistry.get(mixinKey)
  return instances ? (Array.from(instances) as unknown as MixinTypeMap[K][]) : []
}

export function clearAllInstances(): void {
  instanceRegistry.clear()
}
