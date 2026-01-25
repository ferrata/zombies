import "phaser";
import { StepOrder } from "./step-order";
import {
  registerInstance,
  unregisterFromAll,
  MIXIN_LIGHT_AWARE,
  MIXIN_LIGHT_SOURCE,
  MIXIN_POINTABLE,
  MIXIN_DEBUGGABLE,
  MIXIN_INTERACTABLE,
} from "./instances";

type MixinSymbol =
  | typeof MIXIN_LIGHT_AWARE
  | typeof MIXIN_LIGHT_SOURCE
  | typeof MIXIN_POINTABLE
  | typeof MIXIN_DEBUGGABLE
  | typeof MIXIN_INTERACTABLE;

interface StepCallback {
  fn: (obj: Phaser.GameObjects.GameObject) => void;
  order: StepOrder;
  obj: Phaser.GameObjects.GameObject;
}

const stepCallbacks: StepCallback[] = [];
let stepCallbacksDirty = false;

export function runStepCallbacks(): void {
  if (stepCallbacksDirty) {
    stepCallbacks.sort((a, b) => a.order - b.order);
    stepCallbacksDirty = false;
  }

  for (let i = stepCallbacks.length - 1; i >= 0; i--) {
    const callback = stepCallbacks[i];
    if (callback.obj.active === false || callback.obj.scene === null) {
      stepCallbacks.splice(i, 1);
    }
  }

  for (const callback of stepCallbacks) {
    callback.fn(callback.obj);
  }
}

export function clearStepCallbacks(): void {
  stepCallbacks.length = 0;
}

declare module "phaser" {
  namespace GameObjects {
    interface GameObject {
      mixin<T extends object, C = undefined>(
        mixinFn: (obj: this, config?: C) => this & T,
        config?: C
      ): this & T;
      merge<T extends object>(props: T): this & T;
      step(fn: (obj: this) => void, order?: StepOrder): this;
      track(mixinKey: symbol): this;
      _trackedMixins?: Set<symbol>;
    }
  }
}

const originalDestroy = Phaser.GameObjects.GameObject.prototype.destroy;

Phaser.GameObjects.GameObject.prototype.mixin = function <T extends object, C = undefined>(
  mixinFn: (obj: Phaser.GameObjects.GameObject, config?: C) => Phaser.GameObjects.GameObject & T,
  config?: C
): Phaser.GameObjects.GameObject & T {
  return mixinFn(this, config);
};

Phaser.GameObjects.GameObject.prototype.merge = function <T extends object>(
  props: T
): Phaser.GameObjects.GameObject & T {
  Object.assign(this, props);
  return this as Phaser.GameObjects.GameObject & T;
};

Phaser.GameObjects.GameObject.prototype.step = function (
  fn: (obj: Phaser.GameObjects.GameObject) => void,
  order: StepOrder = StepOrder.Default
): Phaser.GameObjects.GameObject {
  stepCallbacks.push({ fn, order, obj: this });
  stepCallbacksDirty = true;
  return this;
};

Phaser.GameObjects.GameObject.prototype.track = function (
  mixinKey: MixinSymbol
): Phaser.GameObjects.GameObject {
  if (!this._trackedMixins) {
    this._trackedMixins = new Set();
  }
  this._trackedMixins.add(mixinKey);
  registerInstance(mixinKey, this);
  return this;
};

Phaser.GameObjects.GameObject.prototype.destroy = function (
  fromScene?: boolean
): void {
  unregisterFromAll(this);

  for (let i = stepCallbacks.length - 1; i >= 0; i--) {
    if (stepCallbacks[i].obj === this) {
      stepCallbacks.splice(i, 1);
    }
  }

  originalDestroy.call(this, fromScene);
};

declare module "phaser" {
  namespace GameObjects {
    interface Container {
      mixin<T extends object, C = undefined>(
        mixinFn: (obj: this, config?: C) => this & T,
        config?: C
      ): this & T;
      merge<T extends object>(props: T): this & T;
      step(fn: (obj: this) => void, order?: StepOrder): this;
      track(mixinKey: symbol): this;
      _trackedMixins?: Set<symbol>;
    }
  }
}
