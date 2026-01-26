import PlayerInputs from '../controls/player-inputs'

export interface GameSceneInterface extends Phaser.Scene {
  isDark: boolean
  isPlayerMode: boolean
  inputs: PlayerInputs
  lightSceneGraphics: Phaser.GameObjects.Graphics
  lightShadowSceneGraphics: Phaser.GameObjects.Graphics
  physics: Phaser.Physics.Arcade.ArcadePhysics
  matter: Phaser.Physics.Matter.MatterPhysics
}
