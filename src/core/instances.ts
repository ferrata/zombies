const instanceRegistry = new Map<Function, Set<any>>();

export function registerInstance(mixinFn: Function, obj: any): void {
  let instances = instanceRegistry.get(mixinFn);
  if (!instances) {
    instances = new Set();
    instanceRegistry.set(mixinFn, instances);
  }
  instances.add(obj);
}

export function unregisterInstance(mixinFn: Function, obj: any): void {
  const instances = instanceRegistry.get(mixinFn);
  if (instances) {
    instances.delete(obj);
  }
}

export function unregisterFromAll(obj: any): void {
  for (const instances of instanceRegistry.values()) {
    instances.delete(obj);
  }
}

export function Instances<T>(mixinFn: (obj: any, ...args: any[]) => T): Iterable<T> {
  const instances = instanceRegistry.get(mixinFn);
  return instances ? (instances as Iterable<T>) : [];
}

export function InstancesArray<T>(mixinFn: (obj: any, ...args: any[]) => T): T[] {
  const instances = instanceRegistry.get(mixinFn);
  return instances ? Array.from(instances) as T[] : [];
}

export function clearAllInstances(): void {
  instanceRegistry.clear();
}
