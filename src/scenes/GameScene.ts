import PlayerInputs from "../controls/PlayerInputs";
import Flashlight from "../objects/Flashlight";
import Pointer from "../objects/Pointer";
import Player from "../objects/Player";
import { Event } from "./Event";
import { Pointable } from "../types/Pointable";
import { StaticMatterThing } from "../objects/StaticMatterThing";
import {
  StaticMatterProjectionRectangle,
  StaticMatterProjectionCircle,
} from "../objects/StaticMatterProjection";
import { IObstacle } from "../types/Obstacle";
import { ILightAware, isLightAware, LightAware } from "../types/LightAware";
import PhaserRaycaster from "phaser-raycaster";

export default class GameScene extends Phaser.Scene {
  private _inputs: PlayerInputs;
  private _isDark: boolean;

  private raycasterPlugin: PhaserRaycaster;
  private field: Phaser.GameObjects.TileSprite;
  private pointer: Pointer;
  private player: Player;
  private objects: any[] = [];
  private obstacles: IObstacle[] = [];

  public get isDark(): boolean {
    return this._isDark;
  }

  public get inputs(): PlayerInputs {
    return this._inputs;
  }

  constructor() {
    super({
      key: "GameScene",
      physics: {
        arcade: {},
        matter: {},
      },
    });
  }

  public closestObject(): Phaser.GameObjects.GameObject {
    return this.physics.closest(
      this.player,
      this.physics.world.bodies.entries.filter(
        (body) => this.objects.indexOf(body.gameObject) > -1
      )
    )?.gameObject;
  }

  create() {
    this.physics.world.setBounds(0, 0, 1600, 1200);
    this.matter.world.setBounds(0, 0, 1600, 1200);

    this.field = this.add.tileSprite(800, 600, 1600, 1200, "background");
    this.field.setPipeline("Light2D");

    const barrel = new (LightAware(StaticMatterThing))(
      this,
      970,
      400,
      "barrel-damaged"
    )
      .setScale(0.3)
      .setOrigin(0.5, 0.5)
      .setAngle(25);

    barrel.setLightAwareShape(barrel.createRectangle());

    const barrel2 = new (LightAware(StaticMatterThing))(
      this,
      800,
      350,
      "barrel"
    )
      .setScale(0.3)
      .setCircle(75)
      .setAngle(-15)
      .setOrigin(0.5, 0.5);

    barrel2.setLightAwareShape(barrel2.createCircle(73));

    const barrel3 = new (LightAware(StaticMatterThing))(
      this,
      900,
      230,
      "barrel-damaged-2"
    )
      .setScale(0.3)
      .setCircle(60)
      .setAngle(165)
      .setOrigin(0.5, 0.5);

    barrel3.setLightAwareShape(barrel3.createCircle(70));

    this.obstacles.push(new StaticMatterProjectionRectangle(this, barrel));
    this.obstacles.push(new StaticMatterProjectionCircle(this, barrel2, 75));
    this.obstacles.push(new StaticMatterProjectionCircle(this, barrel3, 60));

    this.objects.push(
      new (Pointable(Flashlight))(
        this,
        820,
        360,
        this.raycasterPlugin.createRaycaster()
      ).setAngle(-45),
      barrel,
      barrel2
    );

    this.player = new Player(this, 800, 600);
    this.pointer = new Pointer(this, 800, 500);

    this.lights.enable();

    const redLight = this.lights.addLight(0, 100, 600, 0xff0000);
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (redLight.intensity == 0) {
          redLight.setIntensity(3);
        } else {
          redLight.setIntensity(0);
        }
      },
      loop: true,
    });

    // this.darken();
    this.lighten();

    // Set camera zoom
    this.cameras.main.zoom = 1;

    // Locks pointer on mousedown
    this.game.canvas.addEventListener("mousedown", () => {
      this.game.input.mouse.requestPointerLock();
    });

    // Move player pointer upon locked pointer move
    this.input.on(
      "pointermove",
      function (pointer: Phaser.Input.Pointer) {
        if (this.input.mouse.locked) {
          this.pointer.x += pointer.movementX;
          this.pointer.y += pointer.movementY;
        }
      },
      this
    );

    this._inputs = new PlayerInputs(this.input);

    this.events.on(Event.FLASHLIGHT_MISSING, () => {
      console.error("Flashlight is missing");
    });

    this.events.on(Event.OBJECT_PICKED_UP, (item: any) => {
      console.info("Picked up", item.name);
    });

    this.events.on(Event.UNKNOWN_OBJECT, (item: any) => {
      console.error("Unknown item", item.name);
    });

    this.events.on(Event.NO_OBJECT_IN_RANGE, () => {
      console.error("No item in range");
    });

    this.events.on(Event.INTERACT_WITH_OBJECT, () => {
      const item = this.closestObject();
      if (item) {
        this.player.interactWithObject(item);
      } else {
        this.events.emit(Event.NO_OBJECT_IN_RANGE);
      }
    });
  }

  darken() {
    this._isDark = true;
    this.lights.setAmbientColor(0x333333);

    this.children.each((child) => {
      if (isLightAware(child)) {
        // console.log("darken", child.name);
        child.onDarken();
      }
    });
  }

  lighten() {
    this._isDark = false;
    this.lights.setAmbientColor(0xffffff);

    this.children.each((child) => {
      if (isLightAware(child)) {
        // console.log("lighten", child.name);
        child.onLighten();
      }
    });
  }

  update(_time, _delta) {
    if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.zero)) {
      if (this.isDark) {
        this.lighten();
      } else {
        this.darken();
      }
    }

    if (this.obstacles.length > 0) {
      const obstacles = this.obstacles as Phaser.Physics.Arcade.Group[];
      this.physics.world.collide(this.player, obstacles);
    }

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.pointer.x,
      this.pointer.y
    );

    // Rotates player to face towards reticle
    this.player.rotation = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      this.pointer.x,
      this.pointer.y
    );

    // Camera follows player ( can be set in create )
    this.cameras.main.startFollow(this.player);

    this.pointer.update(this.player);

    this.constrainVelocity(this.player, 500);
    this.constrainPointer(this.pointer);

    this.player.onUpdatePointer(this.pointer, distance);
  }

  constrainVelocity(player: Player, maxVelocity: number) {
    if (!player || !player.body) {
      return;
    }

    let vx = player.body.velocity.x;
    let vy = player.body.velocity.y;
    let currVelocitySqr = vx * vx + vy * vy;

    if (currVelocitySqr > maxVelocity * maxVelocity) {
      let angle = Math.atan2(vy, vx);
      vx = Math.cos(angle) * maxVelocity;
      vy = Math.sin(angle) * maxVelocity;
      player.body.velocity.x = vx;
      player.body.velocity.y = vy;
    }
  }

  constrainPointer(pointer: Pointer) {
    if (
      this.cameras.main.worldView.right <= 0 ||
      this.cameras.main.worldView.bottom <= 0
    ) {
      return;
    }

    // can't move pointer offscreen
    if (pointer.x < this.cameras.main.worldView.x) {
      pointer.x = this.cameras.main.worldView.x;
    } else if (pointer.x > this.cameras.main.worldView.right) {
      pointer.x = this.cameras.main.worldView.right;
    }

    if (pointer.y < this.cameras.main.worldView.y) {
      pointer.y = this.cameras.main.worldView.y;
    } else if (pointer.y > this.cameras.main.worldView.bottom) {
      pointer.y = this.cameras.main.worldView.bottom;
    }
  }
}
