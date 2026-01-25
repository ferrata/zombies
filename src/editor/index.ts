import 'phaser'
import 'phaser/plugins/spine/dist/SpinePlugin'
import EditorPreloadScene from './scenes/editor-preload.scene'
import EditorScene from './scenes/editor.scene'
import ModelsPreloadScene from './scenes/models-preload.scene'
import ModelsScene from './scenes/models.scene'
import { editorState, EditorTab } from './editor-state'

declare global {
  interface Window {
    spineGame?: Phaser.Game
    modelsGame?: Phaser.Game
    getSpineGame?: () => Phaser.Game | null
    getModelsGame?: () => Phaser.Game | null
  }
}

// Spine tab game configuration
const spineConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'preview-canvas',
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
    scene: [{ key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' }],
  },
}

// Models tab game configuration
const modelsConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'models-preview-canvas',
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
  scene: [ModelsPreloadScene, ModelsScene],
  plugins: {
    scene: [{ key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' }],
  },
}

// Game instances
let spineGame: Phaser.Game | null = null
let modelsGame: Phaser.Game | null = null

// Tab switching logic
function switchTab(tabId: EditorTab) {
  // Update tab buttons
  const tabs = document.querySelectorAll('.toolbar-tab[data-tab]')
  tabs.forEach((tab) => {
    if (tab.getAttribute('data-tab') === tabId) {
      tab.classList.add('active')
    } else {
      tab.classList.remove('active')
    }
  })

  // Update tab content
  const contents = document.querySelectorAll('.tab-content')
  contents.forEach((content) => {
    if (content.id === `tab-${tabId}`) {
      content.classList.add('active')
    } else {
      content.classList.remove('active')
    }
  })

  // Initialize game for the tab if needed
  if (tabId === 'spine' && !spineGame) {
    spineGame = new Phaser.Game(spineConfig)
    window.spineGame = spineGame
  } else if (tabId === 'models' && !modelsGame) {
    modelsGame = new Phaser.Game(modelsConfig)
    window.modelsGame = modelsGame
  }

  // Save active tab
  editorState.activeTab = tabId
}

// Initialize tab click handlers
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.toolbar-tab[data-tab]')
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab') as EditorTab
      if (tabId) {
        switchTab(tabId)
      }
    })
  })

  // Restore saved tab or default to spine
  const savedTab = editorState.activeTab
  switchTab(savedTab)
})

// Export game instances for external access
window.getSpineGame = () => spineGame
window.getModelsGame = () => modelsGame
