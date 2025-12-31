/**
 * Player weapon types for model preview.
 */
export enum PlayerWeapon {
  HANDGUN = "handgun",
  SHOTGUN = "shotgun",
  RIFLE = "rifle",
  KNIFE = "knife",
}

/**
 * Player state types for model preview.
 */
export enum PlayerState {
  IDLE = "idle",
  MOVE = "move",
}

/**
 * Player legs state types for model preview.
 */
export enum PlayerLegsState {
  IDLE = "idle",
  WALK = "walk",
  STRAFE_LEFT = "strafe_left",
  STRAFE_RIGHT = "strafe_right",
  RUN = "run",
}

/**
 * Represents a player state configuration for preview.
 */
export interface PlayerStateInfo {
  key: string;
  name: string;
  upperAnimation: string;
  legsAnimation: string;
  category: "state" | "action";
  loop: boolean;
}

/**
 * Registry of player states and actions for the editor preview.
 * Shows how the player model is used in the game.
 */
export class PlayerModelRegistry {
  private static states: PlayerStateInfo[] = [
    // Idle states with different weapons
    {
      key: "idle_handgun",
      name: "Idle (Handgun)",
      upperAnimation: "idle_handgun",
      legsAnimation: "idle",
      category: "state",
      loop: true,
    },
    {
      key: "idle_shotgun",
      name: "Idle (Shotgun)",
      upperAnimation: "idle_shotgun",
      legsAnimation: "idle",
      category: "state",
      loop: true,
    },
    {
      key: "idle_rifle",
      name: "Idle (Rifle)",
      upperAnimation: "idle_rifle",
      legsAnimation: "idle",
      category: "state",
      loop: true,
    },
    {
      key: "idle_knife",
      name: "Idle (Knife)",
      upperAnimation: "idle_knife",
      legsAnimation: "idle",
      category: "state",
      loop: true,
    },

    // Move states with different weapons
    {
      key: "move_handgun_walk",
      name: "Walk (Handgun)",
      upperAnimation: "move_handgun",
      legsAnimation: "walk",
      category: "state",
      loop: true,
    },
    {
      key: "move_rifle_walk",
      name: "Walk (Rifle)",
      upperAnimation: "move_rifle",
      legsAnimation: "walk",
      category: "state",
      loop: true,
    },
    {
      key: "move_handgun_run",
      name: "Run (Handgun)",
      upperAnimation: "move_handgun",
      legsAnimation: "run",
      category: "state",
      loop: true,
    },
    {
      key: "move_rifle_strafe",
      name: "Strafe Right (Rifle)",
      upperAnimation: "move_rifle",
      legsAnimation: "strafe_right",
      category: "state",
      loop: true,
    },

    // Actions
    {
      key: "shoot_handgun",
      name: "Shoot (Handgun)",
      upperAnimation: "shoot_handgun",
      legsAnimation: "idle",
      category: "action",
      loop: false,
    },
    {
      key: "shoot_shotgun",
      name: "Shoot (Shotgun)",
      upperAnimation: "shoot_shotgun",
      legsAnimation: "idle",
      category: "action",
      loop: false,
    },
    {
      key: "shoot_rifle",
      name: "Shoot (Rifle)",
      upperAnimation: "shoot_rifle",
      legsAnimation: "idle",
      category: "action",
      loop: false,
    },
    {
      key: "reload_handgun",
      name: "Reload (Handgun)",
      upperAnimation: "reload_handgun",
      legsAnimation: "idle",
      category: "action",
      loop: false,
    },
    {
      key: "reload_shotgun",
      name: "Reload (Shotgun)",
      upperAnimation: "reload_shotgun",
      legsAnimation: "idle",
      category: "action",
      loop: false,
    },
    {
      key: "reload_rifle",
      name: "Reload (Rifle)",
      upperAnimation: "reload_rifle",
      legsAnimation: "idle",
      category: "action",
      loop: false,
    },
    {
      key: "meleeattack_knife",
      name: "Melee Attack (Knife)",
      upperAnimation: "meleeattack_knife",
      legsAnimation: "idle",
      category: "action",
      loop: false,
    },
  ];

  static getStates(): PlayerStateInfo[] {
    return this.states;
  }

  static getState(key: string): PlayerStateInfo | undefined {
    return this.states.find((s) => s.key === key);
  }

  static getStateKeys(): string[] {
    return this.states.map((s) => s.key);
  }
}
