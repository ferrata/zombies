import SpineContainer from "../types/SpineContainer";

export enum ZombieState {
  IDLE = "idle",
  WALK = "walk",
  ATTACK = "attack",
  DIE = "die",
}

export default class Zombie extends SpineContainer {
  private currentState: ZombieState = ZombieState.IDLE;
  private isDead: boolean = false;
  private moveSpeed: number = 50;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "zombie", ZombieState.IDLE, true);

    this.name = "zombie";
    this.setScale(0.6, 0.6);
  }

  /**
   * Get the current state of the zombie
   */
  getState(): ZombieState {
    return this.currentState;
  }

  /**
   * Check if the zombie is dead
   */
  getIsDead(): boolean {
    return this.isDead;
  }

  /**
   * Set zombie state and play corresponding animation
   */
  setZombieState(state: ZombieState, loop: boolean = true): void {
    if (this.isDead && state !== ZombieState.DIE) {
      return;
    }

    if (this.currentState === state) {
      return;
    }

    this.currentState = state;
    this.spine.play(state, loop, true);
  }

  /**
   * Make the zombie attack
   */
  attack(): void {
    if (this.isDead) return;
    this.setZombieState(ZombieState.ATTACK, false);
  }

  /**
   * Kill the zombie
   */
  die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.setZombieState(ZombieState.DIE, false);
  }

  /**
   * Face towards a point
   */
  facePoint(x: number, y: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
    this.spine.rotation = angle + Math.PI / 2;
  }

  /**
   * Set the movement speed
   */
  setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  getMoveSpeed(): number {
    return this.moveSpeed;
  }
}
