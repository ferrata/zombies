export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("flashlight", "assets/images/flashlight.png");
    this.load.image("target", "assets/images/pointer.png");
    this.load.image("background", "assets/images/floor.png");

    this.load.setPath("assets/spine/");
    // @ts-ignore
    this.load.spine("player", "player.json", "player.atlas");
    // @ts-ignore
    this.load.spine("player-legs", "player-legs.json", "player-legs.atlas");
  }

  create() {
    this.scene.start("GameScene");
  }
}
