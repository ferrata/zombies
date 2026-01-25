import PlayerInputs from "../controls/player-inputs";

export type GameScene = Phaser.Scene & {
  isDark: boolean;
  inputs: PlayerInputs;
  lightSceneGraphics: Phaser.GameObjects.Graphics;
  lightShadowSceneGraphics: Phaser.GameObjects.Graphics;
};

export let scene: GameScene;
export let input: PlayerInputs;
export let player: any;

export function setGlobals(gameScene: GameScene): void {
  scene = gameScene;
  input = gameScene.inputs;
}

export function setPlayer(playerObj: any): void {
  player = playerObj;
}

export function clearGlobals(): void {
  scene = undefined as any;
  input = undefined as any;
  player = undefined as any;
}
