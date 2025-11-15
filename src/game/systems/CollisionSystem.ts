import type { Vector2D, GameMap, Wall } from '../../types/game.types';
import { GAME_CONFIG } from '../../utils/Constants';
import { lineIntersectsRect } from '../../utils/Helpers';

export class CollisionGrid {
  cellSize: number;
  grid: boolean[][];
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;

  constructor(width: number, height: number, cellSize: number = GAME_CONFIG.MAP.COLLISION_CELL_SIZE) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(width / cellSize);
    this.gridHeight = Math.ceil(height / cellSize);

    // Initialize grid as all walkable
    this.grid = Array(this.gridHeight)
      .fill(null)
      .map(() => Array(this.gridWidth).fill(true));
  }

  markWalls(walls: Wall[]): void {
    for (const wall of walls) {
      const startX = Math.floor(wall.x / this.cellSize);
      const startY = Math.floor(wall.y / this.cellSize);
      const endX = Math.ceil((wall.x + wall.width) / this.cellSize);
      const endY = Math.ceil((wall.y + wall.height) / this.cellSize);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
            this.grid[y][x] = false;
          }
        }
      }
    }
  }

  isWalkable(x: number, y: number): boolean {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);

    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return false;
    }

    return this.grid[gridY][gridX];
  }

  getNeighbors(x: number, y: number): Vector2D[] {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    const neighbors: Vector2D[] = [];

    const directions = [
      [0, -1], [1, 0], [0, 1], [-1, 0], // Cardinal
      [1, -1], [1, 1], [-1, 1], [-1, -1], // Diagonal
    ];

    for (const [dx, dy] of directions) {
      const nx = gridX + dx;
      const ny = gridY + dy;

      if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
        if (this.grid[ny][nx]) {
          neighbors.push({
            x: nx * this.cellSize + this.cellSize / 2,
            y: ny * this.cellSize + this.cellSize / 2,
          });
        }
      }
    }

    return neighbors;
  }

  raycast(from: Vector2D, to: Vector2D, walls: Wall[]): boolean {
    // Returns true if there's a clear line of sight (no walls in the way)
    for (const wall of walls) {
      if (lineIntersectsRect(from.x, from.y, to.x, to.y, wall.x, wall.y, wall.width, wall.height)) {
        return false;
      }
    }
    return true;
  }
}

export class CollisionSystem {
  grid: CollisionGrid;
  walls: Wall[];

  constructor(map: GameMap) {
    this.walls = map.walls;
    this.grid = new CollisionGrid(map.width, map.height);
    this.grid.markWalls(map.walls);
  }

  canMoveTo(position: Vector2D, radius: number): boolean {
    // Check the four corners of the bounding box
    const checkPoints = [
      { x: position.x - radius, y: position.y - radius },
      { x: position.x + radius, y: position.y - radius },
      { x: position.x - radius, y: position.y + radius },
      { x: position.x + radius, y: position.y + radius },
    ];

    for (const point of checkPoints) {
      if (!this.grid.isWalkable(point.x, point.y)) {
        return false;
      }
    }

    return true;
  }

  resolveCollision(position: Vector2D, radius: number): Vector2D {
    // Simple wall sliding
    const resolved = { x: position.x, y: position.y };

    for (const wall of this.walls) {
      // Check collision with wall
      const closestX = Math.max(wall.x, Math.min(position.x, wall.x + wall.width));
      const closestY = Math.max(wall.y, Math.min(position.y, wall.y + wall.height));

      const distX = position.x - closestX;
      const distY = position.y - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq < radius * radius) {
        // Collision detected, push out
        const dist = Math.sqrt(distSq);
        if (dist === 0) continue;

        const pushX = (distX / dist) * (radius - dist);
        const pushY = (distY / dist) * (radius - dist);

        resolved.x += pushX;
        resolved.y += pushY;
      }
    }

    return resolved;
  }

  hasLineOfSight(from: Vector2D, to: Vector2D): boolean {
    return this.grid.raycast(from, to, this.walls);
  }
}
