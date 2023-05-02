import "phaser";
import "phaser/plugins/spine/dist/SpinePlugin";
import DebugScreenPlugin from "./plugins/DebugScreenPlugin";
import PreloadScene from "./scenes/PreloadScene";
import GameScene from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1700,
    height: 900,
    zoom: 1,
  },
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
      gravity: {
        y: 0,
      },
    },
  },
  scene: [PreloadScene, GameScene],
  plugins: {
    scene: [
      { key: "DebugScreen", plugin: DebugScreenPlugin, start: true },
      { key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" },
    ],
  },
};

window.addEventListener("load", () => new Phaser.Game(config));
