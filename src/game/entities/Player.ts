import { Vector2D } from '../../utils/Vector2D';
import type { InputState, Portal, PowerupEffect } from '../../types/game.types';
import { GAME_CONFIG } from '../../utils/Constants';
import { pointInCircle } from '../../utils/Helpers';
import type { CollisionSystem } from '../systems/CollisionSystem';
import type { PetController } from './PetController';

export class Player {
  position: Vector2D;
  velocity: Vector2D;
  speed: number;
  radius: number;
  rotation: number;

  // State
  isHidden: boolean;
  lastSoundTime: number;

  // Powerup effects
  activeEffects: Map<string, { effect: PowerupEffect; endTime: number }>;

  // Visual
  skinId: string;
  petController: PetController | null;

  constructor(x: number, y: number, skinId: string = 'default') {
    this.position = new Vector2D(x, y);
    this.velocity = Vector2D.zero();
    this.speed = GAME_CONFIG.PLAYER.SPEED;
    this.radius = GAME_CONFIG.PLAYER.RADIUS;
    this.rotation = 0;
    this.isHidden = false;
    this.lastSoundTime = 0;
    this.activeEffects = new Map();
    this.skinId = skinId;
    this.petController = null;
  }

  update(deltaTime: number, input: InputState, collisionSystem: CollisionSystem, currentTime: number): void {
    // Calculate movement
    let moveSpeed = this.speed;

    // Apply speed boost powerup
    if (this.hasActiveEffect('speed_boost')) {
      const effect = this.activeEffects.get('speed_boost');
      if (effect) {
        moveSpeed *= effect.effect.magnitude || 1.5;
      }
    }

    // Update velocity based on input
    this.velocity.x = input.moveX * moveSpeed;
    this.velocity.y = input.moveY * moveSpeed;

    // Normalize diagonal movement
    if (this.velocity.length() > moveSpeed) {
      const normalized = this.velocity.normalize();
      this.velocity.x = normalized.x * moveSpeed;
      this.velocity.y = normalized.y * moveSpeed;
    }

    // Update rotation if moving
    if (this.velocity.length() > 0) {
      this.rotation = this.velocity.angle();
    }

    // Calculate new position
    const newPosition = new Vector2D(
      this.position.x + this.velocity.x * deltaTime,
      this.position.y + this.velocity.y * deltaTime
    );

    // Check collision and resolve
    if (this.hasActiveEffect('wall_phase')) {
      // Can walk through walls
      this.position = newPosition;
    } else {
      if (collisionSystem.canMoveTo(newPosition, this.radius)) {
        this.position = newPosition;
      } else {
        // Try to slide along walls
        const resolved = collisionSystem.resolveCollision(newPosition, this.radius);
        this.position.x = resolved.x;
        this.position.y = resolved.y;
      }
    }

    // Check if player is making sound
    const currentSpeed = this.velocity.length();
    if (currentSpeed > GAME_CONFIG.PLAYER.SOUND_THRESHOLD) {
      this.lastSoundTime = currentTime;
    }

    // Update active effects
    this.updateEffects(currentTime);

    // Update pet if exists
    if (this.petController) {
      this.petController.update(deltaTime, this.position);
    }
  }

  checkPortalCollision(portals: Portal[], currentTime: number): Portal | null {
    for (const portal of portals) {
      if (pointInCircle(this.position, portal.position, portal.radius)) {
        // Check cooldown
        if (currentTime - portal.lastUsed > portal.cooldown) {
          return portal;
        }
      }
    }
    return null;
  }

  addEffect(id: string, effect: PowerupEffect, duration: number, currentTime: number): void {
    this.activeEffects.set(id, {
      effect,
      endTime: currentTime + duration,
    });
  }

  hasActiveEffect(type: string): boolean {
    for (const [, data] of this.activeEffects) {
      if (data.effect.type === type) {
        return true;
      }
    }
    return false;
  }

  private updateEffects(currentTime: number): void {
    // Remove expired effects
    for (const [id, data] of this.activeEffects) {
      if (currentTime >= data.endTime) {
        this.activeEffects.delete(id);
      }
    }
  }

  isMakingSound(currentTime: number): boolean {
    return currentTime - this.lastSoundTime < 0.1; // 100ms window
  }

  setPet(petController: PetController | null): void {
    this.petController = petController;
  }
}
