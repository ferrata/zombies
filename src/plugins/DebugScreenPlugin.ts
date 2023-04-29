import { GameObjects } from "phaser";

export default class DebugScreenPlugin extends Phaser.Plugins.ScenePlugin {
  constructor(
    scene: Phaser.Scene,
    pluginManager: Phaser.Plugins.PluginManager
  ) {
    super(scene, pluginManager, "DebugScreenPlugin");

    this.scene.events.once("boot", () => {
      this.create();
    });
  }

  public create() {
    const debugContainer = this.scene.add.container(0, 0);
    debugContainer.setScrollFactor(0);
    debugContainer.setDepth(1000);

    const debugText = this.scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#cccccc",
        stroke: "#000000",
        strokeThickness: 0.5,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 10,
        },
      })
      .setOrigin(0, 0);

    debugContainer.add(debugText);

    this.scene.events.on("update", () => {
      debugText.setText(this.getDebugText());
    });
  }

  private getDebugText() {
    return [
      `FPS: ${Math.round(this.scene.game.loop.actualFps)}`,
      `Objects: ${this.scene.children.length}`,
      `Bodies: ${this.scene.physics.world.bodies.size}`,
      `Collisions: ${this.scene.physics.world.colliders.length}`,
      `Lights: ${this.scene.lights.lights.length}`,
      // ``,
      // `Player: ${this.scene.children.getByName("player")?.getDebugInfo()}`,
    ].join("\n");
  }
}
