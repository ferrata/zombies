import config from "../GameConfig";
import GameScene from "../scenes/GameScene";
import { Event } from "../scenes/Event";
import Flashlight from "./Flashlight";
import SpineContainer from "../types/SpineContainer";
import { CasingEmitter } from "./CasingEmitter";
import { IDebuggable } from "../types/Debuggable";
import Pointer from "./Pointer";
import { ILightAware, LightAwareShape } from "../types/LightAware";

enum PlayerWeapon {
  HANDGUN = "handgun",
  SHOTGUN = "shotgun",
  RIFLE = "rifle",
  KNIFE = "knife",
}

enum PlayerWeaponMode {
  NONE = "none",
  SINGLE = "single",
  BURST = "burst",
  AUTO = "auto",
}

enum PlayerState {
  IDLE = "idle",
  MOVE = "move",
}

enum PlayerLegsState {
  IDLE = "idle",
  WALK = "walk",
  STRAFE_LEFT = "strafe_left",
  STRAFE_RIGHT = "strafe_right",
  RUN = "run",
}

export default class Player
  extends SpineContainer
  implements ILightAware, IDebuggable
{
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private matterSpot: MatterJS.BodyType;
  private lightAwareShape: LightAwareShape;

  private readonly runningSpeed: number = 500;
  private readonly walkingSpeed: number = 230;
  private readonly strafeSpeed: number = 230;
  private readonly strafeFastSpeed: number = 500;
  private readonly casingEmitter: CasingEmitter;

  private legs: SpineGameObject;
  private flashlight: Flashlight;
  private shadow: Phaser.FX.Shadow;
  private darkColorMatrix: Phaser.FX.ColorMatrix;
  private currentState: PlayerState = PlayerState.IDLE;
  private currentLegsState: PlayerLegsState = PlayerLegsState.IDLE;
  private currentWeapon: PlayerWeapon = PlayerWeapon.HANDGUN;
  private currentWeaponMode: { [key in PlayerWeapon]: PlayerWeaponMode } = {
    handgun: PlayerWeaponMode.SINGLE,
    shotgun: PlayerWeaponMode.SINGLE,
    rifle: PlayerWeaponMode.BURST,
    knife: PlayerWeaponMode.NONE,
  };

  constructor(scene: GameScene, x: number, y: number) {
    super(
      scene,
      x,
      y,
      "player",
      `${PlayerState.IDLE}_${PlayerWeapon.HANDGUN}`,
      true
    );

    this.name = "player";

    this.setScale(0.7, 0.7);

    this.legs = scene.add.spine(0, 0, "player-legs", PlayerState.IDLE, true);
    this.addSpine(this.legs, 0);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
    this.body.setDrag(1, 1);

    this.shadow = this.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3);
    this.postFX.remove(this.shadow);

    this.darkColorMatrix = this.postFX
      .addColorMatrix()
      .brightness(config.colors.darkenColorMatrixBrightness);

    const bounds = this.spine.getBounds();

    this.body
      .setOffset(-bounds.size.x / 3, -bounds.size.y / 3 - 15)
      .setCircle(bounds.size.x / 3)
      .setCollideWorldBounds(true);

    this.matterSpot = this.scene.matter.add.circle(this.x, this.y, 50, {
      isSensor: true,
      label: "player-spot",
    });

    this.lightAwareShape = this.scene.add.circle(this.x, this.y, 50);
    // @ts-ignore
    this.lightAwareShape.owner = this;

    this.setCurrentState(PlayerState.IDLE, PlayerLegsState.IDLE);
    this.selectWeapon(PlayerWeapon.HANDGUN);

    this.casingEmitter = new CasingEmitter(
      this.scene,
      this.x,
      this.y,
      "bullet-casings",
      { from: 0.4, to: 0.3 }
    );

    this.setDepth(config.depths.player);
    this.casingEmitter.setDepth(config.depths.casingEmitter);
  }

  public preRender() {
    this.flashlight?.update();
  }

  public postUpdate() {
    this.updateMatterSpotPosition();
    this.updateFlashlightPosition(this.currentWeapon);
    this.updateCasingEmitterPosition(this.currentWeapon);
    this.updateLightAwareShapePosition();
  }

  public preUpdate() {
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

  private toggleFlashlight() {
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

  private setCurrentState(state: PlayerState, legsState: PlayerLegsState) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.spine.setAnimation(0, `${state}_${this.currentWeapon}`, true);
    }

    if (this.currentLegsState !== legsState) {
      this.currentLegsState = legsState;
      this.legs.setAnimation(0, legsState, true);
    }
  }

  private stop() {
    this.setCurrentState(PlayerState.IDLE, PlayerLegsState.IDLE);
    this.body.setVelocity(0);
  }

  private strafeRight(fast: boolean = false) {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.STRAFE_RIGHT);
    this.scene.physics.velocityFromRotation(
      this.rotation + 0.5 * Math.PI,
      fast ? this.strafeFastSpeed : this.strafeSpeed,
      this.body.velocity
    );
  }

  private strafeLeft(fast: boolean = false) {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.STRAFE_LEFT);
    this.scene.physics.velocityFromRotation(
      this.rotation + 0.5 * Math.PI,
      -(fast ? this.strafeFastSpeed : this.strafeSpeed),
      this.body.velocity
    );
  }

  private moveBackward() {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.WALK);
    this.scene.physics.velocityFromRotation(
      this.rotation,
      -this.walkingSpeed,
      this.body.velocity
    );
  }

  private moveForward() {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.WALK);
    this.scene.physics.velocityFromRotation(
      this.rotation,
      this.walkingSpeed,
      this.body.velocity
    );
  }

  private runBackward() {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.RUN);
    this.scene.physics.velocityFromRotation(
      this.rotation,
      -this.runningSpeed,
      this.body.velocity
    );
  }

  private runForward() {
    this.setCurrentState(PlayerState.MOVE, PlayerLegsState.RUN);
    this.scene.physics.velocityFromRotation(
      this.rotation,
      this.runningSpeed,
      this.body.velocity
    );
  }

  public selectWeapon(weapon: PlayerWeapon) {
    if (this.currentWeapon === weapon) {
      const oldMode = this.currentWeaponMode[this.currentWeapon];
      const newMode = this.nextWeaponMode(this.currentWeapon, oldMode);
      this.currentWeaponMode[this.currentWeapon] = newMode;

      if (oldMode !== newMode) {
        this.scene.events.emit(Event.WEAPON_MODE_CHANGED, {
          weapon: this.currentWeapon,
          mode: newMode,
        });
      }

      return;
    }

    this.currentWeapon = weapon;
    this.spine.setAnimation(0, `${this.currentState}_${weapon}`, true);
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
  }

  public attack() {
    if (this.currentWeapon === PlayerWeapon.KNIFE) {
      this.spine.setAnimation(0, `meleeattack_${this.currentWeapon}`, false);
      return;
    }

    const mode = this.currentWeaponMode[this.currentWeapon];
    if (mode === PlayerWeaponMode.SINGLE) {
      this.shoot();
    } else if (mode === PlayerWeaponMode.BURST) {
      this.shoot();
      this.scene.time.addEvent({
        delay: 100,
        callback: () => {
          this.shoot();
        },
      });
      this.scene.time.addEvent({
        delay: 200,
        callback: () => {
          this.shoot();
        },
      });
    } else if (mode === PlayerWeaponMode.AUTO) {
      const shootEvent = this.scene.time.addEvent({
        delay: 100,
        callback: () => {
          if (
            this.scene.input.keyboard.keys[Phaser.Input.Keyboard.KeyCodes.SPACE]
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

  private shoot() {
    this.spine.setAnimation(0, `shoot_${this.currentWeapon}`, false);
    this.casingEmitter.emitOne(this.getCasingName(this.currentWeapon));
  }

  private reload() {
    if (this.currentWeapon === PlayerWeapon.KNIFE) {
      return;
    }

    this.spine.setAnimation(0, `reload_${this.currentWeapon}`, false);

    // TODO: add reload time for shotgun
    // this.spine.addAnimation(0, `reload_${this.currentWeapon}`, false);
  }

  public interactWithObject(item: Phaser.GameObjects.GameObject) {
    if (item instanceof Flashlight) {
      this.takeItem(() => {
        this.scene.physics.world.remove(item.body);
        this.scene.children.remove(item);

        this.flashlight = item as Flashlight;
        return item;
      });
    } else {
      this.scene.events.emit(Event.UNKNOWN_OBJECT, item);
    }
  }

  private takeItem(fn: Function) {
    const listener = {
      complete: (entry) => {
        this.spine.state.removeListener(listener);

        const item = fn();
        this.spine.addAnimation(
          0,
          `interact_take_${this.currentWeapon}`,
          false
        );
        this.spine.addAnimation(
          0,
          `${this.currentState}_${this.currentWeapon}`,
          true
        );

        if (item) {
          this.scene.events.emit(Event.OBJECT_PICKED_UP, item);
        }
      },
    };

    this.spine.state.addListener(listener);

    this.spine.setAnimation(0, `interact_reach_${this.currentWeapon}`, false);
  }

  public onDarken(): ILightAware {
    this.postFX.remove(this.shadow);
    this.darkColorMatrix
      .reset()
      .brightness(config.colors.darkenColorMatrixBrightness);

    this.casingEmitter.onDarken();
    this.flashlight?.onDarken();
    return this;
  }

  public onLighten(): ILightAware {
    this.postFX.add(this.shadow);
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

  public setLightAwareShape(shape: LightAwareShape): ILightAware {
    return this;
  }

  public getLightAwareShape(): LightAwareShape {
    return this.lightAwareShape;
  }

  public getDebugInfo() {
    return {
      x: this.x,
      y: this.y,
      size: { width: this.body.width, height: this.body.height },
      angle: this.angle,
      velocity: this.body.velocity,

      // matterSpot: {
      //   x: this.matterSpot.position.x,
      //   y: this.matterSpot.position.y,
      //   velocity: this.matterSpot.velocity,
      // },

      currentState: this.currentState,
      currentLegsState: this.currentLegsState,
      currentWeapon: this.currentWeapon,
      currentWeaponMode: this.currentWeaponMode[this.currentWeapon],
      flashlight: this.flashlight?.getDebugInfo(),
    };
  }

  public drawDebugPhysics(graphics: Phaser.GameObjects.Graphics) {
    this.flashlight?.drawDebugPhysics(graphics);
  }

  private updateMatterSpotPosition() {
    this.matterSpot.angle = this.angle;
    this.matterSpot.position.x = this.x;
    this.matterSpot.position.y = this.y;
  }

  private updateLightAwareShapePosition() {
    this.lightAwareShape.x = this.x;
    this.lightAwareShape.y = this.y;
  }

  private updateCasingEmitterPosition(weapon: PlayerWeapon) {
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

  private updateFlashlightPosition(weapon: PlayerWeapon) {
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

    const weaponAngle = Phaser.Math.Angle.Between(
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

  private getBonePosition(boneName: string) {
    const bone = this.spine.skeleton.findBone(boneName);
    const boneInnerPosition = new Phaser.Math.Vector2(
      bone.worldX + this.x - this.spine.skeleton.x,
      bone.worldY + this.y - this.spine.skeleton.y
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

  private getCasingName(weapon: PlayerWeapon) {
    // names are based on the spritesheet "bullet-casings"
    return {
      [PlayerWeapon.HANDGUN]: "8mm-bullet-case",
      [PlayerWeapon.SHOTGUN]: "12gauge-bullet-case",
      [PlayerWeapon.RIFLE]: "ar-bullet-case",
    }[weapon];
  }
}
