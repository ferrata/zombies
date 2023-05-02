export type Constructor = new (...args: any[]) => {};

export type GenericConstructor<T = {}> = new (...args: any[]) => T;
