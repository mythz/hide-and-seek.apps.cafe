import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { GameProgress, UnlockedItem, ActiveLoadout, LocalSettings } from '../../types/game.types';
import { DEFAULT_SETTINGS } from '../../utils/Constants';

interface HideAndSeekDB extends DBSchema {
  gameProgress: {
    key: string;
    value: GameProgress;
  };
  unlockedItems: {
    key: string;
    value: UnlockedItem;
  };
  activeLoadout: {
    key: string;
    value: ActiveLoadout;
  };
}

class StorageManager {
  private db: IDBPDatabase<HideAndSeekDB> | null = null;
  private readonly DB_NAME = 'HideAndSeekDB';
  private readonly DB_VERSION = 1;
  private readonly SETTINGS_KEY = 'gameSettings';

  async init(): Promise<void> {
    try {
      this.db = await openDB<HideAndSeekDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('gameProgress')) {
            db.createObjectStore('gameProgress', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('unlockedItems')) {
            db.createObjectStore('unlockedItems', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('activeLoadout')) {
            db.createObjectStore('activeLoadout', { keyPath: 'id' });
          }
        },
      });

      // Initialize default data if needed
      await this.initializeDefaults();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async initializeDefaults(): Promise<void> {
    if (!this.db) return;

    // Check if game progress exists
    const progress = await this.db.get('gameProgress', 'main');
    if (!progress) {
      await this.db.put('gameProgress', {
        id: 'main',
        coins: 100, // Starting coins
        totalGamesPlayed: 0,
        totalWins: 0,
        totalLosses: 0,
        bestTime: 0,
        createdAt: new Date(),
        lastPlayed: new Date(),
      });
    }

    // Check if loadout exists
    const loadout = await this.db.get('activeLoadout', 'current');
    if (!loadout) {
      await this.db.put('activeLoadout', {
        id: 'current',
        skinId: 'default',
        petId: null,
        powerups: [],
      });
    }
  }

  // Coin operations
  async getCoins(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const progress = await this.db.get('gameProgress', 'main');
    return progress?.coins || 0;
  }

  async addCoins(amount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const progress = await this.db.get('gameProgress', 'main');
    if (progress) {
      progress.coins += amount;
      progress.lastPlayed = new Date();
      await this.db.put('gameProgress', progress);
    }
  }

  async spendCoins(amount: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const progress = await this.db.get('gameProgress', 'main');
    if (!progress || progress.coins < amount) {
      return false;
    }
    progress.coins -= amount;
    progress.lastPlayed = new Date();
    await this.db.put('gameProgress', progress);
    return true;
  }

  // Progress tracking
  async recordWin(timeRemaining: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const progress = await this.db.get('gameProgress', 'main');
    if (progress) {
      progress.totalWins += 1;
      progress.totalGamesPlayed += 1;
      if (timeRemaining > progress.bestTime) {
        progress.bestTime = timeRemaining;
      }
      progress.lastPlayed = new Date();
      await this.db.put('gameProgress', progress);
    }
  }

  async recordLoss(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const progress = await this.db.get('gameProgress', 'main');
    if (progress) {
      progress.totalLosses += 1;
      progress.totalGamesPlayed += 1;
      progress.lastPlayed = new Date();
      await this.db.put('gameProgress', progress);
    }
  }

  async getStats(): Promise<GameProgress | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('gameProgress', 'main') || null;
  }

  // Item management
  async unlockItem(itemId: string, type: 'skin' | 'powerup' | 'pet'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('unlockedItems', {
      id: itemId,
      type,
      unlockedAt: new Date(),
    });
  }

  async isItemUnlocked(itemId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const item = await this.db.get('unlockedItems', itemId);
    return !!item;
  }

  async getUnlockedItems(type?: 'skin' | 'powerup' | 'pet'): Promise<UnlockedItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allItems = await this.db.getAll('unlockedItems');
    if (type) {
      return allItems.filter(item => item.type === type);
    }
    return allItems;
  }

  // Loadout management
  async setActiveLoadout(loadout: Partial<Omit<ActiveLoadout, 'id'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const current = await this.db.get('activeLoadout', 'current');
    if (current) {
      const updated = { ...current, ...loadout };
      await this.db.put('activeLoadout', updated);
    }
  }

  async getActiveLoadout(): Promise<ActiveLoadout | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('activeLoadout', 'current') || null;
  }

  // Settings (localStorage)
  saveSettings(settings: LocalSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadSettings(): LocalSettings {
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
