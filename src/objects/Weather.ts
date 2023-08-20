import config from "../GameConfig";
import GameScene from "../scenes/GameScene";
import Player from "./Player";

export interface IWeather {
  isOn: boolean;

  start: () => void;
  stop: () => void;
}

export class WeatherConditions {
  private rain: Rain;
  private snow: Snow;

  constructor(scene: GameScene, player: Player) {
    this.rain = new Rain(scene, player);
    this.snow = new Snow(scene);
  }

  toggle() {
    if (this.rain.isOn) {
      this.rain.stop();
      this.snow.start();
    } else if (this.snow.isOn) {
      this.snow.stop();
    } else {
      this.rain.start();
    }
  }

  getDebugInfo() {
    if (this.rain.isOn) {
      return "rain";
    }

    if (this.snow.isOn) {
      return "snow";
    }

    return "clear";
  }
}

export class Snow implements IWeather {
  private snow: Phaser.GameObjects.Particles.ParticleEmitter;

  public isOn: boolean;

  constructor(private scene: GameScene) {
    const { width, height } = scene.physics.world.bounds;

    this.snow = scene.add
      .particles(0, 0, "rain-splash", {
        x: -100,
        y: -100,
        speed: (particle) => {
          if (particle.lifeCurrent < Math.random() * 500) {
            return 0;
          }

          return Math.random() * 100 + 50;
        },
        lifespan: Math.random() * 10000,
        quantity: 10,
        angle: 30,
        alpha: { start: 1, end: 0.2 },
        scale: { start: 0.2, end: 0 },
        tint: {
          onEmit: () => this.getSnowColor(),
          onUpdate: () => this.getSnowColor(),
        },
      })
      .setDepth(config.depths.ceiling);

    this.snow.addEmitZone({
      source: new Phaser.Geom.Rectangle(0, 0, width, height),
    });

    this.snow.stop();
  }

  start() {
    this.isOn = true;
    this.snow.start();
  }

  stop() {
    this.isOn = false;
    this.snow.stop();
  }

  private getSnowColor() {
    return this.scene.isDark ? 0x555555 : 0xffffff;
  }
}

export class Rain implements IWeather {
  private rainSplashParticles: Phaser.GameObjects.Particles.ParticleEmitter;
  private rainDrops: Phaser.GameObjects.Particles.ParticleEmitter;
  private lightning: Phaser.Time.TimerEvent;

  public isOn: boolean;

  constructor(private scene: GameScene, private player: Player) {
    const { width, height } = scene.physics.world.bounds;

    this.rainSplashParticles = scene.add
      .particles(0, 0, "rain-splash", {
        x: 0,
        y: 0,
        speed: 0,
        lifespan: 700,
        quantity: 10,
        alpha: { start: 0.3, end: 0 },
        scale: { start: 0.2, end: 0.5 },
        tint: {
          onUpdate: () => {
            return scene.isDark ? 0x000000 : 0x111111;
          },
        },
      })
      .setDepth(config.depths.matterThingBottom);

    this.rainSplashParticles.addEmitZone({
      source: new Phaser.Geom.Rectangle(0, 0, width, height),
    });

    this.rainSplashParticles.stop();

    const rainDropSpeed = 700;
    this.rainDrops = scene.add
      .particles(0, 0, "rain-splash", {
        x: 0,
        y: 0,
        angle: (particle) => {
          const playerSpot = this.player.body.center;

          const angle = Phaser.Math.Angle.Between(
            particle.x,
            particle.y,
            playerSpot.x,
            playerSpot.y
          );

          return Phaser.Math.RadToDeg(angle);
        },

        speed: (particle) => {
          const playerSpot = this.player.body.center;

          const distance = Phaser.Math.Distance.Between(
            playerSpot.x,
            playerSpot.y,
            particle.x,
            particle.y
          );

          return distance > 500
            ? rainDropSpeed
            : rainDropSpeed * (distance / 500);
        },
        lifespan: 300,
        quantity: 10,
        alpha: { start: 0.8, end: 0.2 },
        scale: { start: 0.2, end: 0 },
        tint: {
          onUpdate: () => {
            return scene.isDark ? 0x000000 : 0x4c4c4c;
          },
        },
      })
      .setDepth(config.depths.ceiling);

    this.rainDrops.addEmitZone({
      source: new Phaser.Geom.Rectangle(0, 0, width, height),
    });

    this.rainDrops.stop();
  }

  start() {
    this.isOn = true;
    this.rainSplashParticles.start();
    this.rainDrops.start();

    this.lightning = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (Math.random() > 0.98) {
          const flashTime = Math.random() * 800;
          this.scene.cameras.main.flash(
            flashTime,
            0xf0,
            0xf0,
            0xf0,
            false,
            (_, progress: number) => {
              this.scene.reactToLightning(progress);
            }
          );
        }
      },
    });
  }

  stop() {
    this.isOn = false;
    this.rainSplashParticles.stop();
    this.rainDrops.stop();

    this.lightning?.destroy();
  }
}
