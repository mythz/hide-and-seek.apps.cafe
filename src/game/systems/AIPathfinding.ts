import { Vector2D } from '../../utils/Vector2D';
import type { CollisionGrid } from './CollisionSystem';

interface PathNode {
  position: Vector2D;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost
  parent: PathNode | null;
}

export class AIPathfinding {
  private grid: CollisionGrid;

  constructor(grid: CollisionGrid) {
    this.grid = grid;
  }

  findPath(start: { x: number; y: number }, goal: { x: number; y: number }): Vector2D[] {
    const startNode: PathNode = {
      position: new Vector2D(start.x, start.y),
      g: 0,
      h: this.heuristic(new Vector2D(start.x, start.y), goal),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;

    const openSet: PathNode[] = [startNode];
    const closedSet = new Set<string>();

    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];

      // Check if we reached the goal
      const dist = current.position.distance(goal);
      if (dist < this.grid.cellSize) {
        return this.reconstructPath(current);
      }

      // Move current from open to closed
      openSet.splice(currentIndex, 1);
      closedSet.add(this.positionKey(current.position));

      // Check neighbors
      const neighbors = this.grid.getNeighbors(current.position.x, current.position.y);

      for (const neighborPos of neighbors) {
        const neighbor2D = new Vector2D(neighborPos.x, neighborPos.y);
        const key = this.positionKey(neighbor2D);
        if (closedSet.has(key)) continue;

        const g = current.g + this.distance(current.position, neighbor2D);
        const h = this.heuristic(neighbor2D, goal);

        // Check if neighbor is already in open set
        const existingIndex = openSet.findIndex(
          node => this.positionKey(node.position) === key
        );

        if (existingIndex === -1) {
          // Add new node
          const neighbor: PathNode = {
            position: neighbor2D,
            g,
            h,
            f: g + h,
            parent: current,
          };
          openSet.push(neighbor);
        } else {
          // Update if we found a better path
          if (g < openSet[existingIndex].g) {
            openSet[existingIndex].g = g;
            openSet[existingIndex].f = g + h;
            openSet[existingIndex].parent = current;
          }
        }
      }

      // Limit iterations to prevent infinite loops
      if (closedSet.size > 1000) {
        break;
      }
    }

    // No path found, return direct line
    return [new Vector2D(goal.x, goal.y)];
  }

  private reconstructPath(node: PathNode): Vector2D[] {
    const path: Vector2D[] = [];
    let current: PathNode | null = node;

    while (current !== null) {
      path.unshift(current.position);
      current = current.parent;
    }

    // Simplify path by removing intermediate points
    return this.simplifyPath(path);
  }

  private simplifyPath(path: Vector2D[]): Vector2D[] {
    if (path.length <= 2) return path;

    const simplified: Vector2D[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      // Find furthest visible point
      let furthest = current + 1;
      for (let i = current + 2; i < path.length; i++) {
        // In a real implementation, we'd check line of sight here
        // For now, we'll just take every few points
        if (i - current > 3) break;
        furthest = i;
      }

      simplified.push(path[furthest]);
      current = furthest;
    }

    return simplified;
  }

  private heuristic(a: Vector2D, b: { x: number; y: number }): number {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private distance(a: Vector2D, b: Vector2D): number {
    return a.distance(b);
  }

  private positionKey(pos: Vector2D): string {
    return `${Math.floor(pos.x / this.grid.cellSize)},${Math.floor(pos.y / this.grid.cellSize)}`;
  }
}
