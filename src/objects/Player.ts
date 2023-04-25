import GameScene from "../scenes/GameScene";
import { Event } from "../scenes/Event";
import Flashlight from "./Flashlight";
import SpineContainer from "../types/SpineContainer";

enum PlayerWeapon {
  HANDGUN = "handgun",
  SHOTGUN = "shotgun",
  RIFLE = "rifle",
  KNIFE = "knife",
}

enum PlayerState {
  IDLE = "idle",
  MOVE = "move",
}

export default class Player extends SpineContainer {
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private readonly walkingSpeed: number = 230;
  private readonly strafeSpeed: number = 130;

  private flashlight: Flashlight;
  private shadow: Phaser.FX.Shadow;
  private currentState: PlayerState = PlayerState.IDLE;
  private currentWeapon: PlayerWeapon = PlayerWeapon.HANDGUN;

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

    this.setScale(0.5, 0.5);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
    this.shadow = this.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3);

    const bounds = this.spine.getBounds();
    this.body
      .setOffset(-bounds.size.x / 2, -bounds.size.y / 2)
      .setSize(bounds.size.x, bounds.size.y)
      .setCollideWorldBounds(true);

    this.setCurrentState(PlayerState.IDLE);
    this.selectWeapon(PlayerWeapon.HANDGUN);
  }

  public preUpdate(time: number, delta: number) {
    let { left, right, up, down, keys } = this.scene.inputs;
    if (up) {
      this.moveForward();
    } else if (down) {
      this.moveBackward();
    } else if (left) {
      this.strafeLeft();
    } else if (right) {
      this.strafeRight();
    } else {
      this.stop();
    }

    if (Phaser.Input.Keyboard.JustDown(keys.F)) {
      if (!this.flashlight) {
        return this.scene.events.emit(Event.FLASHLIGHT_MISSING);
      }

      if (this.flashlight.isOff) {
        this.flashlight.turnOn();
      } else {
        this.flashlight.turnOff();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(keys.E)) {
      const item = this.scene.closestObject();
      if (item) {
        this.useItem(item);
      } else {
        this.scene.events.emit(Event.NO_ITEM_IN_RANGE);
      }
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

  private setCurrentState(currentState: PlayerState) {
    if (this.currentState === currentState) {
      return;
    }

    this.currentState = currentState;
    const animation = `${currentState}_${this.currentWeapon}`;
    this.spine.setAnimation(0, animation, true);
  }

  private stop() {
    this.setCurrentState(PlayerState.IDLE);
    this.body.setVelocity(0);
  }

  private strafeRight() {
    this.setCurrentState(PlayerState.MOVE);
    this.scene.physics.velocityFromRotation(
      this.rotation + 0.5 * Math.PI,
      this.strafeSpeed,
      this.body.velocity
    );
  }

  private strafeLeft() {
    this.setCurrentState(PlayerState.MOVE);
    this.scene.physics.velocityFromRotation(
      this.rotation + 0.5 * Math.PI,
      -this.strafeSpeed,
      this.body.velocity
    );
  }

  private moveBackward() {
    this.setCurrentState(PlayerState.MOVE);
    this.scene.physics.velocityFromRotation(
      this.rotation,
      -this.walkingSpeed,
      this.body.velocity
    );
  }

  private moveForward() {
    this.setCurrentState(PlayerState.MOVE);
    this.scene.physics.velocityFromRotation(
      this.rotation,
      this.walkingSpeed,
      this.body.velocity
    );
  }

  public selectWeapon(weapon: PlayerWeapon) {
    if (this.currentWeapon === weapon) {
      return;
    }

    this.currentWeapon = weapon;
    this.spine.setAnimation(0, `${this.currentState}_${weapon}`, true);
  }

  public attack() {
    if (this.currentWeapon === PlayerWeapon.KNIFE) {
      this.spine.setAnimation(0, `meleeattack_${this.currentWeapon}`, false);
      return;
    }

    this.spine.setAnimation(0, `shoot_${this.currentWeapon}`, false);
  }

  public useItem(item: Phaser.GameObjects.GameObject) {
    if (item instanceof Flashlight) {
      this.scene.physics.world.remove(item.body);
      this.scene.children.remove(item);

      this.flashlight = item as Flashlight;
      // this.addAt(this.flashlight, 0);

      this.scene.events.emit(Event.ITEM_PICKED_UP, item);
    } else {
      this.scene.events.emit(Event.UNKNOWN_ITEM, item);
    }
  }

  public onUpdateReticle(
    reticle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    distance: number
  ) {
    this.flashlight?.pointTo(reticle.x, reticle.y, distance);
  }

  public onDark() {
    this.postFX.clear();
    this.postFX.addColorMatrix().brightness(0.5);
  }

  public onLight() {
    this.postFX.clear();
    this.postFX.add(this.shadow);
  }
}
