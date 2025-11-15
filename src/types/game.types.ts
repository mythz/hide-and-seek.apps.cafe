// Core game types

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameProgress {
  id: 'main';
  coins: number;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  bestTime: number;
  createdAt: Date;
  lastPlayed: Date;
}

export interface UnlockedItem {
  id: string;
  type: 'skin' | 'powerup' | 'pet';
  unlockedAt: Date;
}

export interface ActiveLoadout {
  id: 'current';
  skinId: string;
  petId: string | null;
  powerups: string[];
}

export interface LocalSettings {
  musicVolume: number;
  sfxVolume: number;
  showFPS: boolean;
  showMinimap: boolean;
  controlScheme: 'wasd' | 'arrows';
}

export interface PowerupEffect {
  type: 'speed_boost' | 'invisibility' | 'decoy' | 'time_slow' | 'wall_phase';
  magnitude?: number;
  duration?: number;
}

export interface Powerup {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration?: number;
  effect: PowerupEffect;
  icon: string;
  maxUses?: number;
}

export interface Portal {
  id: string;
  position: Vector2D;
  linkedPortalId: string;
  radius: number;
  cooldown: number;
  lastUsed: number;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'open' | 'maze' | 'safe';
}

export interface Corridor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameMap {
  width: number;
  height: number;
  rooms: Room[];
  corridors: Corridor[];
  walls: Wall[];
  portals: Portal[];
  playerSpawn: Vector2D;
  botSpawn: Vector2D;
}

export interface InputState {
  moveX: number;
  moveY: number;
  powerup1: boolean;
  powerup2: boolean;
  powerup3: boolean;
  pause: boolean;
}

export type GameState =
  | 'main_menu'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'game_over'
  | 'shop'
  | 'settings';

export interface GameResult {
  won: boolean;
  timeRemaining: number;
  timeElapsed: number;
  wasDetectedCount: number;
  coinsEarned: number;
}

export interface Pet {
  id: string;
  name: string;
  spriteId: string;
  ability: 'distraction' | 'early_warning' | 'speed_boost' | 'none';
  cooldown: number;
  followOffset: Vector2D;
  followSpeed: number;
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'skin' | 'powerup' | 'pet';
  description: string;
  cost: number;
  preview: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PowerupSlot {
  powerup: Powerup | null;
  usesRemaining: number;
  cooldownRemaining: number;
}

export type AIState = 'patrol' | 'chase' | 'search' | 'investigate';
