/// <reference path="./spine.d.ts" />
/// <reference path="./SpinePlugin.d.ts" />

declare type SpineGameObject = Phaser.GameObjects.GameObject & {
  // hasTransformComponent: boolean;
  // copyPosition(

  // declare interface SpineGameObject extends Phaser.GameObjects.GameObject {
  hasTransformComponent: boolean;
  copyPosition(
    source:
      | Phaser.Types.Math.Vector2Like
      | Phaser.Types.Math.Vector3Like
      | Phaser.Types.Math.Vector4Like
  ): SpineGameObject;
  getLocalPoint(
    x: number,
    y: number,
    point?: Phaser.Math.Vector2,
    camera?: Phaser.Cameras.Scene2D.Camera
  ): Phaser.Math.Vector2;

  alpha: number;
  angle: number;

  readonly blendMode: number;

  blue: number;
  bounds: any;
  displayOriginX: number;
  displayOriginY: number;
  drawDebug: boolean;
  depth: number;
  displayWidth: number;
  displayHeight: number;
  flipX: boolean;
  flipY: boolean;
  green: number;
  height: number;
  plugin: SpinePlugin;
  preMultipliedAlpha: boolean;
  red: number;
  root: spine.Bone;
  rotation: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  scrollFactorX: number;
  scrollFactorY: number;
  skeleton: spine.Skeleton;
  skeletonData: spine.SkeletonData;

  state: spine.AnimationState & Partial<EventListener>;

  stateData: spine.AnimationStateData;

  timeScale: number;
  visible: boolean;
  x: number;
  y: number;
  z: number;
  w: number;
  width: number;

  key: string;

  addAnimation(
    trackIndex: number,
    animationName: string,
    loop?: boolean,
    delay?: number
  ): spine.TrackEntry;
  angleBoneToXY(
    bone: spine.Bone,
    worldX: number,
    worldY: number,
    offset?: number,
    minAngle?: number,
    maxAngle?: number
  ): SpineGameObject;
  clearTrack(trackIndex: number): SpineGameObject;
  clearTracks(): SpineGameObject;
  findAnimation(animationName: string): spine.Animation;
  findBone(boneName: string): spine.Bone;
  findBoneIndex(boneName: string): number;
  findEvent(eventDataName: string): spine.EventData;
  findIkConstraint(constraintName: string): spine.IkConstraintData;
  findPathConstraint(constraintName: string): spine.PathConstraintData;
  findPathConstraintIndex(constraintName: string): number;
  findSkin(skinName: string): spine.Skin;
  findSlot(slotName: string): spine.Slot;
  findSlotIndex(slotName: string): number;
  findTransformConstraint(
    constraintName: string
  ): spine.TransformConstraintData;
  getAnimationList(): string[];
  getAttachment(slotIndex: number, attachmentName: string): spine.Attachment;
  getAttachmentByName(
    slotName: string,
    attachmentName: string
  ): spine.Attachment;
  getBoneList(): string[];
  getBounds(): any;
  getCurrentAnimation(trackIndex?: number): spine.Animation;
  getLocalTransformMatrix(
    tempMatrix?: Phaser.GameObjects.Components.TransformMatrix
  ): Phaser.GameObjects.Components.TransformMatrix;
  getParentRotation(): number;
  getRootBone(): spine.Bone;
  getSkinList(): string[];
  getSlotList(): string[];
  getWorldTransformMatrix(
    tempMatrix?: Phaser.GameObjects.Components.TransformMatrix,
    parentMatrix?: Phaser.GameObjects.Components.TransformMatrix
  ): Phaser.GameObjects.Components.TransformMatrix;
  play(
    animationName: string,
    loop?: boolean,
    ignoreIfPlaying?: boolean
  ): SpineGameObject;

  refresh(): SpineGameObject;
  resetFlip(): SpineGameObject;
  setAlpha(value?: number): SpineGameObject;
  setAngle(degrees?: number): SpineGameObject;
  setAnimation(
    trackIndex: number,
    animationName: string,
    loop?: boolean,
    ignoreIfPlaying?: boolean
  ): spine.TrackEntry;
  setAttachment(slotName: string, attachmentName: string): SpineGameObject;
  setBonesToSetupPose(): SpineGameObject;
  setColor(color?: number, slotName?: string): SpineGameObject;
  setDepth(value: number): SpineGameObject;
  setDisplaySize(width: number, height: number): SpineGameObject;
  setEmptyAnimation(trackIndex: number, mixDuration?: number): spine.TrackEntry;
  setFlipX(value: boolean): SpineGameObject;
  setFlipY(value: boolean): SpineGameObject;
  setFlip(x: boolean, y: boolean): SpineGameObject;
  setMix(fromName: string, toName: string, duration?: number): SpineGameObject;
  setOffset(offsetX?: number, offsetY?: number): SpineGameObject;
  setPosition(x?: number, y?: number, z?: number, w?: number): SpineGameObject;
  setRandomPosition(
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ): SpineGameObject;
  setRotation(radians?: number): SpineGameObject;
  setScale(x: number, y?: number): SpineGameObject;
  setScrollFactor(x: number, y?: number): SpineGameObject;
  setSize(
    width?: number,
    height?: number,
    offsetX?: number,
    offsetY?: number
  ): SpineGameObject;
  setSkeleton(
    atlasDataKey: string,
    animationName?: string,
    loop?: boolean,
    skeletonJSON?: object
  ): SpineGameObject;
  setSkeletonFromJSON(
    atlasDataKey: string,
    skeletonJSON: object,
    animationName?: string,
    loop?: boolean
  ): SpineGameObject;
  setSkin(newSkin: spine.Skin): SpineGameObject;
  setSkinByName(skinName: string): SpineGameObject;
  setSlotsToSetupPose(): SpineGameObject;
  setToSetupPose(): SpineGameObject;
  setVisible(value: boolean): SpineGameObject;
  setX(value?: number): SpineGameObject;
  setY(value?: number): SpineGameObject;
  setZ(value?: number): SpineGameObject;
  setW(value?: number): SpineGameObject;
  toggleFlipX(): SpineGameObject;
  toggleFlipY(): SpineGameObject;
  updateSize(): SpineGameObject;
  willRender(): boolean;
};

declare interface SpineGameObjectConfig
  extends Phaser.Types.GameObjects.GameObjectConfig {
  key?: string;
  animationName?: string;
  loop?: boolean;
  skinName?: string;
  slotName?: string;
  attachmentName?: string;
}
