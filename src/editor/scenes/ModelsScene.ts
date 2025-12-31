import { PlayerModelRegistry, PlayerStateInfo } from "../PlayerModelRegistry";
import { editorState } from "../EditorState";

/**
 * Overview sequence step - defines what the player does in the demo loop.
 */
interface OverviewStep {
  upperAnimation: string;
  legsAnimation: string;
  duration: number; // Duration in ms before next step
}

/**
 * Scripted overview sequence that showcases the player model.
 */
const OVERVIEW_SEQUENCE: OverviewStep[] = [
  // Idle with handgun
  { upperAnimation: "idle_handgun", legsAnimation: "idle", duration: 1500 },
  // Walk forward
  { upperAnimation: "move_handgun", legsAnimation: "walk", duration: 2000 },
  // Stop and shoot
  { upperAnimation: "shoot_handgun", legsAnimation: "idle", duration: 400 },
  { upperAnimation: "shoot_handgun", legsAnimation: "idle", duration: 400 },
  { upperAnimation: "idle_handgun", legsAnimation: "idle", duration: 800 },
  // Reload
  { upperAnimation: "reload_handgun", legsAnimation: "idle", duration: 1500 },
  // Switch to rifle, strafe
  { upperAnimation: "idle_rifle", legsAnimation: "idle", duration: 500 },
  { upperAnimation: "move_rifle", legsAnimation: "strafe_right", duration: 1500 },
  { upperAnimation: "move_rifle", legsAnimation: "strafe_left", duration: 1500 },
  // Shoot rifle
  { upperAnimation: "shoot_rifle", legsAnimation: "idle", duration: 300 },
  { upperAnimation: "shoot_rifle", legsAnimation: "idle", duration: 300 },
  { upperAnimation: "shoot_rifle", legsAnimation: "idle", duration: 300 },
  { upperAnimation: "idle_rifle", legsAnimation: "idle", duration: 800 },
  // Switch to shotgun, run
  { upperAnimation: "idle_shotgun", legsAnimation: "idle", duration: 500 },
  { upperAnimation: "move_shotgun", legsAnimation: "run", duration: 2000 },
  // Shoot shotgun
  { upperAnimation: "shoot_shotgun", legsAnimation: "idle", duration: 600 },
  { upperAnimation: "shoot_shotgun", legsAnimation: "idle", duration: 600 },
  { upperAnimation: "idle_shotgun", legsAnimation: "idle", duration: 800 },
  // Reload shotgun
  { upperAnimation: "reload_shotgun", legsAnimation: "idle", duration: 2000 },
  // Switch to knife
  { upperAnimation: "idle_knife", legsAnimation: "idle", duration: 500 },
  { upperAnimation: "move_knife", legsAnimation: "walk", duration: 1500 },
  // Melee attack
  { upperAnimation: "meleeattack_knife", legsAnimation: "idle", duration: 600 },
  { upperAnimation: "meleeattack_knife", legsAnimation: "idle", duration: 600 },
  { upperAnimation: "idle_knife", legsAnimation: "idle", duration: 1000 },
];

export default class ModelsScene extends Phaser.Scene {
  private playerSpine: SpineGameObject | null = null;
  private legsSpine: SpineGameObject | null = null;
  private stateList!: HTMLUListElement;
  private loadingOverlay!: HTMLElement;

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

    // Create the player model
    this.createPlayerModel();

    // Initialize UI
    this.populateStateList();

    // Restore state or start overview
    this.restoreState();

    // Hide loading overlay
    this.loadingOverlay.classList.add("hidden");
  }

  private createPlayerModel() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create legs first (behind the body)
    this.legsSpine = this.add.spine(centerX, centerY, "player-legs", "idle", true);
    this.legsSpine.setScale(0.7);

    // Create player body
    this.playerSpine = this.add.spine(centerX, centerY, "player", "idle_handgun", true);
    this.playerSpine.setScale(0.7);
  }

  private populateStateList() {
    const states = PlayerModelRegistry.getStates();
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
    states.forEach((state) => {
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
      // Start with overview
      this.startOverview();
      this.highlightState("overview");
      return;
    }

    const state = PlayerModelRegistry.getState(savedState);
    if (state) {
      this.playState(state);
      this.highlightState(savedState);
    } else {
      // Fallback to overview
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
    if (!this.isPlayingOverview || !this.playerSpine || !this.legsSpine) return;

    const step = OVERVIEW_SEQUENCE[this.overviewStepIndex];

    // Play the animations
    this.playerSpine.play(step.upperAnimation, false);
    this.legsSpine.play(step.legsAnimation, true);

    // Schedule next step
    this.overviewTimer = this.time.addEvent({
      delay: step.duration,
      callback: () => {
        this.overviewStepIndex = (this.overviewStepIndex + 1) % OVERVIEW_SEQUENCE.length;
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

  private playState(state: PlayerStateInfo) {
    if (!this.playerSpine || !this.legsSpine) return;

    try {
      // Clear any listeners
      this.playerSpine.state.clearListeners();

      // Play upper body animation
      this.playerSpine.play(state.upperAnimation, state.loop);

      // Play legs animation
      this.legsSpine.play(state.legsAnimation, true);

      // If it's a non-looping action, return to idle after completion
      if (!state.loop) {
        this.playerSpine.state.addListener({
          complete: () => {
            if (this.playerSpine) {
              // Extract weapon from the animation name
              const weapon = state.upperAnimation.split("_").pop() || "handgun";
              this.playerSpine.play(`idle_${weapon}`, true);
              this.playerSpine.state.clearListeners();
            }
          },
        });
      }
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
      // Scroll into view if needed
      selected.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  shutdown() {
    this.stopOverview();
    if (this.playerSpine) {
      this.playerSpine.destroy();
      this.playerSpine = null;
    }
    if (this.legsSpine) {
      this.legsSpine.destroy();
      this.legsSpine = null;
    }
  }
}
