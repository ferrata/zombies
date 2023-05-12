import { GameObjects } from "phaser";
import { IDebuggable, isDebuggable } from "../types/Debuggable";

export default class DebugScreenPlugin extends Phaser.Plugins.ScenePlugin {
  private debugInfoEnabled: boolean = false;
  private help: DebugInfoWindow;
  private sceneDebugInfo: DebugInfoWindow;
  private debugObjects: { [key: string]: DebugInfoWindow } = {};

  private readonly displayBorder: number = 10;

  constructor(
    scene: Phaser.Scene,
    pluginManager: Phaser.Plugins.PluginManager
  ) {
    super(scene, pluginManager, "DebugScreenPlugin");

    // enable debug by default for development
    if (process.env.NODE_ENV === "development") {
      this.debugInfoEnabled = true;
    }

    this.scene.events.once(Phaser.Scenes.Events.BOOT, () => {
      this.create();
    });

    this.scene.events.once(
      Phaser.Scenes.Events.READY,
      (event: Phaser.Scenes.Systems) => {
        event.scene.physics.world.createDebugGraphic();
        event.scene.physics.world.drawDebug = this.debugInfoEnabled;

        if (event.scene.matter) {
          event.scene.matter.world.createDebugGraphic();
          event.scene.matter.world.drawDebug = this.debugInfoEnabled;
        }
      }
    );
  }

  public create() {
    this.sceneDebugInfo = new DebugInfoWindow(
      this.scene,
      `${this.scene.scene.key}`
    )
      .setScrollFactor(0)
      .setPosition(this.displayBorder, this.displayBorder);

    this.help = new DebugInfoWindow(this.scene, "Help")
      .setScrollFactor(0)
      .setText(
        [
          "F9       toggle debug info",
          "0        toggle lights",
          "1,2,3,4  toggle weapons",
          "A,W,S,D  move",
          "E        interact with objects",
          "SPACE    attack",
          "SHIFT    run",
        ].join("\n")
      );

    this.help.setPosition(
      this.scene.game.canvas.width - this.help.width - this.displayBorder,
      this.displayBorder
    );

    this.scene.events.on(
      Phaser.Scenes.Events.ADDED_TO_SCENE,
      (object: Phaser.GameObjects.GameObject) => {
        if (isDebuggable(object)) {
          const objectInfo = new DebugInfoWindow(this.scene, object.name);
          this.debugObjects[object.name] = objectInfo;
        }
      }
    );

    this.scene.events.on(
      Phaser.Scenes.Events.REMOVED_FROM_SCENE,
      (object: Phaser.GameObjects.GameObject) => {
        if (isDebuggable(object)) {
          this.debugObjects[object.name].destroy();
          delete this.debugObjects[object.name];
        }
      }
    );

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, () => {
      this.sceneDebugInfo.visible = this.debugInfoEnabled;
      for (const key in this.debugObjects) {
        this.debugObjects[key].visible = this.debugInfoEnabled;
      }

      if (!this.debugInfoEnabled) {
        return;
      }

      this.scene.physics.world.debugGraphic.update();
      if (this.scene.matter) {
        this.scene.matter.world.debugGraphic.update();
      }

      this.sceneDebugInfo.setDebugInfo(this.getSceneDebugInfo(this.scene));

      for (const key in this.debugObjects) {
        const object = this.scene.children.getByName(key);
        if (!object || !isDebuggable(object)) {
          continue;
        }

        const objectSize = {
          width: object.body.width,
          height: object.body.height,
        };

        const objectInfo = this.debugObjects[key];
        objectInfo.setDebuggable(object);
        objectInfo.setPosition(
          object.body.position.x + objectSize.width + 10,
          object.body.position.y + objectSize.height + 10
        );
      }
    });

    this.scene.events.on("shutdown", () => this.cleanup());
    this.scene.events.on("destroy", () => this.cleanup());

    this.scene.input.keyboard.on("keydown-F9", () => {
      this.debugInfoEnabled = !this.debugInfoEnabled;

      this.scene.physics.world.debugGraphic.clear();
      this.scene.physics.world.drawDebug = this.debugInfoEnabled;

      if (this.scene.matter) {
        this.scene.matter.world.debugGraphic.clear();
        this.scene.matter.world.drawDebug = this.debugInfoEnabled;
      }
    });
  }

  private cleanup() {
    this.sceneDebugInfo.destroy();
    this.help.destroy();
    for (const key in this.debugObjects) {
      this.debugObjects[key].destroy();
    }
  }

  private getSceneDebugInfo(scene: Phaser.Scene): object {
    return {
      fps: Math.round(scene.game.loop.actualFps),
      objects: scene.children.length,
      bodies: scene.physics.world.bodies.size,
      collisions: scene.physics.world.colliders.length,
      lights: scene.lights.lights.length,
    };
  }
}

class DebugInfoWindow extends Phaser.GameObjects.Container {
  private background: GameObjects.Rectangle;
  private titleBackground: GameObjects.Rectangle;
  private title: GameObjects.Text;
  private text: GameObjects.Text;

  constructor(scene: Phaser.Scene, title: string) {
    super(scene, 0, 0);

    this.background = this.scene.add
      .rectangle(0, 0, 0, 0, 0x000000)
      .setAlpha(0.5);
    this.titleBackground = this.scene.add
      .rectangle(0, 0, 0, 0, 0x000000)
      .setAlpha(0.5);

    this.title = this.addTextObject(0, 0, title);
    this.text = this.addTextObject(0, 0, "");

    this.add([this.background, this.titleBackground, this.title, this.text]);

    this.scene.add.existing(this);
    this.setDepth(9999);
    this.resize();
  }

  public setDebuggable(debuggable: IDebuggable): DebugInfoWindow {
    const debugInfo = debuggable?.getDebugInfo();
    if (!debugInfo) {
      this.setText("no debug info available");
      return this;
    }

    return this.setDebugInfo(debugInfo);
  }

  public setDebugInfo(debugInfo: object) {
    const text = this.formatDebugInfo(debugInfo);
    return this.setText(text);
  }

  private formatDebugInfo(debugInfo: object, indent = 0) {
    const maxSpace =
      Math.max(...Object.keys(debugInfo).map((key) => key.length)) + 2;
    const indentString = indent ? " ".repeat(indent) : "";
    return Object.keys(debugInfo)
      .map(
        (key) =>
          `${indentString}${key}${" ".repeat(maxSpace - key.length)}${
            debugInfo[key] instanceof Object
              ? "\n" + this.formatDebugInfo(debugInfo[key], indent + 4)
              : debugInfo[key]
          }`
      )
      .join("\n");
  }

  public setText(text: string): DebugInfoWindow {
    this.text.setText(text);
    this.resize();
    return this;
  }

  private resize() {
    this.title.setPosition(0, 0);
    this.text.setPosition(0, this.title.height);
    this.background.height = this.title.height + this.text.height;
    this.background.width = Math.max(this.title.width, this.text.width);
    this.titleBackground.setPosition(0, 0);
    this.titleBackground.height = this.title.height;
    this.titleBackground.width = this.background.width;

    this.width = this.background.width;
    this.height = this.background.height;
  }

  private addTextObject(
    x: number,
    y: number,
    text: string,
    padding: { top: number; bottom: number; left: number; right: number } = {
      top: 5,
      bottom: 5,
      left: 10,
      right: 10,
    }
  ): GameObjects.Text {
    return this.scene.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#cccccc",
      stroke: "#000000",
      strokeThickness: 0.5,
      padding: padding,
    });
  }
}
