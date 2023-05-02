export interface IDebuggable {
  getDebugInfo(): object;
}

export function isDebuggable(object: any): object is IDebuggable {
  return "getDebugInfo" in object;
}
