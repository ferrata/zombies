import { SpineModelRegistry } from '../spine-model-registry'

export default class EditorPreloadScene extends Phaser.Scene {
  constructor() {
    super('EditorPreloadScene')
  }

  preload() {
    // Load all spines from the registry
    this.load.setPath('assets/spine/')

    const spines = SpineModelRegistry.getSpines()
    for (const spine of spines) {
      this.load.spine(spine.key, spine.jsonFile, spine.atlasFile)
    }
  }

  create() {
    this.scene.start('EditorScene')
  }
}
