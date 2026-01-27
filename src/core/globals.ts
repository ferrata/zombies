import PlayerInputs from '../controls/player-inputs'
import { GameSceneInterface } from '../types/game-scene'
import { PlayerObject } from '../objects/player.object'

export type { GameSceneInterface as GameScene }

export let scene: GameSceneInterface | undefined
export let uiScene: Phaser.Scene | undefined
export let input: PlayerInputs | undefined
export let player: PlayerObject | undefined

export function setGlobals(gameScene: GameSceneInterface): void {
  scene = gameScene
  input = gameScene.inputs
}

export function setUIScene(ui: Phaser.Scene): void {
  uiScene = ui
}

export function setPlayer(playerObj: PlayerObject): void {
  player = playerObj
}

export function clearGlobals(): void {
  scene = undefined
  uiScene = undefined
  input = undefined
  player = undefined
}
