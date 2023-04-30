export interface Debuggable {
  getDebugInfo(): object;
}

export function isDebuggable(object: any): object is Debuggable {
  return "getDebugInfo" in object;
}
