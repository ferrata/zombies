export interface Keys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
  R: Phaser.Input.Keyboard.Key;
  Z: Phaser.Input.Keyboard.Key;
  X: Phaser.Input.Keyboard.Key;
  C: Phaser.Input.Keyboard.Key;
  F: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  enter: Phaser.Input.Keyboard.Key;
  space: Phaser.Input.Keyboard.Key;
  comma: Phaser.Input.Keyboard.Key;
  period: Phaser.Input.Keyboard.Key;
  zero: Phaser.Input.Keyboard.Key;
  one: Phaser.Input.Keyboard.Key;
  two: Phaser.Input.Keyboard.Key;
  three: Phaser.Input.Keyboard.Key;
  four: Phaser.Input.Keyboard.Key;
  five: Phaser.Input.Keyboard.Key;
  six: Phaser.Input.Keyboard.Key;
  seven: Phaser.Input.Keyboard.Key;
  eight: Phaser.Input.Keyboard.Key;
  nine: Phaser.Input.Keyboard.Key;
  shift: Phaser.Input.Keyboard.Key;
}

export default class Inputs {
  private _input: Phaser.Input.InputPlugin;
  private _keys: Keys;
  private _padIndex = 0;

  constructor(input: Phaser.Input.InputPlugin) {
    this._input = input;
    this._keys = this._input.keyboard.addKeys(
      "W,A,S,D,Z,X,C,F,E,R,up,left,down,right,space,enter,comma,period,zero,one,two,three,four,five,six,seven,eight,nine,shift"
    ) as Keys;
  }

  public get left() {
    return this.keys.left.isDown || this.keys.A.isDown || this.padAxisH === -1;
  }

  public get right() {
    return this.keys.right.isDown || this.keys.D.isDown || this.padAxisH === 1;
  }

  public get up() {
    return this.keys.up.isDown || this.keys.W.isDown || this.padAxisV === -1;
  }

  public get down() {
    return this.keys.down.isDown || this.keys.S.isDown || this.padAxisV === 1;
  }

  public get space() {
    return this.keys.space.isDown;
  }

  public get keys(): Keys {
    return this._keys;
  }

  protected get padA() {
    return this.padButtons.some(
      (button) => button.index % 2 === 1 && button.value === 1
    );
  }

  protected get padB() {
    return this.padButtons.some(
      (button) => button.index % 2 === 0 && button.value === 1
    );
  }

  protected get padAxisH(): number {
    if (this.pad) {
      const [x] = this.pad.axes;

      return x.getValue();
    }

    return 0;
  }

  protected get padAxisV(): number {
    if (this.pad) {
      const [_, y] = this.pad.axes;

      return y.getValue();
    }

    return 0;
  }

  protected get padButtons() {
    return this.pad?.buttons ?? [];
  }

  protected get pad() {
    const pad = this._input.gamepad;

    if (pad.gamepads.length > this._padIndex) {
      return pad.gamepads[this._padIndex];
    }

    return;
  }
}
