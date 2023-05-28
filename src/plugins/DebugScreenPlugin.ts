import { GameObjects } from "phaser";
import { IDebuggable, isDebuggable } from "../types/Debuggable";
import { config } from "../GameConfig";

type DebugInfoLevel = "all" | "physics" | "info" | "none";

export default class DebugScreenPlugin extends Phaser.Plugins.ScenePlugin {
  private debugInfoLevel: DebugInfoLevel = "none";
  private help: DebugInfoWindow;
  private sceneDebugInfo: DebugInfoWindow;
  private debugGraphics: Phaser.GameObjects.Graphics;
  private debugObjects: {
    [key: string]: {
      object: IDebuggable;
      window: DebugInfoWindow;
    };
  } = {};

  private get debugInfoEnabled(): boolean {
    return this.debugInfoLevel !== "none";
  }

  private readonly displayBorder: number = 10;

  constructor(
    scene: Phaser.Scene,
    pluginManager: Phaser.Plugins.PluginManager
  ) {
    super(scene, pluginManager, "DebugScreenPlugin");

    // enable debug by default for development
    if (process.env.NODE_ENV === "development") {
      this.debugInfoLevel = "info";
    }

    this.scene.events.once(Phaser.Scenes.Events.BOOT, () => {
      this.create();
    });

    const drawDebugPhysics =
      this.debugInfoLevel === "all" || this.debugInfoLevel === "physics";

    this.scene.events.once(
      Phaser.Scenes.Events.READY,
      (event: Phaser.Scenes.Systems) => {
        this.debugGraphics = event.scene.add
          .graphics()
          .setDepth(config.depths.debug);

        event.scene.physics.world.createDebugGraphic();
        event.scene.physics.world.drawDebug = drawDebugPhysics;

        if (event.scene.matter) {
          event.scene.matter.world.createDebugGraphic();
          event.scene.matter.world.drawDebug = drawDebugPhysics;
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
          this.debugObjects[object.name] = {
            object: object as IDebuggable,
            window: objectInfo,
          };
        }
      }
    );

    this.scene.events.on(
      Phaser.Scenes.Events.REMOVED_FROM_SCENE,
      (object: Phaser.GameObjects.GameObject) => {
        if (isDebuggable(object)) {
          this.debugObjects[object.name].window.destroy();
          delete this.debugObjects[object.name];
        }
      }
    );

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, () => {
      this.resetDebugGraphics(this.debugInfoLevel);
      this.drawDebugInfo();
      this.drawDebugPhysics();
    });
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, () => this.cleanup());

    this.scene.input.keyboard.on("keydown-F9", () => {
      const nextLevel: { [key in DebugInfoLevel]: DebugInfoLevel } = {
        all: "physics",
        physics: "info",
        info: "none",
        none: "all",
      };

      this.debugInfoLevel = nextLevel[this.debugInfoLevel];
      this.resetDebugGraphics(this.debugInfoLevel);
    });
  }

  private resetDebugGraphics(level: DebugInfoLevel) {
    const drawDebugPhysics = level === "physics" || level === "all";

    this.debugGraphics.clear();

    this.scene.physics.world.debugGraphic.clear();
    this.scene.physics.world.drawDebug = drawDebugPhysics;

    if (this.scene.matter) {
      this.scene.matter.world.debugGraphic.clear();
      this.scene.matter.world.drawDebug = drawDebugPhysics;
    }
  }

  private drawDebugInfo() {
    this.sceneDebugInfo.setDebugInfo(this.getSceneDebugInfo(this.scene));

    const drawDebugInfo =
      this.debugInfoLevel === "all" || this.debugInfoLevel === "info";

    for (const key in this.debugObjects) {
      this.debugObjects[key].window.visible = drawDebugInfo;
    }

    if (!this.debugInfoEnabled) {
      return;
    }

    this.sceneDebugInfo.setDebugInfo(this.getSceneDebugInfo(this.scene));

    for (const key in this.debugObjects) {
      const object = this.debugObjects[key].object;
      if (!object) {
        continue;
      }

      const objectSize = {
        width: object.body.width,
        height: object.body.height,
      };

      const objectInfo = this.debugObjects[key].window;
      objectInfo.setDebuggable(object);
      objectInfo.setPosition(
        object.body.position.x + objectSize.width + 10,
        object.body.position.y + objectSize.height + 10
      );
    }
  }

  private drawDebugPhysics() {
    const drawDebugPhysics =
      this.debugInfoLevel === "all" || this.debugInfoLevel === "physics";

    if (!drawDebugPhysics) {
      return;
    }

    for (const key in this.debugObjects) {
      const object = this.debugObjects[key].object;
      if (!object) {
        console.log("skipping", key);
        continue;
      }

      object.drawDebugPhysics(this.debugGraphics);
    }
  }

  private cleanup() {
    this.sceneDebugInfo.destroy();
    this.help.destroy();
    for (const key in this.debugObjects) {
      this.debugObjects[key].window.destroy();
    }
  }

  private getSceneDebugInfo(scene: Phaser.Scene): object {
    return {
      fps: Math.round(scene.game.loop.actualFps),
      objects: scene.children.length,
      bodies: scene.physics.world.bodies.size,
      collisions: scene.physics.world.colliders.length,
      lights: scene.lights.lights.length,
      debugInfoLevel: this.debugInfoLevel,
      debugObjects: Object.keys(this.debugObjects),
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
