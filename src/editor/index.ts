import "phaser";
import "phaser/plugins/spine/dist/SpinePlugin";
import EditorPreloadScene from "./scenes/EditorPreloadScene";
import EditorScene from "./scenes/EditorScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: "preview-canvas",
  transparent: true,
  scale: {
    mode: Phaser.Scale.NONE,
    width: 600,
    height: 600,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [EditorPreloadScene, EditorScene],
  plugins: {
    scene: [
      { key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" },
    ],
  },
};

const game = new Phaser.Game(config);

// Export game instance for external access
(window as any).game = game;
