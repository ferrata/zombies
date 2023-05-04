import GameScene from "../scenes/GameScene";

export class CasingEmitter extends Phaser.GameObjects.Container {
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private emitterAngle: number;
  private emitterOfffset: { x: number; y: number };
  private isDark: boolean;
  private debug: Phaser.GameObjects.Rectangle;

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    casingsTexture: string,
    casingsScale: { from: number; to: number }
  ) {
    super(scene, x, y);

    const textures = this.scene.textures.get(casingsTexture);
    this.emitter = this.scene.add.particles(0, 0, textures, {
      angle: (): number => {
        return this.emitterAngle + 90 + Phaser.Math.Between(-15, 15);
      },
      rotate: (): number => {
        return this.emitterAngle + 90 + Phaser.Math.Between(-25, 25);
      },
      maxVelocityX: {
        onEmit: (): number => {
          return Phaser.Math.Between(220, 245);
        },
        onUpdate: (particle: Phaser.GameObjects.Particles.Particle): number => {
          if (particle.lifeT > 0.5) {
            return 0;
          } else if (particle.lifeT > 0.3) {
            return Phaser.Math.Between(5, 10);
          } else if (particle.lifeT > 0.1) {
            return 10;
          }

          return particle.maxVelocityX;
        },
      },
      maxVelocityY: {
        onUpdate: (particle: Phaser.GameObjects.Particles.Particle): number => {
          if (particle.lifeT > 0.5) {
            return 0;
          } else if (particle.lifeT > 0.3) {
            return Phaser.Math.Between(5, 10);
          } else if (particle.lifeT > 0.1) {
            return 10;
          }

          return Phaser.Math.Between(220, 245);
        },
      },
      lifespan: { min: 900, max: 2000 },
      speed: { min: 20, max: 245 },
      scale: {
        onEmit: () => {
          return casingsScale.from;
        },
        onUpdate: (particle: Phaser.GameObjects.Particles.Particle): number => {
          if (particle.lifeT < 0.08) {
            return particle.scaleX;
          }

          return casingsScale.to;
        },
      },
      emitting: false,
      stopAfter: 1,
    });

    this.emitter.onParticleEmit(
      (particle: Phaser.GameObjects.Particles.Particle) => {
        particle.setPosition(this.emitterOfffset.x, this.emitterOfffset.y);
        if (this.isDark) {
          particle.tint = 0x000000;
        }
      }
    );

    this.scene.physics.world.enable(
      (this.debug = scene.add
        .rectangle(0, 0, 10, 20, 0xff00ff, 0.5)
        .setOrigin(0.5, 0.5)
        .setVisible(this.scene.physics.world.drawDebug))
    );

    this.scene.add.existing(this.emitter);
  }

  public setEmitterPosition(
    center: { x: number; y: number },
    length: number,
    angle: number
  ) {
    const offset = new Phaser.Math.Vector2(center);
    offset.setLength(length).setAngle(Phaser.Math.DegToRad(angle));

    this.emitterOfffset = { x: center.x + offset.x, y: center.y + offset.y };
    this.debug
      .setPosition(this.emitterOfffset.x, this.emitterOfffset.y)
      .setVisible(this.scene.physics.world.drawDebug);
  }

  public setEmitterAngle(angle: number) {
    this.emitterAngle = angle;
    this.debug.setAngle(angle).setVisible(this.scene.physics.world.drawDebug);
  }

  public onLight() {
    this.isDark = false;
    this.updateTintForAllAlive(0xffffff);
  }

  public onDark() {
    this.isDark = true;
    this.updateTintForAllAlive(0x000000);
  }

  public emitOne(casingName: string) {
    this.emitter.setEmitterFrame(casingName);
    this.emitter.start();
  }

  private updateTintForAllAlive(tint: number) {
    this.emitter.forEachAlive(
      (particle: Phaser.GameObjects.Particles.Particle) => {
        particle.tint = tint;
      },
      this.emitter
    );
  }
}
