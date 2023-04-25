import "phaser";
import "phaser/plugins/spine/dist/SpinePlugin";
import GameScene from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: window.innerWidth - 10,
  height: window.innerHeight - 10,
  autoCenter: Phaser.Scale.CENTER_BOTH,
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
  plugins: {
    scene: [
      { key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" },
    ],
  },
};

window.addEventListener("load", () => new Phaser.Game(config));
