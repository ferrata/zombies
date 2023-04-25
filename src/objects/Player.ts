import GameScene from "../scenes/GameScene";
import { Event } from "../scenes/Event";
import Flashlight from "./Flashlight";
import SpineContainer from "../types/SpineContainer";

enum Weapon {
  HANDGUN = "handgun",
  SHOTGUN = "shotgun",
  RIFLE = "rifle",
  KNIFE = "knife",
}

export default class Player extends SpineContainer {
  public scene: GameScene;
  public body: Phaser.Physics.Arcade.Body;

  private readonly walkingSpeed: number = 230;
  private readonly strafeSpeed: number = 130;

  private flashlight: Flashlight;
  private shadow: Phaser.FX.Shadow;
  private currentWeapon: Weapon = Weapon.HANDGUN;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, "player", `idle_${Weapon.HANDGUN}`, true);

    this.setScale(0.5, 0.5);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
    this.shadow = this.postFX.addShadow(0, 0, 0.1, 0.3, 0x000000, 2, 3);

    const bounds = this.spine.getBounds();
    this.body
      .setOffset(-bounds.size.x / 2, -bounds.size.y / 2)
      .setSize(bounds.size.x, bounds.size.y)
      .setCollideWorldBounds(true);
  }

  public preUpdate(time: number, delta: number) {
    let { left, right, up, down, space, keys } = this.scene.inputs;
    if (up) {
      this.scene.physics.velocityFromRotation(
        this.rotation,
        this.walkingSpeed,
        this.body.velocity
      );
    } else if (down) {
      this.scene.physics.velocityFromRotation(
        this.rotation,
        -this.walkingSpeed,
        this.body.velocity
      );
    } else if (left) {
      this.scene.physics.velocityFromRotation(
        this.rotation + 0.5 * Math.PI,
        -this.strafeSpeed,
        this.body.velocity
      );
    } else if (right) {
      this.scene.physics.velocityFromRotation(
        this.rotation + 0.5 * Math.PI,
        this.strafeSpeed,
        this.body.velocity
      );
    } else {
      this.body.setVelocity(0);
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
      this.setWeapon(Weapon.KNIFE);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.two)) {
      this.setWeapon(Weapon.HANDGUN);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.three)) {
      this.setWeapon(Weapon.SHOTGUN);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.four)) {
      this.setWeapon(Weapon.RIFLE);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.space)) {
      this.attack();
    }
  }

  public setWeapon(weapon: Weapon) {
    if (this.currentWeapon === weapon) {
      return;
    }

    this.currentWeapon = weapon;
    this.spine.setAnimation(0, `idle_${weapon}`, true);
  }

  public attack() {
    if (this.currentWeapon === Weapon.KNIFE) {
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
