import config from "../GameConfig";
import GameScene from "../scenes/GameScene";
import { Event } from "../scenes/Event";
import Flashlight from "./Flashlight";
import { CasingEmitter } from "./CasingEmitter";
import { IDebuggable } from "../types/Debuggable";
import {
  ILightAware,
  LightAwareShape,
  getTintColorShift,
} from "../types/LightAware";
import MuzzleFlash from "./MuzzleFlash";
import PlayerPuppet, { PlayerWeapon } from "./player.puppet";

enum PlayerWeaponMode {
  NONE = "none",
  SINGLE = "single",
  BURST = "burst",
  AUTO = "auto",
}

/**
 * Player - Game layer for the player character.
 *
 * Composes PlayerPuppet (animation) and adds:
 * - Physics body
 * - Input handling
 * - Flashlight, CasingEmitter, MuzzleFlash
 * - Matter.js spot for collision detection
 * - Light awareness
 * - Game events
 */
export default class Player implements ILightAware, IDebuggable {
  public readonly puppet: PlayerPuppet;
  public readonly scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private matterSpot: MatterJS.BodyType;
  private lightAwareShape: LightAwareShape;

  private readonly casingEmitter: CasingEmitter;
  private flashlight: Flashlight;
  private shadow: Phaser.FX.Shadow;
  private darkColorMatrix: Phaser.FX.ColorMatrix;
  private shadowAdded: boolean = false;

  private currentWeaponMode: { [key in PlayerWeapon]: PlayerWeaponMode } = {
    [PlayerWeapon.HANDGUN]: PlayerWeaponMode.SINGLE,
    [PlayerWeapon.SHOTGUN]: PlayerWeaponMode.SINGLE,
    [PlayerWeapon.RIFLE]: PlayerWeaponMode.BURST,
    [PlayerWeapon.KNIFE]: PlayerWeaponMode.NONE,
  };
  private muzzleFlash: MuzzleFlash;

  constructor(scene: GameScene, x: number, y: number) {
    this.scene = scene;

    // Create the puppet (handles all animation)
    this.puppet = new PlayerPuppet(scene, x, y);
    this.puppet.name = "player";

    // Enable physics on the puppet container
    scene.physics.world.enable(this.puppet);
    this.body = this.puppet.body as Phaser.Physics.Arcade.Body;
    this.body.setDrag(1, 1);

    // Setup visual effects
    this.shadow = this.puppet.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3);
    this.removeShadow();

    this.darkColorMatrix = this.puppet.postFX
      .addColorMatrix()
      .brightness(config.colors.darkenColorMatrixBrightness);

    // Setup physics body
    const bounds = this.puppet.spine.getBounds();
    this.body
      .setOffset(-bounds.size.x / 3, -bounds.size.y / 3 - 15)
      .setCircle(bounds.size.x / 3)
      .setCollideWorldBounds(true);

    // Setup matter.js collision spot
    this.matterSpot = scene.matter.add.circle(x, y, 50, {
      isSensor: true,
      label: "player-spot",
    });

    // Setup light awareness
    this.lightAwareShape = scene.add.circle(x, y, 50);
    // @ts-ignore
    this.lightAwareShape.owner = this;

    // Initialize state
    this.puppet.idle();
    this.puppet.selectWeapon(PlayerWeapon.HANDGUN);

    // Create effects
    this.casingEmitter = new CasingEmitter(
      scene,
      x,
      y,
      "bullet-casings",
      { from: 0.4, to: 0.3 }
    );
    this.muzzleFlash = new MuzzleFlash(scene, x, y);

