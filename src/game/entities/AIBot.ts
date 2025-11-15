import { Vector2D } from '../../utils/Vector2D';
import type { AIState, GameMap } from '../../types/game.types';
import { GAME_CONFIG } from '../../utils/Constants';
import { randomInt, degToRad, angleDifference } from '../../utils/Helpers';
import type { Player } from './Player';
import type { CollisionSystem } from '../systems/CollisionSystem';
import { AIPathfinding } from '../systems/AIPathfinding';

export class AIBot {
  position: Vector2D;
  velocity: Vector2D;
  speed: number;
  radius: number;
  rotation: number;

  // AI State Machine
  state: AIState;
  target: Vector2D | null;
  lastSeenPlayerPos: Vector2D | null;
  lastSeenPlayerTime: number;

  // Detection
  visionRange: number;
  visionAngle: number;
  hearingRange: number;

  // Pathfinding
  path: Vector2D[];
  patrolPoints: Vector2D[];
  currentPatrolIndex: number;
  pathfinding: AIPathfinding;
  lastPathUpdate: number;

  // State timers
  chaseStartTime: number;
  searchStartTime: number;

  // Slowdown effect
  slowdownFactor: number;
  slowdownEndTime: number;

  constructor(x: number, y: number, collisionSystem: CollisionSystem) {
    this.position = new Vector2D(x, y);
    this.velocity = Vector2D.zero();
    this.speed = GAME_CONFIG.BOT.SPEED;
    this.radius = GAME_CONFIG.BOT.RADIUS;
    this.rotation = 0;

    this.state = 'patrol';
    this.target = null;
    this.lastSeenPlayerPos = null;
    this.lastSeenPlayerTime = 0;

    this.visionRange = GAME_CONFIG.BOT.VISION_RANGE;
    this.visionAngle = degToRad(GAME_CONFIG.BOT.VISION_ANGLE);
    this.hearingRange = GAME_CONFIG.BOT.HEARING_RANGE;

    this.path = [];
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.pathfinding = new AIPathfinding(collisionSystem.grid);
    this.lastPathUpdate = 0;

    this.chaseStartTime = 0;
    this.searchStartTime = 0;

    this.slowdownFactor = 1;
    this.slowdownEndTime = 0;
  }

  setPatrolPoints(points: Vector2D[]): void {
    this.patrolPoints = points;
  }

  update(deltaTime: number, player: Player, _map: GameMap, collisionSystem: CollisionSystem, currentTime: number): void {
    // Update slowdown effect
    if (currentTime > this.slowdownEndTime) {
      this.slowdownFactor = 1;
    }

    // Check player detection
    const detected = this.checkPlayerDetection(player, collisionSystem, currentTime);

    // State machine
    switch (this.state) {
      case 'patrol':
        this.updatePatrol(deltaTime, collisionSystem, currentTime);
        if (detected) {
          this.state = 'chase';
          this.chaseStartTime = currentTime;
        }
        break;

      case 'chase':
        this.updateChase(deltaTime, player, collisionSystem, currentTime);
        if (!detected) {
          if (currentTime - this.lastSeenPlayerTime > 3) {
            this.state = 'search';
            this.searchStartTime = currentTime;
          }
        }
        break;

      case 'search':
        this.updateSearch(deltaTime, collisionSystem, currentTime);
        if (detected) {
          this.state = 'chase';
          this.chaseStartTime = currentTime;
        } else if (currentTime - this.searchStartTime > GAME_CONFIG.BOT.SEARCH_DURATION) {
          this.state = 'patrol';
        }
        break;

      case 'investigate':
        this.updateInvestigate(deltaTime, collisionSystem, currentTime);
        if (detected) {
          this.state = 'chase';
          this.chaseStartTime = currentTime;
        }
        break;
    }

    // Move along path
    this.moveAlongPath(deltaTime, collisionSystem);
  }

