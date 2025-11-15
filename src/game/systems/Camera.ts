import { Vector2D } from '../../utils/Vector2D';
import { GAME_CONFIG } from '../../utils/Constants';

export class Camera {
  position: Vector2D;
  width: number;
  height: number;
  zoom: number;
  smoothness: number;

  constructor(width: number, height: number) {
    this.position = Vector2D.zero();
    this.width = width;
    this.height = height;
    this.zoom = GAME_CONFIG.CAMERA.ZOOM;
    this.smoothness = GAME_CONFIG.CAMERA.SMOOTHNESS;
  }

  follow(targetPos: Vector2D): void {
    // Smooth interpolation toward target
    this.position.x += (targetPos.x - this.position.x) * this.smoothness;
    this.position.y += (targetPos.y - this.position.y) * this.smoothness;
  }

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.translate(-this.position.x + this.width / 2, -this.position.y + this.height / 2);
    ctx.scale(this.zoom, this.zoom);
  }

  worldToScreen(worldPos: Vector2D): Vector2D {
    return new Vector2D(
      (worldPos.x - this.position.x) * this.zoom + this.width / 2,
      (worldPos.y - this.position.y) * this.zoom + this.height / 2
    );
  }

  screenToWorld(screenPos: Vector2D): Vector2D {
    return new Vector2D(
      (screenPos.x - this.width / 2) / this.zoom + this.position.x,
      (screenPos.y - this.height / 2) / this.zoom + this.position.y
    );
  }
}
