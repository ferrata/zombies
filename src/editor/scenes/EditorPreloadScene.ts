import { SpineModelRegistry } from "../SpineModelRegistry";

export default class EditorPreloadScene extends Phaser.Scene {
  constructor() {
    super("EditorPreloadScene");
  }

  preload() {
    // Load all spine models from the registry
    this.load.setPath("assets/spine/");

    const models = SpineModelRegistry.getModels();
    for (const model of models) {
      this.load.spine(model.key, model.jsonFile, model.atlasFile);
    }
  }

  create() {
    this.scene.start("EditorScene");
  }
}
