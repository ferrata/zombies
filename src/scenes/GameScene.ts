import PhaserRaycaster from "phaser-raycaster";
import config from "../GameConfig";
import PlayerInputs from "../controls/PlayerInputs";
import Flashlight from "../objects/Flashlight";
import Pointer from "../objects/Pointer";
import Player from "../objects/Player";
import { Event } from "./Event";
import { Pointable } from "../types/Pointable";
import { isLightAware, LightAware } from "../types/LightAware";
import { IObstacle } from "../types/Obstacle";
import { StaticMatterThing } from "../objects/StaticMatterThing";
import {
  StaticMatterProjectionRectangle,
  StaticMatterProjectionCircle,
} from "../objects/StaticMatterProjection";
import EmergencyAlarmLight from "../objects/EmergencyAlarmLight";
import {
  ILightSource,
  LightSource,
  LightSourceConfig,
} from "../types/LightSource";

export default class GameScene extends Phaser.Scene {
  private _inputs: PlayerInputs;
  private _isDark: boolean;
  private _lightSceneGraphics: Phaser.GameObjects.Graphics;
  private _lightShadowSceneGraphics: Phaser.GameObjects.Graphics;

  private raycasterPlugin: PhaserRaycaster;
  private fieldUnderLight: Phaser.GameObjects.TileSprite;
  private fieldUnderLightShadow: Phaser.GameObjects.TileSprite;
  private field: Phaser.GameObjects.TileSprite;
  private pointer: Pointer;
  private player: Player;
  private lightSources: ILightSource[] = [];
  private objects: any[] = [];
  private obstacles: IObstacle[] = [];
  private redLight: {
    light: EmergencyAlarmLight;
    isOn: boolean;
    enabled: boolean;
  };

  public get isDark(): boolean {
    return this._isDark;
  }

  public get lightSceneGraphics(): Phaser.GameObjects.Graphics {
    if (this._lightSceneGraphics.postFX.list.length === 0) {
      this._lightSceneGraphics.setPipeline("Light2D");
    }

    return this._lightSceneGraphics;
  }

