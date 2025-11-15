import type { GameMap, GameResult, Pet } from '../types/game.types';
import { MapGenerator } from './world/MapGenerator';
import { Player } from './entities/Player';
import { AIBot } from './entities/AIBot';
import { PetController } from './entities/PetController';
import { CollisionSystem } from './systems/CollisionSystem';
import { RenderSystem } from './systems/RenderSystem';
import { InputSystem } from './systems/InputSystem';
import { Camera } from './systems/Camera';
import { PowerupManager } from './managers/PowerupManager';
import { GAME_CONFIG } from '../utils/Constants';
import { circleCollision, calculateRewards } from '../utils/Helpers';
import { Vector2D } from '../utils/Vector2D';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Entities
  private player: Player | null = null;
  private bot: AIBot | null = null;
  private map: GameMap | null = null;

  // Systems
  private collisionSystem: CollisionSystem | null = null;
  private renderSystem: RenderSystem;
  private inputSystem: InputSystem;
  private camera: Camera;
  private powerupManager: PowerupManager | null = null;

  // Game state
  private gameTime: number = GAME_CONFIG.GAME_DURATION;
  private elapsedTime: number = 0;
  private isPaused: boolean = false;
  private isRunning: boolean = false;

  // Frame timing
  private lastFrameTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;

  // Detection tracking
  private wasDetectedCount: number = 0;
  private lastDetectionCheck: boolean = false;

  // Callbacks
  private onGameOver: ((result: GameResult) => void) | null = null;
  private onPause: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, controlScheme: 'wasd' | 'arrows' = 'wasd') {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    this.renderSystem = new RenderSystem(this.ctx);
    this.inputSystem = new InputSystem(controlScheme);
    this.camera = new Camera(canvas.width, canvas.height);
  }

  init(skinId: string, petData: Pet | null, powerupIds: string[]): void {
    // Generate map
    const mapGenerator = new MapGenerator();
    this.map = mapGenerator.generateMap();

    // Initialize collision system
    this.collisionSystem = new CollisionSystem(this.map);

    // Initialize player
    this.player = new Player(this.map.playerSpawn.x, this.map.playerSpawn.y, skinId);

    // Initialize pet if exists
    if (petData) {
      const petController = new PetController(petData, this.player.position);
      this.player.setPet(petController);
    }

    // Initialize bot
    this.bot = new AIBot(this.map.botSpawn.x, this.map.botSpawn.y, this.collisionSystem);

    // Set bot patrol points (use room centers)
    const patrolPoints = this.map.rooms.map(room => new Vector2D(
      room.x + room.width / 2,
      room.y + room.height / 2
    ));
    this.bot.setPatrolPoints(patrolPoints);

    // Initialize powerup manager
    this.powerupManager = new PowerupManager(powerupIds);

    // Initialize camera position
    this.camera.position = this.player.position.clone();

    // Reset game state
    this.elapsedTime = 0;
    this.isPaused = false;
    this.wasDetectedCount = 0;
    this.lastDetectionCheck = false;
  }

  start(): void {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  pause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused && this.onPause) {
      this.onPause();
    }
  }

  setOnGameOver(callback: (result: GameResult) => void): void {
    this.onGameOver = callback;
  }

  setOnPause(callback: () => void): void {
    this.onPause = callback;
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // Cap at 100ms
    this.lastFrameTime = currentTime;

    // Update FPS
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    if (!this.isPaused) {
      this.update(deltaTime, currentTime / 1000);
    }

    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number, currentTime: number): void {
    if (!this.player || !this.bot || !this.map || !this.collisionSystem || !this.powerupManager) {
      return;
    }

    // Update game timer
    this.elapsedTime += deltaTime;

    // Check win condition
    if (this.elapsedTime >= this.gameTime) {
      this.handleWin();
      return;
    }

    // Update input
    const input = this.inputSystem.getInput();

    // Check pause
    if (input.pause) {
      this.pause();
      return;
    }

    // Check powerup activation
    if (input.powerup1) {
      this.powerupManager.activatePowerup(0, this.player, this.bot, currentTime);
    }
    if (input.powerup2) {
      this.powerupManager.activatePowerup(1, this.player, this.bot, currentTime);
    }
    if (input.powerup3) {
      this.powerupManager.activatePowerup(2, this.player, this.bot, currentTime);
    }

    // Update player
    this.player.update(deltaTime, input, this.collisionSystem, currentTime);

    // Check portal collisions
    const portal = this.player.checkPortalCollision(this.map.portals, currentTime);
    if (portal) {
      this.handlePortalTeleport(portal, currentTime);
    }

    // Update bot AI
    this.bot.update(deltaTime, this.player, this.map, this.collisionSystem, currentTime);

    // Track detection
    if (this.bot.isChasingPlayer() && !this.lastDetectionCheck) {
      this.wasDetectedCount++;
      this.lastDetectionCheck = true;
    } else if (!this.bot.isChasingPlayer()) {
      this.lastDetectionCheck = false;
    }

    // Check bot collision with player
    if (this.checkBotCaughtPlayer()) {
      this.handleLoss();
      return;
    }

    // Update powerups
    this.powerupManager.update(deltaTime);

    // Update camera to follow player
    this.camera.follow(this.player.position);
  }

  private render(): void {
    if (!this.map || !this.player || !this.bot) return;

    // Clear canvas
    this.renderSystem.clear(this.canvas.width, this.canvas.height);

    // Transform for camera
    this.ctx.save();
    this.camera.apply(this.ctx);

    // Render map
    this.renderSystem.renderMap(this.map);

    // Render portals
    this.renderSystem.renderPortals(this.map.portals);

    // Render player and pet
    this.renderSystem.renderPlayer(this.player);

    // Render bot
    this.renderSystem.renderBot(this.bot);

    this.ctx.restore();
  }

  private handlePortalTeleport(portal: { id: string; linkedPortalId: string }, currentTime: number): void {
    if (!this.player || !this.map) return;

    // Find linked portal
    const linkedPortal = this.map.portals.find(p => p.id === portal.linkedPortalId);
    if (linkedPortal) {
      this.player.position = new Vector2D(linkedPortal.position.x, linkedPortal.position.y);
      linkedPortal.lastUsed = currentTime;

      // Also update the original portal's lastUsed
      const originalPortal = this.map.portals.find(p => p.id === portal.id);
      if (originalPortal) {
        originalPortal.lastUsed = currentTime;
      }
    }
  }

  private checkBotCaughtPlayer(): boolean {
    if (!this.player || !this.bot) return false;
    return circleCollision(
      this.player.position,
      this.player.radius,
      this.bot.position,
      this.bot.radius
    );
  }

  private handleWin(): void {
    this.stop();

    if (this.onGameOver) {
      const timeRemaining = this.gameTime - this.elapsedTime;
      const result: GameResult = {
        won: true,
        timeRemaining,
        timeElapsed: this.elapsedTime,
        wasDetectedCount: this.wasDetectedCount,
        coinsEarned: calculateRewards({
          won: true,
          timeRemaining,
          timeElapsed: this.elapsedTime,
          wasDetectedCount: this.wasDetectedCount,
          coinsEarned: 0,
        }),
      };
      this.onGameOver(result);
    }
  }

  private handleLoss(): void {
    this.stop();

    if (this.onGameOver) {
      const result: GameResult = {
        won: false,
        timeRemaining: 0,
        timeElapsed: this.elapsedTime,
        wasDetectedCount: this.wasDetectedCount,
        coinsEarned: 0,
      };
      this.onGameOver(result);
    }
  }

  getTimeRemaining(): number {
    return Math.max(0, this.gameTime - this.elapsedTime);
  }

  getFPS(): number {
    return this.fps;
  }

  getPowerupSlots() {
    return this.powerupManager?.getSlots() || [];
  }

  isBotDetecting(): boolean {
    return this.bot?.isChasingPlayer() || false;
  }
}
