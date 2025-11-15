import type { PowerupSlot } from '../../types/game.types';
import type { Player } from '../entities/Player';
import type { AIBot } from '../entities/AIBot';
import { POWERUP_DEFINITIONS } from '../../utils/ShopCatalog';
import { Vector2D } from '../../utils/Vector2D';

export class PowerupManager {
  private slots: PowerupSlot[];

  constructor(powerupIds: string[]) {
    this.slots = [];

    // Initialize slots with powerups
    for (let i = 0; i < 3; i++) {
      const powerupId = powerupIds[i];
      if (powerupId && POWERUP_DEFINITIONS[powerupId]) {
        const powerup = POWERUP_DEFINITIONS[powerupId];
        this.slots.push({
          powerup,
          usesRemaining: powerup.maxUses || 1,
          cooldownRemaining: 0,
        });
      } else {
        this.slots.push({
          powerup: null,
          usesRemaining: 0,
          cooldownRemaining: 0,
        });
      }
    }
  }

  activatePowerup(slotIndex: number, player: Player, bot: AIBot, currentTime: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return false;

    const slot = this.slots[slotIndex];
    if (!slot.powerup || slot.usesRemaining <= 0 || slot.cooldownRemaining > 0) {
      return false;
    }

    const powerup = slot.powerup;
    const effect = powerup.effect;

    // Apply effect based on type
    switch (effect.type) {
      case 'speed_boost':
        player.addEffect(
          `speed_boost_${currentTime}`,
          effect,
          effect.duration || 5,
          currentTime
        );
        break;

      case 'invisibility':
        player.addEffect(
          `invisibility_${currentTime}`,
          effect,
          effect.duration || 8,
          currentTime
        );
        break;

      case 'decoy':
        // Decoy effect would spawn a fake player entity
        // For now, we'll just confuse the bot by sending it to a random location
        bot.path = [
          new Vector2D(
            Math.random() * 3000,
            Math.random() * 3000
          ),
        ];
        break;

      case 'time_slow':
        bot.applySlow(effect.magnitude || 0.5, effect.duration || 6, currentTime);
        break;

      case 'wall_phase':
        player.addEffect(
          `wall_phase_${currentTime}`,
          effect,
          effect.duration || 3,
          currentTime
        );
        break;
    }

    // Consume use
    slot.usesRemaining--;

    // Set cooldown
    if (slot.usesRemaining > 0) {
      slot.cooldownRemaining = 5; // 5 second cooldown between uses
    }

    return true;
  }

  update(deltaTime: number): void {
    // Update cooldowns
    for (const slot of this.slots) {
      if (slot.cooldownRemaining > 0) {
        slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - deltaTime);
      }
    }
  }

  getSlots(): PowerupSlot[] {
    return this.slots;
  }

  canActivate(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return false;
    const slot = this.slots[slotIndex];
    return !!(slot.powerup && slot.usesRemaining > 0 && slot.cooldownRemaining === 0);
  }
}
