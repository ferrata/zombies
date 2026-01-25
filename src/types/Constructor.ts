export type Constructor = new (...args: unknown[]) => object;

export type GenericConstructor<T = object> = new (...args: unknown[]) => T;
