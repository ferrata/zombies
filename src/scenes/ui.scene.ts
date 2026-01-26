import { scene } from '../core/globals'

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      if (!scene) return
      const mainCamera = scene.cameras.main
      this.cameras.main.setScroll(mainCamera.scrollX, mainCamera.scrollY)
      this.cameras.main.setZoom(mainCamera.zoom)
    })
  }
}