  private updatePatrol(_deltaTime: number, _collisionSystem: CollisionSystem, currentTime: number): void {
    if (this.patrolPoints.length === 0) {
      // Random wandering
      if (this.path.length === 0 || Math.random() < 0.01) {
        const randomTarget = new Vector2D(
          randomInt(100, 2900),
          randomInt(100, 2900)
        );
        this.path = this.pathfinding.findPath(this.position, randomTarget);
        this.lastPathUpdate = currentTime;
      }
    } else {
      // Follow patrol points
      if (this.path.length === 0) {
        const target = this.patrolPoints[this.currentPatrolIndex];
        this.path = this.pathfinding.findPath(this.position, target);
        this.lastPathUpdate = currentTime;
      }

      // Check if reached patrol point
      if (this.path.length > 0) {
        const target = this.patrolPoints[this.currentPatrolIndex];
        if (this.position.distance(target) < 50) {
          this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
          this.path = [];
        }
      }
    }
  }

  private updateChase(_deltaTime: number, player: Player, _collisionSystem: CollisionSystem, currentTime: number): void {
    // Update path periodically
    if (currentTime - this.lastPathUpdate > GAME_CONFIG.BOT.PATH_UPDATE_INTERVAL) {
      this.path = this.pathfinding.findPath(this.position, player.position);
      this.lastPathUpdate = currentTime;
    }
  }

  private updateSearch(_deltaTime: number, _collisionSystem: CollisionSystem, currentTime: number): void {
    if (this.lastSeenPlayerPos && this.path.length === 0) {
      // Go to last known position
      this.path = this.pathfinding.findPath(this.position, this.lastSeenPlayerPos);
      this.lastPathUpdate = currentTime;
    } else if (this.path.length === 0) {
      // Search randomly around current position
      const searchRadius = 300;
      const randomTarget = new Vector2D(
        this.position.x + randomInt(-searchRadius, searchRadius),
        this.position.y + randomInt(-searchRadius, searchRadius)
      );
      this.path = this.pathfinding.findPath(this.position, randomTarget);
      this.lastPathUpdate = currentTime;
    }
  }

  private updateInvestigate(_deltaTime: number, _collisionSystem: CollisionSystem, _currentTime: number): void {
    // Similar to search but shorter duration
    if (this.path.length === 0) {
      this.state = 'patrol';
    }
  }

  private moveAlongPath(deltaTime: number, collisionSystem: CollisionSystem): void {
    if (this.path.length === 0) {
      this.velocity = Vector2D.zero();
      return;
    }

    const target = this.path[0];
    const distance = this.position.distance(target);

    // Check if reached waypoint
    if (distance < 20) {
      this.path.shift();
      if (this.path.length === 0) {
        this.velocity = Vector2D.zero();
        return;
      }
      return;
    }

    // Move towards target
    const actualSpeed = this.speed * this.slowdownFactor;
    const moveDir = target.subtract(this.position).normalize();
    this.velocity = moveDir.multiply(actualSpeed);
    this.rotation = this.velocity.angle();

    // Update position
    const newPosition = new Vector2D(
      this.position.x + this.velocity.x * deltaTime,
      this.position.y + this.velocity.y * deltaTime
    );

    if (collisionSystem.canMoveTo(newPosition, this.radius)) {
      this.position = newPosition;
    } else {
      const resolved = collisionSystem.resolveCollision(newPosition, this.radius);
      this.position.x = resolved.x;
      this.position.y = resolved.y;
    }
  }

  private checkPlayerDetection(player: Player, collisionSystem: CollisionSystem, currentTime: number): boolean {
    // Check if player is invisible
    if (player.hasActiveEffect('invisibility')) {
      return false;
    }

    // Check hearing (if player is moving fast)
    const distToPlayer = this.position.distance(player.position);
    if (player.isMakingSound(currentTime) && distToPlayer < this.hearingRange) {
      this.lastSeenPlayerPos = player.position.clone();
      this.lastSeenPlayerTime = currentTime;
      return true;
    }

    // Check vision
    if (distToPlayer < this.visionRange) {
      // Check angle
      const angleToPlayer = this.position.angleTo(player.position);
      const angleDiff = Math.abs(angleDifference(this.rotation, angleToPlayer));

      if (angleDiff < this.visionAngle / 2) {
        // Check line of sight
        if (collisionSystem.hasLineOfSight(this.position, player.position)) {
          this.lastSeenPlayerPos = player.position.clone();
          this.lastSeenPlayerTime = currentTime;
          return true;
        }
      }
    }

    return false;
  }

  applySlow(factor: number, duration: number, currentTime: number): void {
    this.slowdownFactor = factor;
    this.slowdownEndTime = currentTime + duration;
  }

  isChasingPlayer(): boolean {
    return this.state === 'chase';
  }
}
