import SpineContainer from '../types/spine-container'

export enum PlayerWeapon {
  FLASHLIGHT = 'flashlight',
  HANDGUN = 'handgun',
  SHOTGUN = 'shotgun',
  RIFLE = 'rifle',
  KNIFE = 'knife',
}

export enum PlayerState {
  IDLE = 'idle',
  MOVE = 'move',
}

export enum PlayerLegsState {
  IDLE = 'idle',
  WALK = 'walk',
  STRAFE_LEFT = 'strafe_left',
  STRAFE_RIGHT = 'strafe_right',
  RUN = 'run',
}

/**
 * PlayerPuppet - Pure animation layer for the player character.
 *
 * Contains two spine objects (upper body + legs) and provides
 * a clean API for controlling animations. No physics, no inputs,
 * no game-specific logic.
 *
 * Used by:
 * - Player (game) - adds physics, inputs, effects
 * - Editor - direct control for previewing animations
 */
export default class PlayerPuppet extends SpineContainer {
  private legs: SpineGameObject
  private currentState: PlayerState = PlayerState.IDLE
  private currentLegsState: PlayerLegsState = PlayerLegsState.IDLE
  private currentWeapon: PlayerWeapon = PlayerWeapon.KNIFE

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', `${PlayerState.IDLE}_${PlayerWeapon.KNIFE}`, true)

    this.setScale(0.7, 0.7)

    this.legs = scene.add.spine(0, 0, 'player-legs', PlayerLegsState.IDLE, true)
    this.addSpine(this.legs, 0)

    scene.add.existing(this)
  }

  // --- State Getters ---

  getState(): PlayerState {
    return this.currentState
  }

  getLegsState(): PlayerLegsState {
    return this.currentLegsState
  }

  getWeapon(): PlayerWeapon {
    return this.currentWeapon
  }

  // --- Movement States ---

  idle(): void {
    this.setCurrentState(PlayerState.IDLE, PlayerLegsState.IDLE)
  }

  walk(): void {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.WALK)
  }

  run(): void {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.RUN)
  }

  strafeLeft(): void {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.STRAFE_LEFT)
  }

  strafeRight(): void {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.STRAFE_RIGHT)
  }

  // --- Weapon ---

  selectWeapon(weapon: PlayerWeapon): void {
    if (this.currentWeapon === weapon) {
      return
    }

    this.switchToState(this.currentState, weapon)
  }

  // --- Actions (one-shot animations that return to current state) ---

  shoot(): void {
    if (
      this.currentWeapon === PlayerWeapon.KNIFE ||
      this.currentWeapon === PlayerWeapon.FLASHLIGHT
    ) {
      return
    }

    this.spine.setAnimation(0, `shoot_${this.currentWeapon}`, false)
    this.continueCurrentAnimation()
  }

  reload(): void {
    if (
      this.currentWeapon === PlayerWeapon.KNIFE ||
      this.currentWeapon === PlayerWeapon.FLASHLIGHT
    ) {
      return
    }

    this.spine.setAnimation(0, `reload_${this.currentWeapon}`, false)
    this.continueCurrentAnimation()
  }

  meleeAttack(): void {
    this.spine.setAnimation(0, `meleeattack_${this.currentWeapon}`, false)
    this.continueCurrentAnimation()
  }

  interactReach(): void {
    this.spine.setAnimation(0, `interact_reach_${this.currentWeapon}`, false)
  }

  /**
   * Queue return to current state animation.
   * Use after one-shot actions that don't automatically continue.
   */
  returnToCurrentState(): void {
    this.continueCurrentAnimation()
  }

  interactTake(): void {
    this.spine.addAnimation(0, `interact_take_${this.currentWeapon}`, false)
    this.continueCurrentAnimation()
  }

  // --- Internal ---

  private setCurrentState(state: PlayerState, legsState: PlayerLegsState): void {
    if (this.currentState !== state) {
      this.switchToState(state, this.currentWeapon)
    }

    if (this.currentLegsState !== legsState) {
      const oldLegsState = this.currentLegsState
      this.currentLegsState = legsState
      this.legs.setMix(oldLegsState, legsState, 0.2).setAnimation(0, legsState, true)
    }
  }

  private switchToState(state: PlayerState, weapon: PlayerWeapon): void {
    const oldState = `${this.currentState}_${this.currentWeapon}`
    const newState = `${state}_${weapon}`

    this.spine.setMix(oldState, newState, 0.2).setAnimation(0, newState, true)

    this.currentState = state
    this.currentWeapon = weapon
  }

  private continueCurrentAnimation(): void {
    this.spine.addAnimation(0, `${this.currentState}_${this.currentWeapon}`, true)
  }
}
