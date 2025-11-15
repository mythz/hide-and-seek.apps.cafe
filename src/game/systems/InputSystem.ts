import type { InputState } from '../../types/game.types';

export class InputSystem {
  private keys: Set<string>;
  private controlScheme: 'wasd' | 'arrows';

  constructor(controlScheme: 'wasd' | 'arrows' = 'wasd') {
    this.keys = new Set();
    this.controlScheme = controlScheme;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  getInput(): InputState {
    return {
      moveX: this.getMoveX(),
      moveY: this.getMoveY(),
      powerup1: this.keys.has('1'),
      powerup2: this.keys.has('2'),
      powerup3: this.keys.has('3'),
      pause: this.keys.has('escape'),
    };
  }

  private getMoveX(): number {
    if (this.controlScheme === 'wasd') {
      if (this.keys.has('a')) return -1;
      if (this.keys.has('d')) return 1;
    } else {
      if (this.keys.has('arrowleft')) return -1;
      if (this.keys.has('arrowright')) return 1;
    }
    return 0;
  }

  private getMoveY(): number {
    if (this.controlScheme === 'wasd') {
      if (this.keys.has('w')) return -1;
      if (this.keys.has('s')) return 1;
    } else {
      if (this.keys.has('arrowup')) return -1;
      if (this.keys.has('arrowdown')) return 1;
    }
    return 0;
  }

  setControlScheme(scheme: 'wasd' | 'arrows'): void {
    this.controlScheme = scheme;
  }

  clearKeys(): void {
    this.keys.clear();
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }
}
