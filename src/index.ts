import 'phaser'
import 'phaser/plugins/spine/dist/SpinePlugin'
// Game entry point
import DebugScreenPlugin from './plugins/debug-screen.plugin'
import PhaserRaycaster from 'phaser-raycaster'
import PreloadScene from './scenes/preload.scene'
import GameScene from './scenes/game.scene'
import UIScene from './scenes/ui.scene'

const allowDebug = true

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio,
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
    default: 'arcade',

    arcade: {
      debug: allowDebug,
      gravity: { y: 0 },
    },
    matter: {
      debug: allowDebug,
      gravity: { y: 0 },
    },
  },
  scene: [PreloadScene, GameScene, UIScene],
  plugins: {
    scene: [
      { key: 'DebugScreen', plugin: DebugScreenPlugin, start: true },
      { key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' },
      {
        key: 'PhaserRaycaster',
        plugin: PhaserRaycaster,
        mapping: 'raycasterPlugin',
      },
    ],
  },
}

window.addEventListener('load', () => new Phaser.Game(config))
