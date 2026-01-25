import config from "../game-config";
import { Instances } from "../core/instances";
import { lightAwareMixin, LightAwareProps, isLightAware } from "./light-aware.mixin";

export interface LightSourceConfig {
  emitOnDayLight: boolean;
  lightColor: number;
  lightAlpha: number;
  collisionRange: number;
  coneDeg: number;
  coneRange: number;
  closeRange: number;
  forceLightOver: boolean;
}

export interface LightSourceProps {
  lightConfig: LightSourceConfig;
  lightRay: Raycaster.Ray | null;
  lightGraphics: Phaser.GameObjects.Graphics;
  lightRaycaster: Raycaster;

  get isLightEnabled(): boolean;
  enableLight(): void;
  disableLight(): void;
  emitLight(): void;
  setLightOrigin(x: number, y: number): void;
  setLightAngleDeg(angle: number): void;
  mapLightAwareObject(obj: LightAwareProps): void;
}

export function lightSourceMixin<
  T extends Phaser.GameObjects.GameObject & { x: number; y: number; name?: string }
>(obj: T, cfg: { raycaster: Raycaster; config: LightSourceConfig }): T & LightSourceProps {
  const result = obj as T & LightSourceProps;

  result.lightConfig = cfg.config;
  result.lightRaycaster = cfg.raycaster;
  result.lightRay = null;

  result.lightGraphics = obj.scene.add
    .graphics({ fillStyle: { color: cfg.config.lightColor, alpha: cfg.config.lightAlpha } })
    .setName(`${obj.name ?? "light"}-graphics`);

  // Map existing light-aware objects
  const lightAwareShapes: Phaser.GameObjects.Shape[] = [];
  for (const lightAwareObj of Instances(lightAwareMixin)) {
    const shape = lightAwareObj.getLightAwareShape();
    if (shape) lightAwareShapes.push(shape);
  }
  cfg.raycaster.mapGameObjects(lightAwareShapes);

  Object.defineProperty(result, "isLightEnabled", {
    get() {
      return this.lightRay != null;
    },
  });

  result.enableLight = function () {
    this.lightRay = this.lightRaycaster.createRay({ collisionRange: this.lightConfig.collisionRange });
    this.lightRay.autoSlice = true;
  };

  result.disableLight = function () {
    this.lightGraphics.clear();
    this.lightRay?.destroy();
    this.lightRay = null;
  };

  result.setLightOrigin = function (x: number, y: number) {
    if (this.lightRay) {
      this.lightRay.origin.x = x;
      this.lightRay.origin.y = y;
    }
  };

  result.setLightAngleDeg = function (angle: number) {
    this.lightRay?.setAngleDeg(angle);
  };

  result.mapLightAwareObject = function (lightAwareObj: LightAwareProps) {
    const shape = lightAwareObj.getLightAwareShape();
    if (shape) {
      this.lightRaycaster.mapGameObjects([shape]);
    }
  };

  result.emitLight = function () {
    if (!this.lightRay) return;

    const gameScene = this.scene as any;
    let mappedObjectUnderLight: any = null;

    const mappedObjects = this.lightRaycaster.mappedObjects.filter((object: any) => {
      if (this.lightConfig.forceLightOver && object instanceof Phaser.GameObjects.Shape) {
        const ownerBody = (object as any).owner?.body as Phaser.Types.Physics.Matter.MatterBody;
        if (
          ownerBody &&
          (ownerBody as any).bounds &&
          this.scene.matter.intersectPoint(this.lightRay.origin.x, this.lightRay.origin.y, [ownerBody]).length > 0
        ) {
          mappedObjectUnderLight = object;
          return false;
        }
      }
      return true;
    });

    const intersections = this.lightRay.castCone({ objects: mappedObjects });
    const initialIntersections = intersections.slice();
    intersections.push(this.lightRay.origin);

    if (!gameScene.isDark) {
      if (this.lightConfig.emitOnDayLight) {
        this.lightGraphics.clear().fillPoints(intersections);
      }
      return;
    }

    const leftEdgePoint = new Phaser.Math.Vector2(this.lightRay.origin.x, this.lightRay.origin.y)
      .setLength(this.lightConfig.coneRange)
      .setAngle(this.lightRay.angle - this.lightRay.cone / 2)
      .add(this.lightRay.origin);

    gameScene.lightShadowSceneGraphics
      .fillStyle(0xffffff, 0)
      .beginPath()
      .moveTo(this.lightRay.origin.x, this.lightRay.origin.y)
      .lineTo(leftEdgePoint.x, leftEdgePoint.y)
      .arc(
        this.lightRay.origin.x,
        this.lightRay.origin.y,
        this.lightConfig.coneRange,
        this.lightRay.angle - this.lightRay.cone / 2,
        this.lightRay.angle + this.lightRay.cone / 2
      )
      .lineTo(this.lightRay.origin.x, this.lightRay.origin.y)
      .fillPath()
      .fillPoints(intersections);

    gameScene.lightSceneGraphics.fillStyle(0xffffff, 0).fillPoints(intersections);
    gameScene.lightSceneGraphics.fillStyle(this.lightConfig.lightColor, this.lightConfig.lightAlpha).fillPoints(intersections);

    const affectedObjects = initialIntersections.reduce((acc: any[], intersection: any) => {
      if (intersection.object && acc.indexOf(intersection.object) === -1) {
        acc.push(intersection.object);
      }
      return acc;
    }, []);

    affectedObjects.forEach((object: any) => {
      const owner = object.owner as LightAwareProps;
      if (owner && isLightAware(owner)) {
        owner.onLightOver(this.lightRay!, initialIntersections, false);
      }
    });

    if (mappedObjectUnderLight) {
      const owner = mappedObjectUnderLight.owner as LightAwareProps;
      if (owner && isLightAware(owner)) {
        owner.onLightOver(this.lightRay!, initialIntersections, true);
      }
    }
  };

  result.track(lightSourceMixin);

  return result;
}
