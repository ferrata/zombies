import PlayerPuppet, { PlayerWeapon } from "../../objects/player.puppet";
import { editorState } from "../editor-state";

/**
 * Overview sequence step - uses PlayerPuppet methods directly.
 */
interface OverviewStep {
  action: (puppet: PlayerPuppet) => void;
  duration: number;
}

/**
 * Creates the overview sequence using PlayerPuppet's API.
 * This ensures the editor uses the exact same code as the game.
 */
function createOverviewSequence(): OverviewStep[] {
  return [
    // Idle with handgun
    { action: (p) => { p.selectWeapon(PlayerWeapon.HANDGUN); p.idle(); }, duration: 1500 },
    // Walk forward
    { action: (p) => p.walk(), duration: 2000 },
    // Stop and shoot
    { action: (p) => { p.idle(); p.shoot(); }, duration: 400 },
    { action: (p) => p.shoot(), duration: 400 },
    { action: (p) => p.idle(), duration: 800 },
    // Reload
    { action: (p) => p.reload(), duration: 1500 },
    // Switch to rifle, strafe
    { action: (p) => { p.selectWeapon(PlayerWeapon.RIFLE); p.idle(); }, duration: 500 },
    { action: (p) => p.strafeRight(), duration: 1500 },
    { action: (p) => p.strafeLeft(), duration: 1500 },
    // Shoot rifle
    { action: (p) => { p.idle(); p.shoot(); }, duration: 300 },
    { action: (p) => p.shoot(), duration: 300 },
    { action: (p) => p.shoot(), duration: 300 },
    { action: (p) => p.idle(), duration: 800 },
    // Switch to shotgun, run
    { action: (p) => { p.selectWeapon(PlayerWeapon.SHOTGUN); p.idle(); }, duration: 500 },
    { action: (p) => p.run(), duration: 2000 },
    // Shoot shotgun
    { action: (p) => { p.idle(); p.shoot(); }, duration: 600 },
    { action: (p) => p.shoot(), duration: 600 },
    { action: (p) => p.idle(), duration: 800 },
    // Reload shotgun
    { action: (p) => p.reload(), duration: 2000 },
    // Switch to knife
    { action: (p) => { p.selectWeapon(PlayerWeapon.KNIFE); p.idle(); }, duration: 500 },
    { action: (p) => p.walk(), duration: 1500 },
    // Melee attack
    { action: (p) => { p.idle(); p.meleeAttack(); }, duration: 600 },
    { action: (p) => p.meleeAttack(), duration: 600 },
    { action: (p) => p.idle(), duration: 1000 },
  ];
}

/**
 * State item for the sidebar list.
 */
interface StateItem {
  key: string;
  name: string;
  category: "state" | "action";
  action: (puppet: PlayerPuppet) => void;
}

/**
 * Creates the list of states for the sidebar.
 */
