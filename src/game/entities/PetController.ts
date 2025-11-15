import { Vector2D } from '../../utils/Vector2D';
import type { Pet } from '../../types/game.types';

export class PetController {
  pet: Pet;
  position: Vector2D;
  velocity: Vector2D;
  isActive: boolean;
  abilityCooldown: number;
  lastAbilityUse: number;

  constructor(pet: Pet, startPosition: Vector2D) {
    this.pet = pet;
    this.position = startPosition.clone();
    this.velocity = Vector2D.zero();
    this.isActive = true;
    this.abilityCooldown = pet.cooldown;
    this.lastAbilityUse = 0;
  }

  update(deltaTime: number, playerPos: Vector2D): void {
    if (!this.isActive) return;

    // Calculate target position (behind player with offset)
    const targetPos = new Vector2D(
      playerPos.x + this.pet.followOffset.x,
      playerPos.y + this.pet.followOffset.y
    );

    // Smooth follow with lag
    const direction = targetPos.subtract(this.position);
    const distance = direction.length();

    if (distance > 5) {
      const moveSpeed = Math.min(this.pet.followSpeed, distance / deltaTime);
      this.velocity = direction.normalize().multiply(moveSpeed);
      this.position = this.position.add(this.velocity.multiply(deltaTime));
    } else {
      this.velocity = Vector2D.zero();
    }
  }

  canUseAbility(currentTime: number): boolean {
    return currentTime - this.lastAbilityUse >= this.abilityCooldown;
  }

  activateAbility(currentTime: number): void {
    this.lastAbilityUse = currentTime;
    // Ability effects are handled by the game logic
  }
}
