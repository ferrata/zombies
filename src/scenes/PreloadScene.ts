export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("flashlight", "assets/images/flashlight.png");
    this.load.image("background", "assets/images/floor.png");
    this.load.image("wall-lamp", "assets/images/wall-lamp.png");
    this.load.image("green-dot", "assets/images/green-dot.png");

    this.load.image("muzzle-flash", "assets/images/muzzle-flash.png");
    this.load.atlas(
      "bullet-casings",
      "assets/particles/bullet-casings.png",
      "assets/particles/bullet-casings.json"
    );

    this.load.image("barrel", "assets/images/barrel.png");
    this.load.image("barrel-damaged", "assets/images/barrel-damaged.png");
    this.load.image("barrel-damaged-2", "assets/images/barrel-damaged-2.png");

    this.load.setPath("assets/spine/");
    this.load.spine("player", "player.json", "player.atlas");
    this.load.spine("player-legs", "player-legs.json", "player-legs.atlas");
  }

  create() {
    this.scene.start("GameScene");
  }
}
