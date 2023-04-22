import PlayerInputs from "../controls/PlayerInputs";
import Player from "../objects/Player";

export default class GameScene extends Phaser.Scene {
  private _inputs: PlayerInputs;

  private field: Phaser.GameObjects.TileSprite;
  private reticle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private player: Player;
  private flashlight: Phaser.GameObjects.Light;
  private isDark: boolean;

  public get inputs(): PlayerInputs {
    return this._inputs;
  }

  public preload() {
    this.load.spritesheet("player", "assets/images/player.png", {
      frameWidth: 258,
      frameHeight: 220,
    });

    this.load.image("target", "assets/images/pointer.png");
    this.load.image("background", "assets/images/floor.png");
  }

  create() {
    this.physics.world.setBounds(0, 0, 1600, 1200);

    this.field = this.add.tileSprite(800, 600, 1600, 1200, "background");

    this.flashlight = this.lights
      .addLight(180, 80, 200)
      .setColor(0xffffff)
      .setIntensity(0);

    this.player = new Player(this, 800, 600, this.flashlight);
    this.player
      .setOrigin(0.5, 0.5)
      .setDisplaySize(132, 120)
      .setCollideWorldBounds(true);

    this.reticle = this.physics.add.sprite(800, 700, "target");
    this.reticle
      .setOrigin(0.5, 0.5)
      .setDisplaySize(25, 25)
      .setCollideWorldBounds(true);

    this.lighten();

    // Set camera zoom
    this.cameras.main.zoom = 1;

    // Locks pointer on mousedown
    this.game.canvas.addEventListener("mousedown", () => {
      this.game.input.mouse.requestPointerLock();
    });

    // Move reticle upon locked pointer move
    this.input.on(
      "pointermove",
      function (pointer) {
        if (this.input.mouse.locked) {
          this.reticle.x += pointer.movementX;
          this.reticle.y += pointer.movementY;
        }
      },
      this
    );

    this._inputs = new PlayerInputs(this.input);
  }

  darken() {
    this.isDark = true;
    this.lights.enable().setAmbientColor(0x333333);
    this.field.setPipeline("Light2D");
    this.player.setPipeline("Light2D");
    this.player.onDark();
  }

  lighten() {
    this.isDark = false;
    this.lights.disable();
    this.field.resetPipeline();
    this.player.resetPipeline();
    this.player.onLight();
  }

  update(_time, _delta) {
    if (Phaser.Input.Keyboard.JustDown(this.inputs.keys.zero)) {
      if (this.isDark) {
        this.lighten();
      } else {
        this.darken();
      }
    }

    // Rotates player to face towards reticle
    this.player.rotation =
      Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        this.reticle.x,
        this.reticle.y
      ) - 0.25;

    // Camera follows player ( can be set in create )
    this.cameras.main.startFollow(this.player);

    // Makes reticle move with player
    this.reticle.body.velocity.x = this.player.body.velocity.x;
    this.reticle.body.velocity.y = this.player.body.velocity.y;

    // Constrain velocity of player
    this.constrainVelocity(this.player, 500);

    // Constrain position of reticle
    this.constrainReticle(this.reticle);

    this.flashlight.x = this.reticle.x;
    this.flashlight.y = this.reticle.y;
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

  constrainReticle(reticle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    const distX = reticle.x - this.player.x; // X distance between player & reticle
    const distY = reticle.y - this.player.y; // Y distance between player & reticle

    // Ensures reticle cannot be moved offscreen
    if (distX > 800) {
      reticle.x = this.player.x + 800;
    } else if (distX < -800) {
      reticle.x = this.player.x - 800;
    }

    if (distY > 600) {
      reticle.y = this.player.y + 600;
    } else if (distY < -600) {
      reticle.y = this.player.y - 600;
    }
  }
}
