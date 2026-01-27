export default class ModelsPreloadScene extends Phaser.Scene {
  constructor() {
    super('ModelsPreloadScene')
  }

  preload() {
    // Load player spine assets
    this.load.setPath('assets/spine/')
    this.load.spine('player', 'player.json', 'player.atlas')
    this.load.spine('player-legs', 'player-legs.json', 'player-legs.atlas')
  }

  create() {
    this.scene.start('ModelsScene')
  }
}
