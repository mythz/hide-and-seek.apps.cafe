import type { GameMap, Portal } from '../../types/game.types';
import type { Player } from '../entities/Player';
import type { AIBot } from '../entities/AIBot';
import { SKIN_COLORS } from '../../utils/Constants';

export class RenderSystem {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  renderMap(map: GameMap): void {
    // Draw background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, map.width, map.height);

    // Draw rooms
    for (const room of map.rooms) {
      this.ctx.fillStyle = '#2a2a2a';
      this.ctx.fillRect(room.x, room.y, room.width, room.height);

      // Room outline
      this.ctx.strokeStyle = '#404040';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(room.x, room.y, room.width, room.height);
    }

    // Draw corridors
    for (const corridor of map.corridors) {
      this.ctx.fillStyle = '#252525';
      this.ctx.fillRect(corridor.x, corridor.y, corridor.width, corridor.height);
    }

    // Draw walls
    this.ctx.fillStyle = '#0a0a0a';
    for (const wall of map.walls) {
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }
  }

  renderPortals(portals: Portal[]): void {
    const time = Date.now() / 1000;

    for (const portal of portals) {
      // Outer glow
      const gradient = this.ctx.createRadialGradient(
        portal.position.x,
        portal.position.y,
        10,
        portal.position.x,
        portal.position.y,
        portal.radius
      );
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(portal.position.x, portal.position.y, portal.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner circle
      this.ctx.fillStyle = '#64c8ff';
      this.ctx.beginPath();
      this.ctx.arc(portal.position.x, portal.position.y, 15, 0, Math.PI * 2);
      this.ctx.fill();

      // Rotating particles
      for (let i = 0; i < 8; i++) {
        const angle = (time + i / 8) * Math.PI * 2;
        const x = portal.position.x + Math.cos(angle) * 25;
        const y = portal.position.y + Math.sin(angle) * 25;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  renderPlayer(player: Player): void {
    // Pet render (behind player)
    if (player.petController) {
      this.renderPet(player.petController.position, player.petController.pet.spriteId);
    }

    // Apply powerup visual effects
    if (player.hasActiveEffect('invisibility')) {
      this.ctx.globalAlpha = 0.3;
    }

    // Player body (circle for now)
    this.ctx.fillStyle = SKIN_COLORS[player.skinId] || SKIN_COLORS.default;
    this.ctx.beginPath();
    this.ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Direction indicator
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(player.position.x, player.position.y);
    const dirX = player.position.x + Math.cos(player.rotation) * player.radius;
    const dirY = player.position.y + Math.sin(player.rotation) * player.radius;
    this.ctx.lineTo(dirX, dirY);
    this.ctx.stroke();

    // Ghost walk effect
    if (player.hasActiveEffect('wall_phase')) {
      this.ctx.strokeStyle = 'rgba(147, 112, 219, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(player.position.x, player.position.y, player.radius + 5, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  renderBot(bot: AIBot): void {
    // Bot body (different color from player)
    this.ctx.fillStyle = '#ff4444';
    this.ctx.beginPath();
    this.ctx.arc(bot.position.x, bot.position.y, bot.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Direction indicator
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(bot.position.x, bot.position.y);
    const dirX = bot.position.x + Math.cos(bot.rotation) * bot.radius;
    const dirY = bot.position.y + Math.sin(bot.rotation) * bot.radius;
    this.ctx.lineTo(dirX, dirY);
    this.ctx.stroke();

    // State indicator above bot
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(bot.state.toUpperCase(), bot.position.x, bot.position.y - 35);
  }

  renderVisionCone(bot: AIBot): void {
    // Debug visualization
    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(bot.position.x, bot.position.y);
    this.ctx.arc(
      bot.position.x,
      bot.position.y,
      bot.visionRange,
      bot.rotation - bot.visionAngle / 2,
      bot.rotation + bot.visionAngle / 2
    );
    this.ctx.closePath();
    this.ctx.fill();

    // Hearing range
    this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(bot.position.x, bot.position.y, bot.hearingRange, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private renderPet(position: { x: number; y: number }, _spriteId: string): void {
    // Simple circle for pet (could be replaced with sprites)
    this.ctx.fillStyle = '#ffa500';
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Pet outline
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }
}
