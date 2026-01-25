export enum StepOrder {
  Input = -100,
  BeforePhysics = -10,
  Physics = 0,
  AfterPhysics = 10,
  Default = 50,
  BeforeCamera = 90,
  BeforeRender = 100,
}
