import "phaser";
import { StepOrder } from "./step-order";
import { registerInstance, unregisterFromAll } from "./instances";

interface StepCallback {
  fn: (obj: any) => void;
  order: StepOrder;
  obj: any;
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
      mixin<T extends object>(
        mixinFn: (obj: this, config: any) => this & T,
        config?: any
      ): this & T;
      merge<T extends object>(props: T): this & T;
      step(fn: (obj: this) => void, order?: StepOrder): this;
      track(mixinFn: Function): this;
      _trackedMixins?: Set<Function>;
    }
  }
}

const originalDestroy = Phaser.GameObjects.GameObject.prototype.destroy;

Phaser.GameObjects.GameObject.prototype.mixin = function <T extends object>(
  mixinFn: (obj: any, config: any) => any,
  config?: any
): any {
  return mixinFn(this, config);
};

Phaser.GameObjects.GameObject.prototype.merge = function <T extends object>(
  props: T
): any {
  Object.assign(this, props);
  return this;
};

Phaser.GameObjects.GameObject.prototype.step = function (
  fn: (obj: any) => void,
  order: StepOrder = StepOrder.Default
): any {
  stepCallbacks.push({ fn, order, obj: this });
  stepCallbacksDirty = true;
  return this;
};

Phaser.GameObjects.GameObject.prototype.track = function (
  mixinFn: Function
): any {
  if (!this._trackedMixins) {
    this._trackedMixins = new Set();
  }
  this._trackedMixins.add(mixinFn);
  registerInstance(mixinFn, this);
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
      mixin<T extends object>(
        mixinFn: (obj: this, config: any) => this & T,
        config?: any
      ): this & T;
      merge<T extends object>(props: T): this & T;
      step(fn: (obj: this) => void, order?: StepOrder): this;
      track(mixinFn: Function): this;
      _trackedMixins?: Set<Function>;
    }
  }
}