function createStateItems(): StateItem[] {
  return [
    // Idle states
    { key: "idle_handgun", name: "Idle (Handgun)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.HANDGUN); p.idle(); } },
    { key: "idle_shotgun", name: "Idle (Shotgun)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.SHOTGUN); p.idle(); } },
    { key: "idle_rifle", name: "Idle (Rifle)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.RIFLE); p.idle(); } },
    { key: "idle_knife", name: "Idle (Knife)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.KNIFE); p.idle(); } },
    // Move states
    { key: "walk_handgun", name: "Walk (Handgun)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.HANDGUN); p.walk(); } },
    { key: "walk_rifle", name: "Walk (Rifle)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.RIFLE); p.walk(); } },
    { key: "run_handgun", name: "Run (Handgun)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.HANDGUN); p.run(); } },
    { key: "strafe_rifle", name: "Strafe (Rifle)", category: "state", action: (p) => { p.selectWeapon(PlayerWeapon.RIFLE); p.strafeRight(); } },
    // Actions
    { key: "shoot_handgun", name: "Shoot (Handgun)", category: "action", action: (p) => { p.selectWeapon(PlayerWeapon.HANDGUN); p.idle(); p.shoot(); } },
    { key: "shoot_shotgun", name: "Shoot (Shotgun)", category: "action", action: (p) => { p.selectWeapon(PlayerWeapon.SHOTGUN); p.idle(); p.shoot(); } },
    { key: "shoot_rifle", name: "Shoot (Rifle)", category: "action", action: (p) => { p.selectWeapon(PlayerWeapon.RIFLE); p.idle(); p.shoot(); } },
    { key: "reload_handgun", name: "Reload (Handgun)", category: "action", action: (p) => { p.selectWeapon(PlayerWeapon.HANDGUN); p.idle(); p.reload(); } },
    { key: "reload_shotgun", name: "Reload (Shotgun)", category: "action", action: (p) => { p.selectWeapon(PlayerWeapon.SHOTGUN); p.idle(); p.reload(); } },
    { key: "reload_rifle", name: "Reload (Rifle)", category: "action", action: (p) => { p.selectWeapon(PlayerWeapon.RIFLE); p.idle(); p.reload(); } },
    { key: "melee_knife", name: "Melee Attack (Knife)", category: "action", action: (p) => { p.selectWeapon(PlayerWeapon.KNIFE); p.idle(); p.meleeAttack(); } },
  ];
}

export default class ModelsScene extends Phaser.Scene {
  private puppet: PlayerPuppet | null = null;
  private stateList!: HTMLUListElement;
  private loadingOverlay!: HTMLElement;

  private overviewSequence: OverviewStep[] = [];
  private stateItems: StateItem[] = [];
  private overviewStepIndex: number = 0;
  private overviewTimer: Phaser.Time.TimerEvent | null = null;
  private isPlayingOverview: boolean = false;

  constructor() {
    super("ModelsScene");
  }

  create() {
    // Get DOM elements
    this.stateList = document.getElementById("state-list") as HTMLUListElement;
    this.loadingOverlay = document.getElementById(
      "models-loading-overlay"
    ) as HTMLElement;

    // Set up the scene background
    this.cameras.main.setBackgroundColor(0x2d2d2d);

    // Create the player puppet (uses same code as the game!)
    this.createPlayerPuppet();

    // Create sequences and state items
    this.overviewSequence = createOverviewSequence();
    this.stateItems = createStateItems();

    // Initialize UI
    this.populateStateList();

    // Restore state or start overview
    this.restoreState();

    // Hide loading overlay
    this.loadingOverlay.classList.add("hidden");
  }

  private createPlayerPuppet() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create the puppet - same class used by the game!
    this.puppet = new PlayerPuppet(this, centerX, centerY);
  }

  private populateStateList() {
    this.stateList.innerHTML = "";

    // Add Overview item first
    const overviewItem = document.createElement("li");
    overviewItem.className = "state-item";
    overviewItem.dataset.key = "overview";

    const overviewName = document.createElement("span");
    overviewName.textContent = "Overview";
    overviewItem.appendChild(overviewName);

    const overviewBadge = document.createElement("span");
    overviewBadge.className = "state-badge";
    overviewBadge.textContent = "demo";
    overviewBadge.style.backgroundColor = "#2a5d2a";
    overviewItem.appendChild(overviewBadge);

    overviewItem.addEventListener("click", () => {
      this.startOverview();
      this.highlightState("overview");
      editorState.modelsSelectedState = "overview";
    });

    this.stateList.appendChild(overviewItem);

    // Add separator
    const separator = document.createElement("li");
    separator.style.height = "1px";
    separator.style.backgroundColor = "#4d4d4d";
    separator.style.margin = "8px 0";
    separator.style.padding = "0";
    this.stateList.appendChild(separator);

    // Add individual states
    this.stateItems.forEach((state) => {
      const item = document.createElement("li");
      item.className = "state-item";
      item.dataset.key = state.key;

      // Create name span
      const nameSpan = document.createElement("span");
      nameSpan.textContent = state.name;
      item.appendChild(nameSpan);

      // Add category badge
      const badge = document.createElement("span");
      badge.className = `state-badge ${state.category}`;
      badge.textContent = state.category;
      item.appendChild(badge);

      item.addEventListener("click", () => {
        this.stopOverview();
        this.playState(state);
        this.highlightState(state.key);
        editorState.modelsSelectedState = state.key;
      });

      this.stateList.appendChild(item);
    });
  }

  private restoreState() {
    const savedState = editorState.modelsSelectedState;

    if (savedState === "overview" || !savedState) {
      this.startOverview();
      this.highlightState("overview");
      return;
    }

    const state = this.stateItems.find((s) => s.key === savedState);
    if (state) {
      this.playState(state);
      this.highlightState(savedState);
    } else {
      this.startOverview();
      this.highlightState("overview");
    }
  }

  private startOverview() {
    this.stopOverview();
    this.isPlayingOverview = true;
    this.overviewStepIndex = 0;
    this.playOverviewStep();
  }

  private playOverviewStep() {
    if (!this.isPlayingOverview || !this.puppet) return;

    const step = this.overviewSequence[this.overviewStepIndex];

    // Execute the action on the puppet
    step.action(this.puppet);

    // Schedule next step
    this.overviewTimer = this.time.addEvent({
      delay: step.duration,
      callback: () => {
        this.overviewStepIndex = (this.overviewStepIndex + 1) % this.overviewSequence.length;
        this.playOverviewStep();
      },
    });
  }

  private stopOverview() {
    this.isPlayingOverview = false;
    if (this.overviewTimer) {
      this.overviewTimer.destroy();
      this.overviewTimer = null;
    }
  }

  private playState(state: StateItem) {
    if (!this.puppet) return;

    try {
      state.action(this.puppet);
    } catch (error) {
      console.error("Failed to play state:", error);
    }
  }

  private highlightState(stateKey: string) {
    // Remove active class from all items
    const items = this.stateList.querySelectorAll(".state-item");
    items.forEach((item) => item.classList.remove("active"));

    // Add active class to selected item
    const selected = this.stateList.querySelector(`[data-key="${stateKey}"]`);
    if (selected) {
      selected.classList.add("active");
      selected.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  shutdown() {
    this.stopOverview();
    if (this.puppet) {
      this.puppet.destroy();
      this.puppet = null;
    }
  }
}