  public get lightShadowSceneGraphics(): Phaser.GameObjects.Graphics {
    if (this._lightShadowSceneGraphics.postFX.list.length === 0) {
      this._lightShadowSceneGraphics.setPipeline("Light2D");
    }

    return this._lightShadowSceneGraphics;
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
    const { width, height } = { width: 1600, height: 1200 };

    this.physics.world.setBounds(0, 0, width, height);
    this.matter.world.setBounds(0, 0, width, height);

    this.fieldUnderLight = this.add
      .tileSprite(800, 600, width, height, "background")
      .setDepth(config.depths.background - 2);
    this.fieldUnderLight.setPipeline("Light2D");

    this.fieldUnderLightShadow = this.add
      .tileSprite(800, 600, width, height, "background")
      .setDepth(config.depths.background - 1)
      .setTint(config.colors.darkenShadowTintColor);
    this.fieldUnderLightShadow.setPipeline("Light2D");

    this.field = this.add
      .tileSprite(800, 600, width, height, "background")
      .setDepth(config.depths.background);
    this.field.setPipeline("Light2D");

    this.lights.enable();
    this.lights.setAmbientColor(0xffffff);

    this._lightSceneGraphics = this.add
      .graphics()
      .setName("lightSceneGraphics");

    this._lightShadowSceneGraphics = this.add
      .graphics()
      .setName("lightShadowSceneGraphics");

    this.field.setMask(
      this._lightShadowSceneGraphics.createGeometryMask().setInvertAlpha(true)
    );

    this.fieldUnderLightShadow.setMask(
      this._lightSceneGraphics.createGeometryMask().setInvertAlpha(true)
    );

    const barrel = new (LightAware(StaticMatterThing))(
      this,
      970,
      400,
      "barrel-damaged"
    )
      .setScale(0.3)
      .setOrigin(0.5, 0.5)
      .setAngle(25);

    barrel.setLightAwareShape(
      barrel.createPolygon([
        { x: 3, y: 36 },
        { x: 211, y: 11 },
        { x: 310, y: 13 },
        { x: 440, y: 18 },
        { x: 518, y: 41 },
        { x: 625, y: 31 },
        { x: 629, y: 235 },
        { x: 592, y: 428 },
        { x: 496, y: 412 },
        { x: 444, y: 422 },
        { x: 404, y: 406 },
        { x: 390, y: 369 },
        { x: 320, y: 340 },
        { x: 271, y: 380 },
        { x: 209, y: 409 },
        { x: 81, y: 432 },
        { x: 32, y: 274 },
      ])
    );

    const barrel2 = new (LightAware(StaticMatterThing))(
      this,
      770,
      350,
      "barrel"
    )
      .setScale(0.3)
      .setCircle(80)
      .setAngle(-15)
      .setOrigin(0.5, 0.5);

    barrel2.setLightAwareShape(barrel2.createCircle(73));

    const barrel3 = new (LightAware(StaticMatterThing))(
      this,
      900,
      220,
      "barrel-damaged-2"
    )
      .setScale(0.3)
      .setCircle(75)
      .setAngle(165)
      .setOrigin(0.5, 0.5);

    barrel3.setLightAwareShape(barrel3.createCircle(73));

    this.obstacles.push(new StaticMatterProjectionRectangle(this, barrel));
    this.obstacles.push(new StaticMatterProjectionCircle(this, barrel2, 75));
    this.obstacles.push(new StaticMatterProjectionCircle(this, barrel3, 70));

    this.objects.push(
      new (Pointable(Flashlight))(
        this,
        820,
        360,
        this.createRaycaster()
      ).setAngle(-45),
      barrel,
      barrel2
    );

    this.player = new Player(this, 800, 600);
    this.pointer = new Pointer(this, 800, 500);

    this.redLight = {
      light: new EmergencyAlarmLight(
        this,
        10,
        200,
        this.raycasterPlugin.createRaycaster()
      ).setAngle(90),
      isOn: false,
      enabled: false,
    };

    this.time.addEvent({
      delay: 1000,
      callback: () => (this.redLight.isOn = !this.redLight.isOn),
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
      Phaser.Input.Events.POINTER_MOVE,
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
      console.error("Unknown object", item.name);
    });

    this.events.on(Event.NO_OBJECT_IN_RANGE, () => {
      console.error("No object in range");
    });

    this.events.on(Event.OBJECT_TOO_FAR, (item: any) => {
      console.error(`${item.name} is too far`);
    });

    this.events.on(Event.OBJECT_STILL_TOO_FAR, (item: any) => {
      console.error(`Can't reach this damn ${item.name}. It is still too far`);
    });

    this.events.on(Event.INTERACT_WITH_OBJECT, () => {
      const item = this.closestObject();
      if (item) {
        this.player.interactWithObject(item);
      } else {
        this.events.emit(Event.NO_OBJECT_IN_RANGE);
      }
    });

    this.events.on(Phaser.Scenes.Events.POST_UPDATE, () => {
      this.player?.postUpdate();

      if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.zero)) {
        if (this.isDark) {
          this.lighten();
        } else {
          this.darken();
        }
      }

      if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.nine)) {
        this.redLight.enabled = !this.redLight.enabled;
      }
    });

    this.events.on(Phaser.Scenes.Events.PRE_RENDER, () => {
      // reset light effects
      this.children.each((child) => {
        if (isLightAware(child)) {
          child.onLightOverReset();
        }
      });

      this.lightShadowSceneGraphics.clear();
      this.lightSceneGraphics.clear();

      // update lights
      if (this.redLight?.enabled) {
        if (this.redLight.isOn) {
          this.redLight.light.turnOn();
        } else {
          this.redLight.light.turnOff();
        }
      }

      this.lightSources.forEach((child) => {
        if (child.isEnabled) {
          child.emitLight();
        }
      });
    });
  }

  public createRaycaster(): Raycaster {
    return this.raycasterPlugin.createRaycaster();
  }

  public createLightSource(name: string, config: LightSourceConfig) {
    const lightSource = new LightSource(
      this,
      this.createRaycaster(),
      name,
      config
    );
    this.lightSources.push(lightSource);
    return lightSource;
  }

  darken() {
    this._isDark = true;
    this.lightSceneGraphics.clear();
    this.lightShadowSceneGraphics.clear();

    this.field.setTint(config.colors.darkenTintColor);

    this.children.each((child) => {
      if (isLightAware(child)) {
        // console.log("darken", child.name);
        child.onDarken();
      }
    });
  }

  lighten() {
    this._isDark = false;
    this.lightSceneGraphics.clear();
    this.lightShadowSceneGraphics.clear();

    this.field.setTint();

    this.children.each((child) => {
      if (isLightAware(child)) {
        // console.log("lighten", child.name);
        child.onLighten();
      }
    });
  }

  update(_time, _delta) {
    if (this.obstacles.length > 0) {
      const obstacles = this.obstacles as Phaser.Physics.Arcade.Group[];
      this.physics.world.collide(this.player, obstacles);
    }

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
