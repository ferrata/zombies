export class Label extends Phaser.GameObjects.Container {
  private text: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Rectangle;

  DEFAULT_BACKGROUND_COLOR: string = "#000000";
  DEFAULT_BACKGROUND_ALPHA: number = 0.5;
  DEFAULT_TEXT_COLOR: string = "#ffffff";
  DEFAULT_STROKE_COLOR: string = "#aaaaaa";
  DEFAULT_STROKE_THICKNESS: number = 0.5;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string) {
    super(scene, x, y);

    this.text = this.scene.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: "14px",
      padding: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5,
      },
    });

    this.background = scene.add
      .rectangle(0, 0, this.text.width, this.text.height)
      .setOrigin(0, 0);

    this.add([this.background, this.text]);

    this.setBackgroundColor(
      this.DEFAULT_BACKGROUND_COLOR,
      this.DEFAULT_BACKGROUND_ALPHA
    ).setTextColor(this.DEFAULT_TEXT_COLOR);
    this.resize();
  }

  public setText(text: string): Label {
    this.text.setText(text);
    this.resize();
    return this;
  }

  public setBackgroundColor(color: string, alpha: number = 0.5): Label {
    const colorHex = Phaser.Display.Color.HexStringToColor(color).color;
    this.background.setFillStyle(colorHex, alpha);
    return this;
  }

  public setTextColor(
    color: string,
    strokeColor: string = this.DEFAULT_STROKE_COLOR,
    strokeThickness: number = this.DEFAULT_STROKE_THICKNESS
  ): Label {
    this.text.setFill(color).setStroke(strokeColor, strokeThickness);
    return this;
  }

  private resize() {
    this.text.setPosition(0, 0);
    this.background.setPosition(0, 0);
    this.width = this.text.width;
    this.height = this.text.height;
  }
}
