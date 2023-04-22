import "phaser";
import GameScene from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 800,
  height: 600,
  zoom: 1,
  input: {
    keyboard: true,
    gamepad: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
  },
  physics: {
    default: "arcade",

    arcade: {
      debug: true,
      gravity: {
        y: 0,
      },
    },
  },
  scene: [GameScene],
};

window.addEventListener("load", () => new Phaser.Game(config));
