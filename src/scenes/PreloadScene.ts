export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("flashlight", "assets/images/flashlight.png");
    this.load.image("background", "assets/images/floor.png");
    this.load.atlas(
      "bullet-casings",
      "assets/particles/bullet-casings.png",
      "assets/particles/bullet-casings.json"
    );

    this.load.setPath("assets/spine/");
    this.load.spine("player", "player.json", "player.atlas");
    this.load.spine("player-legs", "player-legs.json", "player-legs.atlas");
  }

  create() {
    this.scene.start("GameScene");
  }
}
