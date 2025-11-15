// Game configuration constants

export const GAME_CONFIG = {
  GAME_DURATION: 180, // 3 minutes in seconds
  BASE_COIN_REWARD: 50,
  PERFECT_RUN_BONUS: 100,
  TIME_BONUS_THRESHOLD: 120,
  TIME_BONUS_REWARD: 25,
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,

  PLAYER: {
    SPEED: 200,
    RADIUS: 20,
    SPRINT_MULTIPLIER: 1.5,
    SOUND_THRESHOLD: 180, // speed at which player makes sound
  },

  BOT: {
    SPEED: 180,
    RADIUS: 25,
    VISION_RANGE: 300,
    VISION_ANGLE: 90, // degrees
    HEARING_RANGE: 200,
    CHASE_DURATION: 15,
    SEARCH_DURATION: 10,
    PATH_UPDATE_INTERVAL: 0.5, // seconds
  },

  MAP: {
    WIDTH: 3000,
    HEIGHT: 3000,
    MIN_ROOMS: 8,
    MAX_ROOMS: 12,
    MIN_ROOM_SIZE: 200,
    MAX_ROOM_SIZE: 400,
    CORRIDOR_WIDTH: 80,
    MIN_PORTALS: 6,
    MAX_PORTALS: 10,
    COLLISION_CELL_SIZE: 50,
  },

  PORTAL: {
    RADIUS: 40,
    COOLDOWN: 2, // seconds
  },

  CAMERA: {
    SMOOTHNESS: 0.1,
    ZOOM: 1,
  }
};

export const DEFAULT_SETTINGS = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  showFPS: false,
  showMinimap: true,
  controlScheme: 'wasd' as const,
};

export const SKIN_COLORS: Record<string, string> = {
  default: '#4aa8dd',
  skin_ninja: '#2d2d2d',
  skin_robot: '#64c8ff',
  skin_ghost: '#9b59b6',
  skin_flame: '#e74c3c',
  skin_ice: '#3498db',
};