    // Set depths
    this.puppet.setDepth(config.depths.player);
    this.casingEmitter.setDepth(config.depths.casingEmitter);
    this.muzzleFlash.setDepth(config.depths.player + 1);
  }

  // --- Proxy getters for common puppet container properties ---

  get x(): number {
    return this.puppet.x;
  }

  set x(value: number) {
    this.puppet.x = value;
  }

  get y(): number {
    return this.puppet.y;
  }

  set y(value: number) {
    this.puppet.y = value;
  }

  get rotation(): number {
    return this.puppet.rotation;
  }

  set rotation(value: number) {
    this.puppet.rotation = value;
  }

  get angle(): number {
    return this.puppet.angle;
  }

  set angle(value: number) {
    this.puppet.angle = value;
  }

  // --- Update Loop ---

  public postUpdate(): void {
    this.updateMatterSpotPosition();
    this.updateFlashlightPosition();
    this.updateMuzzleFlashPosition();
    this.updateCasingEmitterPosition();
    this.updateLightAwareShapePosition();
  }

  public preUpdate(): void {
    const { up, down, left, right, keys } = this.scene.inputs;

    if (left) {
      this.strafeLeft(keys.shift.isDown);
    } else if (right) {
      this.strafeRight(keys.shift.isDown);
    } else if (up) {
      if (keys.shift.isDown) {
        this.runForward();
      } else {
        this.moveForward();
      }
    } else if (down) {
      if (!keys.shift.isDown) {
        this.moveBackward();
      } else {
        this.runBackward();
      }
    } else {
      this.stop();
    }

    if (Phaser.Input.Keyboard.JustDown(keys.F)) {
      this.toggleFlashlight();
    }

    if (Phaser.Input.Keyboard.JustDown(keys.E)) {
      this.scene.events.emit(Event.INTERACT_WITH_OBJECT);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.R)) {
      this.reload();
    }

    if (Phaser.Input.Keyboard.JustDown(keys.one)) {
      this.selectWeapon(PlayerWeapon.KNIFE);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.two)) {
      this.selectWeapon(PlayerWeapon.HANDGUN);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.three)) {
      this.selectWeapon(PlayerWeapon.SHOTGUN);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.four)) {
      this.selectWeapon(PlayerWeapon.RIFLE);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.space)) {
      this.attack();
    }
  }

  // --- Movement (animation + physics) ---

  private stop(): void {
    this.puppet.idle();
    this.body.setVelocity(0);
  }

  private strafeRight(fast: boolean = false): void {
    this.puppet.strafeRight();
    this.scene.physics.velocityFromRotation(
      this.rotation + 0.5 * Math.PI,
      fast ? config.player.speed.strafeFast : config.player.speed.strafe,
      this.body.velocity
    );
  }

  private strafeLeft(fast: boolean = false): void {
    this.puppet.strafeLeft();
    this.scene.physics.velocityFromRotation(
      this.rotation + 0.5 * Math.PI,
      -(fast ? config.player.speed.strafeFast : config.player.speed.strafe),
      this.body.velocity
    );
  }

  private moveBackward(): void {
    this.puppet.walk();
    this.scene.physics.velocityFromRotation(
      this.rotation,
      -config.player.speed.walk,
      this.body.velocity
    );
  }

  private moveForward(): void {
    this.puppet.walk();
    this.scene.physics.velocityFromRotation(
      this.rotation,
      config.player.speed.walk,
      this.body.velocity
    );
  }

  private runBackward(): void {
    this.puppet.run();
    this.scene.physics.velocityFromRotation(
      this.rotation,
      -config.player.speed.run,
      this.body.velocity
    );
  }

  private runForward(): void {
    this.puppet.run();
    this.scene.physics.velocityFromRotation(
      this.rotation,
      config.player.speed.run,
      this.body.velocity
    );
  }

  // --- Weapon ---

  public selectWeapon(weapon: PlayerWeapon): void {
    const currentWeapon = this.puppet.getWeapon();

    if (currentWeapon === weapon) {
      // Toggle weapon mode
      const oldMode = this.currentWeaponMode[currentWeapon];
      const newMode = this.nextWeaponMode(currentWeapon, oldMode);
      this.currentWeaponMode[currentWeapon] = newMode;

      if (oldMode !== newMode) {
        this.scene.events.emit(Event.WEAPON_MODE_CHANGED, {
          weapon: currentWeapon,
          mode: newMode,
        });
      }

      return;
    }

    this.puppet.selectWeapon(weapon);
  }

  private nextWeaponMode(
    weapon: PlayerWeapon,
    currentMode: PlayerWeaponMode
  ): PlayerWeaponMode {
    if (weapon !== PlayerWeapon.RIFLE) {
      return PlayerWeaponMode.SINGLE;
    }

    if (currentMode === PlayerWeaponMode.SINGLE) {
      return PlayerWeaponMode.BURST;
    } else if (currentMode === PlayerWeaponMode.BURST) {
      return PlayerWeaponMode.AUTO;
    } else if (currentMode === PlayerWeaponMode.AUTO) {
      return PlayerWeaponMode.SINGLE;
    }

    return PlayerWeaponMode.SINGLE;
  }

  // --- Actions ---

  public attack(): void {
    const weapon = this.puppet.getWeapon();

    if (weapon === PlayerWeapon.KNIFE) {
      this.puppet.meleeAttack();
      return;
    }

    const mode = this.currentWeaponMode[weapon];
    if (mode === PlayerWeaponMode.SINGLE) {
      this.shoot();
    } else if (mode === PlayerWeaponMode.BURST) {
      this.shoot();
      this.scene.time.delayedCall(config.weapon.shotDelay, () => {
        this.shoot();
      });
      this.scene.time.delayedCall(config.weapon.shotDelay * 2, () => {
        this.shoot();
      });
    } else if (mode === PlayerWeaponMode.AUTO) {
      const shootEvent = this.scene.time.addEvent({
        delay: config.weapon.shotDelay,
        callback: () => {
          if (
            this.scene.input.keyboard!.keys[Phaser.Input.Keyboard.KeyCodes.SPACE]
              .isDown
          ) {
            this.shoot();
          } else {
            shootEvent.remove();
          }
        },
        loop: true,
      });
    }
  }

  private shoot(): void {
    this.puppet.shoot();
    this.casingEmitter.emitOne(this.getCasingName());
    this.muzzleFlash.flashOnce();
  }

  private reload(): void {
    this.puppet.reload();
  }

  // --- Flashlight ---

  private toggleFlashlight(): void {
    if (!this.flashlight) {
      this.scene.events.emit(Event.FLASHLIGHT_MISSING);
      return;
    }

    if (this.flashlight.isOff) {
      this.flashlight.turnOn();
    } else {
      this.flashlight.turnOff();
    }
  }

  // --- Interaction ---

  public interactWithObject(item: Phaser.GameObjects.GameObject): void {
    if (this.isAlmostWithinReach(item)) {
      this.almostTakeItem();
      this.scene.events.emit(Event.OBJECT_STILL_TOO_FAR, item);
      return;
    }

    if (!this.isWithinReach(item)) {
      this.scene.events.emit(Event.OBJECT_TOO_FAR, item);
      return;
    }

    if (item instanceof Flashlight) {
      this.takeItem(() => {
        this.scene.physics.world.remove(item.body);
        this.scene.children.remove(item);

        this.flashlight = item as Flashlight;
        // Register player with flashlight so it can light the player
        this.flashlight.mapLightAwareObject(this);
        return item;
      });
    } else {
      this.scene.events.emit(Event.UNKNOWN_OBJECT, item);
    }
  }

  private isWithinReach(item: Phaser.GameObjects.GameObject): boolean {
    const { distance, angle } = this.distanceTo(item);
    return distance <= config.player.reach && angle <= config.player.reachAngle;
  }

  private isAlmostWithinReach(item: Phaser.GameObjects.GameObject): boolean {
    const { distance, angle } = this.distanceTo(item);
    return (
      distance > config.player.reach &&
      distance <= config.player.reachAlmost &&
      angle <= config.player.reachAngle
    );
  }

  private distanceTo(item: Phaser.GameObjects.GameObject): {
    distance: number;
    angle: number;
  } {
    const itemBody = item.body as Phaser.Physics.Arcade.Body;
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      itemBody.x,
      itemBody.y
    );

    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      itemBody.x,
      itemBody.y
    );

    const degreesAbs = Phaser.Math.RadToDeg(Math.abs(angle - this.rotation));
    return { distance, angle: degreesAbs };
  }

  private takeItem(fn: Function): void {
    const listener = {
      complete: () => {
        this.puppet.spine.state.removeListener(listener);

        const item = fn();
        this.puppet.interactTake();

        if (item) {
          this.scene.events.emit(Event.OBJECT_PICKED_UP, item);
        }
      },
    };

    this.puppet.spine.state.addListener(listener);
    this.puppet.interactReach();
  }

  private almostTakeItem(): void {
    const listener = {
      complete: () => {
        this.puppet.spine.state.removeListener(listener);
        // pause for a while, then return arm to current state
        this.scene.time.delayedCall(150, () => {
          this.puppet.returnToCurrentState();
        });
      },
    };

    this.puppet.spine.state.addListener(listener);
    this.puppet.interactReach();
  }

  // --- Light Awareness ---

  public onDarken(): ILightAware {
    this.removeShadow();
    this.darkColorMatrix
      .reset()
      .brightness(config.colors.darkenColorMatrixBrightness);

    this.casingEmitter.onDarken();
    this.flashlight?.onDarken();
    return this;
  }

  public onLighten(): ILightAware {
    this.ensureShadow();
    this.shadow.color = 0x000000;
    this.darkColorMatrix.reset();

    this.casingEmitter.onLighten();
    this.flashlight?.onLighten();
    return this;
  }

  public onLightOverReset(): ILightAware {
    if (this.scene.isDark) {
      this.darkColorMatrix
        .reset()
        .brightness(config.colors.darkenColorMatrixBrightness);
    }
    return this;
  }

  public onLightOver(
    light: Raycaster.Ray,
    intersections: Phaser.Geom.Point[]
  ): ILightAware {
    this.darkColorMatrix.reset();
    return this;
  }

  public onLighningtOver(progress: number): ILightAware {
    this.removeShadow();

    if (progress < 1) {
      this.ensureShadow();
      this.shadow.color = getTintColorShift(0x000000, progress);
    }

    this.darkColorMatrix
      .reset()
      .brightness(
        Phaser.Math.Linear(
          0,
          config.colors.darkenColorMatrixBrightness,
          progress
        )
      );

    return this;
  }

  public setLightAwareShape(shape: LightAwareShape): ILightAware {
    return this;
  }

  public getLightAwareShape(): LightAwareShape {
    return this.lightAwareShape;
  }

  // --- Debug ---

  public hasDebugInfo(): boolean {
    return true;
  }

  public getDebugInfo() {
    return {
      x: this.x,
      y: this.y,
      size: { width: this.body.width, height: this.body.height },
      angle: this.angle,
      velocity: this.body.velocity,
      currentState: this.puppet.getState(),
      currentLegsState: this.puppet.getLegsState(),
      currentWeapon: this.puppet.getWeapon(),
      currentWeaponMode: this.currentWeaponMode[this.puppet.getWeapon()],
      flashlight: this.flashlight?.getDebugInfo(),
    };
  }

  public drawDebugPhysics(graphics: Phaser.GameObjects.Graphics): void {
    this.flashlight?.drawDebugPhysics(graphics);
  }

  // --- Private Helpers ---

  private ensureShadow(): void {
    if (this.shadowAdded) {
      return;
    }

    this.shadowAdded = true;
    this.puppet.postFX.add(this.shadow);
  }

  private removeShadow(): void {
    this.puppet.postFX.remove(this.shadow);
    this.shadowAdded = false;
  }

  private updateMatterSpotPosition(): void {
    this.matterSpot.angle = this.angle;
    this.matterSpot.position.x = this.x;
    this.matterSpot.position.y = this.y;
  }

  private updateLightAwareShapePosition(): void {
    this.lightAwareShape.x = this.x;
    this.lightAwareShape.y = this.y;
  }

  private updateCasingEmitterPosition(): void {
    const weapon = this.puppet.getWeapon();
    const adjustByWeapon = {
      [PlayerWeapon.HANDGUN]: { length: 80, angle: 35 },
      [PlayerWeapon.SHOTGUN]: { length: 70, angle: 30 },
      [PlayerWeapon.RIFLE]: { length: 60, angle: 35 },
      [PlayerWeapon.KNIFE]: { length: 0, angle: 0 },
    };

    const { length, angle } = adjustByWeapon[weapon];
    this.casingEmitter.setEmitterPosition(
      this.body.center,
      length,
      this.angle + angle
    );

    this.casingEmitter.setEmitterAngle(this.angle);
  }

  private updateMuzzleFlashPosition(): void {
    const weapon = this.puppet.getWeapon();
    const scaleByWeapon = {
      [PlayerWeapon.HANDGUN]: { scale: 0.1 },
      [PlayerWeapon.SHOTGUN]: { scale: 0.15 },
      [PlayerWeapon.RIFLE]: { scale: 0.13 },
      [PlayerWeapon.KNIFE]: { scale: 0 },
    };

    const scale = scaleByWeapon[weapon].scale;
    const bone = this.getBonePosition("muzzle");
    this.muzzleFlash.setScale(scale).setPosition(bone.x, bone.y);
    this.muzzleFlash.setAngle(this.angle);
  }

  private updateFlashlightPosition(): void {
    const weapon = this.puppet.getWeapon();
    const attachedToByWeapon = {
      [PlayerWeapon.HANDGUN]: {
        frontBone: "muzzle",
        rearBone: "weapon",
        shift: 10,
      },
      [PlayerWeapon.SHOTGUN]: {
        frontBone: "muzzle",
        rearBone: "weapon",
        shift: 60,
      },
      [PlayerWeapon.RIFLE]: {
        frontBone: "muzzle",
        rearBone: "weapon",
        shift: 60,
      },
      [PlayerWeapon.KNIFE]: {
        frontBone: "head",
        rearBone: "head",
        shift: 0,
      },
    };

    const attachedTo = attachedToByWeapon[weapon];
    const frontBone = this.getBonePosition(attachedTo.frontBone);
    const rearBone = this.getBonePosition(attachedTo.rearBone);

    const flashlightOffset = new Phaser.Math.Vector2(
      frontBone.x - rearBone.x,
      frontBone.y - rearBone.y
    ).setLength(attachedTo.shift);

    const weaponAngle =
      attachedTo.frontBone === attachedTo.rearBone
        ? this.rotation
        : Phaser.Math.Angle.Between(
            rearBone.x,
            rearBone.y,
            frontBone.x,
            frontBone.y
          );

    this.flashlight
      ?.setPosition(
        flashlightOffset.x + rearBone.x,
        flashlightOffset.y + rearBone.y
      )
      .setAngle(Phaser.Math.RadToDeg(weaponAngle));
  }

  private getBonePosition(boneName: string): Phaser.Math.Vector2 {
    const bone = this.puppet.spine.skeleton.findBone(boneName);
    const boneInnerPosition = new Phaser.Math.Vector2(
      bone.worldX + this.x - this.puppet.spine.skeleton.x,
      bone.worldY + this.y - this.puppet.spine.skeleton.y
    );

    const distance = Phaser.Math.Distance.Between(
      this.body.center.x,
      this.body.center.y,
      boneInnerPosition.x,
      boneInnerPosition.y
    );

    const angle = Phaser.Math.Angle.Between(
      this.body.center.x,
      this.body.center.y,
      boneInnerPosition.x,
      boneInnerPosition.y
    );

    const bonePosition = new Phaser.Math.Vector2(
      this.body.center.x,
      this.body.center.y
    )
      .setLength(distance)
      .setAngle(-angle)
      .add(this.body.center);

    return bonePosition;
  }

  private getCasingName(): string | undefined {
    const weapon = this.puppet.getWeapon();
    return {
      [PlayerWeapon.HANDGUN]: "8mm-bullet-case",
      [PlayerWeapon.SHOTGUN]: "12gauge-bullet-case",
      [PlayerWeapon.RIFLE]: "ar-bullet-case",
    }[weapon];
  }
}
