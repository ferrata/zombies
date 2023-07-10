export default {
  depths: {
    background: 0,

    player: 1000,
    pointer: 1000,
    casingEmitter: 500,

    matterThingBottom: 100,
    matterThingTop: 400,

    lightAwareShape: 200,
    pointableObject: 1000,
    light: 150,

    ceiling: 3000,

    debug: 10000,
  },

  flashlight: {
    emitOnDayLight: true,

    lightColor: 0xffffff,
    lightAlpha: 0.3,

    collisionRange: 900,
    coneDeg: 35,
    coneRange: 2000,
    closeRange: 800,

    forceLightOver: false,
  },

  weapon: {
    shotDelay: 120,

    muzzle: {
      light: {
        emitOnDayLight: false,

        lightColor: 0xffffff,
        lightAlpha: 0.3,

        collisionRange: 900,
        coneDeg: 360,
        coneRange: 2000,
        closeRange: 800,

        forceLightOver: true,
      },

      duration: 100,
    },
  },

  emergencyAlarmLight: {
    emitOnDayLight: true,

    lightColor: 0xff0000,
    lightAlpha: 0.15,

    collisionRange: 900,
    coneDeg: 170,
    coneRange: 2000,
    closeRange: 800,

    forceLightOver: false,
  },

  colors: {
    darkenTintColor: 0x212121,
    darkenShadowTintColor: 0x323232,
    darkenColorMatrixBrightness: 0.2,
  },

  player: {
    speed: {
      run: 500,
      walk: 230,
      strafe: 230,
      strafeFast: 500,
    },

    reach: 150,
    reachAngle: 15,
  },
};
