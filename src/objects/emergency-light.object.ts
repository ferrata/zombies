import config from "../game-config";
import { lightSourceMixin, LightSourceProps } from "../mixins/light-source.mixin";
import { debuggableMixin, DebuggableProps } from "../mixins/debuggable.mixin";
import { LightAwareProps } from "../mixins/light-aware.mixin";
import { GameSceneInterface } from "../types/game-scene";
import { MIXIN_LIGHT_AWARE } from "../core/instances";

export interface EmergencyLightObject
  extends Phaser.Physics.Arcade.Sprite,
    LightSourceProps,
    DebuggableProps,
    LightAwareProps {
  isOn: boolean;
  turnOn(): void;
  turnOff(): void;
}

export function createEmergencyLight(scene: Phaser.Scene, x: number, y: number, raycaster: Raycaster): EmergencyLightObject {
  const gameScene = scene as Phaser.Scene & { physics: Phaser.Physics.Arcade.ArcadePhysics };
  const sprite = gameScene.physics.add.sprite(x, y, "wall-lamp") as Phaser.Physics.Arcade.Sprite;

  sprite.setName("emergency-alarm-light");
  sprite.setOrigin(0.5, 0.5);
  sprite.setDisplaySize(60, 20);
  sprite.setDepth(config.depths.ceiling);

  const result = sprite
    .mixin(lightSourceMixin, { raycaster, config: config.emergencyAlarmLight })
    .mixin(debuggableMixin) as unknown as EmergencyLightObject;

  result.lightGraphics.setDepth(config.depths.light);

  Object.defineProperty(result, "isOn", {
    get() {
      return this.isLightEnabled;
    },
  });

  result.turnOn = function () {
    this.setTint();
    this.enableLight();
    this.setLightOrigin(this.x, this.y);
    this.setLightAngleDeg(this.angle - 90);
    this.lightRay?.setConeDeg(config.emergencyAlarmLight.coneDeg);
    this.lightRay?.setRayRange(config.emergencyAlarmLight.coneRange);
  };

  result.turnOff = function () {
    const gameScene = this.scene as GameSceneInterface | undefined;
    this.setTint(gameScene?.isDark ? 0x111111 : 0x505050);
    this.disableLight();
  };

  result.onLighten = function () {
    if (!this.isOn) {
      this.setTint(0x505050);
    }
  };

  result.onDarken = function () {
    if (!this.isOn) {
      this.setTint(0x111111);
    }
  };

  result.onLightOverReset = function () {};
  result.onLightOver = function () {};
  result.onLightningOver = function () {};
  (result as EmergencyLightObject & { onLighningtOver: typeof result.onLightningOver }).onLighningtOver = result.onLightningOver;
  result.setLightAwareShape = function () {};
  result.getLightAwareShape = function () { return null; };
  result.lightShape = null;

  // Track for light awareness so onLighten/onDarken get called
  result.track(MIXIN_LIGHT_AWARE);

  result.getDebugInfo = function () {
    return {
      name: this.name,
      x: this.x,
      y: this.y,
      angle: this.angle,
      isOn: this.isOn,
    };
  };

  result.drawDebugPhysics = function (graphics: Phaser.GameObjects.Graphics) {
    if (!this.lightRay) return;
    graphics.fillStyle(0xff0000, 0.5);
    this.lightRay.intersections.forEach((intersection: Phaser.Geom.Point) => {
      graphics.fillCircle(intersection.x, intersection.y, 3);
    });
  };

  // Start in off state with darkened tint
  const isDark = (scene as GameSceneInterface | undefined)?.isDark ?? false;
  result.setTint(isDark ? 0x111111 : 0x505050);

  return result;
}
