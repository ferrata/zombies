// Partial listener - for use when casting to AnimationStateListener2
export interface SpineAnimationListener {
  complete?: () => void
  start?: () => void
  interrupt?: () => void
  end?: () => void
  dispose?: () => void
  event?: () => void
}

// Helper to create a partial listener that satisfies the full interface
export function createSpineListener(
  listener: SpineAnimationListener,
): spine.AnimationStateListener2 {
  return {
    start: listener.start ?? (() => {}),
    interrupt: listener.interrupt ?? (() => {}),
    end: listener.end ?? (() => {}),
    dispose: listener.dispose ?? (() => {}),
    complete: listener.complete ?? (() => {}),
    event: listener.event ?? (() => {}),
  }
}
